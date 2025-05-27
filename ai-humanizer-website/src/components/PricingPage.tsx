import React from 'react';

const plans = [
    { name: 'Basic Plan', price: '$10/month', credits: 100, features: ['Access to basic features', '100 credits per month'] },
    { name: 'Pro Plan', price: '$30/month', credits: 500, features: ['Access to all features', '500 credits per month'] },
    { name: 'Premium Plan', price: '$50/month', credits: 1000, features: ['Access to all features', '1000 credits per month', 'Priority support'] },
];

const PricingPage: React.FC = () => {
    return (
        <div className="pricing-page">
            <h1>Pricing Plans</h1>
            {plans.map(plan => (
                <div className="pricing-plan" key={plan.name}>
                    <h2>{plan.name}</h2>
                    <p>Price: {plan.price}</p>
                    <p>Credits: {plan.credits} / month</p>
                    <p>Features:</p>
                    <ul>
                        {plan.features.map(f => <li key={f}>{f}</li>)}
                    </ul>
                </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 32 }}>
                <a href="/plan-selector" className="button">Select a Plan</a>
            </div>
        </div>
    );
};

export default PricingPage;