'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/templates';
import { Button, Badge } from '@/components/atoms';
import { getCalls, deleteCall, updateTargetStatus } from '@/services/call-service';
import { ConfirmDialog, TargetsModal, useToast } from '@/components/molecules';
import type { Call } from '@/services/call-service';
import type { Pagination, ClientResponse, PaginatedResponse } from '@/shared/types';

const COMMODITY_OPTIONS = [
  { value: '', label: 'All Commodities' },
  { value: 'Gold', label: 'Gold' },
  { value: 'Silver', label: 'Silver' },
  { value: 'Copper', label: 'Copper' },
  { value: 'Crude', label: 'Crude' },
  { value: 'CMX Gold', label: 'CMX Gold' },
  { value: 'CMX Silver', label: 'CMX Silver' },
  { value: 'Custom', label: 'Other/Manual' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'partial_hit', label: 'Partial Hit' },
  { value: 'all_hit', label: 'All Targets Hit' },
  { value: 'hit_stoploss', label: 'Stoploss Hit' },
  { value: 'expired', label: 'Expired' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
];

const getStatusBadgeVariant = (status: string): 'success' | 'danger' | 'warning' | 'default' | 'info' => {
  switch (status) {
    case 'active':
      return 'warning';
    case 'partial_hit':
      return 'info';
    case 'all_hit':
      return 'success';
    case 'hit_stoploss':
      return 'danger';
    default:
      return 'default';
  }
};

const getCommodityColor = (commodity: string): string => {
  switch (commodity) {
    case 'Gold':
    case 'CMX Gold':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'Silver':
    case 'CMX Silver':
      return 'text-gray-500 dark:text-gray-400';
    case 'Crude':
      return 'text-slate-800 dark:text-slate-200';
    case 'Copper':
      return 'text-orange-600 dark:text-orange-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

function CallsContent() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [targetsModalOpen, setTargetsModalOpen] = useState(false);
  const [selectedCallForTargets, setSelectedCallForTargets] = useState<Call | null>(null);
  const { showToast } = useToast();

  // Filters
  const [commodity, setCommodity] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initial data fetch using useEffect
  useEffect(() => {
    const fetchInitial = async () => {
      setIsLoading(true);
      const response = await getCalls({ page: 1, limit: 10 });
      if (response.success && response.data) {
        setCalls(response.data.data || []);
        setPagination(response.data.pagination || null);
      }
      setIsLoading(false);
    };
    fetchInitial();
  }, []);

  const fetchCalls = async (page: number) => {
    setIsLoading(true);
    const response: ClientResponse<PaginatedResponse<Call>> = await getCalls({
      page,
      limit: 10,
      commodity: commodity || undefined,
      status: status || undefined,
      type: type || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortBy: 'date',
      sortOrder: 'desc',
    });

    if (response.success && response.data) {
      setCalls(response.data.data || []);
      setPagination(response.data.pagination || null);
    }
    setIsLoading(false);
  };

  const handleFilter = async () => {
    setCurrentPage(1);
    await fetchCalls(1);
  };

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);
    await fetchCalls(newPage);
  };

  const handleDeleteClick = (call: Call) => {
    setSelectedCall(call);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCall) return;
    const callId = selectedCall.id || selectedCall._id;
    if (!callId) return;

    setIsDeleting(callId);
    const response = await deleteCall(callId);

    if (response.success) {
      setCalls(calls.filter(c => (c.id || c._id) !== callId));
      showToast({ message: 'Call deleted successfully', variant: 'success' });
    } else {
      showToast({ message: response.error || 'Failed to delete call', variant: 'error' });
    }
    setIsDeleting(null);
    setConfirmOpen(false);
    setSelectedCall(null);
  };

  const handleViewTargets = (call: Call) => {
    setSelectedCallForTargets(call);
    setTargetsModalOpen(true);
  };

  const handleUpdateTargetStatus = async (targetId: string, isAcheived: boolean) => {
    if (!selectedCallForTargets) return;
    const callId = selectedCallForTargets.id || selectedCallForTargets._id;
    if (!callId) return;

    const response = await updateTargetStatus(callId, targetId, isAcheived);
    if (response.success && response.data) {
      // Update local state
      const updatedCall = response.data;
      setCalls(calls.map(c => (c.id || c._id) === callId ? updatedCall : c));
      setSelectedCallForTargets(updatedCall);
      showToast({ message: 'Target status updated', variant: 'success' });
    } else {
      showToast({ message: response.error || 'Update failed', variant: 'error' });
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-foreground">Calls</h1>
          <p className="text-muted-foreground mt-1">
            Manage trading calls for commodities
          </p>
        </div>
        <Link href="/calls/new" className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Call
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-3xl p-4 shadow-sm border border-border animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex flex-wrap gap-4">
          <select
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            className="px-3 py-2 border border-input rounded-3xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {COMMODITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-background text-foreground">
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-input rounded-3xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-background text-foreground">
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 border border-input rounded-3xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-background text-foreground">
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-input rounded-3xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-input rounded-3xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button onClick={handleFilter} isLoading={isLoading}>
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Calls Table */}
      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p>No calls found</p>
            <Link href="/calls/new" className="mt-4">
              <Button variant="secondary" size="sm">Create your first call</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Commodity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Entry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Stoploss
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {calls.map((call, index) => {
                  const callId = call.id || call._id;
                  return (
                    <tr 
                      key={callId} 
                      className={`transition-colors hover:bg-primary/5 ${index % 2 === 0 ? 'bg-transparent' : 'bg-muted/10'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {formatDate(call.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold uppercase ${getCommodityColor(call.commodity)}`}>
                          {call.commodity === 'Custom' ? call.customCommodity : call.commodity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={call.type === 'buy' ? 'success' : 'danger'}>
                          {call.type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {formatPrice(call.entryPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="text-success hover:text-success/90 bg-success/5 border-success/20 font-medium rounded-xl px-4"
                          onClick={() => handleViewTargets(call)}
                        >
                          View All
                        </Button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-destructive">
                        {formatPrice(call.stopLoss)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusBadgeVariant(call.status)}>
                          {call.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/calls/${callId}/edit`}>
                            <Button variant="secondary" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="danger"
                            className="bg-red-800 hover:bg-red-600"
                            size="sm"
                            onClick={() => handleDeleteClick(call)}
                            isLoading={isDeleting === callId}
                            disabled={isDeleting !== null}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <ConfirmDialog
          open={confirmOpen}
          title="Delete Call"
          message={`Are you sure you want to delete this ${selectedCall?.commodity} call?`}
          onCancelAction={() => {
            setConfirmOpen(false);
            setSelectedCall(null);
          }}
          onConfirmAction={handleDeleteConfirm}
          isLoading={!!isDeleting}
        />

        <TargetsModal
          open={targetsModalOpen}
          call={selectedCallForTargets}
          onClose={() => {
            setTargetsModalOpen(false);
            setSelectedCallForTargets(null);
          }}
          onUpdateTarget={handleUpdateTargetStatus}
        />

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {calls?.length || 0} of {pagination.total} calls
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
    </div>
  );
}

export default function CallsPage() {
  return (
    <DashboardLayout>
      <CallsContent />
    </DashboardLayout>
  );
}
