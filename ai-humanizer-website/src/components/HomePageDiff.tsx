import React, { useState, useRef } from 'react';

// Helper to get OpenAI API key (copied from HomePage)
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

// Get alternative, more human-sounding suggestions for a word in context
const getHumanAlternatives = async (
    word: string,
    context: string,
    apiKeyOverride?: string
): Promise<string[]> => {
    const apiKey = apiKeyOverride || getOpenAIApiKey();
    if (!apiKey) { return []; }
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
    } catch {
        return [];
    }
};

// Get explanation for why a word/group was changed
const getChangeExplanation = async (
    original: string,
    changed: string,
    context: string,
    apiKeyOverride?: string
): Promise<string> => {
    const apiKey = apiKeyOverride || getOpenAIApiKey();
    if (!apiKey) { return ''; }
    try {
        const prompt = `Explain in 1-2 sentences why the phrase "${changed}" was chosen instead of "${original}" in the following context. Focus on how it improves human-likeness, tone, or clarity.\n\nContext: ${context}`;
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: 'You are an expert at explaining AI text rewriting choices for humanization.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 64,
                temperature: 0.6,
            })
        });
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        return typeof content === 'string' ? content.trim() : '';
    } catch {
        return '';
    }
};

const turquoise = '#1DE9B6';
const blue = '#1976D2';

// Disclaimers and design improvements for HomePageDiff
// 1. Add a disclaimer below the diff output
// 2. Add subtle animation and polish to tooltips
// 3. Improve accessibility and mobile responsiveness

const HighlightedDiff: React.FC<{ input: string; output: string; reasons: string[] }> = ({ input, output, reasons }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [alternatives, setAlternatives] = useState<string[]>([]);
    const [altLoading, setAltLoading] = useState(false);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
    const [explanation, setExplanation] = useState('');
    const [explanationLoading, setExplanationLoading] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const lastWordRef = useRef<string | null>(null);
    const lastOrigRef = useRef<string | null>(null);

    const inputWords = input.split(/(\s+)/);
    const outputWords = output.split(/(\s+)/);
    const handleMouseEnter = (i: number, word: string, e: React.MouseEvent) => {
        setHoveredIdx(i);
        setTooltipPos({ x: e.clientX, y: e.clientY });
        if (debounceRef.current) { clearTimeout(debounceRef.current); }
        debounceRef.current = setTimeout(async () => {
            if (lastWordRef.current === word && lastOrigRef.current === inputWords[i]) { return; }
            setAltLoading(true);
            setExplanationLoading(true);
            setAlternatives([]);
            setExplanation('');
            try {
                const context = output;
                const alts = await getHumanAlternatives(word, context);
                setAlternatives(alts);
                lastWordRef.current = word;
                lastOrigRef.current = inputWords[i];
                if (inputWords[i] !== word) {
                    const expl = await getChangeExplanation(inputWords[i], word, context);
                    setExplanation(expl);
                } else {
                    setExplanation('');
                }
            } catch {
                setAlternatives([]);
                setExplanation('');
            } finally {
                setAltLoading(false);
                setExplanationLoading(false);
            }
        }, 600);
    };
    const handleMouseLeave = () => {
        setHoveredIdx(null);
        setAlternatives([]);
        setAltLoading(false);
        setExplanation('');
        setExplanationLoading(false);
        if (debounceRef.current) { clearTimeout(debounceRef.current); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
            <div style={{
                background: 'linear-gradient(90deg, #fafdff 60%, #e0f7fa 100%)',
                borderRadius: 16,
                padding: 24,
                fontSize: 19,
                lineHeight: 1.8,
                wordBreak: 'break-word',
                boxShadow: '0 6px 24px rgba(30,233,182,0.10)',
                minHeight: 60,
                transition: 'box-shadow 0.3s',
                overflowX: 'auto',
            }}>
                {outputWords.map((word, i) => {
                    const changed = inputWords[i] !== word;
                    return (
                        <span
                            key={i}
                            style={{
                                background: changed ? 'linear-gradient(90deg, #1DE9B6 10%, #1976D2 90%)' : 'transparent',
                                color: changed ? '#fff' : '#222',
                                borderRadius: 8,
                                padding: changed ? '4px 10px' : undefined,
                                margin: '0 2px',
                                transition: 'background 0.3s, color 0.3s, box-shadow 0.3s',
                                cursor: changed ? 'pointer' : 'default',
                                fontWeight: changed ? 700 : 400,
                                position: 'relative',
                                boxShadow: changed ? '0 2px 12px rgba(30,233,182,0.13)' : undefined,
                                outline: changed && hoveredIdx === i ? '2px solid #fff' : undefined,
                            }}
                            title={changed ? (reasons[i] || 'Changed for humanization') : 'No change'}
                            onMouseEnter={changed ? (e) => handleMouseEnter(i, word, e) : undefined}
                            onMouseLeave={changed ? handleMouseLeave : undefined}
                            tabIndex={changed ? 0 : -1}
                            aria-label={changed ? `Changed: ${word}` : undefined}
                        >
                            {word}
                            {hoveredIdx === i && changed && tooltipPos && (
                                <div
                                    style={{
                                        position: 'fixed',
                                        left: tooltipPos.x + 16,
                                        top: tooltipPos.y + 16,
                                        background: '#fff',
                                        color: '#222',
                                        border: '1.5px solid #1DE9B6',
                                        borderRadius: 14,
                                        boxShadow: '0 8px 32px rgba(30,233,182,0.18)',
                                        padding: '18px 22px',
                                        zIndex: 9999,
                                        minWidth: 240,
                                        fontSize: 16,
                                        maxWidth: 340,
                                        pointerEvents: 'auto',
                                        animation: 'fadeIn 0.25s',
                                    }}
                                    role="tooltip"
                                >
                                    <div style={{ fontWeight: 700, marginBottom: 8, color: '#1976D2' }}>Why this change?</div>
                                    {explanationLoading ? (
                                        <div style={{ color: '#888' }}>Loading explanation...</div>
                                    ) : explanation ? (
                                        <div style={{ marginBottom: 10 }}>{explanation}</div>
                                    ) : (
                                        <div style={{ color: '#888', marginBottom: 10 }}>No explanation</div>
                                    )}
                                    <div style={{ fontWeight: 600, marginBottom: 4, color: '#1DE9B6' }}>Alternatives:</div>
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
            {/* Disclaimer section */}
            <div style={{
                marginTop: 18,
                fontSize: 15,
                color: '#888',
                background: 'rgba(25,118,210,0.06)',
                borderRadius: 10,
                padding: '12px 18px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(25,118,210,0.04)',
                maxWidth: 600,
                alignSelf: 'center',
            }}>
                <strong>Disclaimer:</strong> This tool uses AI to suggest human-like rewrites and explanations. Results may not always be perfect or contextually accurate. Please review and edit the output as needed for your use case.
            </div>
        </div>
    );
};

export default HighlightedDiff;
