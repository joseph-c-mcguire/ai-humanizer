// Supabase Edge Function for AI Humanizer with Auth & Usage Logging
// File: supabase/functions/humanizer/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // Handle CORS for browser requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use environment variables provided by Supabase Edge Runtime
    // These are available as globalThis.env in the latest Supabase Edge Runtime
    const { SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY } = globalThis.env ?? {};

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Supabase env vars' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing OpenAI API key' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create a Supabase client with the auth token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse the request body
    const { inputText } = await req.json();
    if (!inputText) {
      return new Response(JSON.stringify({ error: 'Missing inputText' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call OpenAI API
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at rewriting AI-generated text to sound as human and natural as possible. Rewrite the following text to be undetectable as AI-generated, while preserving the original meaning.'
          },
          {
            role: 'user',
            content: `Humanize this text: ${inputText}`
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();
    if (!openaiRes.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'OpenAI API error' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Track usage in database
    await supabase
      .from('usage_logs')
      .insert([{ 
        user_id: user.id,
        function_name: 'ai-humanizer-serve',
        tokens_used: data.usage?.total_tokens || 0,
        created_at: new Date().toISOString()
      }]);
      
    // Return the humanized text
    const output = data.choices?.[0]?.message?.content?.trim() || '';
    return new Response(JSON.stringify({ output }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
