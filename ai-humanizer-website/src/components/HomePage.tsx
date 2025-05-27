import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { humanizeText } from '../api/humanizer';
import supabase from '../utils/supabaseClient';
import { getUserCredits } from '../api/credits';

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
    console.log('HomePage rendered');
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [credits, setCredits] = useState<number | null>(null);
    const [plan, setPlan] = useState<string>('free');
    const [diffReasons, setDiffReasons] = useState<string[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const history = useHistory();

    useEffect(() => {
        let isMounted = true;
        const checkAuth = async () => {
            const { data } = await supabase.auth.getUser();
            if (!isMounted) { return; }
            if (data?.user) {
                setIsLoggedIn(true);
                setUserId(data.user.id);
                const sessionRes = await supabase.auth.getSession();
                setSessionId(sessionRes.data.session?.access_token || null);
                const userCredits = await getUserCredits();
                if (userCredits) {
                    setCredits(userCredits.credits_remaining);
                    setPlan(userCredits.plan_type);
                }
            } else {
                // Always sign in as guest if not signed in
                const guestEmail = 'guest@guest.com';
                const guestPassword = 'guest1234';
                const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: guestEmail,
                    password: guestPassword,
                });
                if (signInError) {
                    setError('Guest access unavailable. Please contact support.');
                    setCredits(null);
                    setPlan('guest');
                    setUserId(null);
                    setSessionId(null);
                    setIsLoggedIn(false);
                    return;
                }
                setUserId(signInData.user?.id || null);
                setSessionId(signInData.session?.access_token || null);
                setIsLoggedIn(false);
                setCredits(1); // 1 free usage for guest
                setPlan('guest');
            }
        };
        checkAuth();
        // Listen for auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted) { return; }
            setIsLoggedIn(!!session?.user);
            setUserId(session?.user?.id || null);
            setSessionId(session?.access_token || null);
            if (session?.user) {
                const userCredits = await getUserCredits();
                if (userCredits) {
                    setCredits(userCredits.credits_remaining);
                    setPlan(userCredits.plan_type);
                }
            } else {
                setCredits(1);
                setPlan('guest');
            }
        });
        return () => {
            isMounted = false;
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    // Store result helper must be defined before use
    const storeResult = async (input: string, output: string) => {
        if (!userId) {
            return;
        }
        await supabase
            .from('projects')
            .insert([
                {
                    user_id: userId,
                    input_text: input,
                    output_text: output,
                    created_at: new Date().toISOString(),
                },
            ]);
    };

    const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
        }
        setLoading(true);
        setError('');
        setOutputText('');
        setDiffReasons([]);
        try {
            if (!userId) {
                setError('User not identified. Please refresh or try again.');
                setLoading(false);
                return;
            }
            // Check credits for all users (including guest)
            if (credits !== null && credits <= 0) {
                setError('You have no credits left. Please upgrade your plan.');
                setLoading(false);
                return;
            }
            let result = '';
            if (plan === 'guest') {
                // Only allow 1 usage for guest
                const { data: usageData } = await supabase
                    .from('usages')
                    .select('id')
                    .eq('user_id', userId);
                if (usageData && usageData.length > 0) {
                    setError('You must be logged in to use this feature again. Please sign up or log in.');
                    setLoading(false);
                    return;
                }
                // Use OpenAI API for guest
                try {
                    const axios = (await import('axios')).default;
                    const apiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
                    if (!apiKey) { setError('No OpenAI API key configured for anonymous usage.'); setLoading(false); return; }
                    const response = await axios.post(
                        'https://api.openai.com/v1/chat/completions',
                        {
                            model: 'gpt-3.5-turbo',
                            messages: [
                                { role: 'system', content: 'Rewrite the following text to sound more human and natural.' },
                                { role: 'user', content: inputText },
                            ],
                            max_tokens: 512,
                            temperature: 0.7,
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                    result = response.data.choices[0].message.content;
                } catch (anonErr: unknown) {
                    if (anonErr instanceof Error) {
                        setError(anonErr.message || 'Failed to humanize text (anonymous)');
                    } else {
                        setError('Failed to humanize text (anonymous)');
                    }
                    setLoading(false);
                    return;
                }
            } else {
                // Authenticated user
                try {
                    result = await humanizeText(inputText);
                } catch (err: unknown) {
                    if (err instanceof Error) {
                        setError(err.message || 'Failed to humanize text');
                    } else {
                        setError('Failed to humanize text');
                    }
                    setLoading(false);
                    return;
                }
            }
            setOutputText(result);
            const inputWords = inputText.split(/(\s+)/);
            const outputWords = result.split(/(\s+)/);
            const reasons = outputWords.map((word: string, i: number) => inputWords[i] !== word ? 'Reworded for natural tone' : '');
            setDiffReasons(reasons);
            // Store usage in Supabase
            await storeResult(inputText, result);
            await supabase
                .from('usages')
                .insert([
                    {
                        user_id: userId,
                        input_text: inputText,
                        output_text: result,
                        created_at: new Date().toISOString(),
                        session_id: sessionId,
                    },
                ]);
            // Update credits for authenticated users
            if (plan !== 'guest') {
                const userCredits = await getUserCredits();
                if (userCredits) {
                    setCredits(userCredits.credits_remaining);
                }
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'Failed to humanize text');
            } else {
                setError('Failed to humanize text');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
            <h1 style={{ fontSize: 28, marginBottom: 16 }}>AI Text Humanizer</h1>
            <p style={{ marginBottom: 24 }}>
                Paste your text below and click "Humanize" to make it sound more natural and human-like.
            </p>
            {/* If guest access is unavailable, show a creative friendly message and hide the form */}
            {error === 'Guest access unavailable. Please contact support.' ? (
                <div style={{
                    background: '#fff3cd',
                    color: '#856404',
                    border: '1.5px solid #ffeeba',
                    borderRadius: 8,
                    padding: 32,
                    margin: '32px 0',
                    textAlign: 'center',
                    fontSize: 18,
                    fontWeight: 500,
                    boxShadow: '0 2px 12px rgba(255, 223, 0, 0.08)'
                }}>
                    <span role="img" aria-label="robot" style={{ fontSize: 32 }}>🤖</span>
                    <div style={{ marginTop: 16 }}>
                        <b>Guest access is currently unavailable.</b>
                        <br />
                        <span style={{ fontSize: 16, color: '#555' }}>
                            Our guest robot is on vacation!<br />
                            <span style={{ color: turquoise }}>But you can still join the fun:</span>
                        </span>
                        <br /><br />
                        <button
                            type="button"
                            onClick={() => { window.location.assign('/signup'); }}
                            style={{
                                background: turquoise,
                                color: '#fff',
                                padding: '12px 28px',
                                borderRadius: 6,
                                textDecoration: 'none',
                                fontWeight: 700,
                                fontSize: 18,
                                boxShadow: '0 2px 8px rgba(25, 233, 182, 0.10)',
                                border: 'none',
                                cursor: 'pointer',
                                marginBottom: 8
                            }}
                        >
                            🚀 Create a free account and blast off!
                        </button>
                        <br /><br />
                        <span style={{ fontSize: 15, color: '#888' }}>
                            Need help? <a href="/contact" style={{ color: blue, textDecoration: 'underline' }}>Contact support</a>
                        </span>
                    </div>
                </div>
            ) : (
                <>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            rows={6}
                            placeholder="Enter your text here..."
                            style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                backgroundColor: turquoise,
                                color: '#fff',
                                padding: '12px 24px',
                                fontSize: 16,
                                borderRadius: 4,
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'background 0.3s',
                            }}
                        >
                            {loading ? 'Humanizing...' : 'Humanize'}
                        </button>
                    </form>
                    {error && error !== 'Guest access unavailable. Please contact support.' && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
                </>
            )}
            {outputText && (
                <div style={{ marginTop: 32 }}>
                    <h2 style={{ fontSize: 22, marginBottom: 16 }}>Humanized Text</h2>
                    <HighlightedDiff input={inputText} output={outputText} reasons={diffReasons} />
                </div>
            )}
            <div style={{ marginTop: 32, fontSize: 14, color: '#555' }}>
                {plan === 'guest' ? (
                    <div>
                        You are using the app as a guest. Your changes will not be saved. Consider{' '}
                        <button
                            onClick={async () => {
                                setLoading(true);
                                setError('');
                                try {
                                    const { data: user, error: signUpError } = await supabase.auth.signUp({
                                        email: `user_${Date.now()}@example.com`,
                                        password: Math.random().toString(36).slice(-8),
                                    });
                                    if (signUpError) { throw signUpError; }
                                    setUserId(user.user?.id || null);
                                    setIsLoggedIn(true);
                                    setPlan('free');
                                    setCredits(100); // 100 free credits for new users
                                    localStorage.removeItem('guest_user_id');
                                } catch (err: unknown) {
                                    if (err instanceof Error) {
                                        setError(err.message);
                                    } else {
                                        setError('Failed to create account');
                                    }
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            style={{
                                background: 'none',
                                color: turquoise,
                                border: 'none',
                                padding: 0,
                                textDecoration: 'underline',
                                cursor: 'pointer',
                            }}
                        >
                            signing up
                        </button>{' '}
                        for a permanent account.
                    </div>
                ) : (
                    <div>
                        Logged in as user {userId}. Plan: {plan}. Credits: {credits}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HomePage;