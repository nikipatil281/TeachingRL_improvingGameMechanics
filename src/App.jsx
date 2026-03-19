import React, { useEffect, useMemo, useState } from 'react';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Tutorial from './components/Tutorial';
import Dashboard from './components/Dashboard';
import TransitionPhase from './components/TransitionPhase';
import PrePhaselTransition from './components/PrePhase1Transition';
import Phase1Instructions from './components/Phase1Instructions';
import PrePhase2Transition from './components/PrePhase2Transition';
import BackendStatusPopup from './components/BackendStatusPopup';
import { ML_API_BASE_URL } from './logic/MLAgent';
import { rlAgent } from './logic/RLAgent';
import { pingBackendHealth } from './logic/backendHealth';

const ACTIVE_BACKEND_PHASES = new Set([
  'pre-tutorial',
  'orientation-instructions',
  'tutorial',
  'pre-simulation',
  'transition',
  'simulation',
]);

const BACKEND_STATUS_VISIBLE_PHASES = new Set([
  'pre-simulation',
  'transition',
  'simulation',
]);

const initialBackendState = {
  ml: { ready: false, state: 'idle' },
  rl: { ready: false, state: 'idle' },
};

function App() {
  const [phase, setPhase] = useState('login');
  const [theme, setTheme] = useState('theme-black-coffee');
  const [shopName, setShopName] = useState('You');
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('Leo');
  const [backendStatus, setBackendStatus] = useState(initialBackendState);
  const [backendPopupDismissed, setBackendPopupDismissed] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);

  const shouldManageBackends = useMemo(
    () => ACTIVE_BACKEND_PHASES.has(phase) && !simulationComplete,
    [phase, simulationComplete]
  );
  const shouldShowBackendStatusUi = useMemo(
    () => BACKEND_STATUS_VISIBLE_PHASES.has(phase) && !simulationComplete,
    [phase, simulationComplete]
  );

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'theme-black-coffee' ? 'theme-latte' : 'theme-black-coffee'));
  };

  const handleJoin = (sName, uName) => {
    if (sName && sName.trim()) {
      setShopName(sName.trim());
    }
    if (uName && uName.trim()) {
      setUserName(uName.trim());
    }
    setBackendPopupDismissed(false);
    setPhase('landing');
  };

  const handleRestart = () => {
    setBackendPopupDismissed(false);
    setSimulationComplete(false);
    setPhase('pre-simulation');
  };

  const handleExitToLogin = () => {
    setShopName('You');
    setUserName('');
    setUserAvatar('Leo');
    setBackendPopupDismissed(false);
    setSimulationComplete(false);
    setPhase('login');
  };

  useEffect(() => {
    if (!shouldManageBackends) return undefined;

    let cancelled = false;
    let intervalId;

    const refreshBackendStatus = async () => {
      setBackendStatus((current) => ({
        ml: current.ml.ready ? current.ml : { ready: false, state: 'warming' },
        rl: current.rl.ready ? current.rl : { ready: false, state: 'warming' },
      }));

      const [mlResult, rlResult] = await Promise.all([
        pingBackendHealth(ML_API_BASE_URL),
        pingBackendHealth(rlAgent.baseUrl),
      ]);

      if (cancelled) return;

      setBackendStatus({
        ml: {
          ready: mlResult.ok,
          state: mlResult.ok ? 'ready' : mlResult.status,
        },
        rl: {
          ready: rlResult.ok,
          state: rlResult.ok ? 'ready' : rlResult.status,
        },
      });
    };

    refreshBackendStatus();
    intervalId = window.setInterval(refreshBackendStatus, 15000);

    const settleCadenceId = window.setInterval(() => {
      const allReady = (
        (backendStatus.ml.ready || backendStatus.ml.state === 'ready')
        && (backendStatus.rl.ready || backendStatus.rl.state === 'ready')
      );

      window.clearInterval(intervalId);
      intervalId = window.setInterval(
        refreshBackendStatus,
        allReady ? (phase === 'simulation' ? 240000 : 180000) : 15000
      );
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.clearInterval(settleCadenceId);
    };
  }, [backendStatus.ml.ready, backendStatus.ml.state, backendStatus.rl.ready, backendStatus.rl.state, phase, shouldManageBackends]);

  return (
    <div className={`App ${theme}`}>
      {phase === 'login' && <Login onJoin={handleJoin} theme={theme} toggleTheme={toggleTheme} shopName={shopName} userName={userName} />}
      {phase === 'landing' && <LandingPage onComplete={(avatar) => { setUserAvatar(avatar || 'Leo'); setPhase('pre-tutorial'); }} theme={theme} toggleTheme={toggleTheme} />}
      {phase === 'pre-tutorial' && <PrePhaselTransition onComplete={() => setPhase('orientation-instructions')} onBackToStory={() => setPhase('landing')} theme={theme} />}
      {phase === 'orientation-instructions' && <Phase1Instructions onComplete={() => setPhase('tutorial')} theme={theme} toggleTheme={toggleTheme} />}
      {phase === 'tutorial' && (
        <Tutorial
          onComplete={() => setPhase('pre-simulation')}
          theme={theme}
          toggleTheme={toggleTheme}
          shopName={shopName}
          userName={userName}
          userAvatar={userAvatar}
          backendStatus={backendStatus}
        />
      )}
      {phase === 'pre-simulation' && (
        <PrePhase2Transition
          onComplete={() => setPhase('transition')}
          theme={theme}
          toggleTheme={toggleTheme}
          backendStatus={backendStatus}
          showBackendStatusButton={backendPopupDismissed}
          onOpenBackendStatus={() => setBackendPopupDismissed(false)}
        />
      )}
      {phase === 'transition' && (
        <TransitionPhase
          onComplete={() => setPhase('simulation')}
          theme={theme}
        />
      )}
      {phase === 'simulation' && (
        <Dashboard
          theme={theme}
          toggleTheme={toggleTheme}
          shopName={shopName}
          userName={userName}
          userAvatar={userAvatar}
          onRestart={handleRestart}
          onExitToLogin={handleExitToLogin}
          backendStatus={backendStatus}
          onSimulationComplete={() => setSimulationComplete(true)}
          showBackendStatusButton={backendPopupDismissed}
          onOpenBackendStatus={() => setBackendPopupDismissed(false)}
        />
      )}
      {shouldManageBackends && shouldShowBackendStatusUi && (
        <BackendStatusPopup
          mlState={backendStatus.ml.state}
          rlState={backendStatus.rl.state}
          onDismiss={() => setBackendPopupDismissed(true)}
          onOpen={backendPopupDismissed ? () => setBackendPopupDismissed(false) : null}
          phase={phase}
        />
      )}
    </div>
  );
}

export default App;
