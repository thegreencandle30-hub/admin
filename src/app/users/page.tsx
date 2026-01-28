'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/templates';
import { Button, Badge } from '@/components/atoms';
import { ConfirmDialog, useToast } from '@/components/molecules';
import { getUsers, updateUserStatus, deleteUser } from '@/services/user-service';
import type { User, Pagination, PaginatedResponse, ClientResponse } from '@/shared/types';

// Data fetching component
function UsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast } = useToast();

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initial data fetch using useEffect
  useEffect(() => {
    const fetchInitial = async () => {
      setIsLoading(true);
      const response = await getUsers({ page: 1, limit: 10 });
      if (response.success && response.data) {
        setUsers(response.data.data || []);
        setPagination(response.data.pagination || null);
      }
      setIsLoading(false);
    };
    fetchInitial();
  }, []);

  const fetchUsers = async (page: number, searchQuery: string) => {
    setIsLoading(true);
    const response: ClientResponse<PaginatedResponse<User>> = await getUsers({
      page,
      limit: 10,
      search: searchQuery || undefined,
    });

    if (response.success && response.data) {
      setUsers(response.data.data || []);
      setPagination(response.data.pagination || null);
    }
    setIsLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchUsers(1, search);
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    await fetchUsers(newPage, search);
  };

  const handleToggleStatus = async (user: User) => {
    const response = await updateUserStatus(user.id, !user.isActive);
    if (response.success) {
      setUsers(users.map(u =>
        u.id === user.id ? { ...u, isActive: !user.isActive } : u
      ));
      showToast({ message: `User ${!user.isActive ? 'enabled' : 'disabled'} successfully`, variant: 'success' });
    } else {
      showToast({ message: response.error || 'Failed to update status', variant: 'error' });
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    const response = await deleteUser(userToDelete.id);

    if (response.success) {
      setUsers(users.filter(u => u.id !== userToDelete.id));
      showToast({ message: 'User deleted successfully', variant: 'success' });
    } else {
      showToast({ message: response.error || 'Failed to delete user', variant: 'error' });
    }

    setIsDeleting(false);
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and subscriptions
          </p>
        </div>
        <Link href="/users/new">
          <Button className="animate-slide-up">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <input
          type="text"
          placeholder="Search by name, mobile or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-input rounded-3xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button type="submit" isLoading={isLoading}>Search</Button>
      </form>

      {/* Users Table */}
      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    ID / User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Mobile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Plan / Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-md w-fit mb-1">
                          #{user.displayId || 'N/A'}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {user.fullName || 'No Name'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {user.mobile}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {user.city || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {user.hasActiveSubscription ? (
                          <>
                            <Badge variant="info" className="w-fit">
                              {user.subscription.planTier}
                            </Badge>
                            {user.subscription.endDate && (
                              <span className="text-[10px] text-muted-foreground">
                                Expires: {new Date(user.subscription.endDate).toLocaleDateString()}
                              </span>
                            )}
                          </>
                        ) : (
                          <Badge variant="default" className="w-fit">No Subscription</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/users/${user.id}`}>
                          <Button variant="secondary" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/users/${user.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={user.isActive ? 'bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-400' : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400'}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="bg-red-800 hover:bg-red-600"
                          onClick={() => handleDeleteClick(user)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {users?.length || 0} of {pagination.total} users
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage || isLoading}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete User"
        message={`Are you sure you want to delete the user with mobile ${userToDelete?.mobile}? This action cannot be undone and will also delete all their payment history.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={isDeleting}
        onConfirmAction={handleDeleteConfirm}
        onCancelAction={handleDeleteCancel}
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <DashboardLayout>
      <UsersContent />
    </DashboardLayout>
  );
}
