import React, { useEffect, useState } from 'react';
import { getUserCredits, getCreditHistory } from '../api/credits';
import supabase from '../utils/supabaseClient';

interface CreditHistory {
  id: string;
  action_type: string;
  credits_used: number;
  created_at: string;
  input_length: number;
}

const CreditsPage: React.FC = () => {
  const [credits, setCredits] = useState<number | null>(null);
  const [totalUsed, setTotalUsed] = useState<number>(0);
  const [plan, setPlan] = useState<string>('free');
  const [history, setHistory] = useState<CreditHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);

      if (data.session) {
        const userCredits = await getUserCredits();
        if (userCredits) {
          setCredits(userCredits.credits_remaining);
          setPlan(userCredits.plan_type);
          setTotalUsed(userCredits.total_credits_used);
        }

        const creditHistory = await getCreditHistory();
        setHistory(creditHistory);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!isLoggedIn) {
    return (
      <div className="credits-page">
        <h1>Credits</h1>
        <div className="auth-prompt">
          <p>Please <a href="/login">log in</a> to view your credits.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="credits-page">
        <h1>Credits</h1>
        <div className="loading">Loading credit information...</div>
      </div>
    );
  }

  return (
    <div className="credits-page">
      <h1>Credits</h1>
      
      <div className="credit-summary">
        <div className="credit-card">
          <h2>Current Plan</h2>
          <span className="plan-badge">{plan.toUpperCase()}</span>
          <div className="credit-stats">
            <div className="stat">
              <span className="label">Credits Remaining:</span>
              <span className="value">{credits}</span>
            </div>
            <div className="stat">
              <span className="label">Total Credits Used:</span>
              <span className="value">{totalUsed}</span>
            </div>
          </div>
        </div>

        {plan === 'free' && (
          <div className="upgrade-prompt">
            <h3>Need more credits?</h3>
            <p>Upgrade your plan to get more credits and additional features.</p>
            <a href="/pricing" className="upgrade-btn">View Plans</a>
          </div>
        )}
      </div>
      
      <div className="history-section">
        <h2>Usage History</h2>
        {history.length > 0 ? (
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Credits Used</th>
                <th>Text Length</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.created_at)}</td>
                  <td>{item.action_type}</td>
                  <td>{item.credits_used}</td>
                  <td>{item.input_length || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-history">No usage history yet.</p>
        )}
      </div>
    </div>
  );
};

export default CreditsPage;
