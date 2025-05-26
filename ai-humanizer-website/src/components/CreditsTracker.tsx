import React, { useEffect, useState } from 'react';
import supabase from '../utils/supabaseClient';

const CreditsTracker: React.FC = () => {
    const [usedCredits, setUsedCredits] = useState<number>(0);
    const [totalCredits, setTotalCredits] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCredits = async () => {
            setLoading(true);
            setError('');
            const { data, error: userError } = await supabase.auth.getUser();
            const user = data?.user;
            if (!user) {
                setError('You must be logged in to view credits.');
                setLoading(false);
                return;
            }
            const { data: userData, error } = await supabase
                .from('users')
                .select('credits, total_credits')
                .eq('id', user.id)
                .single();
            if (error) {
                setError(error.message);
            } else if (userData) {
                setUsedCredits((userData.total_credits || 0) - (userData.credits || 0));
                setTotalCredits(userData.total_credits || 0);
            }
            setLoading(false);
        };
        fetchCredits();
    }, []);

    if (loading) return <div>Loading credits...</div>;
    if (error) return <div className="error">{error}</div>;

    const remainingCredits = totalCredits - usedCredits;

    return (
        <div className="credits-tracker">
            <h2>Credits Tracker</h2>
            <p>Used Credits: {usedCredits}</p>
            <p>Total Credits: {totalCredits}</p>
            <p>Remaining Credits: {remainingCredits}</p>
        </div>
    );
};

export default CreditsTracker;