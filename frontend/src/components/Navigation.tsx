import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();

  const isAuthor = isAuthenticated && user?.isApproved &&
    (user.role === 'EDITOR' || user.role === 'ADMIN');

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            🧠 Headache Hub
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600">
              Home
            </Link>
            <Link to="/articles" className="text-gray-700 hover:text-blue-600">
              Articles
            </Link>
            {isAuthenticated && (
              <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
            )}
            {isAuthenticated && user?.isApproved && (
              <Link to="/dashboard/episodes" className="text-gray-700 hover:text-blue-600">
                Tracker
              </Link>
            )}
            {isAuthor && (
              <Link to="/dashboard/my-articles" className="text-gray-700 hover:text-blue-600">
                My Articles
              </Link>
            )}
            {isAuthor && (
              <Link
                to="/articles/new"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Write
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="text-gray-700 hover:text-blue-600">
                Admin
              </Link>
            )}
            {isAuthenticated && user ? (
              <>
                <div className="text-right text-sm leading-tight">
                  <div className="font-semibold text-gray-900">{user.fullName}</div>
                  <div className="text-gray-500">{user.role}</div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
