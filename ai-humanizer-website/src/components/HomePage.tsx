import React, { useState, useRef } from 'react';

// Robustly get API key for all environments (CRA, Vite, Netlify, browser)
function getOpenAIApiKey(): string {
    if (process.env.REACT_APP_OPENAI_API_KEY) {
        return process.env.REACT_APP_OPENAI_API_KEY;
    }
    if (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_OPENAI_API_KEY) {
        return (import.meta as any).env.VITE_OPENAI_API_KEY;
    }
    if (typeof window !== 'undefined' && (window as any)._env_ && (window as any)._env_.REACT_APP_OPENAI_API_KEY) {
        return (window as any)._env_.REACT_APP_OPENAI_API_KEY;
    }
    if (typeof window !== 'undefined' && (window as any).REACT_APP_OPENAI_API_KEY) {
        return (window as any).REACT_APP_OPENAI_API_KEY;
    }
    return '';
}

// OpenAI API call for humanizing text
const humanizeText = async (inputText: string, apiKey?: string): Promise<string> => {
    if (!inputText.trim()) {
        console.warn('No input text provided to humanizeText');
        throw new Error('Please enter some text to humanize');
    }
    const key = apiKey || getOpenAIApiKey();
    if (!key) {
        console.error('OpenAI API key not configured');
        if (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') {
            alert('OpenAI API key not found. Please check your .env.local or deployment environment variables.');
        }
        throw new Error('OpenAI API key not configured');
    }
    try {
        console.log('Sending request to OpenAI API with input:', inputText);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
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
            })
        });
        const data = await response.json();
        console.log('OpenAI API response:', data);
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content.trim().length > 0) {
            return content.trim();
        } else {
            return inputText;
        }
    } catch (err: any) {
        console.error('OpenAI API error:', err);
        throw new Error('Failed to humanize text');
    }
};

