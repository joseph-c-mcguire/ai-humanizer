import React, { useEffect, useState } from 'react';
import supabase from '../utils/supabaseClient';

const CreditsTracker: React.FC = () => {
    const [usedCredits, setUsedCredits] = useState<number>(0);
    const [totalCredits, setTotalCredits] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;
        const fetchCredits = async () => {
            setLoading(true);
            setError('');
            const { data, error: userError } = await supabase.auth.getUser();
            const user = data?.user;
            if (!user) {
                if (isMounted) {
                    setError('You must be logged in to view credits.');
                    setLoading(false);
                }
                return;
            }
            // Always fetch the most recent user row, or create if not exists
            let { data: userData, error } = await supabase
                .from('users')
                .select('credits, total_credits')
                .eq('id', user.id)
                .single();
            if (error && error.code === 'PGRST116') { // no rows returned
                // If user row does not exist, create it with 500 credits
                const { data: newUser, error: insertError } = await supabase
                    .from('users')
                    .insert([{ id: user.id, credits: 500, total_credits: 500 }])
                    .select('credits, total_credits')
                    .single();
                if (isMounted) {
                    if (insertError) {
                        setError(insertError.message);
                        setLoading(false);
                        return;
                    }
                    userData = newUser;
                }
            } else if (error) {
                if (isMounted) {
                    setError(error.message);
                    setLoading(false);
                    return;
                }
            }
            if (isMounted && userData) {
                setUsedCredits((userData.total_credits || 0) - (userData.credits || 0));
                setTotalCredits(userData.total_credits || 0);
            }
            if (isMounted) setLoading(false);
        };
        fetchCredits();
        return () => { isMounted = false; };
    }, []);

    if (loading) return <div>Loading credits...</div>;
    if (error) return <div className="error">{error}</div>;

    const remainingCredits = totalCredits - usedCredits;

    return (
        <div className="card container" style={{ maxWidth: 400, margin: '2rem auto', textAlign: 'center' }}>
            <h2>Credits Tracker</h2>
            <p>Used Credits: {usedCredits}</p>
            <p>Total Credits: {totalCredits}</p>
            <p>Remaining Credits: {remainingCredits}</p>
        </div>
    );
};

export default CreditsTracker;