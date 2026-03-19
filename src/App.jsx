import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Tutorial from './components/Tutorial';
import Dashboard from './components/Dashboard';
import TransitionPhase from './components/TransitionPhase'; // Added Import
import PrePhaselTransition from './components/PrePhase1Transition';
import Phase1Instructions from './components/Phase1Instructions';
import PrePhase2Transition from './components/PrePhase2Transition';

function App() {
  const [phase, setPhase] = useState('login'); // 'login', 'landing', 'pre-tutorial', 'orientation-instructions', 'tutorial', 'transition', 'simulation'
  const [theme, setTheme] = useState('theme-black-coffee'); // 'theme-black-coffee' or 'theme-latte'
  const [shopName, setShopName] = useState('You'); // Default shop name
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('Leo'); // Chosen avatar seed

  const toggleTheme = () => {
    setTheme(prev => prev === 'theme-black-coffee' ? 'theme-latte' : 'theme-black-coffee');
  };

  const handleJoin = (sName, uName) => {
    if (sName && sName.trim()) {
      setShopName(sName.trim());
    }
    if (uName && uName.trim()) {
      setUserName(uName.trim());
    }
    setPhase('landing');
  };

  const handleRestart = () => {
    setPhase('pre-simulation');
  };

  const handleExitToLogin = () => {
    setShopName('You');
    setUserName('');
    setUserAvatar('Leo');
    setPhase('login');
  };

  return (
    <div className={`App ${theme}`}>
      {phase === 'login' && <Login onJoin={handleJoin} theme={theme} toggleTheme={toggleTheme} shopName={shopName} userName={userName} />}
      {phase === 'landing' && <LandingPage onComplete={(avatar) => { setUserAvatar(avatar || 'Leo'); setPhase('pre-tutorial'); }} theme={theme} toggleTheme={toggleTheme} />}
      {phase === 'pre-tutorial' && <PrePhaselTransition onComplete={() => setPhase('orientation-instructions')} onBackToStory={() => setPhase('landing')} theme={theme} />}
      {phase === 'orientation-instructions' && <Phase1Instructions onComplete={() => setPhase('tutorial')} theme={theme} toggleTheme={toggleTheme} />}
      {phase === 'tutorial' && <Tutorial onComplete={() => setPhase('pre-simulation')} theme={theme} toggleTheme={toggleTheme} shopName={shopName} userName={userName} userAvatar={userAvatar} />}
      {phase === 'pre-simulation' && <PrePhase2Transition onComplete={() => setPhase('transition')} theme={theme} />}
      {phase === 'transition' && <TransitionPhase onComplete={() => setPhase('simulation')} theme={theme} />}
      {phase === 'simulation' && <Dashboard theme={theme} toggleTheme={toggleTheme} shopName={shopName} userName={userName} userAvatar={userAvatar} onRestart={handleRestart} onExitToLogin={handleExitToLogin} />}
    </div>
  );
}

export default App;
