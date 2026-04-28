import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Your Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.fullName}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Account status</div>
          <div className="mt-2 text-xl font-semibold text-gray-900">
            {user.isApproved ? 'Approved' : 'Pending approval'}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Role</div>
          <div className="mt-2 text-xl font-semibold text-gray-900">{user.role}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-gray-500">Email</div>
          <div className="mt-2 text-lg font-semibold text-gray-900 break-all">{user.email}</div>
        </div>
      </div>

      {!user.isApproved ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-xl font-semibold text-amber-900">Waiting for admin approval</h2>
          <p className="mt-2 text-amber-800">
            Your account is active for login, but personal tracking features stay locked until an admin approves you.
          </p>
          <p className="mt-2 text-amber-800">
            You can still use the public parts of the site like any anonymous visitor.
          </p>
          <div className="mt-4">
            <Link to="/articles" className="font-semibold text-amber-900 underline underline-offset-4">
              Continue to public articles
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Migraine tracking</h2>
            <p className="mt-2 text-gray-600">
              Phase 3 will connect this area to episode logging, calendar history and trend analysis.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Account readiness</h2>
            <p className="mt-2 text-gray-600">
              Your account is approved and ready for protected features as they land in the next phase.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
