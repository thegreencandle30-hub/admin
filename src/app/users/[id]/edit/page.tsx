'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/templates';
import { Button, Input } from '@/components/atoms';
import { useToast } from '@/components/molecules';
import { getUserById, updateUser } from '@/services/user-service';
import type { UpdateUserData } from '@/services/user-service';
import type { User } from '@/shared/types';

function EditUserForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<UpdateUserData>({
    fullName: '',
    mobile: '',
    city: '',
    isActive: true,
    accessDays: undefined,
    isUnlimited: false,
    extendSubscription: false,
  });

  // Track if user has active subscription for extend option
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const response = await getUserById(userId);

      if (response.success && response.data) {
        const userData = response.data.user;
        setUser(userData);
        setHasActiveSubscription(userData.hasActiveSubscription);
        setFormData({
          fullName: userData.fullName || '',
          mobile: userData.mobile,
          city: userData.city || '',
          isActive: userData.isActive,
          accessDays: undefined,
          isUnlimited: !!userData.subscription.isUnlimited || (userData.subscription.isActive && userData.subscription.endDate === null),
          planTier: userData.subscription.planTier || 'Regular',
          extendSubscription: false,
        });
      } else {
        setError(response.error || 'Failed to fetch user');
      }
      setIsLoading(false);
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (e.target instanceof HTMLInputElement && e.target.type === 'checkbox') {
      const { checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        // Clear accessDays when unlimited is selected
        ...(name === 'isUnlimited' && checked ? { accessDays: undefined } : {}),
      }));
    } else if (name === 'accessDays') {
      setFormData((prev) => ({
        ...prev,
        accessDays: value ? parseInt(value, 10) : undefined,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.mobile && !formData.mobile.trim()) {
      setError('Mobile number cannot be empty');
      return;
    }

    // Validate mobile number format if changed
    if (formData.mobile && formData.mobile !== user?.mobile) {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(formData.mobile.trim())) {
        setError('Please enter a valid 10-digit mobile number starting with 6-9');
        return;
      }
    }

    if (formData.accessDays && formData.accessDays < 1) {
      setError('Access days must be at least 1');
      return;
    }

    setIsSubmitting(true);

    // Build update data - only include changed fields
    const updateData: UpdateUserData = {};

    if (formData.fullName !== (user?.fullName || '')) {
      updateData.fullName = formData.fullName;
    }

    if (formData.mobile && formData.mobile !== user?.mobile) {
      updateData.mobile = formData.mobile.trim();
    }

    if (formData.city !== (user?.city || '')) {
      updateData.city = formData.city;
    }

    if (formData.isActive !== user?.isActive) {
      updateData.isActive = formData.isActive;
    }

    if (formData.planTier !== user?.subscription.planTier) {
      updateData.planTier = formData.planTier;
    }

    // Handle subscription updates
    if (formData.isUnlimited) {
      updateData.isUnlimited = true;
    } else if (formData.accessDays) {
      updateData.accessDays = formData.accessDays;
      updateData.extendSubscription = formData.extendSubscription;
    }

    // Check if there are any changes
    if (Object.keys(updateData).length === 0) {
      setError('No changes to save');
      setIsSubmitting(false);
      return;
    }

    const response = await updateUser(userId, updateData);

    if (response.success) {
      showToast({ message: 'User updated successfully', variant: 'success' });
      router.push('/users');
    } else {
      setError(response.error || 'Failed to update user');
    }

    setIsSubmitting(false);
  };

  const formatDate = (date: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Link href="/users">
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Edit User</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Update user details and subscription
            </p>
          </div>
        </div>

        {/* Current Subscription Info */}
        {user && (
          <div className="bg-muted/50 rounded-3xl p-4 border border-border animate-slide-up">
            <h3 className="text-sm font-medium text-foreground mb-2">Current Subscription</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Plan:</span>{' '}
                <span className="font-medium">
                  {user.subscription.isUnlimited
                    ? `Unlimited (${user.subscription.planTier || 'Regular'})`
                    : user.subscription.planTier && user.subscription.planTier !== 'None'
                    ? user.subscription.planTier
                    : user.subscription.plan
                    ? user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)
                    : user.hasActiveSubscription
                    ? 'Active'
                    : 'None'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{' '}
                <span className={`font-medium ${user.hasActiveSubscription ? 'text-green-600' : 'text-red-600'}`}>
                  {user.hasActiveSubscription ? 'Active' : 'Inactive'}
                </span>
              </div>
              {user.subscription.isUnlimited || !user.subscription.endDate ? (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Expires:</span>{' '}
                  <span className="font-medium text-green-600">Unlimited Access</span>
                </div>
              ) : (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Expires:</span>{' '}
                  <span className="font-medium">{formatDate(user.subscription.endDate)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-card rounded-3xl shadow-sm border border-border p-4 sm:p-6 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-destructive/15 border border-destructive/20 rounded-3xl text-destructive">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Full Name
              </label>
              <Input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName || ''}
                onChange={handleChange}
                placeholder="Enter full name"
                maxLength={100}
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label
                htmlFor="mobile"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Mobile Number
              </label>
              <Input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
              />
              {user?.firebaseUid && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ This user has already logged in. Changing mobile may cause login issues.
                </p>
              )}
            </div>

            {/* City */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-foreground mb-2"
              >
                City
              </label>
              <Input
                type="text"
                id="city"
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                placeholder="Enter city"
                maxLength={100}
              />
            </div>

            {/* Subscription Update */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-foreground">
                Update Subscription
              </label>

              {/* Plan Tier Selection */}
              <div>
                <label
                  htmlFor="planTier"
                  className="block text-xs font-medium text-muted-foreground mb-1"
                >
                  Subscription Tier
                </label>
                <select
                  id="planTier"
                  name="planTier"
                  value={formData.planTier}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  <option value="Regular">Regular</option>
                  <option value="Premium">Premium</option>
                  <option value="International">International</option>
                </select>
              </div>

              {/* Unlimited Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isUnlimited"
                  name="isUnlimited"
                  checked={formData.isUnlimited}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="isUnlimited" className="text-sm text-foreground cursor-pointer">
                  Unlimited Access
                </label>
              </div>

              {/* Access Days (shown when not unlimited) */}
              {!formData.isUnlimited && (
                <>
                  <div>
                    <label
                      htmlFor="accessDays"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Add/Set Access Days
                    </label>
                    <Input
                      type="number"
                      id="accessDays"
                      name="accessDays"
                      value={formData.accessDays || ''}
                      onChange={handleChange}
                      placeholder="Enter number of days"
                      min="1"
                      max="3650"
                    />
                  </div>

                  {/* Extend vs Replace Toggle (shown only if user has active subscription) */}
                  {hasActiveSubscription && formData.accessDays && (
                    <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
                      <p className="text-sm font-medium text-foreground">How to apply access days?</p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="extendMode"
                            checked={!formData.extendSubscription}
                            onChange={() => setFormData(prev => ({ ...prev, extendSubscription: false }))}
                            className="w-4 h-4 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-foreground">
                            Replace from today
                          </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="extendMode"
                            checked={formData.extendSubscription}
                            onChange={() => setFormData(prev => ({ ...prev, extendSubscription: true }))}
                            className="w-4 h-4 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-foreground">
                            Add to existing subscription
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm text-foreground cursor-pointer">
                Account Active
              </label>
              <span className="text-xs text-muted-foreground">
                (Inactive users cannot login)
              </span>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
              <Link href="/users">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
  );
}

export default function EditUserPage() {
  const params = useParams();
  const userId = params.id as string;

  return (
    <DashboardLayout>
      <EditUserForm userId={userId} />
    </DashboardLayout>
  );
}
