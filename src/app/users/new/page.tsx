'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/templates';
import { Button, Input } from '@/components/atoms';
import { useToast } from '@/components/molecules';
import { createUser } from '@/services/user-service';
import type { CreateUserData } from '@/services/user-service';

function NewUserForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateUserData>({
    fullName: '',
    mobile: '',
    city: '',
    isActive: true,
    accessDays: undefined,
    isUnlimited: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
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
    if (!formData.mobile.trim()) {
      setError('Mobile number is required');
      return;
    }

    // Validate mobile number format (10 digits)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(formData.mobile.trim())) {
      setError('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    // Check if subscription access is provided
    if (!formData.isUnlimited && !formData.accessDays) {
      setError('Please provide access days or select unlimited access');
      return;
    }

    if (formData.accessDays && formData.accessDays < 1) {
      setError('Access days must be at least 1');
      return;
    }

    setIsSubmitting(true);

    const response = await createUser({
      fullName: formData.fullName?.trim() || undefined,
      mobile: formData.mobile.trim(),
      city: formData.city?.trim() || undefined,
      isActive: formData.isActive,
      ...(formData.isUnlimited ? { isUnlimited: true } : { accessDays: formData.accessDays }),
    });

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Add User</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Create a new user account with platform access
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
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              User will be able to login with this mobile number
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
              value={formData.city || ''}
              onChange={handleChange}
              placeholder="Enter city"
              maxLength={100}
            />
          </div>

          {/* Access Type */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Platform Access
            </label>
            
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
              <div>
                <label
                  htmlFor="accessDays"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Access Days
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
                <p className="text-xs text-muted-foreground mt-1">
                  Number of days the user can access the platform (max 10 years)
                </p>
              </div>
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
              Create User
            </Button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-info/10 border border-info/20 rounded-3xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="font-medium text-info mb-2">💡 Note</h3>
        <ul className="text-sm text-info/80 space-y-1 list-disc list-inside">
          <li>Users created here will be able to login using OTP verification on their mobile number</li>
          <li>The subscription access will start from the time of creation</li>
          <li>You can edit the user details or extend their access later</li>
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
