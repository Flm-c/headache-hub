import { FormEvent, KeyboardEvent, useState } from 'react';
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

type ConfirmAction =
  | { type: 'approve'; userId: string; userName: string }
  | { type: 'status'; userId: string; userName: string; newIsActive: boolean }
  | { type: 'role'; userId: string; userName: string; newRole: UserRole }
  | { type: 'bulkBlock'; userIds: string[]; count: number }
  | { type: 'bulkRestore'; userIds: string[]; count: number }
  | { type: 'bulkApprove'; userIds: string[]; count: number };

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'fullName'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState<20 | 50 | 100>(20);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'PATIENT' as UserRole,
  });
  const [pageError, setPageError] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditAction, setAuditAction] = useState('');

  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
    setUsersPage(1);
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setUsersPage(1);
  };

  const usersQuery = useQuery({
    queryKey: ['admin-users', statusFilter, activeFilter, roleFilter, sortBy, sortOrder, searchQuery, usersPage, usersPageSize],
    queryFn: () =>
      fetchAdminUsers({
        status: statusFilter,
        search: searchQuery || undefined,
        isActive: activeFilter === 'active' ? true : activeFilter === 'blocked' ? false : undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        sortBy,
        sortOrder,
        page: usersPage,
        pageSize: usersPageSize,
      }),
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
    onSuccess: () => { setPageError(''); setConfirm(null); setSelectedIds([]); void invalidateUsers(); },
    onError: (error: Error) => setPageError(error.message),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateAdminUserRole(userId, { role }),
    onSuccess: () => { setPageError(''); setConfirm(null); void invalidateUsers(); },
    onError: (error: Error) => setPageError(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      updateAdminUserStatus(userId, { isActive }),
    onSuccess: () => { setPageError(''); setConfirm(null); setSelectedIds([]); void invalidateUsers(); },
    onError: (error: Error) => setPageError(error.message),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ userIds, isActive }: { userIds: string[]; isActive: boolean }) =>
      Promise.all(userIds.map((id) => updateAdminUserStatus(id, { isActive }))),
    onSuccess: () => { setPageError(''); setConfirm(null); setSelectedIds([]); void invalidateUsers(); },
    onError: (error: Error) => setPageError(error.message),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (userIds: string[]) =>
      Promise.all(userIds.map((id) => approveAdminUser(id))),
    onSuccess: () => { setPageError(''); setConfirm(null); setSelectedIds([]); void invalidateUsers(); },
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

  const handleConfirm = () => {
    if (!confirm) return;
    if (confirm.type === 'approve') approveMutation.mutate(confirm.userId);
    else if (confirm.type === 'status') statusMutation.mutate({ userId: confirm.userId, isActive: confirm.newIsActive });
    else if (confirm.type === 'role') roleMutation.mutate({ userId: confirm.userId, role: confirm.newRole });
    else if (confirm.type === 'bulkBlock') bulkStatusMutation.mutate({ userIds: confirm.userIds, isActive: false });
    else if (confirm.type === 'bulkRestore') bulkStatusMutation.mutate({ userIds: confirm.userIds, isActive: true });
    else if (confirm.type === 'bulkApprove') bulkApproveMutation.mutate(confirm.userIds);
  };

  const usersResult = usersQuery.data;
  const users = usersResult?.users ?? [];
  const usersTotal = usersResult?.total ?? 0;
  const usersTotalPages = usersResult ? Math.ceil(usersResult.total / usersResult.pageSize) : 1;
  const auditData = auditQuery.data;
  const auditTotalPages = auditData ? Math.ceil(auditData.total / auditData.pageSize) : 1;

  const isMutating =
    approveMutation.isPending || roleMutation.isPending || statusMutation.isPending ||
    bulkStatusMutation.isPending || bulkApproveMutation.isPending;
  const isAllSelected = users.length > 0 && users.every((u) => selectedIds.includes(u.id));

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedIds(isAllSelected ? [] : users.map((u) => u.id));

  const isDestructiveConfirm = (): boolean => {
    if (!confirm) return false;
    return confirm.type === 'bulkBlock' || (confirm.type === 'status' && !confirm.newIsActive);
  };

  const confirmTitle = (): string => {
    if (!confirm) return '';
    if (confirm.type === 'approve') return `Approve "${confirm.userName}"?`;
    if (confirm.type === 'status') return confirm.newIsActive ? `Restore "${confirm.userName}"?` : `Block "${confirm.userName}"?`;
    if (confirm.type === 'role') return `Change role of "${confirm.userName}" to ${confirm.newRole}?`;
    if (confirm.type === 'bulkBlock') return `Block ${confirm.count} selected users?`;
    if (confirm.type === 'bulkRestore') return `Restore ${confirm.count} selected users?`;
    if (confirm.type === 'bulkApprove') return `Approve ${confirm.count} selected users?`;
    return '';
  };

  const confirmDescription = (): string => {
    if (!confirm) return '';
    if (confirm.type === 'approve') return 'The user will gain access to the platform.';
    if (confirm.type === 'status' && !confirm.newIsActive) return 'The user will be blocked and unable to log in.';
    if (confirm.type === 'status' && confirm.newIsActive) return 'The user will regain access to the platform.';
    if (confirm.type === 'role') return "This will immediately change the user's permissions.";
    if (confirm.type === 'bulkBlock') return 'All selected users will be blocked and unable to log in.';
    if (confirm.type === 'bulkRestore') return 'All selected users will regain access to the platform.';
    if (confirm.type === 'bulkApprove') return 'All selected pending users will be approved.';
    return '';
  };

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
      {/* Confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-1">{confirmTitle()}</h3>
            <p className="text-sm text-gray-500 mb-5">{confirmDescription()}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={isMutating}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isMutating}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                  isDestructiveConfirm() ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isMutating ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

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
          {/* Create user */}
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

          {/* User list */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 mb-6">
              {/* Title + sort */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">User management</h2>
                  <p className="text-sm text-gray-500">
                    {usersQuery.isFetching
                      ? 'Loading...'
                      : `${usersTotal} user${usersTotal !== 1 ? 's' : ''} found`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value as 'createdAt' | 'fullName'); setUsersPage(1); }}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="createdAt">Sort: Date joined</option>
                    <option value="fullName">Sort: Name</option>
                  </select>
                  <button
                    type="button"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    onClick={() => { setSortOrder((o) => o === 'asc' ? 'desc' : 'asc'); setUsersPage(1); }}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Search by name or email…"
                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-14 top-1/2 -translate-y-1/2 px-1 text-gray-400 hover:text-gray-600"
                      title="Clear"
                    >
                      ×
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Find
                  </button>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'pending' | 'approved'); setUsersPage(1); }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All approval statuses</option>
                  <option value="pending">Pending only</option>
                  <option value="approved">Approved only</option>
                </select>
                <select
                  value={activeFilter}
                  onChange={(e) => { setActiveFilter(e.target.value as 'all' | 'active' | 'blocked'); setUsersPage(1); }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All ban statuses</option>
                  <option value="active">Active only</option>
                  <option value="blocked">Blocked only</option>
                </select>
                <select
                  value={roleFilter}
                  onChange={(e) => { setRoleFilter(e.target.value as 'all' | UserRole); setUsersPage(1); }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="all">All roles</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Bulk actions bar */}
              {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm">
                  <span className="font-medium text-blue-800">{selectedIds.length} selected</span>
                  <button
                    type="button"
                    onClick={() => setConfirm({ type: 'bulkApprove', userIds: selectedIds, count: selectedIds.length })}
                    className="rounded-md bg-green-600 px-3 py-1 font-semibold text-white hover:bg-green-700"
                  >
                    Approve all
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirm({ type: 'bulkBlock', userIds: selectedIds, count: selectedIds.length })}
                    className="rounded-md bg-red-600 px-3 py-1 font-semibold text-white hover:bg-red-700"
                  >
                    Block all
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirm({ type: 'bulkRestore', userIds: selectedIds, count: selectedIds.length })}
                    className="rounded-md bg-gray-700 px-3 py-1 font-semibold text-white hover:bg-gray-800"
                  >
                    Restore all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="ml-auto text-blue-600 hover:underline"
                  >
                    Clear selection
                  </button>
                </div>
              )}
            </div>

            {usersQuery.isLoading ? (
              <div className="text-gray-600">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="rounded-lg bg-gray-50 px-4 py-6 text-sm text-gray-600">No users found for this filter.</div>
            ) : (
              <>
                {/* Select all */}
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                  />
                  <label htmlFor="select-all">Select all on page</label>
                </div>

                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`rounded-xl border p-4 transition-colors ${
                        selectedIds.includes(user.id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(user.id)}
                            onChange={() => toggleSelect(user.id)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 accent-blue-600"
                          />
                          <div>
                            <div className="text-lg font-semibold text-gray-900">{user.fullName}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                            <div className="mt-1 text-xs text-gray-400">
                              Joined {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
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
                        </div>
                        <div className="flex flex-col gap-3 lg:items-end">
                          {!user.isApproved && (
                            <button
                              type="button"
                              onClick={() => setConfirm({ type: 'approve', userId: user.id, userName: user.fullName })}
                              disabled={isMutating}
                              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                            >
                              Approve user
                            </button>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={user.role}
                              onChange={(e) =>
                                setConfirm({ type: 'role', userId: user.id, userName: user.fullName, newRole: e.target.value as UserRole })
                              }
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            >
                              {roles.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirm({ type: 'status', userId: user.id, userName: user.fullName, newIsActive: !user.isActive })
                              }
                              disabled={isMutating}
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

                {/* Pagination */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Rows per page:</span>
                    <select
                      value={usersPageSize}
                      onChange={(e) => { setUsersPageSize(Number(e.target.value) as 20 | 50 | 100); setUsersPage(1); }}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                      disabled={usersPage === 1}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50"
                    >
                      ← Prev
                    </button>
                    <span className="text-gray-500">Page {usersPage} of {usersTotalPages}</span>
                    <button
                      type="button"
                      onClick={() => setUsersPage((p) => Math.min(usersTotalPages, p + 1))}
                      disabled={usersPage === usersTotalPages}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </>
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
