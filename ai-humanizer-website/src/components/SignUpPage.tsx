import React, { useState } from 'react';
import supabase from '../utils/supabaseClient';

// Social login providers
type Provider = 'google' | 'github';

const SignUpPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [rawResponse, setRawResponse] = useState('');

    // Handle email/password signup
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        setRawResponse(''); // Clear previous raw response
        let responseDetails = '';
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) {
                setError(error.message || 'Sign up failed.');
                responseDetails = JSON.stringify(error, null, 2);
            } else {
                setSuccess('Sign up successful! Please check your email to confirm your account.');
                responseDetails = JSON.stringify(data, null, 2);
                // Optionally, create user_credits row with 10 credits
                if (data.user) {
                    const creditsRes = await supabase.from('user_credits').insert({
                        id: data.user.id,
                        credits_remaining: 10,
                        total_credits_used: 0,
                        plan_type: 'free',
                    });
                    responseDetails += '\n\nUser credits insert response:\n' + JSON.stringify(creditsRes, null, 2);
                }
            }
        } catch (err) {
            setError('Unexpected error: ' + (err instanceof Error ? err.message : String(err)));
            responseDetails = String(err);
        } finally {
            setLoading(false);
            // Use setTimeout to ensure state updates before reload
            setTimeout(() => setRawResponse(responseDetails), 0);
        }
    };

    // Handle social login
    const handleSocialSignUp = async (provider: Provider) => {
        setLoading(true);
        setError('');
        setSuccess('');
        setRawResponse('');
        let responseDetails = '';
        
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin + '/dashboard',
                }
            });
            
            if (error) {
                setError(error.message || `${provider} sign up failed.`);
                responseDetails = JSON.stringify(error, null, 2);
            } else {
                // We won't actually see this since the page will redirect
                setSuccess(`Redirecting to ${provider} for authentication...`);
                responseDetails = JSON.stringify(data, null, 2);
            }
        } catch (err) {
            setError('Unexpected error: ' + (err instanceof Error ? err.message : String(err)));
            responseDetails = String(err);
        } finally {
            setLoading(false);
            setTimeout(() => setRawResponse(responseDetails), 0);
        }
    };

    // Show the result of the request below the form
    let resultMessage = '';
    if (error) {
        resultMessage = `❌ Error: ${error}`;
    } else if (success) {
        resultMessage = `✅ Success: ${success}`;
    }

    return (
        <div className="auth-container">
            <form className="login-form" onSubmit={handleSignUp}>
                <h2>Sign Up</h2>
                <input
                    type="email"
                    id="signup-email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                />
                <input
                    type="password"
                    id="signup-password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit" disabled={loading} className="primary-button">
                    {loading ? 'Signing up...' : 'Sign Up with Email'}
                </button>
                
                <div className="divider">
                    <span>OR</span>
                </div>
                
                <div className="social-buttons">
                    <button 
                        type="button" 
                        onClick={() => handleSocialSignUp('google')}
                        disabled={loading}
                        className="social-button google-button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                            <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                        </svg>
                        Sign up with Google
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={() => handleSocialSignUp('github')}
                        disabled={loading}
                        className="social-button github-button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        Sign up with GitHub
                    </button>
                </div>
                
                <p style={{marginTop: 16, color: '#555', fontSize: 14, textAlign: 'center'}}>
                    Already have an account? <a href="/login">Log in</a>
                </p>
                
                {resultMessage && (
                    <div style={{ marginTop: 16, fontWeight: 600, color: error ? '#d32f2f' : '#388e3c' }}>{resultMessage}</div>
                )}
                
                {rawResponse && (
                    <pre style={{ marginTop: 16, background: '#f7f7f7', color: '#333', fontSize: 13, padding: 12, borderRadius: 6, overflowX: 'auto' }}>{rawResponse}</pre>
                )}
            </form>
        </div>
    );
};

export default SignUpPage;