// Get alternative, more human-sounding suggestions for a word in context
const getHumanAlternatives = async (
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
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'You are an expert at rewriting text to sound more human and natural.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 32,
                temperature: 0.8,
            })
        });
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === 'string' && content.trim().length > 0) {
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

const turquoise = '#1DE9B6';
const blue = '#1976D2';

// Spinner component for loading indication
const Spinner: React.FC = () => (
    <span style={{ display: 'inline-block', verticalAlign: 'middle' }} aria-label="Loading">
        <svg width="28" height="28" viewBox="0 0 44 44" stroke={turquoise}>
            <g fill="none" fillRule="evenodd" strokeWidth="4">
                <circle cx="22" cy="22" r="18" strokeOpacity=".2" />
                <path d="M40 22c0-9.94-8.06-18-18-18">
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 22 22"
                        to="360 22 22"
                        dur="1s"
                        repeatCount="indefinite"
                    />
                </path>
            </g>
        </svg>
    </span>
);

const HighlightedDiff: React.FC<{ input: string; output: string; reasons: string[] }> = ({ input, output, reasons }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [alternatives, setAlternatives] = useState<string[]>([]);
    const [altLoading, setAltLoading] = useState(false);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const lastWordRef = useRef<string | null>(null);

    // Simple word diff (for demo, not NLP-accurate)
    const inputWords = input.split(/(\s+)/);
    const outputWords = output.split(/(\s+)/);
    // Map output words to input words for highlighting
    const handleMouseEnter = (i: number, word: string, e: React.MouseEvent) => {
        setHoveredIdx(i);
        setTooltipPos({ x: e.clientX, y: e.clientY });
        if (debounceRef.current) { clearTimeout(debounceRef.current); }
        debounceRef.current = setTimeout(async () => {
            if (lastWordRef.current === word) { return; } // Don't refetch for same word
            setAltLoading(true);
            setAlternatives([]);
            try {
                const context = output;
                const alts = await getHumanAlternatives(word, context);
                setAlternatives(alts);
                lastWordRef.current = word;
            } catch {
                setAlternatives([]);
            } finally {
                setAltLoading(false);
            }
        }, 600); // 600ms delay
    };
    const handleMouseLeave = () => {
        setHoveredIdx(null);
        setAlternatives([]);
        setAltLoading(false);
        if (debounceRef.current) { clearTimeout(debounceRef.current); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
            <div style={{
                background: '#f7fafd',
                borderRadius: 8,
                padding: 16,
                fontSize: 18,
                lineHeight: 1.7,
                wordBreak: 'break-word',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
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
                                position: 'relative',
                            }}
                            title={changed ? (reasons[i] || 'Changed for humanization') : 'No change'}
                            onMouseEnter={changed ? (e) => handleMouseEnter(i, word, e) : undefined}
                            onMouseLeave={changed ? handleMouseLeave : undefined}
                        >
                            {word}
                            {hoveredIdx === i && changed && tooltipPos && (
                                <div
                                    style={{
                                        position: 'fixed',
                                        left: tooltipPos.x + 12,
                                        top: tooltipPos.y + 12,
                                        background: '#fff',
                                        color: '#222',
                                        border: '1px solid #ddd',
                                        borderRadius: 6,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                        padding: '10px 16px',
                                        zIndex: 9999,
                                        minWidth: 180,
                                        fontSize: 15,
                                    }}
                                >
                                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Alternatives:</div>
                                    {altLoading ? (
                                        <div style={{ color: '#888' }}>Loading...</div>
                                    ) : alternatives.length > 0 ? (
                                        <ul style={{ margin: 0, padding: 0, listStyle: 'disc inside' }}>
                                            {alternatives.map((alt, idx) => (
                                                <li key={idx}>{alt}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div style={{ color: '#888' }}>No suggestions</div>
                                    )}
                                </div>
                            )}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

const HomePage: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [diffReasons, setDiffReasons] = useState<string[]>([]);
    const [showCopied, setShowCopied] = useState(false);
    const [clearAnim, setClearAnim] = useState(false);
    const outputRef = useRef<HTMLDivElement>(null);

    // Smooth scroll to tool section
    const scrollToTool = (e: React.MouseEvent) => {
        e.preventDefault();
        const el = document.getElementById('humanizer-tool');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('handleSubmit called with inputText:', inputText);
        if (!inputText.trim()) {
            setError('Please enter some text to humanize');
            console.warn('Submit blocked: inputText is empty');
            return;
        }
        setLoading(true);
        setError('');
        setOutputText('');
        setDiffReasons([]);
        try {
            const result = await humanizeText(inputText);
            setOutputText(result);
            const inputWords = inputText.split(/(\s+)/);
            const outputWords = result.split(/(\s+)/);
            const reasons = outputWords.map((word: string, i: number) =>
                inputWords[i] !== word ? 'Reworded for natural tone' : ''
            );
            setDiffReasons(reasons);
            setTimeout(() => {
                if (outputRef.current) {
                    outputRef.current.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
            console.log('Humanized text result:', result);
        } catch (err: any) {
            setError(err.message || 'Failed to humanize text');
            console.error('Error in handleSubmit:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (outputText) {
            navigator.clipboard.writeText(outputText);
            setShowCopied(true);
            setTimeout(() => setShowCopied(false), 1200);
            console.log('Copied outputText to clipboard:', outputText);
        } else {
            console.warn('No outputText to copy');
        }
    };

    const handleClear = () => {
        setInputText('');
        setOutputText('');
        setDiffReasons([]);
        setError('');
        setClearAnim(true);
        setTimeout(() => setClearAnim(false), 500);
        console.log('Cleared input and output fields');
    };

    return (
        <div style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: 24,
            minHeight: '100vh',
            background: 'linear-gradient(120deg, #fafdff 0%, #e0f7fa 100%)',
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
        }}>
            {/* Animated background bubbles */}
            <div aria-hidden="true" style={{
                position: 'fixed',
                top: 0, left: 0, width: '100vw', height: '100vh',
                zIndex: 0,
                pointerEvents: 'none',
            }}>
                <svg width="100%" height="100%" style={{ position: 'absolute', left: 0, top: 0 }}>
                    <circle cx="80" cy="120" r="60" fill="#1DE9B6" fillOpacity="0.08">
                        <animate attributeName="cy" values="120;180;120" dur="8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="800" cy="60" r="80" fill="#1976D2" fillOpacity="0.07">
                        <animate attributeName="cy" values="60;120;60" dur="10s" repeatCount="indefinite" />
                    </circle>
                </svg>
            </div>

            {/* Hero Section */}
            <section style={{ textAlign: 'center', padding: '3rem 0 2rem 0', zIndex: 1, position: 'relative' }}>
                <h1 style={{ fontSize: 38, color: blue, marginBottom: 12, fontWeight: 800 }}>
                    Make Your AI Text Sound <span style={{ color: turquoise }}>Human</span>
                </h1>
                <p style={{ fontSize: 20, color: '#333', marginBottom: 24 }}>
                    Instantly transform robotic AI writing into natural, human-like content. <br />
                    Try our free AI Humanizer tool below!
                </p>
            </section>

            {/* Features Section */}
            <section className="section" style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', margin: '2rem 0' }}>
                <div className="card" style={{ minWidth: 260, flex: 1 }}>
                    <h3>AI-Powered Humanization</h3>
                    <p>Our advanced AI rewrites your text to sound natural, authentic, and undetectable as AI-generated.</p>
                </div>
                <div className="card" style={{ minWidth: 260, flex: 1 }}>
                    <h3>Fast & Easy</h3>
                    <p>Paste your text, click Humanize, and get results in seconds. No account required to try!</p>
                </div>
                <div className="card" style={{ minWidth: 260, flex: 1 }}>
                    <h3>Track Credits</h3>
                    <p>Sign up to track your usage, store projects, and upgrade for more credits and features.</p>
                </div>
            </section>

            {/* Humanizer Tool Section */}
            <section id="humanizer-tool" className="section" style={{ margin: '3rem 0', position: 'relative' }}>
                <h2 style={{ fontSize: 28, marginBottom: 16, color: blue }}>AI Text Humanizer</h2>
                <p style={{ marginBottom: 24 }}>
                    Paste your text below and click "Humanize" to make it sound more natural and human-like.
                </p>
                <form
                    onSubmit={handleSubmit}
                    style={{ display: 'flex', flexDirection: 'column', gap: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 12px rgba(30,233,182,0.04)', padding: 24, zIndex: 2, position: 'relative' }}
                    aria-label="AI Humanizer form"
                    autoComplete="off"
                >
                    <label htmlFor="input-text" style={{ fontWeight: 600, color: blue, marginBottom: 4 }}>Your Text</label>
                    <textarea
                        id="input-text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        rows={6}
                        placeholder="Enter your text here..."
                        style={{ width: '100%', padding: 12, fontSize: 16, borderRadius: 4, border: '1px solid #ccc', background: '#fafdff', outline: clearAnim ? `2px solid ${turquoise}` : undefined, transition: 'outline 0.3s', resize: 'vertical', zIndex: 2, position: 'relative' }}
                        disabled={loading}
                        aria-required="true"
                        autoComplete="off"
                    />
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', zIndex: 2, position: 'relative' }}>
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
                                fontWeight: 700,
                                boxShadow: loading ? 'none' : '0 2px 8px rgba(30,233,182,0.08)',
                                outline: 'none',
                                userSelect: 'auto',
                                zIndex: 2,
                                position: 'relative',
                            }}
                            aria-label="Humanize text"
                            tabIndex={0}
                        >
                            {loading ? <><Spinner /> Humanizing...</> : 'Humanize'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={loading}
                            style={{
                                background: '#fff',
                                color: turquoise,
                                border: `1.5px solid ${turquoise}`,
                                borderRadius: 4,
                                padding: '12px 20px',
                                fontSize: 16,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
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
                {error && <div style={{ color: 'red', marginTop: 16 }} role="alert">{error}</div>}
                {outputText && (
                    <div ref={outputRef} style={{ marginTop: 32 }}>
                        <h2 style={{ fontSize: 22, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                            Humanized Text
                            <button
                                onClick={handleCopy}
                                style={{
                                    marginLeft: 8,
                                    background: turquoise,
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 4,
                                    padding: '4px 12px',
                                    fontSize: 15,
                                    cursor: 'pointer',
                                    fontWeight: 600,
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
                    </div>
                )}
            </section>

            {/* Testimonials Section */}
            <section className="section" style={{ background: '#f7fafd', borderRadius: 12, padding: '2.5rem 1rem', margin: '3rem 0' }}>
                <h2 style={{ textAlign: 'center', color: blue, marginBottom: 32 }}>What Our Users Say</h2>
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div className="card" style={{ minWidth: 260, flex: 1 }}>
                        <p>“I use this tool for all my blog posts. It makes my AI content sound like me!”</p>
                        <strong>- Alex, Content Creator</strong>
                    </div>
                    <div className="card" style={{ minWidth: 260, flex: 1 }}>
                        <p>“Super easy to use and the results are amazing. No more AI detection issues!”</p>
                        <strong>- Jamie, Marketer</strong>
                    </div>
                    <div className="card" style={{ minWidth: 260, flex: 1 }}>
                        <p>“The best humanizer I’ve tried. Fast, simple, and effective.”</p>
                        <strong>- Taylor, Student</strong>
                    </div>
                </div>
            </section>

            {/* Footer Section */}
            {/* Footer removed as requested */}
        </div>
    );
};

export default HomePage;