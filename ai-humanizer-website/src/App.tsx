import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import PricingPage from './components/PricingPage';
import Dashboard from './components/Dashboard';
import PaymentScreen from './components/PaymentScreen';
import ContactPage from './components/ContactPage';
import CreditsTracker from './components/CreditsTracker';
import PlanSelector from './components/PlanSelector';
import supabase from './utils/supabaseClient';

const turquoise = '#1DE9B6';
const blue = '#1976D2';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h2 style={{ color: '#d32f2f' }}>Something went wrong</h2>
      <pre style={{ color: '#b71c1c', margin: '16px 0' }}>{error.message}</pre>
      <button onClick={() => window.location.reload()} style={{ background: '#1976d2', color: '#fff', padding: '8px 16px', borderRadius: 4 }}>Reload</button>
    </div>
  );
}

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const getSession = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (isMounted) {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    };
    getSession();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user || null);
      }
    });
    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div style={{textAlign:'center',marginTop:40}}>Loading session...</div>;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Router>
        <nav className="navbar" style={{ background: '#e0f7fa', color: blue, boxShadow: '0 2px 8px rgba(25, 233, 182, 0.10)' }}>
          <div style={{ fontWeight: 700, fontSize: '1.3rem', letterSpacing: '1px', color: turquoise }}>AI Humanizer</div>
          <div className="nav-links">
            <Link to="/" style={{ color: blue }}>Home</Link>
            <Link to="/dashboard" style={{ color: blue }}>Dashboard</Link>
            <Link to="/pricing" style={{ color: blue }}>Pricing</Link>
            <Link to="/plan-selector" style={{ color: blue }}>Plans</Link>
            <Link to="/credits" style={{ color: blue }}>Credits</Link>
            <Link to="/contact" style={{ color: blue }}>Contact</Link>
            <Link to="/login" style={{ color: blue }}>Login</Link>
          </div>
        </nav>
        {user && (
          <div style={{textAlign:'center',background:'#e3f2fd',padding:8,marginBottom:0}}>
            Logged in as <b>{user.email}</b>
          </div>
        )}
        <Switch>
          <Route exact path="/" component={HomePage} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/pricing" component={PricingPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/payment" component={PaymentScreen} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/credits" component={CreditsTracker} />
          <Route path="/plan-selector" component={PlanSelector} />
        </Switch>
      </Router>
    </ErrorBoundary>
  );
};

export default App;