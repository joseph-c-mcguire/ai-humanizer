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
    // Prefer REACT_APP_* env vars if available, fallback to SUPABASE_* and OPENAI_API_KEY
    const env = globalThis.env ?? {};
    const SUPABASE_URL = env.REACT_APP_SUPABASE_URL || env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = env.REACT_APP_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
    const OPENAI_API_KEY = env.REACT_APP_OPENAI_API_KEY || env.OPENAI_API_KEY;
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

    // Check user credits
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('credits_remaining, total_credits_used, plan_type')
      .eq('id', user.id)
      .single();
    if (creditError || !creditData) {
      return new Response(JSON.stringify({ error: 'Failed to retrieve user credits' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (creditData.credits_remaining <= 0) {
      return new Response(JSON.stringify({
        error: 'Insufficient credits',
        message: 'You have run out of credits. Please upgrade your plan.'
      }), {
        status: 403,
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

    // Deduct credits and log usage
    const creditsToUse = 1;
    if (creditData.credits_remaining < creditsToUse) {
      return new Response(JSON.stringify({
        error: 'Insufficient credits',
        message: `This operation requires ${creditsToUse} credits, but you only have ${creditData.credits_remaining}.`
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    // Deduct credits
    await supabase
      .from('user_credits')
      .update({
        credits_remaining: creditData.credits_remaining - creditsToUse,
        total_credits_used: (creditData.total_credits_used || 0) + creditsToUse,
        last_updated: new Date().toISOString()
      })
      .eq('id', user.id);
    // Log usage
    await supabase
      .from('credit_usage_history')
      .insert({
        user_id: user.id,
        action_type: 'humanize',
        credits_used: creditsToUse,
        input_length: inputText.length
      });

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
