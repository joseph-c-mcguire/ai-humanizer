import React from 'react';

const plans = [
    { name: 'Basic Plan', price: '$10/month', credits: 100, features: ['Access to basic features', '100 credits per month'] },
    { name: 'Pro Plan', price: '$30/month', credits: 500, features: ['Access to all features', '500 credits per month'] },
    { name: 'Premium Plan', price: '$50/month', credits: 1000, features: ['Access to all features', '1000 credits per month', 'Priority support'] },
];

const accent = '#1DE9B6';
const blue = '#1976D2';

const PricingPage: React.FC = () => {
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
            {/* Hero Section */}
            <section style={{ textAlign: 'center', marginBottom: 48 }}>
                <h1 style={{ fontSize: 44, color: blue, fontWeight: 900, letterSpacing: 1, marginBottom: 10 }}>Pricing Plans</h1>
                <p style={{ fontSize: 22, color: '#333', fontWeight: 500, marginBottom: 0 }}>
                    Choose the plan that fits your needs and start humanizing your AI text today!
                </p>
            </section>
            {/* Plans Grid */}
            <div style={{
                display: 'flex',
                gap: 36,
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginBottom: 40,
            }}>
                {plans.map((plan, idx) => (
                    <div
                        className="pricing-plan"
                        key={plan.name}
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
                        <h2 style={{ color: blue, fontWeight: 800, fontSize: 28, marginBottom: 8 }}>{plan.name}</h2>
                        <div style={{ fontSize: 32, color: accent, fontWeight: 900, marginBottom: 8 }}>{plan.price}</div>
                        <div style={{ fontSize: 18, color: '#444', fontWeight: 600, marginBottom: 18 }}>Credits: {plan.credits} / month</div>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: '0 0 18px 0',
                            color: '#333',
                            fontSize: 16,
                            textAlign: 'left',
                        }}>
                            {plan.features.map(f => (
                                <li key={f} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ color: accent, fontWeight: 900, fontSize: 18 }}>•</span> {f}
                                </li>
                            ))}
                        </ul>
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
                    </div>
                ))}
            </div>
            {/* Call to Action */}
            <div style={{ textAlign: 'center', marginTop: 32 }}>
                <a
                    href="/plan-selector"
                    className="button"
                    style={{
                        background: accent,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 24,
                        padding: '16px 38px',
                        fontWeight: 800,
                        fontSize: 22,
                        boxShadow: '0 4px 24px rgba(30,233,182,0.13)',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        letterSpacing: 1,
                        transition: 'background 0.2s',
                        display: 'inline-block',
                    }}
                >Select a Plan</a>
            </div>
        </div>
    );
};

export default PricingPage;