import React, { useState } from 'react';
import supabase from '../utils/supabaseClient';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('guest@guest.com');
    const [password, setPassword] = useState('guest1234');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        // Only allow guest login
        if (email !== 'guest@guest.com' || password !== 'guest1234') {
            setError('Only the guest account is allowed.');
            setLoading(false);
            return;
        }
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        setLoading(false);
        if (error) {
            setError(error.message || 'Login failed. Please use the guest credentials.');
        } else {
            window.location.href = '/dashboard';
        }
    };

    return (
        <form className="login-form" onSubmit={handleLogin}>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>
                {loading ? 'Please wait...' : 'Login as Guest'}
            </button>
            <p style={{marginTop: 12, color: '#555', fontSize: 14}}>Only guest@guest.com / guest1234 is allowed.</p>
        </form>
    );
};

export default LoginPage;