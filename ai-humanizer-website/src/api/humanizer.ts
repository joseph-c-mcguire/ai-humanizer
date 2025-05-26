import axios from 'axios';

const API_URL = 'https://api.undetectable.ai/humanizer'; // Replace with the actual API endpoint

export const humanizeText = async (inputText: string): Promise<string> => {
    try {
        const response = await axios.post(API_URL, {
            text: inputText
        });
        // Defensive: check for error or missing field
        if (response.data && typeof response.data.humanizedText === 'string') {
            return response.data.humanizedText;
        } else if (response.data && response.data.error) {
            throw new Error(response.data.error);
        } else {
            throw new Error('Unexpected API response.');
        }
    } catch (error: any) {
        // Try to show a more descriptive error if available
        if (error.response && error.response.data && error.response.data.error) {
            throw new Error(error.response.data.error);
        }
        console.error('Error humanizing text:', error);
        throw new Error('Failed to humanize text. Please check your input or try again later.');
    }
};