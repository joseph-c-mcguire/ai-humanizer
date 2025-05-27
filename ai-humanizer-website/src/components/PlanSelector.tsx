import React, { useState } from 'react';
import supabase from '../utils/supabaseClient';
import { useHistory } from 'react-router-dom';

const plans = [
    { id: 1, name: 'Basic Plan', credits: 100, price: '$10/month', description: 'Great for light users.', plan_type: 'basic' },
    { id: 2, name: 'Pro Plan', credits: 500, price: '$30/month', description: 'For professionals and regular users.', plan_type: 'pro' },
    { id: 3, name: 'Premium Plan', credits: 1000, price: '$50/month', description: 'Best value for power users.', plan_type: 'premium' },
];

const accent = '#1DE9B6';
const blue = '#1976D2';

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
        <div style={{
            maxWidth: 900,
            margin: '0 auto',
            padding: '2.5rem 1rem 4rem 1rem',
            minHeight: '100vh',
            background: 'linear-gradient(120deg, #fafdff 0%, #e0f7fa 100%)',
            borderRadius: 32,
            boxShadow: '0 8px 48px rgba(30,233,182,0.10)',
            position: 'relative',
        }}>
            <h2 style={{ textAlign: 'center', fontSize: 40, color: blue, fontWeight: 900, letterSpacing: 1, marginBottom: 38 }}>Select a Subscription Plan</h2>
            {error && <div style={{ color: 'red', marginBottom: 18, textAlign: 'center', fontWeight: 700, fontSize: 18 }}>{error}</div>}
            <div style={{
                display: 'flex',
                gap: 36,
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginBottom: 40,
            }}>
                {plans.map((plan, idx) => (
                    <div
                        key={plan.id}
                        className="plan-item"
                        style={{
                            minWidth: 270,
                            flex: 1,
                            maxWidth: 320,
                            background: '#fff',
                            borderRadius: 20,
                            boxShadow: `0 4px 24px rgba(25,118,210,0.09)`,
                            padding: '2.2rem 1.5rem 2rem 1.5rem',
                            border: idx === 1 ? `2.5px solid ${accent}` : '1.5px solid #e0f7fa',
                            position: 'relative',
                            transition: 'transform 0.18s, box-shadow 0.18s',
                            zIndex: 1,
                            textAlign: 'center',
                        }}
                        onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                        onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        <h3 style={{ color: blue, fontWeight: 800, fontSize: 26, marginBottom: 8 }}>{plan.name}</h3>
                        <div style={{ fontSize: 28, color: accent, fontWeight: 900, marginBottom: 8 }}>{plan.price}</div>
                        <div style={{ fontSize: 17, color: '#444', fontWeight: 600, marginBottom: 18 }}>Credits: {plan.credits} / month</div>
                        <p style={{ color: '#333', fontSize: 16, marginBottom: 18 }}>{plan.description}</p>
                        {idx === 1 && (
                            <div style={{
                                position: 'absolute',
                                top: 18,
                                right: 18,
                                background: accent,
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: 14,
                                borderRadius: 8,
                                padding: '2px 14px',
                                letterSpacing: 1,
                                boxShadow: '0 2px 8px rgba(30,233,182,0.08)',
                            }}>Most Popular</div>
                        )}
                        <button
                            onClick={() => handleSelectPlan(plan)}
                            disabled={loading}
                            style={{
                                background: accent,
                                color: '#fff',
                                border: 'none',
                                borderRadius: 12,
                                padding: '14px 32px',
                                fontWeight: 800,
                                fontSize: 18,
                                marginTop: 10,
                                boxShadow: loading ? 'none' : '0 2px 8px rgba(30,233,182,0.08)',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                letterSpacing: 1,
                                transition: 'background 0.2s',
                                outline: 'none',
                                userSelect: 'auto',
                            }}
                        >
                            {loading ? 'Updating...' : 'Select Plan'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlanSelector;