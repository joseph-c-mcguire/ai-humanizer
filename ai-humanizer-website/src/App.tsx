import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import PricingPage from './components/PricingPage';
import Dashboard from './components/Dashboard';
import PaymentScreen from './components/PaymentScreen';
import ContactPage from './components/ContactPage';
import CreditsTracker from './components/CreditsTracker';
import PlanSelector from './components/PlanSelector';
import CreditsPage from './components/CreditsPage';
import SignUpPage from './components/SignUpPage';
import LogoutButton from './components/LogoutButton';
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
  const [credits, setCredits] = useState<number|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const getSession = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (isMounted) {
        if (data?.user) {
          setUser(data.user);
          // Fetch credits if logged in
          const { data: creditData } = await supabase
            .from('user_credits')
            .select('credits_remaining')
            .eq('id', data.user.id)
            .single();
          setCredits(creditData?.credits_remaining ?? null);
        } else {
          setUser(null);
          setCredits(null);
        }
        setLoading(false);
      }
    };
    getSession();
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(session?.user || null);
        if (session?.user) {
          supabase
            .from('user_credits')
            .select('credits_remaining')
            .eq('id', session.user.id)
            .single()
            .then(({ data: creditData }) => setCredits(creditData?.credits_remaining ?? null));
        } else {
          setCredits(null);
        }
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
        <Switch>
          <Route exact path="/" component={HomePage} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/pricing" component={PricingPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/signup" component={SignUpPage} />
          <Route path="/payment" component={PaymentScreen} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/credits" component={CreditsPage} />
          <Route path="/plan-selector" component={PlanSelector} />
        </Switch>
      </Router>
    </ErrorBoundary>
  );
};

export default App;