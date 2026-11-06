import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Droplet, 
  Sunrise, 
  Sunset, 
  TrendingUp, 
  IndianRupee, 
  PlusCircle, 
  FileText, 
  Clock, 
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { DashboardStats } from '../types';
import { formatCurrency, formatLitres } from '../utils/formatters';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get<DashboardStats>('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">Dairy Operations Overview</h1>
          <p className="text-sm sm:text-base text-stone-500 mt-1">
            Real-time dairy stats, daily milk intake & billing projections.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/milk-entry')}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl shadow-xs transition duration-150 min-h-[48px]"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add Milk Entry</span>
          </button>
        </div>
      </div>

      {/* Primary Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Active Customers */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Active Customers</span>
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-extrabold text-stone-900">
              {loading ? '-' : stats?.totalActiveCustomers ?? 0}
            </span>
            <p className="text-xs text-stone-500 mt-1">Total registered active consumers</p>
          </div>
        </div>

        {/* Today's Total Milk Quantity */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Today's Milk Intake</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Droplet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-stone-900">
                {loading ? '-' : formatLitres(stats?.todayTotalLitres ?? 0)}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
              <span className="flex items-center gap-1">
                <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                M: {formatLitres(stats?.todayMorningLitres ?? 0)}
              </span>
              <span className="flex items-center gap-1">
                <Sunset className="w-3.5 h-3.5 text-indigo-500" />
                E: {formatLitres(stats?.todayEveningLitres ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Current Milk Rate */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Current Milk Rate</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-stone-900">
                {loading ? '-' : formatCurrency(stats?.currentMilkRate ?? 0)}
              </span>
              <span className="text-xs font-semibold text-stone-500">/ Litre</span>
            </div>
            <p className="text-xs text-stone-500 mt-1">Standard rate for all active accounts</p>
          </div>
        </div>

        {/* Current Month Estimated Billing */}
        <div className="bg-white p-6 rounded-2xl border border-red-200/80 bg-linear-to-br from-white to-red-50/30 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Month Billing Projection</span>
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-700">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl sm:text-4xl font-extrabold text-red-700">
              {loading ? '-' : formatCurrency(stats?.currentMonthEstimatedBilling ?? 0)}
            </span>
            <div className="flex items-center justify-between mt-2 text-xs text-stone-500">
              <span>Milk: {formatCurrency(stats?.currentMonthMilkSales ?? 0)}</span>
              <span>Prod: {formatCurrency(stats?.currentMonthProductSales ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div>
        <h2 className="text-lg font-bold text-stone-900 mb-4">Quick Dairy Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/milk-entry')}
            className="flex flex-col items-center justify-center p-5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 transition text-center group min-h-[90px]"
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-2 group-hover:bg-red-600 group-hover:text-white transition">
              <Droplet className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-stone-800">Add Milk Entry</span>
          </button>

          <button
            onClick={() => navigate('/product-sales')}
            className="flex flex-col items-center justify-center p-5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 transition text-center group min-h-[90px]"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:bg-amber-600 group-hover:text-white transition">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-stone-800">Add Product Sale</span>
          </button>

          <button
            onClick={() => navigate('/customers')}
            className="flex flex-col items-center justify-center p-5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 transition text-center group min-h-[90px]"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-stone-800">Manage Customers</span>
          </button>

          <button
            onClick={() => navigate('/rates')}
            className="flex flex-col items-center justify-center p-5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 transition text-center group min-h-[90px]"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:bg-purple-600 group-hover:text-white transition">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-stone-800">Manage Rates</span>
          </button>

          <button
            onClick={() => navigate('/bills')}
            className="flex flex-col items-center justify-center p-5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 transition text-center group min-h-[90px] col-span-2 sm:col-span-1"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-stone-800">Generate Bills</span>
          </button>
        </div>
      </div>

      {/* Recent Activity Log Section */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-stone-400" />
            <h2 className="text-base font-bold text-stone-900">Recent Dairy Activity</h2>
          </div>
          <button
            onClick={() => navigate('/customers')}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {stats.recentActivity.map((act, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    act.type === 'MILK_ENTRY' ? 'bg-blue-500' : 'bg-amber-500'
                  }`} />
                  <p className="text-sm font-medium text-stone-800">{act.description}</p>
                </div>
                <span className="text-xs text-stone-400 whitespace-nowrap">{act.timeAgo}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-stone-400">
            No recent activity recorded yet. Start by entering today's morning or evening milk.
          </div>
        )}
      </div>
    </div>
  );
};

