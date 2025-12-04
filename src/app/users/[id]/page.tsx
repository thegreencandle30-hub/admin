'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/templates';
import { Button, Badge } from '@/components/atoms';
import { getUserById, getUserPayments, updateUserStatus, activateSubscription, deleteUser } from '@/services/user-service';
import ConfirmDialog from '@/components/molecules/confirm-dialog';
import { useToast } from '@/components/molecules';
import type { Payment } from '@/services/user-service';
import type { User, Pagination } from '@/shared/types';

// Child component that uses useToast (must be inside DashboardLayout which has ToastProvider)
function UserDetailsContent({ userId }: { userId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<'daily' | 'weekly' | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const response = await getUserById(userId);

      if (response.success && response.data) {
        setUser(response.data.user);
        // Fetch payments
        const paymentsResponse = await getUserPayments(userId, 1, 10);
        if (paymentsResponse.success && paymentsResponse.data) {
          setPayments(paymentsResponse.data.data);
          setPagination(paymentsResponse.data.pagination);
        }
      } else {
        setError(response.error || 'Failed to fetch user');
      }
      setIsLoading(false);
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleToggleStatus = async () => {
    if (!user) return;

    setIsUpdating(true);
    const response = await updateUserStatus(userId, !user.isActive);

    if (response.success && response.data) {
      setUser(response.data.user);
      showToast({ message: `User ${!user?.isActive ? 'enabled' : 'disabled'} successfully`, variant: 'success' });
    } else {
      showToast({ message: response.error || 'Failed to update status', variant: 'error' });
    }
    setIsUpdating(false);
  };

  const handleActivateSubscriptionClick = (plan: 'daily' | 'weekly') => {
    if (!user) return;
    setPendingPlan(plan);
    setConfirmOpen(true);
  };

  const handleActivateSubscriptionConfirm = async () => {
    if (!user || !pendingPlan) return;

    setIsUpdating(true);
    const response = await activateSubscription(userId, pendingPlan);

    if (response.success && response.data) {
      setUser(response.data.user);
      showToast({ message: 'Subscription activated successfully', variant: 'success' });
    } else {
      showToast({ message: response.error || 'Failed to activate subscription', variant: 'error' });
    }

    setIsUpdating(false);
    setPendingPlan(null);
    setConfirmOpen(false);
  };

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    const response = await deleteUser(userId);

    if (response.success) {
      showToast({ message: 'User deleted successfully', variant: 'success' });
      router.push('/users');
    } else {
      showToast({ message: response.error || 'Failed to delete user', variant: 'error' });
    }

    setIsDeleting(false);
    setDeleteConfirmOpen(false);
  };

  const handlePageChange = async (newPage: number) => {
    const response = await getUserPayments(userId, newPage, 10);
    if (response.success && response.data) {
      setPayments(response.data.data);
      setPagination(response.data.pagination);
      setCurrentPage(newPage);
    }
  };

  const formatDate = (date: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const isSubscriptionActive = (user: User): boolean => {
    if (!user.subscription?.isActive) return false;
    // Unlimited subscriptions are always active
    if (user.subscription?.isUnlimited) return true;
    if (!user.subscription?.endDate) return false;
    return new Date(user.subscription.endDate) > new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user && !isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-6 text-center">
          <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
            User Not Found
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || 'The user you are looking for does not exist.'}
          </p>
          <Link href="/users">
            <Button>Back to Users</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link href="/users">
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">User Details</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              View and manage user information
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/users/${userId}/edit`}>
              <Button variant="secondary" size="sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
            </Link>
            <Button variant="danger" size="sm" className="bg-red-800 hover:bg-red-600" onClick={handleDeleteClick}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* User Info Card */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Basic Info */}
            <div className="bg-card rounded-3xl shadow-sm border border-border p-4 sm:p-6 animate-slide-up">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                    {user?.fullName || user?.mobile}
                  </h2>
                  <Badge variant={user?.isActive ? 'success' : 'danger'}>
                    {user?.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {user?.fullName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Full Name</span>
                    <span className="text-foreground">
                      {user?.fullName}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mobile</span>
                  <span className="text-foreground">
                    {user?.mobile}
                  </span>
                </div>
                {user?.city && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">City</span>
                    <span className="text-foreground">
                      {user?.city}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">User ID</span>
                  <span className="text-foreground font-mono text-xs">
                    {user?.id}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="text-foreground">
                    {formatDate(user?.createdAt || null)}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  variant="ghost"
                  className={`w-full ${user?.isActive ? 'bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-400' : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400'}`}
                  onClick={handleToggleStatus}
                  isLoading={isUpdating}
                >
                  {user?.isActive ? 'Disable User' : 'Enable User'}
                </Button>
              </div>
            </div>

            {/* Subscription Card */}
            <div className="bg-card rounded-3xl shadow-sm border border-border p-4 sm:p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                Subscription
              </h3>

              {user && isSubscriptionActive(user) ? (
                <div className="space-y-3">
                  <div className="p-4 bg-success/10 border border-success/20 rounded-3xl">
                    <Badge variant="success" className="mb-2">Active</Badge>
                    <p className="text-sm font-medium text-success">
                      {user.subscription.isUnlimited
                        ? 'UNLIMITED Access'
                        : `${user.subscription.plan?.toUpperCase()} Plan`}
                    </p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Start Date</span>
                    <span className="text-foreground">
                      {formatDate(user.subscription.startDate)}
                    </span>
                  </div>
                  {!user.subscription.isUnlimited && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">End Date</span>
                      <span className="text-foreground">
                        {formatDate(user.subscription.endDate)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 border border-border rounded-3xl text-center">
                      <Badge variant="default">No Active Subscription</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Manually activate subscription:
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleActivateSubscriptionClick('daily')}
                        disabled={isUpdating}
                      >
                        Daily (₹99)
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleActivateSubscriptionClick('weekly')}
                        disabled={isUpdating}
                      >
                        Weekly (₹499)
                      </Button>
                    </div>
                  </div>
                  <ConfirmDialog
                    open={confirmOpen}
                    title="Activate Subscription"
                    message={`Are you sure you want to activate ${pendingPlan?.toUpperCase()} subscription for this user?`}
                    onCancelAction={() => setConfirmOpen(false)}
                    onConfirmAction={handleActivateSubscriptionConfirm}
                    isLoading={isUpdating}
                  />
                </>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="px-4 sm:px-6 py-4 border-b border-border">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Payment History
                </h3>
              </div>

              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <p>No payment history</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Transaction ID
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {payments.map((payment) => (
                          <tr key={payment._id || payment.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {formatDate(payment.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="info">
                                {payment.plan.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                              {formatPrice(payment.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant={
                                  payment.status === 'completed'
                                    ? 'success'
                                    : payment.status === 'failed'
                                      ? 'danger'
                                      : 'warning'
                                }
                              >
                                {payment.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                              {payment.transactionId.slice(0, 20)}...
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {pagination.totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!pagination.hasPrevPage}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagination.hasNextPage}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Delete User"
          message={`Are you sure you want to delete the user with mobile ${user?.mobile}? This action cannot be undone and will also delete all their payment history.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isLoading={isDeleting}
          onConfirmAction={handleDeleteConfirm}
          onCancelAction={() => setDeleteConfirmOpen(false)}
        />
      </div>
  );
}

// Main page component - wraps content in DashboardLayout
export default function UserDetailsPage() {
  const params = useParams();
  const userId = params.id as string;

  return (
    <DashboardLayout>
      <UserDetailsContent userId={userId} />
    </DashboardLayout>
  );
}
