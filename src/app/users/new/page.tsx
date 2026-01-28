'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/templates';
import { Button, Input } from '@/components/atoms';
import { useToast } from '@/components/molecules';
import { createUser } from '@/services/user-service';
import { getSubscriptionPlans } from '@/services/subscription-service';
import type { CreateUserData } from '@/services/user-service';
import type { SubscriptionPlan } from '@/services/subscription-service';

function NewUserForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    password: '',
    city: '',
    planId: '',
    accessDuration: '',
    planTier: 'Regular' as 'Regular' | 'Premium' | 'International',
    accessType: 'plan' as 'plan' | 'custom' | 'unlimited', // New field to track access type
  });

  useEffect(() => {
    const loadPlans = async () => {
      const response = await getSubscriptionPlans();
      if (response.success && response.data) {
        setPlans(response.data);
      }
    };
    loadPlans();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'radio') {
      setFormData((prev) => ({
        ...prev,
        accessType: value as 'plan' | 'custom' | 'unlimited',
        planId: '', // Reset plan
        accessDuration: '', // Reset duration
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
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!formData.mobile.trim()) {
      setError('Mobile number is required');
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(formData.mobile.trim())) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!formData.password.trim()) {
      setError('Password is required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate access type
    if (formData.accessType === 'plan' && !formData.planId) {
      setError('Please select a subscription plan');
      return;
    }

    if (formData.accessType === 'custom') {
      const days = parseInt(formData.accessDuration, 10);
      if (!formData.accessDuration || days < 1) {
        setError('Please enter valid number of days (minimum 1)');
        return;
      }
    }

    setIsSubmitting(true);

    // Prepare data based on access type
    const submitData: CreateUserData = {
      fullName: formData.fullName.trim(),
      mobile: formData.mobile.trim(),
      password: formData.password.trim(),
      city: formData.city.trim(),
    };

    if (formData.accessType === 'plan') {
      submitData.planId = formData.planId;
    } else if (formData.accessType === 'custom') {
      submitData.accessDuration = parseInt(formData.accessDuration, 10);
      submitData.planTier = formData.planTier;
    } else if (formData.accessType === 'unlimited') {
      submitData.accessDuration = 'unlimited';
      submitData.planTier = formData.planTier;
    }

    const response = await createUser(submitData);

    if (response.success) {
      showToast({ message: 'User created successfully', variant: 'success' });
      router.push('/users');
    } else {
      setError(response.error || 'Failed to create user');
    }

    setIsSubmitting(false);
  };

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Create User</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Create a new user account and grant platform access
          </p>
        </div>
      </div>

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
              Full Name *
            </label>
            <Input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
              maxLength={100}
              required
            />
          </div>

          {/* Mobile Number */}
          <div>
            <label
              htmlFor="mobile"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Mobile Number *
            </label>
            <Input
              type="tel"
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              User will login with this mobile number
            </p>
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
              value={formData.city}
              onChange={handleChange}
              placeholder="Enter city (Optional)"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Password *
            </label>
            <Input
              type="text"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password (min 6 characters)"
              minLength={6}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              User will use this to login along with mobile number
            </p>
          </div>

          {/* Access Type Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Grant Access *
            </label>

            {/* Option 1: Select from Plans */}
            <div className="flex items-start gap-3">
              <input
                type="radio"
                id="accessType-plan"
                name="accessType"
                value="plan"
                checked={formData.accessType === 'plan'}
                onChange={handleChange}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="accessType-plan" className="text-sm text-foreground cursor-pointer font-medium">
                  Select Subscription Plan
                </label>
                {formData.accessType === 'plan' && (
                  <select
                    name="planId"
                    value={formData.planId}
                    onChange={handleChange}
                    className="mt-2 w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    required={formData.accessType === 'plan'}
                  >
                    <option value="">Choose a plan...</option>
                    {plans.map((plan) => (
                      <option key={plan._id} value={plan._id}>
                        {plan.name} - {plan.durationDays} days - ₹{plan.price}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Option 2: Custom Days */}
            <div className="flex items-start gap-3">
              <input
                type="radio"
                id="accessType-custom"
                name="accessType"
                value="custom"
                checked={formData.accessType === 'custom'}
                onChange={handleChange}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="accessType-custom" className="text-sm text-foreground cursor-pointer font-medium">
                  Custom Duration
                </label>
                {formData.accessType === 'custom' && (
                  <div className="mt-2 space-y-3">
                    <Input
                      type="number"
                      name="accessDuration"
                      value={formData.accessDuration}
                      onChange={handleChange}
                      placeholder="Enter number of days"
                      min="1"
                      max="3650"
                      required={formData.accessType === 'custom'}
                    />
                    <select
                      name="planTier"
                      value={formData.planTier}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="Regular">Regular</option>
                      <option value="Premium">Premium</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Option 3: Unlimited */}
            <div className="flex items-start gap-3">
              <input
                type="radio"
                id="accessType-unlimited"
                name="accessType"
                value="unlimited"
                checked={formData.accessType === 'unlimited'}
                onChange={handleChange}
                className="mt-1"
              />
              <div className="flex-1">
                <label htmlFor="accessType-unlimited" className="text-sm text-foreground cursor-pointer font-medium">
                  Unlimited Access
                </label>
                {formData.accessType === 'unlimited' && (
                  <div className="mt-2">
                    <select
                      name="planTier"
                      value={formData.planTier}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="Regular">Regular</option>
                      <option value="Premium">Premium</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
            <Link href="/users">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isLoading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-info/10 border border-info/20 rounded-3xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="font-medium text-info mb-2">💡 Information</h3>
        <ul className="text-sm text-info/80 space-y-1 list-disc list-inside">
          <li>Users will be able to login using Mobile + Password on the app</li>
          <li>Access expires at 00:00 AM IST (midnight) on the specified day</li>
          <li>You can extend access or modify tier later from user details page</li>
        </ul>
      </div>
    </div>
  );
}

export default function NewUserPage() {
  return (
    <DashboardLayout>
      <NewUserForm />
    </DashboardLayout>
  );
}
