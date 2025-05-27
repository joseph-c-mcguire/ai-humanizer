import React from 'react';

const plans = [
    { id: 1, name: 'Basic Plan', credits: 100, price: '$10/month', description: 'Great for light users.' },
    { id: 2, name: 'Pro Plan', credits: 500, price: '$30/month', description: 'For professionals and regular users.' },
    { id: 3, name: 'Premium Plan', credits: 1000, price: '$50/month', description: 'Best value for power users.' },
];

const handleSelectPlan = (planName: string) => {
    // TODO: Implement plan selection logic (e.g., redirect to payment or update user plan in Supabase)
    alert(`Selected: ${planName}`);
};

const PlanSelector: React.FC = () => {
    return (
        <div className="plan-selector">
            <h2>Select a Subscription Plan</h2>
            <ul>
                {plans.map(plan => (
                    <li key={plan.id} className="plan-item">
                        <h3>{plan.name}</h3>
                        <p>{plan.description}</p>
                        <p>Credits: {plan.credits} / month</p>
                        <p>Price: {plan.price}</p>
                        <button onClick={() => handleSelectPlan(plan.name)}>Select Plan</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PlanSelector;