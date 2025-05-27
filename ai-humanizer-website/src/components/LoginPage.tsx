import React from 'react';

const LoginPage: React.FC = () => {
    return (
        <div className="auth-container" style={{ maxWidth: 500, margin: '0 auto', padding: 32, textAlign: 'center' }}>
            <h2>Login Not Required</h2>
            <p>
                You do not need to log in to use the AI Humanizer.<br />
                Please go to the <a href="/">Home page</a> to use the app.
            </p>
        </div>
    );
};

export default LoginPage;