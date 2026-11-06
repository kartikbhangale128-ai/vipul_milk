import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ArrowLeft,
  Sun,
  Moon,
  Layers,
  GripVertical,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { Customer, MilkEntry, SingleMilkEntryItem } from '../types';
import { formatDate, getTodayDateString } from '../utils/formatters';

export const MilkEntryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Shift: 'Ajay Morning' | 'Rahul Evening' | 'Ajay Evening' | 'Rahul Morning' | 'All'
  const routeShift = searchParams.get('shift') || 'All';
  // Both AM & PM are always active for all shifts so any customer can record morning or evening milk
  const routeSession = 'both';
  const showMorning = true;
  const showEvening = true;

  const today = getTodayDateString();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [activeCustomers, setActiveCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Grid Values: key = `${customerId}_${date}_${session}` ('morning' or 'evening') -> string value
  const [gridValues, setGridValues] = useState<Record<string, string>>({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [draggedCustId, setDraggedCustId] = useState<number | null>(null);

  // Auto-save debounce timer ref and queue ref
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const pendingSaveRef = useRef<boolean>(false);
  const gridValuesRef = useRef(gridValues);
  gridValuesRef.current = gridValues;
  const filteredCustomersRef = useRef<Customer[]>([]);

  // Calculate distinct dates in selected range
  const dateRangeList = useMemo(() => {
    if (!startDate || !endDate) return [];
    const list: string[] = [];
    let current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      list.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }
    return list;
  }, [startDate, endDate]);

  const loadActiveCustomers = async () => {
    try {
      const res = await api.get<Customer[]>('/customers/active-list');
      setActiveCustomers(res.data);
    } catch (err) {
      console.error('Failed to load active customers', err);
    }
  };

  const loadGridEntries = async () => {
    if (!startDate || !endDate) return;
    try {
      setLoading(true);
      setSaveSuccess(false);
      const res = await api.get<MilkEntry[]>('/milk-entries/grid', {
        params: {
          startDate,
          endDate,
        },
      });

      const newValues: Record<string, string> = {};
      res.data.forEach((entry) => {
        const mKey = `${entry.customerId}_${entry.entryDate}_morning`;
        const eKey = `${entry.customerId}_${entry.entryDate}_evening`;
        newValues[mKey] = entry.morningLitres > 0 ? String(entry.morningLitres) : '';
        newValues[eKey] = entry.eveningLitres > 0 ? String(entry.eveningLitres) : '';
      });

      // For any date/customer cell that has no recorded entry yet, pre-fill with customer's default quantity
      activeCustomers.forEach((cust) => {
        dateRangeList.forEach((dStr) => {
          const mKey = `${cust.id}_${dStr}_morning`;
          const eKey = `${cust.id}_${dStr}_evening`;
          if (newValues[mKey] === undefined) {
            newValues[mKey] = cust.defaultMorningLitres && cust.defaultMorningLitres > 0 
              ? String(cust.defaultMorningLitres) 
              : '';
          }
          if (newValues[eKey] === undefined) {
            newValues[eKey] = cust.defaultEveningLitres && cust.defaultEveningLitres > 0 
              ? String(cust.defaultEveningLitres) 
              : '';
          }
        });
      });

      setGridValues(newValues);
      setUnsavedChanges(false);
    } catch (err) {
      console.error('Failed to load milk entries', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActiveCustomers();
  }, []);

  useEffect(() => {
    loadGridEntries();
  }, [startDate, endDate]);

  // Filter customers based on routeShift & search query
  const filteredCustomers = useMemo(() => {
    return activeCustomers.filter((c) => {
      // 1. Shift filter: Ajay Morning, Rahul Evening, Ajay Evening, Rahul Morning, or All
      if (routeShift !== 'All') {
        const assigned = (c.deliveryPerson || 'Ajay Morning').trim().toLowerCase();
        if (assigned !== routeShift.trim().toLowerCase()) {
          return false;
        }
      }

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
      );
    });
  }, [activeCustomers, routeShift, searchQuery]);

  filteredCustomersRef.current = filteredCustomers;

  const performSave = useCallback(async (currentGrid: Record<string, string>, currentCustomers: Customer[]) => {
    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    try {
      isSavingRef.current = true;
      setSaving(true);
      const itemsToSave: SingleMilkEntryItem[] = [];

      currentCustomers.forEach((cust) => {
        dateRangeList.forEach((date) => {
          const mKey = `${cust.id}_${date}_morning`;
          const eKey = `${cust.id}_${date}_evening`;
          const mVal = parseFloat(currentGrid[mKey] || '0');
          const eVal = parseFloat(currentGrid[eKey] || '0');

          if (currentGrid[mKey] !== undefined || currentGrid[eKey] !== undefined) {
            itemsToSave.push({
              customerId: cust.id,
              date,
              morningLitres: isNaN(mVal) ? 0 : mVal,
              eveningLitres: isNaN(eVal) ? 0 : eVal,
            });
          }
        });
      });

      if (itemsToSave.length > 0) {
        await api.post('/milk-entries/bulk', { entries: itemsToSave });
        setUnsavedChanges(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error('Failed to save milk entries', err);
    } finally {
      isSavingRef.current = false;
      setSaving(false);
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        performSave(gridValuesRef.current, filteredCustomersRef.current);
      }
    }
  }, [dateRangeList]);

  const triggerAutoSave = useCallback((newGrid: Record<string, string>) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      performSave(newGrid, filteredCustomersRef.current);
    }, 1200); // Debounce auto-save by 1.2 seconds of typing pause
  }, [performSave]);

  const handleCellChange = (customerId: number, date: string, session: 'morning' | 'evening', value: string) => {
    // Only allow numbers and decimal
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    const key = `${customerId}_${date}_${session}`;
    setGridValues((prev) => {
      const updated = {
        ...prev,
        [key]: value,
      };
      triggerAutoSave(updated);
      return updated;
    });
    setUnsavedChanges(true);
    setSaveSuccess(false);
  };

  const handleCellBlur = (customerId: number, date: string) => {
    // Immediate save on blur if timer is pending
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    performSave(gridValuesRef.current, filteredCustomersRef.current);
  };

  // Keyboard navigation for spreadsheet cell movement: Arrow keys & Enter
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    dateIndex: number,
    session: 'morning' | 'evening',
    totalRows: number,
    totalDates: number
  ) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const targetId = session === 'evening' && showMorning
        ? `cell-${rowIndex}-${dateIndex}-morning`
        : `cell-${Math.max(0, rowIndex - 1)}-${dateIndex}-${showEvening ? 'evening' : 'morning'}`;
      const el = document.getElementById(targetId) as HTMLInputElement | null;
      if (el) { el.focus(); el.select(); }
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const targetId = session === 'morning' && showEvening
        ? `cell-${rowIndex}-${dateIndex}-evening`
        : `cell-${Math.min(totalRows - 1, rowIndex + 1)}-${dateIndex}-${showMorning ? 'morning' : 'evening'}`;
      const el = document.getElementById(targetId) as HTMLInputElement | null;
      if (el) { el.focus(); el.select(); }
    } else if (e.key === 'ArrowLeft') {
      const input = e.currentTarget;
      if (input.selectionStart === 0 && input.selectionEnd === 0) {
        e.preventDefault();
        const prevDateIdx = Math.max(0, dateIndex - 1);
        const targetId = `cell-${rowIndex}-${prevDateIdx}-${session}`;
        const el = document.getElementById(targetId) as HTMLInputElement | null;
        if (el) { el.focus(); el.select(); }
      }
    } else if (e.key === 'ArrowRight') {
      const input = e.currentTarget;
      if (input.selectionStart === input.value.length) {
        e.preventDefault();
        const nextDateIdx = Math.min(totalDates - 1, dateIndex + 1);
        const targetId = `cell-${rowIndex}-${nextDateIdx}-${session}`;
        const el = document.getElementById(targetId) as HTMLInputElement | null;
        if (el) { el.focus(); el.select(); }
      }
    }
  };

  const handleBulkSave = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    await performSave(gridValuesRef.current, filteredCustomersRef.current);
  };

  const handleCustomerDrop = async (targetCustId: number) => {
    if (!draggedCustId || draggedCustId === targetCustId) return;

    // Get current filtered list
    const currentList = [...filteredCustomers];
    const dragIdx = currentList.findIndex((c) => c.id === draggedCustId);
    const targetIdx = currentList.findIndex((c) => c.id === targetCustId);

    if (dragIdx === -1 || targetIdx === -1) return;

    const [moved] = currentList.splice(dragIdx, 1);
    currentList.splice(targetIdx, 0, moved);

    // Update activeCustomers state reflecting new order
    const remaining = activeCustomers.filter((c) => !currentList.some((fc) => fc.id === c.id));
    const newActiveList = [...currentList, ...remaining];
    setActiveCustomers(newActiveList);
    setDraggedCustId(null);

    // Persist new order to backend
    try {
      const orderIds = newActiveList.map((c) => c.id);
      await api.put('/customers/reorder', orderIds);
    } catch (err) {
      console.error('Failed to save customer order', err);
    }
  };

  const colsPerDate = (showMorning ? 1 : 0) + (showEvening ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Top Shift Selection Mode Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <button
              onClick={() => navigate('/select-mode')}
              className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change Shift
            </button>
            <span className="text-xs text-stone-400">&bull;</span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
              {routeShift === 'All' ? 'All Customers (All Shifts)' : `${routeShift}`}
              {' – '}
              {routeSession === 'both' ? 'Both AM & PM' : routeSession === 'morning' ? 'Morning Only' : 'Evening Only'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Daily Milk Entry
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Entering milk intake for <strong>{filteredCustomers.length}</strong> active customers. Use <strong>↑ ↓ ← →</strong> arrows or <strong>Enter</strong> to navigate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saving && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Auto-saving...
            </span>
          )}

          {!saving && unsavedChanges && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              Unsaved Changes
            </span>
          )}

          {!saving && saveSuccess && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Saved!
            </span>
          )}

          <button
            onClick={handleBulkSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-xs transition duration-150 min-h-[48px] cursor-pointer disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Milk Entries'}</span>
          </button>
        </div>
      </div>

      {/* Date Range & Route Switching Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        {/* Quick Shift Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-stone-100">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-2">Shift:</span>
          
          <button
            onClick={() => setSearchParams({ shift: 'Ajay Morning', session: 'both' })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
              routeShift === 'Ajay Morning'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            1. Ajay Morning (AM &amp; PM)
          </button>

          <button
            onClick={() => setSearchParams({ shift: 'Rahul Evening', session: 'both' })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
              routeShift === 'Rahul Evening'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            2. Rahul Evening (AM &amp; PM)
          </button>

          <button
            onClick={() => setSearchParams({ shift: 'Ajay Evening', session: 'both' })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
              routeShift === 'Ajay Evening'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            3. Ajay Evening (AM &amp; PM)
          </button>

          <button
            onClick={() => setSearchParams({ shift: 'Rahul Morning', session: 'both' })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
              routeShift === 'Rahul Morning'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            4. Rahul Morning (AM &amp; PM)
          </button>

          <button
            onClick={() => setSearchParams({ shift: 'All', session: 'both' })}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
              routeShift === 'All'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            5. All (All Shifts)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 text-sm font-semibold min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 text-sm font-semibold min-h-[44px]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Filter Customers In Grid
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by customer name or code..."
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 text-sm min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Quick Date Range Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs text-stone-500">
          <span className="font-semibold">Quick Ranges:</span>
          <button
            type="button"
            onClick={() => {
              setStartDate(today);
              setEndDate(today);
            }}
            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
          >
            Today ({formatDate(today)})
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              const y = d.getFullYear();
              const m = d.getMonth() + 1;
              const padM = String(m).padStart(2, '0');
              setStartDate(`${y}-${padM}-01`);
              setEndDate(`${y}-${padM}-10`);
            }}
            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
          >
            Day 1 – 10
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              const y = d.getFullYear();
              const m = d.getMonth() + 1;
              const padM = String(m).padStart(2, '0');
              setStartDate(`${y}-${padM}-11`);
              setEndDate(`${y}-${padM}-20`);
            }}
            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
          >
            Day 11 – 20
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              const y = d.getFullYear();
              const m = d.getMonth() + 1;
              const padM = String(m).padStart(2, '0');
              const lastDay = new Date(y, m, 0).getDate();
              setStartDate(`${y}-${padM}-21`);
              setEndDate(`${y}-${padM}-${lastDay}`);
            }}
            className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold cursor-pointer"
          >
            Day 21 – End of Month
          </button>
        </div>
      </div>

      {/* Spreadsheet Editable Grid */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[700px] relative">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 z-20 bg-stone-100 border-b border-stone-200 shadow-2xs">
              <tr>
                <th className="py-3.5 px-4 sticky left-0 z-30 bg-stone-100 font-bold text-stone-800 min-w-[240px] text-sm border-r border-stone-200">
                  <div className="flex items-center justify-between">
                    <span>Customer ({filteredCustomers.length})</span>
                    <span className="text-[10px] text-stone-400 font-normal uppercase tracking-wide">Drag to reorder</span>
                  </div>
                </th>
                {dateRangeList.map((dStr) => (
                  <th
                    key={dStr}
                    className="py-2.5 px-3 text-center border-r border-stone-200 bg-stone-100/90 font-bold text-stone-800 text-sm min-w-[85px]"
                  >
                    <div className="font-bold text-stone-800">{formatDate(dStr)}</div>
                    <div className="flex flex-col gap-0.5 text-xs text-stone-500 font-semibold mt-1">
                      {showMorning && (
                        <span className="text-amber-700 bg-amber-50/80 rounded px-1.5 py-0.5">AM</span>
                      )}
                      {showEvening && (
                        <span className="text-indigo-700 bg-indigo-50/80 rounded px-1.5 py-0.5">PM</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-stone-600">
              {loading ? (
                <tr>
                  <td colSpan={1 + dateRangeList.length} className="py-16 text-center text-stone-400 text-sm">
                    Loading milk records for selected date range...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={1 + dateRangeList.length} className="py-16 text-center text-stone-400 text-sm">
                    {activeCustomers.length === 0 
                      ? 'No customers added yet. Please add customers from the Customers page.'
                      : `No active customers found for "${routeShift}".`}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, rIdx) => {
                  const totalRows = filteredCustomers.length;
                  const totalDates = dateRangeList.length;

                  return (
                    <tr 
                      key={cust.id} 
                      draggable
                      onDragStart={() => setDraggedCustId(cust.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleCustomerDrop(cust.id)}
                      className={`hover:bg-red-50/20 transition border-b-2 border-stone-600 ${
                        draggedCustId === cust.id ? 'opacity-40 bg-stone-100' : ''
                      }`}
                    >
                      <td className="py-3 px-4 sticky left-0 z-10 bg-white font-bold text-stone-900 border-r border-stone-200 whitespace-nowrap shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span 
                            title="Drag row to swap or reorder" 
                            className="cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-700"
                          >
                            <GripVertical className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="truncate max-w-[190px] text-sm sm:text-base font-bold text-stone-900">{cust.name}</div>
                            <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono mt-0.5">
                              <span className="font-semibold">{cust.customerCode}</span>
                              <span className="text-stone-300">•</span>
                              <span className="text-stone-600 font-sans font-semibold">
                                {cust.deliveryPerson || 'Ajay Morning'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {dateRangeList.map((dStr, dIdx) => {
                        const mKey = `${cust.id}_${dStr}_morning`;
                        const eKey = `${cust.id}_${dStr}_evening`;
                        const mVal = gridValues[mKey] ?? '';
                        const eVal = gridValues[eKey] ?? '';

                        return (
                          <td key={dStr} className="p-1.5 border-r border-stone-200 align-top min-w-[85px]">
                            <div className="flex flex-col gap-1.5">
                              {/* Morning Box (AM) */}
                              {showMorning && (
                                <div className="relative">
                                  <input
                                    id={`cell-${rIdx}-${dIdx}-morning`}
                                    type="text"
                                    inputMode="decimal"
                                    value={mVal}
                                    onChange={(e) => handleCellChange(cust.id, dStr, 'morning', e.target.value)}
                                    onBlur={() => handleCellBlur(cust.id, dStr)}
                                    onKeyDown={(e) => handleKeyDown(e, rIdx, dIdx, 'morning', totalRows, totalDates)}
                                    placeholder="-"
                                    className={`w-full text-center py-2 px-1.5 rounded-lg border font-bold text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition shadow-2xs ${
                                      mVal !== '' && parseFloat(mVal) > 0
                                        ? 'bg-amber-50/80 border-amber-300 text-stone-900'
                                        : 'bg-stone-50/60 border-stone-200 text-stone-400'
                                    }`}
                                  />
                                </div>
                              )}

                              {/* Evening Box (PM) - Stacked Below AM */}
                              {showEvening && (
                                <div className="relative">
                                  <input
                                    id={`cell-${rIdx}-${dIdx}-evening`}
                                    type="text"
                                    inputMode="decimal"
                                    value={eVal}
                                    onChange={(e) => handleCellChange(cust.id, dStr, 'evening', e.target.value)}
                                    onBlur={() => handleCellBlur(cust.id, dStr)}
                                    onKeyDown={(e) => handleKeyDown(e, rIdx, dIdx, 'evening', totalRows, totalDates)}
                                    placeholder="-"
                                    className={`w-full text-center py-2 px-1.5 rounded-lg border font-bold text-sm sm:text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-2xs ${
                                      eVal !== '' && parseFloat(eVal) > 0
                                        ? 'bg-indigo-50/80 border-indigo-300 text-stone-900'
                                        : 'bg-stone-50/60 border-stone-200 text-stone-400'
                                    }`}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <div className="flex items-center gap-4">
            {showMorning && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
                Morning (AM)
              </span>
            )}
            {showEvening && (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-indigo-100 border border-indigo-300" />
                Evening (PM)
              </span>
            )}
            <span className="text-stone-400">
              &bull; Supports decimal litres (e.g. 0.625, 1.375) &bull; Keyboard navigation active
            </span>
          </div>

          <button
            onClick={handleBulkSave}
            disabled={saving || loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition duration-150 min-h-[40px] cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
