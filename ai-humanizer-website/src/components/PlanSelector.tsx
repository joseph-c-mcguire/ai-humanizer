import React, { useState } from 'react';
import supabase from '../utils/supabaseClient';
import { useHistory } from 'react-router-dom';

const plans = [
    { id: 1, name: 'Basic Plan', credits: 100, price: '$10/month', description: 'Great for light users.', plan_type: 'basic' },
    { id: 2, name: 'Pro Plan', credits: 500, price: '$30/month', description: 'For professionals and regular users.', plan_type: 'pro' },
    { id: 3, name: 'Premium Plan', credits: 1000, price: '$50/month', description: 'Best value for power users.', plan_type: 'premium' },
];

const PlanSelector: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const history = useHistory();

    const handleSelectPlan = async (plan: typeof plans[0]) => {
        setLoading(true);
        setError('');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError('You must be logged in to select a plan.');
            setLoading(false);
            return;
        }
        // Upsert user_credits row
        const { error: upsertError } = await supabase
            .from('user_credits')
            .upsert([
                {
                    id: user.id,
                    credits_remaining: plan.credits,
                    plan_type: plan.plan_type,
                    // Optionally reset total_credits_used or keep as is
                }
            ], { onConflict: 'id' });
        if (upsertError) {
            setError('Failed to update plan: ' + upsertError.message);
            setLoading(false);
            return;
        }
        // Optionally, insert a payment record (mock)
        await supabase.from('payments').insert({
            user_id: user.id,
            plan_id: plan.id,
            amount: plan.credits,
            status: 'success',
            created_at: new Date().toISOString(),
        });
        setLoading(false);
        history.push('/dashboard');
    };

    return (
        <div className="plan-selector">
            <h2>Select a Subscription Plan</h2>
            {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
            <ul>
                {plans.map(plan => (
                    <li key={plan.id} className="plan-item">
                        <h3>{plan.name}</h3>
                        <p>{plan.description}</p>
                        <p>Credits: {plan.credits} / month</p>
                        <p>Price: {plan.price}</p>
                        <button onClick={() => handleSelectPlan(plan)} disabled={loading}>
                            {loading ? 'Updating...' : 'Select Plan'}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PlanSelector;