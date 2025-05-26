import React from 'react';

const PaymentScreen: React.FC = () => {
    return (
        <div>
            <h1>Payment Processing</h1>
            <p>This is a simulated payment processing screen.</p>
            <form>
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
                <button type="submit">Submit Payment</button>
            </form>
            <p>* This is a demo and does not process actual payments.</p>
        </div>
    );
};

export default PaymentScreen;