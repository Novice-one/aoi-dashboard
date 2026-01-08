import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

function App() {
  const [filter, setFilter] = useState({ type: 'all' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50">
      <Sidebar onSelectFilter={setFilter} />
      <Dashboard filter={filter} />
    </div>
  );
}

export default App;
