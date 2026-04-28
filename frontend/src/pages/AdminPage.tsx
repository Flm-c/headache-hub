import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveAdminUser,
  createAdminUser,
  fetchAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
} from '../api/admin';
import { UserRole } from '../types/auth';

const roles: UserRole[] = ['PATIENT', 'EDITOR', 'ADMIN'];

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'PATIENT' as UserRole,
  });
  const [pageError, setPageError] = useState('');

  const usersQuery = useQuery({
    queryKey: ['admin-users', statusFilter],
    queryFn: () => fetchAdminUsers(statusFilter),
  });

  const invalidateUsers = async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const approveMutation = useMutation({
    mutationFn: approveAdminUser,
    onSuccess: () => {
      setPageError('');
      void invalidateUsers();
    },
    onError: (error: Error) => setPageError(error.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateAdminUserRole(userId, { role }),
    onSuccess: () => {
      setPageError('');
      void invalidateUsers();
    },
    onError: (error: Error) => setPageError(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      updateAdminUserStatus(userId, { isActive }),
    onSuccess: () => {
      setPageError('');
      void invalidateUsers();
    },
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
    createUserMutation.mutate({
      ...formData,
      isActive: true,
    });
  };

  const users = usersQuery.data || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Approve registrations, manage roles and create internal users directly.</p>
      </div>

      {pageError && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create user as admin</h2>
            <p className="text-sm text-gray-600">
              Users created here are auto-approved and can be assigned any role immediately.
            </p>
          </div>
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateUser}>
          <input
            type="text"
            value={formData.fullName}
            onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
            className="rounded-lg border border-gray-300 px-4 py-2"
            placeholder="Full name"
            required
          />
          <input
            type="email"
            value={formData.email}
            onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
            className="rounded-lg border border-gray-300 px-4 py-2"
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={formData.password}
            onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
            className="rounded-lg border border-gray-300 px-4 py-2"
            placeholder="Temporary password"
            required
          />
          <select
            value={formData.role}
            onChange={(event) =>
              setFormData((current) => ({ ...current, role: event.target.value as UserRole }))
            }
            className="rounded-lg border border-gray-300 px-4 py-2"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
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
            onChange={(event) => setStatusFilter(event.target.value as 'all' | 'pending' | 'approved')}
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
                      <span
                        className={`rounded-full px-3 py-1 ${
                          user.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {user.isApproved ? 'Approved' : 'Pending'}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 ${
                          user.isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
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
                        onChange={(event) =>
                          roleMutation.mutate({ userId: user.id, role: event.target.value as UserRole })
                        }
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
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
  );
}
