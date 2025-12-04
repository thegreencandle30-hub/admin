'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/templates';
import { Button, Badge, Skeleton } from '@/components/atoms';
import { getDashboardStats, getRecentPayments, getSubscriptionMetrics } from '@/services/dashboard-service';
import type { DashboardStats, SubscriptionMetrics, Payment } from '@/services/dashboard-service';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [subscriptionMetrics, setSubscriptionMetrics] = useState<SubscriptionMetrics | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for chart
  const chartData = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 },
    { name: 'May', revenue: 1890 },
    { name: 'Jun', revenue: 2390 },
    { name: 'Jul', revenue: 3490 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const [statsResponse, metricsResponse, paymentsResponse] = await Promise.all([
        getDashboardStats(),
        getSubscriptionMetrics(),
        getRecentPayments(5),
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (metricsResponse.success && metricsResponse.data) {
        setSubscriptionMetrics(metricsResponse.data);
      }

      if (paymentsResponse.success && paymentsResponse.data) {
        setRecentPayments(paymentsResponse.data.payments);
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="animate-slide-up">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Welcome to The Green Candle Admin</p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-3xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Skeleton className="h-64 w-full rounded-3xl" />
              <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
            <Skeleton className="h-64 w-full rounded-3xl" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <StatCard
                title="Total Users"
                value={stats?.totalUsers?.toString() || '0'}
                subtext={`${stats?.activeUsers || 0} active`}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                }
                color="blue"
              />
              <StatCard
                title="Active Subscriptions"
                value={stats?.activeSubscriptions?.toString() || '0'}
                subtext={subscriptionMetrics ? `${subscriptionMetrics.activeByPlan.daily} daily, ${subscriptionMetrics.activeByPlan.weekly} weekly` : ''}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="green"
              />
              <StatCard
                title="Today's Calls"
                value={stats?.todayCalls?.toString() || '0'}
                subtext={`${stats?.totalCalls || 0} total calls`}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
                color="purple"
              />
              <StatCard
                title="Revenue (This Month)"
                value={formatPrice(stats?.monthlyRevenue || 0)}
                subtext={`${stats?.callAccuracy || 0}% call accuracy`}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="yellow"
              />
            </div>

            {/* Chart Section */}
            <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-lg border border-border animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">Revenue Trend</h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82f163ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6df163ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#282a27ff" vertical={false} />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '0.5rem' }}
                      itemStyle={{ color: '#fafafa' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#68f163ff" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {/* Quick Actions */}
              <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-lg border border-border">
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Link href="/calls/new">
                    <Button variant="secondary" className="w-full justify-start h-auto py-3 hover:bg-primary hover:text-primary-foreground transition-colors group active:scale-95">
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Call
                    </Button>
                  </Link>
                  <Link href="/calls">
                    <Button variant="secondary" className="w-full justify-start h-auto py-3 hover:bg-primary hover:text-primary-foreground transition-colors group active:scale-95">
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      View Calls
                    </Button>
                  </Link>
                  <Link href="/users">
                    <Button variant="secondary" className="w-full justify-start h-auto py-3 hover:bg-primary hover:text-primary-foreground transition-colors group active:scale-95">
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Manage Users
                    </Button>
                  </Link>
                  <Link href="/calls">
                    <Button variant="secondary" className="w-full justify-start h-auto py-3 hover:bg-primary hover:text-primary-foreground transition-colors group active:scale-95">
                      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Call Stats
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Subscription Alerts */}
              <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-lg border border-border">
                <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                  Subscription Alerts
                </h2>
                {subscriptionMetrics ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-warning/10 rounded-3xl border border-warning/20">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-warning-foreground font-medium">Expiring Today</span>
                      </div>
                      <Badge variant="warning">{subscriptionMetrics.expiringToday}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-3xl border border-destructive/20">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm text-destructive font-medium">Expired Recently</span>
                      </div>
                      <Badge variant="danger">{subscriptionMetrics.expiredRecently}</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No alerts</p>
                )}
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-card rounded-3xl shadow-lg border border-border overflow-hidden animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">
                  Recent Payments
                </h2>
                <Link href="/users">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
              
              {recentPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <svg className="w-10 h-10 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <p>No recent payments</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          User
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
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentPayments.map((payment) => (
                        <tr key={payment._id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {payment.user?.mobile || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="info">
                              {payment.plan.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {formatDate(payment.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Revenue Chart */}
            <div className="bg-card rounded-3xl shadow-lg border border-border p-4 sm:p-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">
                Revenue Overview
              </h2>
              <div className="h-64">
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor='#e7ebe5ff' stopOpacity={1}/>
                        <stop offset="100%" stopColor='#9df881ff' stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="rgb(156 163 175)" />
                    <YAxis stroke="rgb(156 163 175)" />
                    <CartesianGrid strokeDasharray="3 3" className="text-muted-foreground" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgb(17 24 39)', borderColor: 'rgb(31 41 55)' }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#38ca3fff"
                      strokeWidth={2}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

function StatCard({ title, value, subtext, icon, color }: StatCardProps) {
  const colors = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-emerald-500/10 text-emerald-500',
    purple: 'bg-purple-500/10 text-purple-500',
    yellow: 'bg-amber-500/10 text-amber-500',
  };

  return (
    <div className="bg-card rounded-3xl p-4 sm:p-6 shadow-lg border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 group">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`p-3 rounded-3xl ${colors[color]} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground truncate font-medium">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{value}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  );
}
