import axios from 'axios';
import supabase from '../utils/supabaseClient';

const API_URL = process.env.REACT_APP_HUMANIZER_API_URL || 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.REACT_APP_HUMANIZER_API_KEY || process.env.REACT_APP_OPENAI_API_KEY || '';

// Replace direct OpenAI call with Supabase Edge Function call
export const humanizeText = async (inputText: string): Promise<string> => {
    try {
        // First check if user is authenticated
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
            throw new Error('You must be logged in to use this feature');
        }

        // Call the edge function with authentication
        const { data, error } = await supabase.functions.invoke('ai-humanizer-serve', {
            body: { inputText },
        });

        if (error) {
            throw new Error(error.message || 'Failed to humanize text');
        }

        return data?.output || '';
    } catch (error: any) {
        throw new Error(error.message || 'Failed to humanize text');
    }
};