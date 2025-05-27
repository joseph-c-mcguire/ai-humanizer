import axios from 'axios';

// Robustly get API key for all environments (CRA, Vite, Netlify, browser)
function getOpenAIApiKey(): string {
    // 1. Standard env
    if (process.env.REACT_APP_OPENAI_API_KEY) {
        return process.env.REACT_APP_OPENAI_API_KEY;
    }
    // 2. Vite env
    if (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_OPENAI_API_KEY) {
        return (import.meta as any).env.VITE_OPENAI_API_KEY;
    }
    // 3. Netlify/Vercel style window._env_ injection
    if (typeof window !== 'undefined' && (window as any)._env_ && (window as any)._env_.REACT_APP_OPENAI_API_KEY) {
        return (window as any)._env_.REACT_APP_OPENAI_API_KEY;
    }
    // 4. Directly on window (for manual injection)
    if (typeof window !== 'undefined' && (window as any).REACT_APP_OPENAI_API_KEY) {
        return (window as any).REACT_APP_OPENAI_API_KEY;
    }
    return '';
}

/**
 * Humanizes text using OpenAI API without requiring authentication
 */
export const humanizeText = async (inputText: string): Promise<string> => {
    if (!inputText.trim()) {
        throw new Error('Please enter some text to humanize');
    }
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
        if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
            // Show a warning in the browser for debugging
            alert('OpenAI API key not found. Please check your .env.local or deployment environment variables.');
        }
        throw new Error('OpenAI API key not configured');
    }
    return await humanizeTextWithKey(inputText, apiKey);
};

const humanizeTextWithKey = async (inputText: string, apiKey: string): Promise<string> => {
    try {
        if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
            // eslint-disable-next-line no-console
            console.log('Using OpenAI key:', apiKey.slice(0, 8) + '...');
        }
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at rewriting AI-generated text to sound more human and natural. Rewrite the following text to be undetectable as AI-generated, while preserving the original meaning.'
                    },
                    {
                        role: 'user',
                        content: `Humanize this text: ${inputText}`
                    }
                ],
                max_tokens: 1024,
                temperature: 0.7,
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                }
            }
        );
        // Debug: log the full response in development
        if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
            // eslint-disable-next-line no-console
            console.log('OpenAI API response:', response.data);
        }
        // Robustly extract the content
        const content = response?.data?.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content.trim().length > 0) {
            return content.trim();
        } else {
            // If OpenAI returns nothing, return the original input as fallback
            return inputText;
        }
    } catch (err: any) {
        if (err.response && err.response.data && err.response.data.error) {
            throw new Error(err.response.data.error.message);
        }
        if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
            // eslint-disable-next-line no-console
            console.error('OpenAI API error:', err);
        }
        throw new Error('Failed to humanize text');
    }
};

/**
 * Gets alternative, more human-sounding suggestions for a specific word in context.
 * Returns an array of suggestions (strings).
 */
export const getHumanAlternatives = async (
    word: string,
    context: string,
    apiKeyOverride?: string
): Promise<string[]> => {
    const apiKey = apiKeyOverride || getOpenAIApiKey();
    if (!apiKey) {
        throw new Error('OpenAI API key not configured');
    }
    try {
        const prompt = `Suggest 3 alternative, more human-sounding replacements for the word "${word}" in the following sentence. Only return the alternatives, comma-separated, and do not repeat the original word.\n\nSentence: ${context}`;
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are an expert at rewriting text to sound more human and natural.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 32,
                temperature: 0.8,
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                }
            }
        );
        const content = response?.data?.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content.trim().length > 0) {
            // Split by comma and trim
            return content.split(',').map(s => s.trim()).filter(Boolean);
        } else {
            return [];
        }
    } catch (err: any) {
        if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
            // eslint-disable-next-line no-console
            console.error('OpenAI API error (alternatives):', err);
        }
        return [];
    }
};