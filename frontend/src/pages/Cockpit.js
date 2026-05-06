import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Briefcase, AlertCircle, CheckCircle,
  RefreshCcw, Info
} from 'lucide-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
};

const Cockpit = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchCockpitData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cockpit', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setLastUpdated(new Date());
      } else {
        toast.error("Failed to load cockpit data");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCockpitData();
    const interval = setInterval(fetchCockpitData, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <div className="p-6 flex justify-center items-center h-full">Loading cockpit...</div>;
  }

  if (!data) return null;

  const { metrics, alerts, topDeals, pendingActions, recentActivity, attendance } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good morning, {user?.first_name || 'Admin'}. Here's your business.
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0 text-sm text-muted-foreground">
          <span>Last updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <Button variant="outline" size="sm" onClick={fetchCockpitData} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Row 1: Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue Today</p>
                <h3 className="text-2xl font-bold mt-2">{formatCurrency(metrics.revenue_today)}</h3>
              </div>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`flex items-center ${metrics.revenue_trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.revenue_trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(metrics.revenue_trend)}%
              </span>
              <span className="text-muted-foreground ml-2">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue MTD</p>
                <h3 className="text-2xl font-bold mt-2">{formatCurrency(metrics.revenue_mtd)}</h3>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className={`flex items-center ${metrics.mtd_trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.mtd_trend >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {Math.abs(metrics.mtd_trend)}%
              </span>
              <span className="text-muted-foreground ml-2">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cash in Bank</p>
                <h3 className="text-2xl font-bold mt-2">{formatCurrency(metrics.cash_balance)}</h3>
              </div>
              <Briefcase className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Across {metrics.bank_accounts_count || 1} accounts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                <h3 className="text-2xl font-bold mt-2">{formatCurrency(metrics.pipeline_value)}</h3>
              </div>
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {metrics.open_deals_count || 0} open deals
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Alert Strip */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.slice(0, 3).map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-4 rounded-lg border-l-4 bg-card shadow-sm
                ${alert.severity === 'critical' ? 'border-red-500' : alert.severity === 'warning' ? 'border-yellow-500' : 'border-blue-500'}
              `}
            >
              <div className="flex items-center gap-3">
                {alert.severity === 'critical' ? <AlertCircle className="w-5 h-5 text-red-500" /> :
                 alert.severity === 'warning' ? <AlertCircle className="w-5 h-5 text-yellow-500" /> :
                 <Info className="w-5 h-5 text-blue-500" />}
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
              {alert.action_label && (
                <Button variant="outline" size="sm">{alert.action_label}</Button>
              )}
            </div>
          ))}
          {alerts.length > 3 && (
            <p className="text-sm text-muted-foreground pl-2 cursor-pointer hover:underline">
              +{alerts.length - 3} more alerts
            </p>
          )}
        </div>
      )}

      {/* Row 3: 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Attendance Snapshot (40%) */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base">Attendance Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Present today</span>
                <span className="font-semibold">{attendance?.present || 0} / {attendance?.total || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-yellow-500" /> On leave</span>
                <span className="font-semibold">{attendance?.on_leave || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-500" /> Not checked in</span>
                <span className="font-semibold">{attendance?.absent || 0}</span>
              </div>
              {attendance?.absent > 0 && attendance?.absent_names && (
                <p className="text-xs text-muted-foreground ml-6">
                  {attendance.absent_names.join(', ')}
                </p>
              )}
              <div className="pt-4 flex gap-2">
                <Button variant="outline" size="sm" className="w-full">Mark all present</Button>
                <Button variant="ghost" size="sm" className="w-full">View details</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions (35%) */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Pending Your Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center pb-2 border-b">
                <span>Leave requests</span>
                <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded-full">{pendingActions?.leaves || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span>Expense claims</span>
                <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded-full">{pendingActions?.expenses || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span>Purchase orders</span>
                <span className="font-semibold bg-gray-100 px-2 py-0.5 rounded-full">{pendingActions?.purchase_orders || 0}</span>
              </div>
              <div className="pt-2">
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Approve All Eligible
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Deals (25%) */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Top Deals Closing Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDeals && topDeals.length > 0 ? topDeals.map((deal, idx) => (
                <div key={idx} className="flex flex-col text-sm border-b pb-2 last:border-0">
                  <span className="font-medium truncate">{deal.name}</span>
                  <div className="flex justify-between text-muted-foreground text-xs mt-1">
                    <span>{formatCurrency(deal.value)}</span>
                    <span>Closes in {deal.days_to_close}d</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No deals closing soon.</p>
              )}
              <Button variant="ghost" size="sm" className="w-full text-xs mt-2">View Pipeline</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity && recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm">
                <div className="mt-0.5">{activity.icon || <CheckCircle className="w-4 h-4 text-green-500" />}</div>
                <div className="flex-1">
                  <p>{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Cockpit;
