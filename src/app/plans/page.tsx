'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/templates';
import { Button, Badge, Input } from '@/components/atoms';
import { useToast, ConfirmDialog, FormField } from '@/components/molecules';
import { getSubscriptionPlans, updateSubscriptionPlan, createSubscriptionPlan, deleteSubscriptionPlan, SubscriptionPlan } from '@/services/subscription-service';

const DURATION_OPTIONS = [
  { label: 'Daily', days: 1 },
  { label: 'Weekly', days: 7 },
  { label: 'Monthly', days: 30 },
  { label: 'Yearly', days: 365 },
  { label: 'Lifetime', days: 36500 },
];

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Omit<SubscriptionPlan, '_id' | 'isActive'>>({
    name: '',
    tier: 'Regular',
    durationDays: 30,
    durationLabel: 'Monthly',
    price: 0,
    currency: 'INR',
    maxTargetsVisible: 2,
    reminderHours: 24, // Keep as default, but hidden from UI
  });

  const fetchPlans = async () => {
    setIsLoading(true);
    const response = await getSubscriptionPlans();
    if (response.success && response.data) {
      setPlans(response.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // defer fetch to avoid synchronous state updates in the effect body
    const timer = setTimeout(() => {
      fetchPlans();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleEditClick = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      tier: plan.tier,
      durationDays: plan.durationDays,
      durationLabel: plan.durationLabel,
      price: plan.price,
      currency: plan.currency || 'INR',
      maxTargetsVisible: plan.maxTargetsVisible,
      reminderHours: plan.reminderHours,
    });
    setShowPlanModal(true);
  };

  const handleAddClick = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      tier: 'Regular',
      durationDays: 30,
      durationLabel: 'Monthly',
      price: 0,
      currency: 'INR',
      maxTargetsVisible: 2,
      reminderHours: 24,
    });
    setShowPlanModal(true);
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    setIsUpdating(plan._id);
    const response = await updateSubscriptionPlan(plan._id, { isActive: !plan.isActive });
    
    if (response.success) {
      setPlans(plans.map(p => p._id === plan._id ? { ...p, isActive: !plan.isActive } : p));
      showToast({ message: `${plan.name} status updated`, variant: 'success' });
    } else {
      showToast({ message: response.error || 'Update failed', variant: 'error' });
    }
    setIsUpdating(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (editingPlan) {
      const response = await updateSubscriptionPlan(editingPlan._id, formData);
      if (response.success && response.data) {
        setPlans(plans.map(p => p._id === editingPlan._id ? response.data! : p));
        showToast({ message: 'Plan updated successfully', variant: 'success' });
        setShowPlanModal(false);
      } else {
        showToast({ message: response.error || 'Failed to update plan', variant: 'error' });
      }
    } else {
      const response = await createSubscriptionPlan({ ...formData, isActive: true });
      if (response.success && response.data) {
        setPlans([...plans, response.data]);
        showToast({ message: 'Plan created successfully', variant: 'success' });
        setShowPlanModal(false);
      } else {
        showToast({ message: response.error || 'Failed to create plan', variant: 'error' });
      }
    }
    setIsSubmitting(false);
  };

  const handleDeleteClick = (id: string) => {
    setPlanToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;
    setIsUpdating(planToDelete);
    const response = await deleteSubscriptionPlan(planToDelete);
    if (response.success) {
      setPlans(plans.filter(p => p._id !== planToDelete));
      showToast({ message: 'Plan deleted successfully', variant: 'success' });
    } else {
      showToast({ message: response.error || 'Failed to delete plan', variant: 'error' });
    }
    setIsUpdating(null);
    setShowDeleteConfirm(false);
    setPlanToDelete(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subscription Plans</h1>
            <p className="text-muted-foreground mt-1">
              Manage pricing and visibility for different tiers
            </p>
          </div>
          <Button onClick={handleAddClick}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Plan
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan._id} className="bg-card rounded-4xl p-6 border border-border shadow-sm flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <div className="flex gap-2">
                      <Badge variant={
                        plan.tier === 'International' ? 'info' : 
                        plan.tier === 'Premium' ? 'success' : 'default'
                      }>
                        {plan.tier}
                      </Badge>
                      <Badge variant={plan.isActive ? 'success' : 'danger'}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEditClick(plan)}
                      className="p-2 hover:bg-muted rounded-full transition-colors"
                      title="Edit Plan"
                    >
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(plan._id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors group"
                      title="Delete Plan"
                    >
                      <svg className="w-4 h-4 text-muted-foreground group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 py-2 border-y border-border/50 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-bold text-primary">{plan.currency === 'USD' ? '$' : '₹'}{plan.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">
                      {plan.durationLabel === 'Lifetime' ? plan.durationLabel : `${plan.durationLabel} (${plan.durationDays} days)`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Targets Visible:</span>
                    <span className="font-medium">{plan.maxTargetsVisible === 99 ? 'ALL' : plan.maxTargetsVisible}</span>
                  </div>
                </div>

                <Button 
                  variant={plan.isActive ? 'ghost' : 'primary'}
                  size="sm"
                  className="w-full"
                  onClick={() => handleToggleActive(plan)}
                  isLoading={isUpdating === plan._id}
                >
                  {plan.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowPlanModal(false)} />
            <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold">{editingPlan ? 'Edit' : 'Add New'} Subscription Plan</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Plan Name">
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Basic Monthly"
                      required
                    />
                  </FormField>
                  <FormField label="Tier">
                    <select
                      className="w-full px-3 py-2 rounded-3xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value as SubscriptionPlan['tier'] })}
                      required
                    >
                      <option value="Regular">Regular</option>
                      <option value="Premium">Premium</option>
                      <option value="International">International</option>
                    </select>
                  </FormField>
                  <FormField label="Price">
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      placeholder="0.00"
                      required
                    />
                  </FormField>
                  <FormField label="Currency">
                    <select
                      className="w-full px-3 py-2 rounded-3xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value as SubscriptionPlan['currency'] })}
                      required
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </FormField>
                  <FormField label="Plan Duration">
                    <select
                      className="w-full px-3 py-2 rounded-3xl bg-input border border-border text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                      value={`${formData.durationDays}|${formData.durationLabel}`}
                      onChange={(e) => {
                        const [days, label] = e.target.value.split('|');
                        setFormData({ 
                          ...formData, 
                          durationDays: parseInt(days), 
                          durationLabel: label 
                        });
                      }}
                      required
                    >
                      {DURATION_OPTIONS.map(opt => (
                        <option key={opt.label} value={`${opt.days}|${opt.label}`}>
                          {opt.label === 'Lifetime' ? opt.label : `${opt.label} (${opt.days} days)`}
                        </option>
                      ))}
                      {!DURATION_OPTIONS.some(opt => opt.days === formData.durationDays && opt.label === formData.durationLabel) && (
                        <option value={`${formData.durationDays}|${formData.durationLabel}`}>
                          {formData.durationLabel === 'Lifetime' ? formData.durationLabel : `${formData.durationLabel} (${formData.durationDays} days)`}
                        </option>
                      )}
                    </select>
                  </FormField>
                  <FormField label="Targets Visible">
                    <Input
                      type="number"
                      value={formData.maxTargetsVisible}
                      onChange={(e) => setFormData({ ...formData, maxTargetsVisible: parseInt(e.target.value) })}
                      placeholder="2"
                      required
                    />
                  </FormField>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <Button type="button" variant="ghost" onClick={() => setShowPlanModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={showDeleteConfirm}
          title="Delete Plan"
          message="Are you sure you want to delete this subscription plan? This action cannot be undone."
          confirmLabel="Delete"
          onCancelAction={() => setShowDeleteConfirm(false)}
          onConfirmAction={handleDeleteConfirm}
          isLoading={isUpdating === planToDelete}
        />
      </div>
    </DashboardLayout>
  );
}
