import React, { useState } from 'react';

const PaymentScreen: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setSuccess('Payment processed! (Demo only)');
        }, 1200);
    };

    return (
        <div className="payment-form">
            <h1>Payment Processing</h1>
            <p>This is a simulated payment processing screen.</p>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="cardNumber">Card Number:</label>
                    <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" />
                </div>
                <div>
                    <label htmlFor="expiryDate">Expiry Date:</label>
                    <input type="text" id="expiryDate" placeholder="MM/YY" />
                </div>
                <div>
                    <label htmlFor="cvv">CVV:</label>
                    <input type="text" id="cvv" placeholder="123" />
                </div>
                <button type="submit" disabled={loading}>{loading ? 'Processing...' : 'Submit Payment'}</button>
            </form>
            {success && <p style={{ color: 'green', marginTop: 16 }}>{success}</p>}
            {error && <p style={{ color: 'red', marginTop: 16 }}>{error}</p>}
            <p>* This is a demo and does not process actual payments.</p>
        </div>
    );
};

export default PaymentScreen;