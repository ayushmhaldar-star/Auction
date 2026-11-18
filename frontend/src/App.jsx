import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SettingsProvider } from './context/SettingsContext';

// Components
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import ErrorBoundary from './components/common/ErrorBoundary';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import DashboardOverview from './pages/admin/DashboardOverview';
import PlayerManagement from './pages/admin/PlayerManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import TeamManagement from './pages/admin/TeamManagement';
import AuctionControl from './pages/admin/AuctionControl';
import SoldPlayers from './pages/admin/SoldPlayers';
import UnsoldPlayers from './pages/admin/UnsoldPlayers';
import AuctionHistory from './pages/admin/AuctionHistory';
import SettingsPage from './pages/admin/SettingsPage';

// Public Display Page
import LiveAuctionDisplay from './pages/public/LiveAuctionDisplay';

// Protected Admin Layout
const AdminLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-400 font-bold">
        Authenticating Admin...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <SettingsProvider>
            <Router>
            <Routes>
              {/* Public TV / Projector Display */}
              <Route path="/live" element={<LiveAuctionDisplay />} />

              {/* Admin Login */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected Admin Console */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardOverview />} />
                <Route path="auction" element={<AuctionControl />} />
                <Route path="players" element={<PlayerManagement />} />
                <Route path="categories" element={<CategoryManagement />} />
                <Route path="teams" element={<TeamManagement />} />
                <Route path="sold" element={<SoldPlayers />} />
                <Route path="unsold" element={<UnsoldPlayers />} />
                <Route path="history" element={<AuctionHistory />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Default fallback */}
              <Route path="*" element={<Navigate to="/live" replace />} />
            </Routes>
          </Router>
        </SettingsProvider>
      </SocketProvider>
    </AuthProvider>
  </ErrorBoundary>
  );
}

export default App;
