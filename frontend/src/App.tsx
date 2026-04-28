import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const ArticleEditorPage = lazy(() => import('./pages/ArticleEditorPage'));
const MyArticlesPage = lazy(() => import('./pages/MyArticlesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const EpisodeTrackingPage = lazy(() => import('./pages/EpisodeTrackingPage'));
const EpisodeCalendarPage = lazy(() => import('./pages/EpisodeCalendarPage'));
const EpisodeStatsPage = lazy(() => import('./pages/EpisodeStatsPage'));

function App() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Public article routes */}
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/:slug" element={<ArticlePage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/profile" element={<ProfilePage />} />
        </Route>
        <Route element={<ProtectedRoute requireApproved />}>
          <Route path="/dashboard/episodes" element={<EpisodeTrackingPage />} />
          <Route path="/dashboard/calendar" element={<EpisodeCalendarPage />} />
          <Route path="/dashboard/stats" element={<EpisodeStatsPage />} />
        </Route>

        {/* Editor & Admin: article authoring */}
        <Route element={<ProtectedRoute allowedRoles={['EDITOR', 'ADMIN']} requireApproved />}>
          <Route path="/articles/new" element={<ArticleEditorPage />} />
          <Route path="/articles/:id/edit" element={<ArticleEditorPage />} />
          <Route path="/dashboard/my-articles" element={<MyArticlesPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} requireApproved />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </Suspense>
  );
}

export default App;
