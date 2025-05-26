import axios from 'axios';

const API_URL = process.env.REACT_APP_HUMANIZER_API_URL || 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.REACT_APP_HUMANIZER_API_KEY || process.env.REACT_APP_OPENAI_API_KEY || '';

// Replace direct OpenAI call with Supabase Edge Function call
export const humanizeText = async (inputText: string): Promise<string> => {
    const SUPABASE_EDGE_URL = process.env.REACT_APP_SUPABASE_EDGE_URL || 'https://ostzdzthagctsdrkbsbg.supabase.co/functions/v1/humanizer';
    try {
        const response = await fetch(SUPABASE_EDGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ inputText })
        });
        const result = await response.json();
        if (response.ok) {
            return result.output;
        } else {
            throw new Error(result.error || 'Failed to humanize text');
        }
    } catch (error: any) {
        throw new Error(error.message || 'Failed to humanize text');
    }
};