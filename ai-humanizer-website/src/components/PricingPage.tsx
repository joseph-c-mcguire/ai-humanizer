import React from 'react';

const PricingPage: React.FC = () => {
    return (
        <div>
            <h1>Pricing Plans</h1>
            <div className="pricing-plan">
                <h2>Basic Plan</h2>
                <p>Price: $10/month</p>
                <p>Features:</p>
                <ul>
                    <li>Access to basic features</li>
                    <li>10 credits per month</li>
                </ul>
            </div>
            <div className="pricing-plan">
                <h2>Pro Plan</h2>
                <p>Price: $20/month</p>
                <p>Features:</p>
                <ul>
                    <li>Access to all features</li>
                    <li>50 credits per month</li>
                </ul>
            </div>
            <div className="pricing-plan">
                <h2>Premium Plan</h2>
                <p>Price: $30/month</p>
                <p>Features:</p>
                <ul>
                    <li>Access to all features</li>
                    <li>100 credits per month</li>
                    <li>Priority support</li>
                </ul>
            </div>
        </div>
    );
};

export default PricingPage;