import React, { useEffect, useState } from 'react';
import { 
  Download, 
  Archive, 
  IndianRupee, 
  Droplet, 
  ShoppingBag,
  Users
} from 'lucide-react';
import api from '../services/api';
import { BillPreviewResponse } from '../types';
import { formatCurrency, formatLitres } from '../utils/formatters';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MonthlyBillsPage: React.FC = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedShift, setSelectedShift] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [preview, setPreview] = useState<BillPreviewResponse | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingCustId, setDownloadingCustId] = useState<number | null>(null);

  const loadPreview = async () => {
    try {
      setLoadingPreview(true);
      const res = await api.get<BillPreviewResponse>('/bills/preview', {
        params: {
          month: selectedMonth,
          year: selectedYear,
        },
      });
      setPreview(res.data);
    } catch (err) {
      console.error('Failed to generate bill preview', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [selectedMonth, selectedYear]);

  // Filter bills by shift and search query
  const filteredBills = React.useMemo(() => {
    if (!preview || !preview.bills) return [];
    return preview.bills.filter((b) => {
      // 1. Shift filter
      if (selectedShift !== 'All') {
        const assigned = (b.deliveryPerson || 'Ajay Morning').trim().toLowerCase();
        if (assigned !== selectedShift.trim().toLowerCase()) {
          return false;
        }
      }
      // 2. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = b.customerName.toLowerCase().includes(q);
        const matchesCode = b.customerCode.toLowerCase().includes(q);
        return matchesName || matchesCode;
      }
      return true;
    });
  }, [preview, selectedShift, searchQuery]);

  // Download individual customer PDF bill on-demand
  const handleDownloadSinglePdf = async (customerId: number, customerName: string) => {
    try {
      setDownloadingCustId(customerId);
      const res = await api.get(`/bills/customer/${customerId}/pdf`, {
        params: {
          month: selectedMonth,
          year: selectedYear,
        },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${months[selectedMonth - 1]}_${selectedYear}_${customerName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download customer bill PDF');
    } finally {
      setDownloadingCustId(null);
    }
  };

  // Download all customer PDFs as ZIP on-demand
  const handleDownloadAllZip = async () => {
    if (!preview || preview.bills.length === 0) return;
    try {
      setDownloadingZip(true);
      // Auto-finalize/generate all bills if not already stored
      await api.post('/bills/finalize', {
        month: selectedMonth,
        year: selectedYear,
      });

      const res = await api.get('/bills/zip', {
        params: { month: selectedMonth, year: selectedYear },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${months[selectedMonth - 1]}_${selectedYear}_All_Bills.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download all bills ZIP');
    } finally {
      setDownloadingZip(false);
    }
  };

  const years = [2025, 2026, 2027, 2028];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">Monthly Billing & Invoicing</h1>
          <p className="text-sm text-stone-500 mt-1">
            View accurate monthly milk & product charges and download individual or batch PDF invoices on demand.
          </p>
        </div>

        {preview && preview.bills.length > 0 && (
          <button
            onClick={handleDownloadAllZip}
            disabled={downloadingZip}
            className="inline-flex items-center gap-2 bg-stone-900 hover:bg-black text-white font-bold px-5 py-3 rounded-xl shadow-xs transition min-h-[48px] cursor-pointer disabled:opacity-50"
          >
            <Archive className="w-5 h-5 text-red-400" />
            <span>{downloadingZip ? 'Packaging All Invoices...' : 'Download All Bills (ZIP)'}</span>
          </button>
        )}
      </div>

      {/* Month & Year Selection Bar */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial">
            <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
              Billing Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full sm:w-44 px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-bold text-sm min-h-[44px]"
            >
              {months.map((m, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 sm:flex-initial">
            <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1">
              Billing Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full sm:w-32 px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-bold text-sm min-h-[44px]"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Active Customers</span>
          <p className="text-3xl font-black text-stone-900 mt-2">
            {loadingPreview ? '-' : preview?.totalBills ?? 0}
          </p>
          <p className="text-xs text-stone-500 mt-1">Consumers with activity</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Milk Litres</span>
          <p className="text-3xl font-black text-stone-900 mt-2">
            {loadingPreview ? '-' : formatLitres(preview?.aggregateMilkLitres ?? 0)}
          </p>
          <p className="text-xs text-stone-500 mt-1">Combined monthly intake</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Milk Amount</span>
          <p className="text-3xl font-black text-stone-900 mt-2">
            {loadingPreview ? '-' : formatCurrency(preview?.aggregateMilkAmount ?? 0)}
          </p>
          <p className="text-xs text-stone-500 mt-1">Calculated at daily saved rates</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-red-200 bg-red-50/20 shadow-2xs">
          <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Grand Total Billing</span>
          <p className="text-3xl font-black text-red-700 mt-2">
            {loadingPreview ? '-' : formatCurrency(preview?.aggregateGrandTotal ?? 0)}
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Incl. {formatCurrency(preview?.aggregateProductAmount ?? 0)} products
          </p>
        </div>
      </div>

      {/* Detailed Customer Bills Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        {/* Shift / Route Filter Bar */}
        <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-stone-50/50">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-1">Shift / Route:</span>
            {[
              { label: 'All (All Shifts)', value: 'All' },
              { label: '1. Ajay Morning', value: 'Ajay Morning' },
              { label: '2. Rahul Evening', value: 'Rahul Evening' },
              { label: '3. Ajay Evening', value: 'Ajay Evening' },
              { label: '4. Rahul Morning', value: 'Rahul Morning' },
            ].map((shift) => (
              <button
                key={shift.value}
                onClick={() => setSelectedShift(shift.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedShift === shift.value
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {shift.label}
              </button>
            ))}
          </div>

          <div className="w-full md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter bills by customer..."
              className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Customer Bills for {months[selectedMonth - 1]} {selectedYear}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Individual PDF bills are generated on-demand with live consumption data.
            </p>
          </div>
          <span className="text-xs text-stone-400 font-semibold">{filteredBills.length} customer bills</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-xs">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4 text-right">Morning Litres</th>
                <th className="py-3 px-4 text-right">Evening Litres</th>
                <th className="py-3 px-4 text-right">Total Litres</th>
                <th className="py-3 px-4 text-right">Milk Amount</th>
                <th className="py-3 px-4 text-right">Product Total</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Download PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loadingPreview ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-stone-400">
                    Calculating monthly consumption records...
                  </td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-stone-400">
                    No consumption records found for {months[selectedMonth - 1]} {selectedYear} in this section.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.customerId} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-stone-500">
                      {b.customerCode}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900">
                      {b.customerName}
                      {b.phone && <span className="block text-[11px] font-normal text-stone-400">{b.phone}</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        (b.deliveryPerson || '').includes('Rahul')
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {b.deliveryPerson || 'Ajay Morning'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-stone-700">
                      {formatLitres(b.morningLitres)}
                    </td>
                    <td className="py-3 px-4 text-right text-stone-700">
                      {formatLitres(b.eveningLitres)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-stone-800">
                      {formatLitres(b.totalLitres)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-stone-700">
                      {formatCurrency(b.milkTotalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-stone-700">
                      {b.productTotalAmount > 0 ? formatCurrency(b.productTotalAmount) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-700 text-base">
                      {formatCurrency(b.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDownloadSinglePdf(b.customerId, b.customerName)}
                        disabled={downloadingCustId === b.customerId}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs cursor-pointer border border-red-200 transition min-h-[36px]"
                        title="Download this customer's PDF bill"
                      >
                        <Download className="w-3.5 h-3.5 text-red-600" />
                        <span>{downloadingCustId === b.customerId ? 'Exporting...' : 'PDF Bill'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
