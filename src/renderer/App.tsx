import React from 'react';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Lighthouse Beacon IDE</h1>
        <p className="status-message">Development environment configured</p>
      </header>
      <main className="app-main">
        <div className="info-section">
          <h2>Welcome to Lighthouse Beacon</h2>
          <p>AI-powered development environment with natural language interaction</p>
          <div className="status-indicators">
            <div className="status-item">
              <span className="status-label">Electron:</span>
              <span className="status-value">Running</span>
            </div>
            <div className="status-item">
              <span className="status-label">React:</span>
              <span className="status-value">Loaded</span>
            </div>
            <div className="status-item">
              <span className="status-label">HMR:</span>
              <span className="status-value">Active</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
