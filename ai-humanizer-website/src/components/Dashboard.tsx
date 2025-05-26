import React, { useEffect, useState } from 'react';
import supabase from '../utils/supabaseClient';

const Dashboard: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            setError('');
            const { data, error: userError } = await supabase.auth.getUser();
            const user = data?.user;
            if (!user) {
                setError('You must be logged in to view your dashboard.');
                setLoading(false);
                return;
            }
            const { data: projectsData, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) {
                setError(error.message);
            } else {
                setProjects(projectsData || []);
            }
            setLoading(false);
        };
        fetchProjects();
    }, []);

    return (
        <div>
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