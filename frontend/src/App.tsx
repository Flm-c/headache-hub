import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ArticlesPage from './pages/ArticlesPage';
import AdminPage from './pages/AdminPage';
import EpisodeTrackingPage from './pages/EpisodeTrackingPage';
import EpisodeCalendarPage from './pages/EpisodeCalendarPage';
import EpisodeStatsPage from './pages/EpisodeStatsPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route element={<ProtectedRoute requireApproved />}>
          <Route path="/dashboard/episodes" element={<EpisodeTrackingPage />} />
          <Route path="/dashboard/calendar" element={<EpisodeCalendarPage />} />
          <Route path="/dashboard/stats" element={<EpisodeStatsPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} requireApproved />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
