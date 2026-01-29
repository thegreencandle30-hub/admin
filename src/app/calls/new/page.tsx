'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/templates';
import { Button, Input } from '@/components/atoms';
import { createCall } from '@/services/call-service';
import type { CreateCallData } from '@/services/call-service';

const COMMODITY_OPTIONS = [
  { value: 'Gold', label: 'Gold' },
  { value: 'Silver', label: 'Silver' },
  { value: 'Copper', label: 'Copper' },
  { value: 'Crude', label: 'Crude' },
  { value: 'CMX Gold', label: 'CMX Gold' },
  { value: 'CMX Silver', label: 'CMX Silver' },
  { value: 'Custom', label: 'Other/Manual' },
];

const TYPE_OPTIONS = [
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
];

export default function NewCallPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateCallData>({
    commodity: 'Gold',
    customCommodity: '',
    type: 'buy',
    entryPrice: 0,
    targetPrices: [{ price: 0, label: 'Target 1', order: 1, isAcheived: false }],
    stopLoss: 0,
    analysis: '',
    date: new Date().toISOString().split('T')[0],
    tradeType: 'intraday',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['entryPrice', 'stopLoss'].includes(name)
        ? parseFloat(value) || 0
        : value,
    }));
  };

  const handleTargetChange = (index: number, field: string, value: string | number) => {
    const newTargets = [...formData.targetPrices];
    newTargets[index] = {
      ...newTargets[index],
      [field]: field === 'price' ? parseFloat(value.toString()) || 0 : value
    };
    setFormData({ ...formData, targetPrices: newTargets });
  };

  const addTarget = () => {
    if (formData.targetPrices.length >= 6) return;
    const nextOrder = formData.targetPrices.length + 1;
    setFormData({
      ...formData,
      targetPrices: [
        ...formData.targetPrices,
        { price: 0, label: `Target ${nextOrder}`, order: nextOrder, isAcheived: false }
      ]
    });
  };

  const removeTarget = (index: number) => {
    if (formData.targetPrices.length <= 1) return;
    const newTargets = formData.targetPrices.filter((_, i) => i !== index);
    setFormData({ ...formData, targetPrices: newTargets });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.commodity === 'Custom' && !formData.customCommodity) {
      setError('Please specify the custom commodity name');
      return;
    }
    if (formData.entryPrice <= 0) {
      setError('Entry price must be greater than 0');
      return;
    }
    if (formData.stopLoss <= 0) {
      setError('Stop loss must be greater than 0');
      return;
    }
    if (formData.targetPrices.some(t => t.price <= 0)) {
      setError('All target prices must be greater than 0');
      return;
    }
    if (!formData.analysis) {
      setError('Analysis/Rationale is required');
      return;
    }

    // Validate targets based on call type
    for (const target of formData.targetPrices) {
      if (formData.type === 'buy') {
        if (target.price <= formData.entryPrice) {
          setError(`Target "${target.label}" must be greater than entry price for BUY calls`);
          return;
        }
      } else {
        if (target.price >= formData.entryPrice) {
          setError(`Target "${target.label}" must be less than entry price for SELL calls`);
          return;
        }
      }
    }

    // Validate stoploss
    if (formData.type === 'buy' && formData.stopLoss >= formData.entryPrice) {
      setError('For BUY calls, stop loss must be less than entry price');
      return;
    }
    if (formData.type === 'sell' && formData.stopLoss <= formData.entryPrice) {
      setError('For SELL calls, stop loss must be greater than entry price');
      return;
    }

    setIsSubmitting(true);

    const response = await createCall(formData);

    if (response.success) {
      router.push('/calls');
    } else {
      setError(response.error || 'Failed to create call');
    }

    setIsSubmitting(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 pb-10">
        {/* Page Header omitted for brevity in replace tool, but included in my mind */}
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">New Call</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Create a new trading call with multiple targets
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

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-foreground mb-2">
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

            {/* Trade Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Trade Type
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tradeType: 'intraday' })}
                  className={`flex-1 px-4 py-3 rounded-3xl font-medium transition-all border-2 ${
                    formData.tradeType === 'intraday'
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                      : 'bg-background text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {formData.tradeType === 'intraday' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Intraday</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tradeType: 'short_term' })}
                  className={`flex-1 px-4 py-3 rounded-3xl font-medium transition-all border-2 ${
                    formData.tradeType === 'short_term'
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                      : 'bg-background text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {formData.tradeType === 'short_term' && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Short Term</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Commodity & Type Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="commodity" className="block text-sm font-medium text-foreground mb-2">
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
                {formData.commodity === 'Custom' && (
                  <div className="mt-2">
                    <Input
                      name="customCommodity"
                      value={formData.customCommodity}
                      onChange={handleChange}
                      placeholder="Enter commodity name"
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-foreground mb-2">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <label htmlFor="entryPrice" className="block text-sm font-medium text-foreground mb-2">
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

              <div>
                <label htmlFor="stopLoss" className="block text-sm font-medium text-foreground mb-2">
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
              </div>
            </div>

            {/* Multiple Targets Section */}
            <div className="space-y-4 border-t border-border pt-4">
               <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Target Prices (Max 6)</label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={addTarget}
                  disabled={formData.targetPrices.length >= 6}
                >
                  + Add Target
                </Button>
              </div>
              
              <div className="space-y-3">
                {formData.targetPrices.map((target, index) => (
                  <div key={index} className="flex gap-2 items-start animate-fade-in">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={target.label}
                        onChange={(e) => handleTargetChange(index, 'label', e.target.value)}
                        placeholder="Label (e.g. Target 1)"
                        required
                      />
                      <Input
                        type="number"
                        value={target.price || ''}
                        onChange={(e) => handleTargetChange(index, 'price', e.target.value)}
                        placeholder="Price"
                        step="0.01"
                        required
                      />
                    </div>
                    {formData.targetPrices.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive mt-1"
                        onClick={() => removeTarget(index)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Field */}
            <div className="border-t border-border pt-4">
              <label htmlFor="analysis" className="block text-sm font-medium text-foreground mb-2">
                Analysis / Rationale
              </label>
              <textarea
                id="analysis"
                name="analysis"
                value={formData.analysis}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-input rounded-3xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-32 resize-none"
                placeholder="Enter technical or fundamental analysis for this call..."
                required
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {formData.analysis.length}/2000 characters
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
              <Link href="/calls">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" isLoading={isSubmitting}>
                Create Call
              </Button>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="bg-info/10 border border-info/20 rounded-3xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-medium text-info mb-2">💡 Note</h3>
          <ul className="text-sm text-info/80 space-y-1 list-disc list-inside">
            <li>For <strong>BUY</strong> calls: Target &gt; Entry &gt; Stop Loss</li>
            <li>For <strong>SELL</strong> calls: Stop Loss &gt; Entry &gt; Target</li>
            <li>Calls are automatically set to &quot;active&quot; status when created</li>
            <li>You can update the status later when targets are hit or calls expire</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
