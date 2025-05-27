import React, { useEffect, useState } from 'react';
import supabase from '../utils/supabaseClient';

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

    // Fetch user projects
    const fetchUserData = async (userId: string) => {
        setLoading(true);
        setError('');
        // Fetch projects
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
        // Subscribe to auth changes
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

    useEffect(() => {
        // Debug: log user and session state
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            // eslint-disable-next-line no-console
            console.log('Dashboard session:', session);
            // eslint-disable-next-line no-console
            console.log('Dashboard user state:', user);
        })();
    }, [user]);

    if (checkingAuth) return <div>Loading dashboard...</div>;
    if (!user) {
        return (
            <div className="auth-required">
                <h2>You must be logged in to view your dashboard.</h2>
                <p>Please <a href="/login">log in</a> or <a href="/signup">sign up</a> to continue.</p>
            </div>
        );
    }
    return (
        <div className="dashboard">
            <h1>Your Dashboard</h1>
            {profile && (
                <div className="profile">
                    <strong>Welcome, {profile.full_name || user.email}!</strong>
                    {profile.avatar_url && <img src={profile.avatar_url} alt="Avatar" style={{ width: 48, borderRadius: '50%' }} />}
                </div>
            )}
            <div className="credits">
                <strong>Credits:</strong> {credits !== null ? credits : 'Loading...'}
            </div>
            <h2>Stored Projects</h2>
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p className="error">{error}</p>
            ) : (
                <ul>
                    {projects.map(project => (
                        <li key={project.id}>
                            {project.input_text} → {project.output_text} <br />
                            <small>{new Date(project.created_at).toLocaleString()}</small>
                        </li>
                    ))}
                </ul>
            )}
            <h2>Credits History</h2>
            <ul>
                {creditsHistory.length === 0 && <li>No credits history found.</li>}
                {creditsHistory.map(entry => (
                    <li key={entry.id}>
                        {entry.change > 0 ? '+' : ''}{entry.change} ({entry.reason || 'No reason'}) <small>{new Date(entry.created_at).toLocaleString()}</small>
                    </li>
                ))}
            </ul>
            <h2>Payments</h2>
            <ul>
                {payments.length === 0 && <li>No payments found.</li>}
                {payments.map(payment => (
                    <li key={payment.id}>
                        {payment.amount} credits for {payment.plans?.name || 'Unknown Plan'} - {payment.status} <small>{new Date(payment.created_at).toLocaleString()}</small>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Dashboard;