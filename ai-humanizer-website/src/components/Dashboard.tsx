// NOTE: If you get an npm ERESOLVE error when installing react-wordcloud with React 17,
// run: npm install react-wordcloud d3-cloud --legacy-peer-deps
// This will bypass the peer dependency warning for react@17 and allow installation.

import React, { useEffect, useState } from 'react';
import supabase from '../utils/supabaseClient';
import ReactWordcloud from 'react-wordcloud';

const turquoise = '#1DE9B6';
const blue = '#1976D2';

const TABS = ['Projects', 'Word Cloud', 'Analytics'] as const;
type Tab = typeof TABS[number];

function getWordCounts(texts: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    texts.forEach(text => {
        text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .forEach(word => {
                if (word.length > 2 && !['the', 'and', 'for', 'with', 'that', 'are', 'was', 'this', 'but', 'you', 'your'].includes(word)) {
                    counts[word] = (counts[word] || 0) + 1;
                }
            });
    });
    return counts;
}

const AI_WORDS = [
    'utilize', 'thus', 'therefore', 'furthermore', 'additionally', 'consequently', 'moreover', 'hence', 'whereas', 'notwithstanding', 'insofar', 'herein', 'aforementioned', 'pursuant', 'endeavor', 'commence', 'terminate', 'facilitate', 'demonstrate', 'implement', 'objective', 'obtain', 'provide', 'significant', 'impact', 'solution', 'approach', 'methodology', 'process', 'system', 'data', 'information', 'analysis', 'result', 'output', 'input', 'model', 'algorithm', 'function', 'variable', 'parameter'
];

