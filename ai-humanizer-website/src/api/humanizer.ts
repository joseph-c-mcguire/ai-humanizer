import axios from 'axios';
import supabase from '../utils/supabaseClient';

const API_URL = process.env.REACT_APP_HUMANIZER_API_URL || 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.REACT_APP_HUMANIZER_API_KEY || process.env.REACT_APP_OPENAI_API_KEY || '';

// Replace direct OpenAI call with Supabase Edge Function call
export const humanizeText = async (inputText: string): Promise<string> => {
    try {
        // First check if user is authenticated
        console.log('Checking authentication...');
        const { data: authData } = await supabase.auth.getUser();
        console.log('Auth data:', authData);
        
        if (!authData?.user) {
            console.error('Authentication failed: No user found');
            throw new Error('You must be logged in to use this feature');
        }
        
        console.log('User authenticated, calling Supabase Edge Function...');
        console.log('Function name: ai-humanizer');
        console.log('Input text:', inputText);

        // Call the edge function with authentication
        const { data, error } = await supabase.functions.invoke('ai-humanizer', {
            body: { inputText },
        });

        if (error) {
            console.error('Edge function error:', error);
            throw new Error(error.message || 'Failed to humanize text');
        }

        // Add logging for debugging
        console.log('Supabase Edge Function response:', data);

        if (!data || typeof data.output !== 'string') {
            console.error('Invalid response format:', data);
            throw new Error('Unexpected response from humanizer function');
        }

        return data.output;
    } catch (error: any) {
        console.error('Error in humanizeText:', error);
        throw new Error(error.message || 'Failed to humanize text');
    }
};