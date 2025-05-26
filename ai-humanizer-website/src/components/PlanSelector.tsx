import React from 'react';

const PlanSelector: React.FC = () => {
    const plans = [
        { id: 1, name: 'Basic Plan', credits: 100, price: '$10/month' },
        { id: 2, name: 'Pro Plan', credits: 500, price: '$30/month' },
        { id: 3, name: 'Premium Plan', credits: 1000, price: '$50/month' },
    ];

    return (
        <div className="plan-selector">
            <h2>Select a Subscription Plan</h2>
            <ul>
                {plans.map(plan => (
                    <li key={plan.id} className="plan-item">
                        <h3>{plan.name}</h3>
                        <p>Credits: {plan.credits}</p>
                        <p>Price: {plan.price}</p>
                        <button>Select Plan</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PlanSelector;