import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import HomePage from './components/HomePage';
import PricingPage from './components/PricingPage';
import LoginPage from './components/LoginPage';
import PaymentScreen from './components/PaymentScreen';
import ContactPage from './components/ContactPage';
import Dashboard from './components/Dashboard';
import CreditsTracker from './components/CreditsTracker';
import PlanSelector from './components/PlanSelector';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/payment" component={PaymentScreen} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/credits" component={CreditsTracker} />
        <Route path="/plan-selector" component={PlanSelector} />
      </Switch>
    </Router>
  );
};

export default App;