// Netlify Function: /api/humanizer
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }
  try {
    const { text } = JSON.parse(event.body || '{}');
    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing text' })
      };
    }
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'OpenAI API key not set in environment' })
      };
    }
    // Call OpenAI API
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
            content: `Humanize this text: ${text}`
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      })
    });
    const data = await openaiRes.json();
    if (!openaiRes.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: data.error?.message || 'OpenAI API error' })
      };
    }
    const output = data.choices?.[0]?.message?.content?.trim() || '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ output })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
