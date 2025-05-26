import React, { useState, useEffect } from 'react';
import { humanizeText } from '../api/humanizer';
import supabase from '../utils/supabaseClient';

const turquoise = '#1DE9B6';
const blue = '#1976D2';

const HighlightedDiff: React.FC<{ input: string; output: string; reasons: string[] }> = ({ input, output, reasons }) => {
    // Simple word diff (for demo, not NLP-accurate)
    const inputWords = input.split(/(\s+)/);
    const outputWords = output.split(/(\s+)/);
    // Map output words to input words for highlighting
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {outputWords.map((word, i) => {
                const changed = inputWords[i] !== word;
                return (
                    <span
                        key={i}
                        style={{
                            background: changed ? turquoise : 'transparent',
                            color: changed ? blue : '#222',
                            borderRadius: 4,
                            padding: changed ? '2px 6px' : undefined,
                            margin: '0 2px',
                            transition: 'background 0.3s',
                            cursor: changed ? 'pointer' : 'default',
                            fontWeight: changed ? 600 : 400,
                        }}
                        title={changed ? (reasons[i] || 'Changed for humanization') : 'No change'}
                    >
                        {word}
                    </span>
                );
            })}
        </div>
    );
};

const HomePage: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [credits, setCredits] = useState<number | null>(null);
    const [diffReasons, setDiffReasons] = useState<string[]>([]);

    useEffect(() => {
        let isMounted = true;
        const fetchUserCredits = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('credits')
                    .eq('id', data.user.id)
                    .single();
                if (isMounted && userData) {
                    setCredits(userData.credits);
                }
            }
        };
        fetchUserCredits();
        return () => { isMounted = false; };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let isMounted = true;
        setLoading(true);
        setError('');
        setOutputText('');
        setDiffReasons([]);
        try {
            if (credits !== null && credits <= 0) {
                if (isMounted) {
                    setError('You have no credits left. Please upgrade your plan.');
                }
                setLoading(false);
                return;
            }
            // Call API
            const result = await humanizeText(inputText);
            if (isMounted) {
                setOutputText(result);
                // For demo: generate fake reasons for each changed word
                const inputWords = inputText.split(/(\s+)/);
                const outputWords = result.split(/(\s+)/);
                const reasons = outputWords.map((word, i) => {
                    if (inputWords[i] !== word) {
                        return 'Reworded for natural tone';
                    }
                    return '';
                });
                setDiffReasons(reasons);
            }
            // Deduct credits and store result
            await updateUserCredits(isMounted);
            await storeResult(inputText, result);
        } catch (err: any) {
            if (isMounted) {
                setError(err.message || 'Failed to humanize text');
            }
        } finally {
            if (isMounted) {
                setLoading(false);
            }
        }
        return () => { isMounted = false; };
    };

    const updateUserCredits = async (isMounted = true) => {
        const { data } = await supabase.auth.getUser();
        if (data?.user && credits !== null) {
            await supabase
                .from('users')
                .update({ credits: credits - 1 })
                .eq('id', data.user.id);
            if (isMounted) {
                setCredits(credits - 1);
            }
        }
    };

    const storeResult = async (input: string, output: string) => {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
            await supabase
                .from('projects')
                .insert([
                    {
                        user_id: data.user.id,
                        input_text: input,
                        output_text: output,
                        created_at: new Date().toISOString(),
                    },
                ]);
        }
    };

    return (
        <div className="home-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '80vh', background: '#f7fafd' }}>
            <div style={{ background: '#fff', padding: 32, borderRadius: 16, boxShadow: '0 2px 24px rgba(25, 118, 210, 0.10)', maxWidth: 1200, width: '100%', display: 'flex', gap: 32 }}>
                {/* Input Side */}
                <div style={{ flex: 1, minWidth: 320 }}>
                    <h1 style={{ textAlign: 'center', marginBottom: 24, color: blue }}>AI Humanizer Tool</h1>
                    <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Enter text to humanize"
                            rows={8}
                            required
                            style={{ width: '100%', marginBottom: 12, fontSize: 16, padding: 10, border: `2px solid ${turquoise}`, borderRadius: 8, background: '#e0f7fa' }}
                        />
                        <button type="submit" disabled={loading} style={{ width: '100%', fontSize: 18, padding: 12, background: turquoise, color: blue, border: 'none', borderRadius: 8, fontWeight: 700, boxShadow: '0 2px 8px rgba(25, 233, 182, 0.15)' }}>
                            {loading ? 'Humanizing...' : 'Humanize'}
                        </button>
                    </form>
                    {error && <p className="error" style={{ color: '#d32f2f', marginBottom: 12, textAlign: 'center' }}>{error}</p>}
                    <div className="credits-info" style={{ textAlign: 'center', fontWeight: 500, color: blue }}>
                        <p>Credits remaining: {credits !== null ? credits : 'Log in to view'}</p>
                    </div>
                </div>
                {/* Output Side */}
                <div style={{ flex: 1, minWidth: 320, background: '#e3f2fd', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px rgba(25, 118, 210, 0.08)' }}>
                    <h2 style={{ color: turquoise, fontWeight: 700, marginBottom: 16 }}>AI Output & Changes</h2>
                    {outputText ? (
                        <>
                            <div style={{ marginBottom: 16, fontSize: 16, color: blue, fontWeight: 600 }}>Side-by-side comparison:</div>
                            <div style={{ display: 'flex', gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: turquoise, fontWeight: 700, marginBottom: 8 }}>Original</div>
                                    <div style={{ background: '#fff', borderRadius: 8, padding: 12, minHeight: 40, border: `1.5px solid ${turquoise}` }}>{inputText}</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: blue, fontWeight: 700, marginBottom: 8 }}>Humanized</div>
                                    <div style={{ background: '#fff', borderRadius: 8, padding: 12, minHeight: 40, border: `1.5px solid ${blue}` }}>
                                        <HighlightedDiff input={inputText} output={outputText} reasons={diffReasons} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: 24, color: '#555', fontSize: 15 }}>
                                <b>How to read:</b> <span style={{ background: turquoise, color: blue, borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>highlighted</span> words were changed by the AI for a more human, natural tone.
                            </div>
                        </>
                    ) : (
                        <div style={{ color: '#888', fontStyle: 'italic', marginTop: 32 }}>AI output will appear here after you click Humanize.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;