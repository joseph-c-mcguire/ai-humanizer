import React, { useEffect, useState } from 'react';
import supabase from '../utils/supabaseClient';

const Dashboard: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Fetch user projects
    const fetchUserData = async (userId: string) => {
        setLoading(true);
        setError('');
        const { data: projectsData, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            setError(error.message);
        } else {
            setProjects(projectsData || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        let isMounted = true;
        const checkUser = async () => {
            setCheckingAuth(true);
            const { data } = await supabase.auth.getUser();
            if (!isMounted) { return; }
            setUser(data?.user || null);
            setCheckingAuth(false);
            if (data?.user) {
                fetchUserData(data.user.id);
            }
        };
        checkUser();
        // Subscribe to auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) { return; }
            setUser(session?.user || null);
            if (session?.user) {
                fetchUserData(session.user.id);
            } else {
                setProjects([]);
            }
        });
        return () => {
            isMounted = false;
            authListener?.subscription?.unsubscribe();
        };
    }, []);

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
        </div>
    );
};

export default Dashboard;