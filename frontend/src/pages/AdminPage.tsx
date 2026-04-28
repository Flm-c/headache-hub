import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveAdminUser,
  createAdminUser,
  fetchAdminUsers,
  fetchAuditLogs,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '../api/admin';
import { AuditLogEntry, UserRole } from '../types/auth';

const roles: UserRole[] = ['PATIENT', 'EDITOR', 'ADMIN'];

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'PATIENT' as UserRole,
  });
  const [pageError, setPageError] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditAction, setAuditAction] = useState('');

  const usersQuery = useQuery({
    queryKey: ['admin-users', statusFilter],
    queryFn: () => fetchAdminUsers(statusFilter),
  });

  const auditQuery = useQuery({
    queryKey: ['admin-audit', auditPage, auditAction],
    queryFn: () =>
      fetchAuditLogs({ page: auditPage, pageSize: 20, action: auditAction || undefined }),
    enabled: activeTab === 'audit',
  });

  const invalidateUsers = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const approveMutation = useMutation({
    mutationFn: approveAdminUser,
    onSuccess: () => { setPageError(''); void invalidateUsers(); },
    onError: (error: Error) => setPageError(error.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateAdminUserRole(userId, { role }),
    onSuccess: () => { setPageError(''); void invalidateUsers(); },
    onError: (error: Error) => setPageError(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      updateAdminUserStatus(userId, { isActive }),
    onSuccess: () => { setPageError(''); void invalidateUsers(); },
    onError: (error: Error) => setPageError(error.message),
  });

  const createUserMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      setPageError('');
      setFormData({ fullName: '', email: '', password: '', role: 'PATIENT' });
      void invalidateUsers();
    },
    onError: (error: Error) => setPageError(error.message),
  });

  const handleCreateUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPageError('');
    createUserMutation.mutate({ ...formData, isActive: true });
  };

  const users = usersQuery.data || [];
  const auditData = auditQuery.data;
  const auditTotalPages = auditData ? Math.ceil(auditData.total / auditData.pageSize) : 1;

  const ACTION_LABELS: Record<string, string> = {
    USER_APPROVED: 'Approved',
    USER_ROLE_CHANGED: 'Role changed',
    USER_BLOCKED: 'Blocked',
    USER_UNBLOCKED: 'Unblocked',
    USER_CREATED: 'Created',
    ARTICLE_PUBLISHED: 'Published',
    ARTICLE_UNPUBLISHED: 'Unpublished',
    PROFILE_NAME_UPDATED: 'Name updated',
    PASSWORD_CHANGED: 'Password changed',
  };

  const formatChanges = (entry: AuditLogEntry): string => {
    if (!entry.changes) return '';
    try {
      const parsed = JSON.parse(entry.changes) as Record<string, unknown>;
      return Object.entries(parsed).map(([k, v]) => `${k}: ${String(v)}`).join(', ');
    } catch {
      return entry.changes;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Admin Panel</h1>
        <p className="text-gray-600">Manage users, approvals, and audit activity.</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {(['users', 'audit'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'users' ? 'User Management' : 'Audit Log'}
          </button>
        ))}
      </div>

      {pageError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-8">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Create user as admin</h2>
              <p className="text-sm text-gray-600">
                Users created here are auto-approved and can be assigned any role immediately.
              </p>
            </div>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateUser}>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData((c) => ({ ...c, fullName: e.target.value }))}
                className="rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Full name"
                required
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((c) => ({ ...c, email: e.target.value }))}
                className="rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Email"
                required
              />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((c) => ({ ...c, password: e.target.value }))}
                className="rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Temporary password"
                required
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData((c) => ({ ...c, role: e.target.value as UserRole }))}
                className="rounded-lg border border-gray-300 px-4 py-2"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className="md:col-span-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {createUserMutation.isPending ? 'Creating user...' : 'Create approved user'}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">User management</h2>
                <p className="text-sm text-gray-600">Approve pending users, change roles, and block accounts.</p>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved')}
                className="rounded-lg border border-gray-300 px-4 py-2"
              >
                <option value="all">All users</option>
                <option value="pending">Pending only</option>
                <option value="approved">Approved only</option>
              </select>
            </div>

            {usersQuery.isLoading ? (
              <div className="text-gray-600">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="rounded-lg bg-gray-50 px-4 py-6 text-sm text-gray-600">No users found for this filter.</div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{user.fullName}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">{user.role}</span>
                          <span className={`rounded-full px-3 py-1 ${user.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {user.isApproved ? 'Approved' : 'Pending'}
                          </span>
                          <span className={`rounded-full px-3 py-1 ${user.isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                            {user.isActive ? 'Active' : 'Blocked'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 lg:items-end">
                        {!user.isApproved && (
                          <button
                            type="button"
                            onClick={() => approveMutation.mutate(user.id)}
                            disabled={approveMutation.isPending}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                          >
                            Approve user
                          </button>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={user.role}
                            onChange={(e) => roleMutation.mutate({ userId: user.id, role: e.target.value as UserRole })}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          >
                            {roles.map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => statusMutation.mutate({ userId: user.id, isActive: !user.isActive })}
                            disabled={statusMutation.isPending}
                            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                          >
                            {user.isActive ? 'Block user' : 'Restore user'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'audit' && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Audit Log</h2>
              <p className="text-sm text-gray-500">
                {auditData ? `${auditData.total} total events` : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center gap-2">
            <select
              value={auditAction}
              onChange={(e) => { setAuditAction(e.target.value); setAuditPage(1); }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">All actions</option>
              <option value="USER_APPROVED">User approved</option>
              <option value="USER_ROLE_CHANGED">Role changed</option>
              <option value="USER_BLOCKED">User blocked</option>
              <option value="USER_UNBLOCKED">User unblocked</option>
              <option value="USER_CREATED">User created</option>
              <option value="ARTICLE_PUBLISHED">Article published</option>
              <option value="ARTICLE_UNPUBLISHED">Article unpublished</option>
              <option value="PROFILE_NAME_UPDATED">Name updated</option>
              <option value="PASSWORD_CHANGED">Password changed</option>
            </select>
            <button
              onClick={() => void queryClient.invalidateQueries({ queryKey: ['admin-audit'] })}
              disabled={auditQuery.isFetching}
              title="Refresh"
              className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ${auditQuery.isFetching ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            </div>
          </div>

          {auditQuery.isLoading ? (
            <div className="text-gray-500 py-6 text-center">Loading audit log...</div>
          ) : !auditData || auditData.logs.length === 0 ? (
            <div className="rounded-lg bg-gray-50 px-4 py-6 text-sm text-gray-500 text-center">
              No audit events found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="pb-2 pr-4">When</th>
                    <th className="pb-2 pr-4">Action</th>
                    <th className="pb-2 pr-4">Actor</th>
                    <th className="pb-2 pr-4">Entity</th>
                    <th className="pb-2">Changes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditData.logs.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-4 text-gray-400 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-gray-800 whitespace-nowrap">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </td>
                      <td className="py-2.5 pr-4 text-gray-600 whitespace-nowrap">
                        <div>{entry.user.fullName}</div>
                        <div className="text-xs text-gray-400">{entry.user.email}</div>
                      </td>
                      <td className="py-2.5 pr-4 text-gray-500 whitespace-nowrap">
                        <span className="capitalize">{entry.entity}</span>
                        <div className="text-xs text-gray-400 font-mono truncate max-w-[120px]">{entry.entityId}</div>
                      </td>
                      <td className="py-2.5 text-gray-500 text-xs">{formatChanges(entry)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {auditTotalPages > 1 && (
                <div className="flex justify-between items-center mt-4 text-sm">
                  <button
                    type="button"
                    onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                    disabled={auditPage === 1}
                    className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-gray-500">Page {auditPage} of {auditTotalPages}</span>
                  <button
                    type="button"
                    onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}
                    disabled={auditPage === auditTotalPages}
                    className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
