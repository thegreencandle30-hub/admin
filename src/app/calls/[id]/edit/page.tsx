'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/templates';
import { Button, Input } from '@/components/atoms';
import { getCallById, updateCall } from '@/services/call-service';
import type { Call, CreateCallData } from '@/services/call-service';

const COMMODITY_OPTIONS = [
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'nifty', label: 'Nifty' },
  { value: 'copper', label: 'Copper' },
];

const TYPE_OPTIONS = [
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'hit_target', label: 'Hit Target' },
  { value: 'hit_stoploss', label: 'Hit Stoploss' },
  { value: 'expired', label: 'Expired' },
];

export default function EditCallPage() {
  const router = useRouter();
  const params = useParams();
  const callId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [call, setCall] = useState<Call | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCallData & { status: string }>({
    commodity: 'gold',
    type: 'buy',
    entryPrice: 0,
    target: 0,
    stopLoss: 0,
    date: new Date().toISOString().split('T')[0],
    status: 'active',
  });

  // Fetch call data
  useEffect(() => {
    const fetchCall = async () => {
      setIsLoading(true);
      const response = await getCallById(callId);

      if (response.success && response.data) {
        const fetchedCall = response.data.call;
        setCall(fetchedCall);
        setFormData({
          commodity: fetchedCall.commodity,
          type: fetchedCall.type,
          entryPrice: fetchedCall.entryPrice,
          target: fetchedCall.target,
          stopLoss: fetchedCall.stopLoss,
          date: fetchedCall.date.split('T')[0],
          status: fetchedCall.status,
        });
      } else {
        setError(response.error || 'Failed to fetch call');
      }
      setIsLoading(false);
    };

    if (callId) {
      fetchCall();
    }
  }, [callId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['entryPrice', 'target', 'stopLoss'].includes(name)
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.entryPrice <= 0) {
      setError('Entry price must be greater than 0');
      return;
    }
    if (formData.target <= 0) {
      setError('Target must be greater than 0');
      return;
    }
    if (formData.stopLoss <= 0) {
      setError('Stop loss must be greater than 0');
      return;
    }

    // Validate target and stoploss based on call type
    if (formData.type === 'buy') {
      if (formData.target <= formData.entryPrice) {
        setError('For BUY calls, target must be greater than entry price');
        return;
      }
      if (formData.stopLoss >= formData.entryPrice) {
        setError('For BUY calls, stop loss must be less than entry price');
        return;
      }
    } else {
      if (formData.target >= formData.entryPrice) {
        setError('For SELL calls, target must be less than entry price');
        return;
      }
      if (formData.stopLoss <= formData.entryPrice) {
        setError('For SELL calls, stop loss must be greater than entry price');
        return;
      }
    }

    setIsSubmitting(true);

    const response = await updateCall(callId, formData);

    if (response.success) {
      router.push('/calls');
    } else {
      setError(response.error || 'Failed to update call');
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!call && !isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-6 text-center">
            <svg className="w-12 h-12 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
              Call Not Found
            </h2>
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error || 'The call you are looking for does not exist.'}
            </p>
            <Link href="/calls">
              <Button>Back to Calls</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Link href="/calls">
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Call</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Update trading call details
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

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-input rounded-3xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Update when the call hits target, stoploss, or expires
              </p>
            </div>

            {/* Date */}
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-input rounded-3xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            {/* Commodity & Type Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="commodity"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Commodity
                </label>
                <select
                  id="commodity"
                  name="commodity"
                  value={formData.commodity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-3xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {COMMODITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Call Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-input rounded-3xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Fields */}
            <div>
              <label
                htmlFor="entryPrice"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Entry Price (₹)
              </label>
              <Input
                type="number"
                id="entryPrice"
                name="entryPrice"
                value={formData.entryPrice || ''}
                onChange={handleChange}
                placeholder="Enter entry price"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="target"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Target Price (₹)
                </label>
                <Input
                  type="number"
                  id="target"
                  name="target"
                  value={formData.target || ''}
                  onChange={handleChange}
                  placeholder="Enter target"
                  step="0.01"
                  min="0"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.type === 'buy' ? 'Should be higher than entry' : 'Should be lower than entry'}
                </p>
              </div>

              <div>
                <label
                  htmlFor="stopLoss"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Stop Loss (₹)
                </label>
                <Input
                  type="number"
                  id="stopLoss"
                  name="stopLoss"
                  value={formData.stopLoss || ''}
                  onChange={handleChange}
                  placeholder="Enter stop loss"
                  step="0.01"
                  min="0"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.type === 'buy' ? 'Should be lower than entry' : 'Should be higher than entry'}
                </p>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
              <Link href="/calls">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={isSubmitting}>
                Update Call
              </Button>
            </div>
          </form>
        </div>

        {/* Call Info */}
        {call && (
          <div className="bg-muted/50 border border-border rounded-3xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-medium text-foreground mb-2">Call Information</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Created: {new Date(call.createdAt).toLocaleString('en-IN')}</p>
              <p>Last Updated: {new Date(call.updatedAt).toLocaleString('en-IN')}</p>
              {call.createdBy && <p>Created By: {call.createdBy.email}</p>}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
