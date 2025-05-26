// Supabase Edge Function for AI Humanizer
// File: supabase/functions/humanizer/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { inputText } = await req.json();
    if (!inputText) {
      return new Response(JSON.stringify({ error: 'Missing inputText' }), { status: 400 });
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing OpenAI API key' }), { status: 500 });
    }

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
      return new Response(JSON.stringify({ error: data.error?.message || 'OpenAI API error' }), { status: 500 });
    }
    const output = data.choices?.[0]?.message?.content?.trim() || '';
    return new Response(JSON.stringify({ output }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Unknown error' }), { status: 500 });
  }
});
