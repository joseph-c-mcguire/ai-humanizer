// --- Modernized HomePage with smooth edges, creative layout, and navigation ---
import React, { useState, useRef, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import supabase from '../utils/supabaseClient';
import HighlightedDiff from './HomePageDiff';
import { signUpUser, signInUser, signOutUser, getSession } from '../utils/auth';

const turquoise = '#1DE9B6';
const blue = '#1976D2';

const HomePage: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [diffReasons, setDiffReasons] = useState<string[]>([]);
    const [showCopied, setShowCopied] = useState(false);
    const [clearAnim, setClearAnim] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);
    const [user, setUser] = useState<any>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const history = useHistory();

    // Auth states
    const [showLogin, setShowLogin] = useState(false);
    const [showSignup, setShowSignup] = useState(false);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authFirstName, setAuthFirstName] = useState(''); // New: first name
    const [authLastName, setAuthLastName] = useState('');   // New: last name
    const [authError, setAuthError] = useState('');

    // Toast state for feedback
    const [toast, setToast] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    
    const handleLogout = async () => {
        try {
            await signOutUser();
            setToast({ type: 'success', message: 'Successfully logged out' });
            setTimeout(() => setToast(null), 3000);
        } catch (error) {
            setToast({ type: 'error', message: 'Failed to log out' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const checkSession = async () => {
            setCheckingAuth(true);
            const { session } = await getSession();
            if (!isMounted) { return; }
            setUser(session?.user || null);
            setCheckingAuth(false);
        };
        checkSession();
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) { return; }
            setUser(session?.user || null);
        });
        return () => {
            isMounted = false;
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) {
            setError('Please enter some text to humanize');
            return;
        }
        setLoading(true);
        setError('');
        setOutputText('');
        setDiffReasons([]);
        try {
            const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
            if (!apiKey) {
                throw new Error('OpenAI API key is not set. Please set REACT_APP_OPENAI_API_KEY in your environment.');
            }
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
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
            if (!response.ok) {
                let msg = `OpenAI API error: ${response.status}`;
                try {
                    const data = await response.json();
                    msg = data.error?.message || msg;
                } catch {}
                throw new Error(msg);
            }
            let result;
            try {
                result = await response.json();
            } catch (jsonErr) {
                throw new Error('The server did not return valid JSON.');
            }
            setOutputText(result.choices?.[0]?.message?.content?.trim() || '');
            const inputWords = inputText.split(/(\s+)/);
            const outputWords = (result.choices?.[0]?.message?.content?.trim() || '').split(/(\s+)/);
            const reasons = outputWords.map((word: string, i: number) =>
                inputWords[i] !== word ? 'Reworded for natural tone' : ''
            );
            setDiffReasons(reasons);
            // Automatically save project if user is logged in
            if (user && result.choices?.[0]?.message?.content) {
                try {
                    await supabase.from('projects').insert({
                        user_id: user.id,
                        input_text: inputText,
                        output_text: result.choices[0].message.content.trim(),
                        created_at: new Date().toISOString(),
                    });
                } catch (saveErr) {
                    // Optionally, show a toast or log error
                    console.error('Failed to save project:', saveErr);
                }
            }
            setTimeout(() => {
                if (outputRef.current) {
                    outputRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
        } catch (err: any) {
            setError(err.message || 'Failed to humanize text');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (outputText) {
            navigator.clipboard.writeText(outputText);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 1200);
        }
    };

    const handleClear = () => {
        setInputText('');
        setOutputText('');
        setDiffReasons([]);
        setError('');
        setClearAnim(true);
        setTimeout(() => setClearAnim(false), 500);
    };

    // Login handler
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        try {
            // FIX: Pass an object instead of two arguments
            const { user, error } = await signInUser({ email: authEmail, password: authPassword });
            if (error) {
                setAuthError(error.message || 'Login failed');
                return;
            }
            setShowLogin(false);
            setAuthEmail('');
            setAuthPassword('');
            setToast({ type: 'success', message: 'Logged in successfully' });
            setTimeout(() => setToast(null), 2000);
        } catch (err: any) {
            setAuthError(err.message || 'Login failed');
        }
    };

    // Signup handler
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError('');
        try {
            const { user, error } = await signUpUser({
                email: authEmail,
                password: authPassword,
                firstName: authFirstName,
                lastName: authLastName,
            });
            if (error) {
                setAuthError(error.message || 'Sign up failed');
                return;
            }
            setShowSignup(false);
            setAuthEmail('');
            setAuthPassword('');
            setAuthFirstName('');
            setAuthLastName('');
            setToast({ type: 'success', message: 'Account created! Please check your email to confirm.' });
            setTimeout(() => setToast(null), 3000);
        } catch (err: any) {
            setAuthError(err.message || 'Sign up failed');
        }
    };

    // Centering for main container and sections
    return (
        <div style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: 0,
            minHeight: '100vh',
            background: 'linear-gradient(120deg, #fafdff 0%, #e0f7fa 100%)',
            borderRadius: 32,
            boxShadow: '0 8px 48px rgba(30,233,182,0.10)',
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
        }}>
            {/* Navigation Bar */}
            <header style={{
                width: '100%',
                background: 'rgba(255,255,255,0.98)',
                boxShadow: '0 2px 16px rgba(30,233,182,0.07)',
                padding: '0.5rem 0',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1.5px solid #e0f7fa',
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginLeft: 24 }}>
                    <span style={{ fontWeight: 900, fontSize: 28, color: blue, letterSpacing: 1 }}>AI Humanizer</span>
                </div>
                <nav style={{ display: 'flex', alignItems: 'center', gap: 28, marginRight: 32 }}>
                    <Link to="/" style={{ color: blue, fontWeight: 700, textDecoration: 'none', fontSize: 18 }}>Home</Link>
                    <Link to="/pricing" style={{ color: blue, fontWeight: 700, textDecoration: 'none', fontSize: 18 }}>Pricing</Link>
                    <Link to="/dashboard" style={{ color: blue, fontWeight: 700, textDecoration: 'none', fontSize: 18 }}>Dashboard</Link>
                    <Link to="/credits" style={{ color: blue, fontWeight: 700, textDecoration: 'none', fontSize: 18 }}>Credits</Link>
                    <Link to="/payment" style={{ color: blue, fontWeight: 700, textDecoration: 'none', fontSize: 18 }}>Payment</Link>
                    <Link to="/contact" style={{ color: blue, fontWeight: 700, textDecoration: 'none', fontSize: 18 }}>Contact</Link>
                    {!checkingAuth && user ? (
                        <button
                            onClick={handleLogout}
                            style={{
                                background: turquoise,
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                padding: '8px 22px',
                                fontWeight: 700,
                                fontSize: 17,
                                marginLeft: 8,
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(30,233,182,0.08)',
                                transition: 'background 0.2s',
                            }}
                        >Logout</button>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowLogin(true)}
                                style={{
                                    background: turquoise,
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '8px 22px',
                                    fontWeight: 700,
                                    fontSize: 17,
                                    marginLeft: 8,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(30,233,182,0.08)',
                                    transition: 'background 0.2s',
                                }}
                            >Login</button>
                            <button
                                onClick={() => setShowSignup(true)}
                                style={{
                                    background: blue,
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '8px 22px',
                                    fontWeight: 700,
                                    fontSize: 17,
                                    marginLeft: 8,
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(25,118,210,0.08)',
                                    transition: 'background 0.2s',
                                }}
                            >Sign Up</button>
                        </>
                    )}
                </nav>
            </header>

            {/* Hero Section */}
            <section style={{ textAlign: 'center', padding: '3.5rem 0 2.5rem 0', zIndex: 1, position: 'relative' }}>
                <h1 style={{ fontSize: 44, color: blue, marginBottom: 14, fontWeight: 900, letterSpacing: 1 }}>
                    Make Your AI Text Sound <span style={{ color: turquoise }}>Human</span>
                </h1>
                <p style={{ fontSize: 22, color: '#333', marginBottom: 30, fontWeight: 500 }}>
                    Instantly transform robotic AI writing into natural, human-like content.<br />
                    Try our free AI Humanizer tool below!
                </p>
                <button
                    onClick={() => {
                        const el = document.getElementById('humanizer-tool');
                        if (el) { el.scrollIntoView({ behavior: 'smooth' }); }
                    }}
                    style={{
                        background: turquoise,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 24,
                        padding: '16px 38px',
                        fontWeight: 800,
                        fontSize: 22,
                        marginTop: 18,
                        boxShadow: '0 4px 24px rgba(30,233,182,0.13)',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                    }}
                >Try the Humanizer</button>
            </section>

            {/* Features Section */}
            <section className="section" style={{ display: 'flex', gap: 36, flexWrap: 'wrap', justifyContent: 'center', margin: '2.5rem 0' }}>
                <div className="card" style={{ minWidth: 270, flex: 1, borderRadius: 18, boxShadow: '0 2px 16px rgba(30,233,182,0.07)' }}>
                    <h3>AI-Powered Humanization</h3>
                    <p>Our advanced AI rewrites your text to sound natural, authentic, and undetectable as AI-generated.</p>
                </div>
                <div className="card" style={{ minWidth: 270, flex: 1, borderRadius: 18, boxShadow: '0 2px 16px rgba(25,118,210,0.07)' }}>
                    <h3>Fast & Easy</h3>
                    <p>Paste your text, click Humanize, and get results in seconds. No account required to try!</p>
                </div>
                <div className="card" style={{ minWidth: 270, flex: 1, borderRadius: 18, boxShadow: '0 2px 16px rgba(25,118,210,0.07)' }}>
                    <h3>Track Credits</h3>
                    <p>Sign up to track your usage, store projects, and upgrade for more credits and features.</p>
                </div>
            </section>

            {/* Humanizer Tool Section */}
            <section id="humanizer-tool" className="section" style={{ margin: '3.5rem 0', position: 'relative', borderRadius: 24, background: '#fff', boxShadow: '0 4px 32px rgba(30,233,182,0.06)', padding: '2.5rem 1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 style={{ fontSize: 30, marginBottom: 18, color: blue, fontWeight: 800 }}>AI Text Humanizer</h2>
                <p style={{ marginBottom: 28, fontSize: 18, color: '#444' }}>
                    Paste your text below and click <b>Humanize</b> to make it sound more natural and human-like.
                </p>
                <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: 18, background: '#fafdff', borderRadius: 16, boxShadow: '0 2px 12px rgba(30,233,182,0.04)', padding: 28, zIndex: 2, position: 'relative' }}
                    aria-label="AI Humanizer form"
                    autoComplete="off"
                >
                    <label htmlFor="input-text" style={{ fontWeight: 700, color: blue, marginBottom: 6, fontSize: 18 }}>Your Text</label>
                    <textarea
                        id="input-text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        rows={7}
                        placeholder="Enter your text here..."
                        style={{ width: '100%', padding: 16, fontSize: 18, borderRadius: 10, border: '1.5px solid #ccc', background: '#fafdff', outline: clearAnim ? `2px solid ${turquoise}` : undefined, transition: 'outline 0.3s', resize: 'vertical', zIndex: 2, position: 'relative', fontFamily: 'inherit' }}
                        disabled={loading}
                        aria-required="true"
                        autoComplete="off"
                    />
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', zIndex: 2, position: 'relative' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                backgroundColor: turquoise,
                                color: '#fff',
                                padding: '14px 32px',
                                fontSize: 18,
                                borderRadius: 8,
                                border: 'none',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: 800,
                                boxShadow: loading ? 'none' : '0 2px 8px rgba(30,233,182,0.08)',
                                outline: 'none',
                                userSelect: 'auto',
                                zIndex: 2,
                                position: 'relative',
                                letterSpacing: 1,
                            }}
                            aria-label="Humanize text"
                            tabIndex={0}
                        >
                            {loading ? 'Humanizing...' : 'Humanize'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={loading}
                            style={{
                                background: '#fff',
                                color: turquoise,
                                border: `1.5px solid ${turquoise}`,
                                borderRadius: 8,
                                padding: '14px 28px',
                                fontSize: 18,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: 700,
                                opacity: loading ? 0.5 : 1,
                                transition: 'opacity 0.2s, border 0.2s',
                                marginLeft: 4,
                                outline: 'none',
                                userSelect: 'auto',
                                zIndex: 2,
                                position: 'relative',
                            }}
                            aria-label="Clear text"
                            tabIndex={0}
                        >
                            Clear
                        </button>
                    </div>
                </form>
                {error && <div style={{ color: 'red', marginTop: 18, fontWeight: 600, fontSize: 17 }} role="alert">{error}</div>}
                {outputText && (
                    <div ref={outputRef} style={{ marginTop: 38 }}>
                        <h2 style={{ fontSize: 24, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14, fontWeight: 800 }}>
                            Humanized Text
                            <button
                                onClick={handleCopy}
                                style={{
                                    marginLeft: 10,
                                    background: turquoise,
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    padding: '6px 18px',
                                    fontSize: 17,
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    boxShadow: '0 1px 4px rgba(30,233,182,0.08)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                                title="Copy to clipboard"
                                aria-live="polite"
                            >
                                <span style={{
                                    display: 'inline-block',
                                    transition: 'transform 0.2s',
                                    transform: showCopied ? 'scale(1.15)' : 'scale(1)',
                                    color: showCopied ? '#fff' : undefined
                                }}>
                                    {showCopied ? 'Copied!' : 'Copy'}
                                </span>
                            </button>
                        </h2>
                        <HighlightedDiff input={inputText} output={outputText} reasons={diffReasons} />
                        {/* Project is now auto-saved for logged-in users */}
                    </div>
                )}
            </section>

            {/* Testimonials Section */}
            <section className="section" style={{ background: '#f7fafd', borderRadius: 18, padding: '2.5rem 1rem', margin: '3.5rem 0', boxShadow: '0 2px 16px rgba(25,118,210,0.06)' }}>
                <h2 style={{ textAlign: 'center', color: blue, marginBottom: 36, fontWeight: 900 }}>What Our Users Say</h2>
                <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div className="card" style={{ minWidth: 270, flex: 1, borderRadius: 14, boxShadow: '0 2px 8px rgba(30,233,182,0.07)' }}>
                        <p>“I use this tool for all my blog posts. It makes my AI content sound like me!”</p>
                        <strong>- Alex, Content Creator</strong>
                    </div>
                    <div className="card" style={{ minWidth: 270, flex: 1, borderRadius: 14, boxShadow: '0 2px 8px rgba(25,118,210,0.07)' }}>
                        <p>“Super easy to use and the results are amazing. No more AI detection issues!”</p>
                        <strong>- Jamie, Marketer</strong>
                    </div>
                    <div className="card" style={{ minWidth: 270, flex: 1, borderRadius: 14, boxShadow: '0 2px 8px rgba(25,118,210,0.07)' }}>
                        <p>“The best humanizer I’ve tried. Fast, simple, and effective.”</p>
                        <strong>- Taylor, Student</strong>
                    </div>
                </div>
            </section>

            {/* Login Modal */}
            {showLogin && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.3s' }}>
                    <form onSubmit={handleLogin} style={{ background: '#fff', padding: 32, borderRadius: 16, minWidth: 340, maxWidth: '95vw', width: '100%', boxShadow: '0 4px 32px rgba(25,118,210,0.13)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animation: 'popIn 0.3s' }}>
                        <h2 style={{ color: blue, marginBottom: 18, fontWeight: 900, letterSpacing: 1 }}>Login</h2>
                        <input type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required style={{ width: '90%', padding: 12, marginBottom: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 17, textAlign: 'center', transition: 'border 0.2s, box-shadow 0.2s' }} />
                        <input type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required style={{ width: '90%', padding: 12, marginBottom: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 17, textAlign: 'center', transition: 'border 0.2s, box-shadow 0.2s' }} />
                        {authError && <div style={{ color: 'red', marginBottom: 10, fontWeight: 600 }}>{authError}</div>}
                        <button type="submit" style={{ background: turquoise, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 17, marginTop: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(30,233,182,0.08)', transition: 'background 0.2s, transform 0.1s', outline: 'none' }}>Login</button>
                        <div style={{ marginTop: 12 }}>
                            <span style={{ color: '#555' }}>No account? </span>
                            <button type="button" onClick={() => { setShowLogin(false); setShowSignup(true); }} style={{ background: 'none', color: blue, border: 'none', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Sign Up</button>
                        </div>
                        <button type="button" onClick={() => setShowLogin(false)} style={{ marginTop: 10, background: 'none', color: '#888', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    </form>
                </div>
            )}
            {/* Signup Modal */}
            {showSignup && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.3s' }}>
                    <form onSubmit={handleSignup} style={{ background: '#fff', padding: 32, borderRadius: 16, minWidth: 340, maxWidth: '95vw', width: '100%', boxShadow: '0 4px 32px rgba(30,233,182,0.13)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, animation: 'popIn 0.3s' }}>
                        <h2 style={{ color: turquoise, marginBottom: 18, fontWeight: 900, letterSpacing: 1 }}>Sign Up</h2>
                        <input type="text" placeholder="First Name" value={authFirstName} onChange={e => setAuthFirstName(e.target.value)} required style={{ width: '90%', padding: 12, marginBottom: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 17, textAlign: 'center', transition: 'border 0.2s, box-shadow 0.2s' }} />
                        <input type="text" placeholder="Last Name" value={authLastName} onChange={e => setAuthLastName(e.target.value)} required style={{ width: '90%', padding: 12, marginBottom: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 17, textAlign: 'center', transition: 'border 0.2s, box-shadow 0.2s' }} />
                        <input type="email" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required style={{ width: '90%', padding: 12, marginBottom: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 17, textAlign: 'center', transition: 'border 0.2s, box-shadow 0.2s' }} />
                        <input type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required style={{ width: '90%', padding: 12, marginBottom: 8, borderRadius: 8, border: '1.5px solid #ccc', fontSize: 17, textAlign: 'center', transition: 'border 0.2s, box-shadow 0.2s' }} />
                        {authError && <div style={{ color: 'red', marginBottom: 10, fontWeight: 600 }}>{authError}</div>}
                        <button type="submit" style={{ background: turquoise, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 17, marginTop: 8, cursor: 'pointer', boxShadow: '0 2px 8px rgba(30,233,182,0.08)', transition: 'background 0.2s, transform 0.1s', outline: 'none' }}>Sign Up</button>
                        <div style={{ marginTop: 12 }}>
                            <span style={{ color: '#555' }}>Already have an account? </span>
                            <button type="button" onClick={() => { setShowSignup(false); setShowLogin(true); }} style={{ background: 'none', color: blue, border: 'none', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Login</button>
                        </div>
                        <button type="button" onClick={() => setShowSignup(false)} style={{ marginTop: 10, background: 'none', color: '#888', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                    </form>
                </div>
            )}
            {/* Toast Feedback */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: toast.type === 'error' ? '#ff5252' : turquoise,
                    color: '#fff',
                    padding: '14px 32px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 18,
                    boxShadow: '0 2px 16px rgba(30,233,182,0.13)',
                    zIndex: 20000,
                    animation: 'fadeIn 0.3s',
                }}>{toast.message}</div>
            )}
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default HomePage;