const Dashboard: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [credits, setCredits] = useState<number | null>(null);
    const [creditsHistory, setCreditsHistory] = useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [tab, setTab] = useState<Tab>('Projects');

    // Fetch user projects
    const fetchUserData = async (userId: string) => {
        setLoading(true);
        setError('');
        const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (projectsError) {
            setError(projectsError.message);
        } else {
            setProjects(projectsData || []);
        }
        setLoading(false);
    };

    // Fetch user profile
    const fetchUserProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (!error) {
            setProfile(data);
        }
    };

    // Fetch user credits
    const fetchUserCredits = async (userId: string) => {
        const { data, error } = await supabase
            .from('users')
            .select('credits, total_credits')
            .eq('id', userId)
            .single();
        if (!error) {
            setCredits(data?.credits ?? null);
        }
    };

    // Fetch credits history
    const fetchCreditsHistory = async (userId: string) => {
        const { data, error } = await supabase
            .from('credits_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) {
            setCreditsHistory(data || []);
        }
    };

    // Fetch payments
    const fetchPayments = async (userId: string) => {
        const { data, error } = await supabase
            .from('payments')
            .select('*, plan_id, plans(name)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!error) {
            setPayments(data || []);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const checkSession = async () => {
            setCheckingAuth(true);
            const { data: { session }, error } = await supabase.auth.getSession();
            if (!isMounted) {
                return;
            }
            if (error) {
                setUser(null);
                setCheckingAuth(false);
                return;
            }
            setUser(session?.user || null);
            setCheckingAuth(false);
            if (session?.user) {
                const userId = session.user.id;
                fetchUserData(userId);
                fetchUserProfile(userId);
                fetchUserCredits(userId);
                fetchCreditsHistory(userId);
                fetchPayments(userId);
            }
        };
        checkSession();
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) {
                return;
            }
            setUser(session?.user || null);
            if (session?.user) {
                const userId = session.user.id;
                fetchUserData(userId);
                fetchUserProfile(userId);
                fetchUserCredits(userId);
                fetchCreditsHistory(userId);
                fetchPayments(userId);
            } else {
                setProjects([]);
                setProfile(null);
                setCredits(null);
                setCreditsHistory([]);
                setPayments([]);
            }
        });
        return () => {
            isMounted = false;
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    // --- Analytics ---
    // Word cloud data
    const aiWordCounts = getWordCounts(projects.map(p => p.input_text));
    const humanWordCounts = getWordCounts(projects.map(p => p.output_text));
    const aiWordsCloud = Object.entries(aiWordCounts).map(([text, value]) => ({
        text,
        value,
        color: AI_WORDS.includes(text) ? '#d32f2f' : blue,
    }));
    const humanWordsCloud = Object.entries(humanWordCounts).map(([text, value]) => ({
        text,
        value,
        color: AI_WORDS.includes(text) ? '#d32f2f' : turquoise,
    }));

    // Usage over time (simple bar chart)
    const usageByDay: Record<string, number> = projects.reduce((acc, p) => {
        const day = new Date(p.created_at).toLocaleDateString();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const usageDays: string[] = Object.keys(usageByDay);
    const usageCounts: number[] = Object.values(usageByDay);

    function evaluateBestPractices(text: string) {
        const { length } = text;
        const hasPunctuation = /[.!?]/.test(text);
        const hasCapitalization = /[A-Z]/.test(text[0]);
        const hasParagraphs = /\n{2,}/.test(text);
        const isLong = length > 120;
        const isShort = length < 30;
        let summary = [];
        if (isShort) { summary.push('Very short (may seem robotic)'); }
        if (isLong) { summary.push('Good length for natural writing'); }
        if (!hasPunctuation) { summary.push('No punctuation (add periods, etc.)'); }
        if (!hasCapitalization) { summary.push('No capitalization at start'); }
        if (hasParagraphs) { summary.push('Has paragraphs (good for readability)'); }
        if (summary.length === 0) { summary.push('Looks good!'); }
        return summary;
    }

    if (checkingAuth) return <div style={{textAlign:'center',marginTop:40}}>Loading dashboard...</div>;
    if (!user) {
        return (
            <div className="auth-required" style={{textAlign:'center',marginTop:40}}>
                <h2>You must be logged in to view your dashboard.</h2>
                <p>Please <a href="/login">log in</a> or <a href="/signup">sign up</a> to continue.</p>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '2.5rem 1rem 4rem 1rem',
            minHeight: '100vh',
            background: 'linear-gradient(120deg, #fafdff 0%, #e0f7fa 100%)',
            borderRadius: 32,
            boxShadow: '0 8px 48px rgba(30,233,182,0.10)',
            position: 'relative',
        }}>
            <h1 style={{ textAlign: 'center', fontSize: 40, color: blue, fontWeight: 900, letterSpacing: 1, marginBottom: 18 }}>Your Dashboard</h1>
            {profile && (
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <strong style={{ fontSize: 22, color: turquoise }}>Welcome, {profile.full_name || user.email}!</strong>
                    {profile.avatar_url && <img src={profile.avatar_url} alt="Avatar" style={{ width: 48, borderRadius: '50%', marginLeft: 16 }} />}
                </div>
            )}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <span style={{ fontWeight: 700, color: blue, fontSize: 18 }}>Credits:</span>
                <span style={{ fontWeight: 900, color: turquoise, fontSize: 22, marginLeft: 10 }}>{credits !== null ? credits : 'Loading...'}</span>
            </div>
            {/* Tab Navigation */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginBottom: 36 }}>
                {TABS.map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            background: tab === t ? turquoise : '#fff',
                            color: tab === t ? '#fff' : blue,
                            border: `2px solid ${turquoise}`,
                            borderRadius: 16,
                            padding: '10px 28px',
                            fontWeight: 800,
                            fontSize: 17,
                            cursor: 'pointer',
                            boxShadow: tab === t ? '0 2px 8px rgba(30,233,182,0.13)' : 'none',
                            transition: 'background 0.2s, color 0.2s',
                        }}
                    >{t}</button>
                ))}
            </div>
            {/* Tab Content */}
            {tab === 'Projects' && (
                <>
                    <h2 style={{ color: blue, fontWeight: 800, marginBottom: 18 }}>Stored Projects</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : error ? (
                        <p className="error">{error}</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {projects.map(project => (
                                <li key={project.id} style={{ marginBottom: 24, padding: 18, background: '#fafdff', borderRadius: 12, boxShadow: '0 2px 8px rgba(30,233,182,0.07)' }}>
                                    <div style={{ fontWeight: 700, color: blue, marginBottom: 6 }}>Input:</div>
                                    <div>{project.input_text}</div>
                                    <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
                                        {evaluateBestPractices(project.input_text).map((tip, i) => (
                                            <span key={i} style={{ marginRight: 8, background: '#e0f7fa', color: '#1976D2', borderRadius: 4, padding: '2px 8px' }}>{tip}</span>
                                        ))}
                                    </div>
                                    <div style={{ fontWeight: 700, color: turquoise, marginBottom: 6, marginTop: 10 }}>Output:</div>
                                    <div>{project.output_text}</div>
                                    <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
                                        {evaluateBestPractices(project.output_text).map((tip, i) => (
                                            <span key={i} style={{ marginRight: 8, background: '#e0f7fa', color: '#1DE9B6', borderRadius: 4, padding: '2px 8px' }}>{tip}</span>
                                        ))}
                                    </div>
                                    <small style={{ color: '#888' }}>{new Date(project.created_at).toLocaleString()}</small>
                                </li>
                            ))}
                        </ul>
                    )}
                    <h2 style={{ color: blue, fontWeight: 800, marginTop: 40, marginBottom: 18 }}>Credits History</h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {creditsHistory.length === 0 && <li>No credits history found.</li>}
                        {creditsHistory.map(entry => (
                            <li key={entry.id} style={{ marginBottom: 10 }}>
                                <span style={{ color: entry.change > 0 ? turquoise : '#d32f2f', fontWeight: 700 }}>
                                    {entry.change > 0 ? '+' : ''}{entry.change}
                                </span>
                                <span style={{ marginLeft: 8 }}>{entry.reason || 'No reason'}</span>
                                <small style={{ marginLeft: 12, color: '#888' }}>{new Date(entry.created_at).toLocaleString()}</small>
                            </li>
                        ))}
                    </ul>
                    <h2 style={{ color: blue, fontWeight: 800, marginTop: 40, marginBottom: 18 }}>Payments</h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {payments.length === 0 && <li>No payments found.</li>}
                        {payments.map(payment => (
                            <li key={payment.id} style={{ marginBottom: 10 }}>
                                <span style={{ fontWeight: 700, color: turquoise }}>{payment.amount} credits</span> for <span style={{ color: blue }}>{payment.plans?.name || 'Unknown Plan'}</span> - {payment.status}
                                <small style={{ marginLeft: 12, color: '#888' }}>{new Date(payment.created_at).toLocaleString()}</small>
                            </li>
                        ))}
                    </ul>
                </>
            )}
            {tab === 'Word Cloud' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40, justifyContent: 'center', alignItems: 'flex-start', marginTop: 24 }}>
                    <div style={{ flex: 1, minWidth: 320 }}>
                        <h3 style={{ color: blue, fontWeight: 800, marginBottom: 10 }}>AI Words (Input)</h3>
                        <ReactWordcloud
                            words={aiWordsCloud}
                            options={{
                                rotations: 2,
                                rotationAngles: [0, 0],
                                fontSizes: [18, 48],
                                fontFamily: 'inherit',
                                colors: aiWordsCloud.map(w => w.color),
                                enableTooltip: true,
                                deterministic: false,
                                spiral: 'rectangular',
                            }}
                        />
                        <div style={{ marginTop: 10, color: '#d32f2f', fontWeight: 700 }}>Red = "AI" words to avoid</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 320 }}>
                        <h3 style={{ color: turquoise, fontWeight: 800, marginBottom: 10 }}>Human Words (Output)</h3>
                        <ReactWordcloud
                            words={humanWordsCloud}
                            options={{
                                rotations: 2,
                                rotationAngles: [0, 0],
                                fontSizes: [18, 48],
                                fontFamily: 'inherit',
                                colors: humanWordsCloud.map(w => w.color),
                                enableTooltip: true,
                                deterministic: false,
                                spiral: 'rectangular',
                            }}
                        />
                        <div style={{ marginTop: 10, color: turquoise, fontWeight: 700 }}>Green = Human-like words</div>
                    </div>
                </div>
            )}
            {tab === 'Analytics' && (
                <div style={{ marginTop: 32, textAlign: 'center' }}>
                    <h2 style={{ color: blue, fontWeight: 800, marginBottom: 18 }}>Usage Over Time</h2>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', justifyContent: 'center', minHeight: 120 }}>
                        {usageDays.map((day, i) => (
                            <div key={day} style={{ width: 32, background: turquoise, height: usageCounts[i] * 18 + 10, borderRadius: 8, margin: '0 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', transition: 'height 0.3s' }}>
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{usageCounts[i]}</span>
                                <span style={{ color: '#333', fontSize: 12, marginTop: 6 }}>{day}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 32 }}>
                        <h3 style={{ color: blue, fontWeight: 800 }}>Project Length Distribution</h3>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', justifyContent: 'center', minHeight: 80 }}>
                            {['<50', '50-100', '100-200', '200+'].map((bucket, i) => {
                                const counts = projects.filter(p => {
                                    const len = p.input_text.length;
                                    if (i === 0) return len < 50;
                                    if (i === 1) return len >= 50 && len < 100;
                                    if (i === 2) return len >= 100 && len < 200;
                                    return len >= 200;
                                }).length;
                                return (
                                    <div key={bucket} style={{ width: 38, background: blue, height: counts * 16 + 8, borderRadius: 8, margin: '0 2px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', transition: 'height 0.3s' }}>
                                        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{counts}</span>
                                        <span style={{ color: '#fff', fontSize: 12, marginTop: 6 }}>{bucket}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;