import React, { useState } from 'react';
import { humanizeText } from '../api/humanizer';
import supabase from '../utils/supabaseClient';

const HomePage: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [credits, setCredits] = useState<number | null>(null);
    const [creditsLoading, setCreditsLoading] = useState(true);

    // Fetch user credits on mount
    React.useEffect(() => {
        const fetchCredits = async () => {
            setCreditsLoading(true);
            const { data, error: userError } = await supabase.auth.getUser();
            const user = data?.user;
            if (user) {
                const { data, error } = await supabase
                    .from('users')
                    .select('credits')
                    .eq('id', user.id)
                    .single();
                if (!error && data) {
                    setCredits(data.credits);
                } else {
                    setCredits(null);
                }
            } else {
                setCredits(null);
            }
            setCreditsLoading(false);
        };
        fetchCredits();
    }, []);

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(event.target.value);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setOutputText('');
        try {
            if (credits !== null && credits <= 0) {
                setError('You have no credits left. Please upgrade your plan.');
                setLoading(false);
                return;
            }
            const result = await humanizeText(inputText);
            setOutputText(result);
            // Deduct 1 credit per use (customize as needed)
            const { data, error: userError } = await supabase.auth.getUser();
            const user = data?.user;
            if (user) {
                await supabase
                    .from('users')
                    .update({ credits: (credits || 1) - 1 })
                    .eq('id', user.id);
                setCredits((c) => (c ? c - 1 : 0));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to humanize text. Please try again later.');
        }
        setLoading(false);
    };

    return (
        <div className="home-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: '#f7f7f7' }}>
            <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', maxWidth: 500, width: '100%' }}>
                <h1 style={{ textAlign: 'center', marginBottom: 24 }}>AI Humanizer Tool</h1>
                <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
                    <textarea
                        value={inputText}
                        onChange={handleInputChange}
                        placeholder="Enter text to humanize"
                        rows={5}
                        required
                        style={{ width: '100%', marginBottom: 12, fontSize: 16, padding: 10 }}
                    />
                    <button type="submit" disabled={loading} style={{ width: '100%', fontSize: 16, padding: 10 }}>
                        {loading ? 'Humanizing...' : 'Humanize'}
                    </button>
                </form>
                <div className="output-section" style={{ marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, marginBottom: 8 }}>Output</h2>
                    {loading ? (
                        <p style={{ color: '#888' }}>Processing...</p>
                    ) : outputText ? (
                        <div style={{ background: '#f1f8e9', padding: 12, borderRadius: 6, minHeight: 40 }}>{outputText}</div>
                    ) : (
                        <div style={{ minHeight: 40, color: '#aaa' }}>No output yet.</div>
                    )}
                </div>
                {error && <div className="error" style={{ color: '#d32f2f', marginBottom: 12, textAlign: 'center' }}>{error}</div>}
                <div className="credits-info" style={{ textAlign: 'center', fontWeight: 500 }}>
                    <span>Credits left: </span>
                    {creditsLoading ? <span style={{ color: '#888' }}>Loading...</span> : credits !== null ? <span>{credits}</span> : <span style={{ color: '#d32f2f' }}>N/A</span>}
                </div>
            </div>
        </div>
    );
};

export default HomePage;