import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from '../api/profile';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  // ── Name section ──────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  // ── Password section ──────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const nameMutation = useMutation({
    mutationFn: () => updateProfile({ fullName: fullName.trim() }),
    onSuccess: async () => {
      setNameError('');
      setNameSuccess('Name updated successfully.');
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    },
    onError: (err: Error) => {
      setNameSuccess('');
      setNameError(err.message || 'Failed to update name.');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      updateProfile({ currentPassword, newPassword }),
    onSuccess: () => {
      setPwError('');
      setPwSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: Error) => {
      setPwSuccess('');
      setPwError(err.message || 'Failed to change password.');
    },
  });

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameSuccess('');
    setNameError('');
    if (!fullName.trim()) {
      setNameError('Name cannot be empty.');
      return;
    }
    nameMutation.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwSuccess('');
    setPwError('');
    if (!currentPassword) {
      setPwError('Current password is required.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    passwordMutation.mutate();
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account information and password.</p>
      </div>

      {/* Account info (read-only) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Email</span>
            <p className="font-medium text-gray-900 mt-0.5">{user.email}</p>
          </div>
          <div>
            <span className="text-gray-500">Role</span>
            <p className="font-medium text-gray-900 mt-0.5">{user.role}</p>
          </div>
          <div>
            <span className="text-gray-500">Status</span>
            <p className="mt-0.5">
              {user.isApproved ? (
                <span className="text-green-700 font-medium">Approved</span>
              ) : (
                <span className="text-yellow-600 font-medium">Pending approval</span>
              )}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Member since</span>
            <p className="font-medium text-gray-900 mt-0.5">
              {new Date(user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Change name */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Display Name</h2>
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {nameError && <p className="text-sm text-red-600">{nameError}</p>}
          {nameSuccess && <p className="text-sm text-green-600">{nameSuccess}</p>}
          <button
            type="submit"
            disabled={nameMutation.isPending}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {nameMutation.isPending ? 'Saving…' : 'Save Name'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {pwError && <p className="text-sm text-red-600">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-green-600">{pwSuccess}</p>}
          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {passwordMutation.isPending ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
