import { useState, useEffect } from 'react';
import Projects from './components/Projects';
import Tasks from './components/Tasks';
import Timer from './components/Timer';
import Dashboard from './components/Dashboard';
import { api } from './api';

const TABS = [
  { id: 'timer',     label: 'Timer' },
  { id: 'projects',  label: 'Projects' },
  { id: 'tasks',     label: 'Tasks' },
  { id: 'dashboard', label: 'Dashboard' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('timer');
  const [running, setRunning] = useState(null);

  // Poll for running timer to update header indicator
  useEffect(() => {
    const poll = async () => {
      try { setRunning(await api.getRunning()); } catch { /* ignore */ }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Training Time Tracker</span>
        {running && (
          <span className="running-indicator" aria-label={`Timer running: ${running.taskName}`}>
            <span className="pulse-dot" aria-hidden="true" />
            {running.taskName}
          </span>
        )}
      </header>

      <nav className="app-nav" role="tablist" aria-label="Main navigation">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-main" role="tabpanel">
        {activeTab === 'timer'     && <Timer onRunningChange={setRunning} />}
        {activeTab === 'projects'  && <Projects />}
        {activeTab === 'tasks'     && <Tasks />}
        {activeTab === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}
