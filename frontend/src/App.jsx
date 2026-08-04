import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { XpProvider } from './context/XpContext';
import { wakeBackend } from './api/client';
import Layout from './components/Layout';
import LevelUpToast from './components/LevelUpToast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Dreams from './pages/Dreams';
import VisionBoard from './pages/VisionBoard';
import Affirmations from './pages/Affirmations';
import Journal from './pages/Journal';
import Goals from './pages/Goals';
import Coach from './pages/Coach';
import Universe from './pages/Universe';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-cosmic-navy" />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <XpProvider>
      <LevelUpToast />
      {children}
    </XpProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dreams" element={<Dreams />} />
        <Route path="vision-board" element={<VisionBoard />} />
        <Route path="affirmations" element={<Affirmations />} />
        <Route path="journal" element={<Journal />} />
        <Route path="goals" element={<Goals />} />
        <Route path="coach" element={<Coach />} />
        <Route path="universe" element={<Universe />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  useEffect(() => {
    wakeBackend();
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
