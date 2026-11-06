import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  History, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { Customer, CustomerRequest, PageResponse, MilkEntry, ProductEntry } from '../types';
import { formatDate, formatCurrency } from '../utils/formatters';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [selectedShift, setSelectedShift] = useState<string>('All');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerRequest>({ name: '', phone: '', address: '', deliveryPerson: 'Ajay Morning' });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Detail / History Drawer state
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [customerMilkEntries, setCustomerMilkEntries] = useState<MilkEntry[]>([]);
  const [customerProductEntries, setCustomerProductEntries] = useState<ProductEntry[]>([]);
  const [historyTab, setHistoryTab] = useState<'milk' | 'products'>('milk');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const activeParam = activeFilter === 'all' ? null : activeFilter === 'active';
      const shiftParam = selectedShift === 'All' ? null : selectedShift;
      const res = await api.get<PageResponse<Customer>>('/customers', {
        params: {
          query: searchQuery,
          shift: shiftParam,
          activeOnly: activeParam,
          page,
          size: 100,
        },
      });
      setCustomers(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, activeFilter, selectedShift]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchCustomers();
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', address: '', deliveryPerson: 'Ajay Morning' });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      deliveryPerson: customer.deliveryPerson || 'Ajay Morning',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Customer name is required');
      return;
    }

    try {
      setSaving(true);
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    const action = customer.active ? 'deactivate' : 'reactivate';
    const confirmMsg = customer.active
      ? `Are you sure you want to deactivate ${customer.name}? All historical consumption and bills will remain preserved.`
      : `Reactivate ${customer.name}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.patch(`/customers/${customer.id}/${action}`);
      fetchCustomers();
    } catch (err) {
      alert('Failed to update customer status');
    }
  };

  const handleOpenHistory = async (customer: Customer) => {
    setDetailCustomer(customer);
    try {
      const [milkRes, prodRes] = await Promise.all([
        api.get<PageResponse<MilkEntry>>(`/customers/${customer.id}/milk-entries`, { params: { size: 50 } }),
        api.get<PageResponse<ProductEntry>>(`/customers/${customer.id}/product-entries`, { params: { size: 50 } }),
      ]);
      setCustomerMilkEntries(milkRes.data.content);
      setCustomerProductEntries(prodRes.data.content);
    } catch (err) {
      console.error('Failed to load customer history', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">Customer Management</h1>
          <p className="text-sm text-stone-500 mt-1">
            Maintain customer records, view individual histories & manage active accounts ({totalElements} total).
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl shadow-xs transition duration-150 min-h-[48px] self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Route / Shift Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-1">Shift / Route:</span>
        {[
          { label: 'All Routes', value: 'All' },
          { label: '1. Ajay Morning', value: 'Ajay Morning' },
          { label: '2. Rahul Evening', value: 'Rahul Evening' },
          { label: '3. Ajay Evening', value: 'Ajay Evening' },
          { label: '4. Rahul Morning', value: 'Rahul Morning' },
        ].map((shift) => (
          <button
            key={shift.value}
            onClick={() => {
              setSelectedShift(shift.value);
              setPage(0);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedShift === shift.value
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
            }`}
          >
            {shift.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, code or phone..."
              className="w-full pl-11 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-800 text-sm min-h-[44px]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-semibold text-sm rounded-xl min-h-[44px] cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl w-full md:w-auto">
          {(['active', 'all', 'inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter);
                setPage(0);
              }}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold capitalize transition ${
                activeFilter === filter
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-xs tracking-wider">
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Route</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Address</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    Loading customer records...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-600 text-xs">
                      {c.customerCode}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      {c.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        (c.deliveryPerson || '').includes('Rahul')
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {c.deliveryPerson || 'Ajay Morning'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      {c.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          {c.phone}
                        </span>
                      ) : (
                        <span className="text-stone-300">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500 hidden md:table-cell max-w-xs truncate">
                      {c.address || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          c.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-100 text-stone-600 border border-stone-200'
                        }`}
                      >
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenHistory(c)}
                          className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                          title="View Records & Consumption History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`p-2 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer ${
                            c.active
                              ? 'text-stone-400 hover:text-red-700 hover:bg-red-50'
                              : 'text-stone-400 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={c.active ? 'Deactivate Customer' : 'Reactivate Customer'}
                        >
                          {c.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>
              Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} customers)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="p-2 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200">
            <h2 className="text-xl font-bold text-stone-900 mb-1">
              {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
            </h2>
            <p className="text-xs text-stone-500 mb-6">
              Customers will receive automated sequential IDs (e.g. CUST-001).
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Full Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Patil"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-medium text-sm min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-medium text-sm min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Delivery Person & Shift *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryPerson: 'Ajay Morning' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      formData.deliveryPerson === 'Ajay Morning' || formData.deliveryPerson === 'Ajay'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Ajay Morning
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryPerson: 'Rahul Evening' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      formData.deliveryPerson === 'Rahul Evening'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Rahul Evening
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryPerson: 'Ajay Evening' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      formData.deliveryPerson === 'Ajay Evening'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Ajay Evening
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, deliveryPerson: 'Rahul Morning' })}
                    className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      formData.deliveryPerson === 'Rahul Morning' || formData.deliveryPerson === 'Rahul'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Rahul Morning
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Delivery / Home Address
                </label>
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House / flat no., street, lane, landmark"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-medium text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 min-h-[48px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm min-h-[48px] cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer History Slide-over / Modal */}
      {detailCustomer && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-stone-200 bg-stone-50 flex items-start justify-between">
              <div>
                <span className="text-xs font-bold font-mono text-red-600">{detailCustomer.customerCode}</span>
                <h2 className="text-2xl font-extrabold text-stone-900 mt-1">{detailCustomer.name}</h2>
                <div className="flex items-center gap-4 text-xs text-stone-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    {detailCustomer.phone || 'No phone'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {detailCustomer.address || 'No address'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDetailCustomer(null)}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60"
              >
                &times;
              </button>
            </div>

            {/* Tab buttons */}
            <div className="flex border-b border-stone-200 px-6 pt-3 gap-6 bg-white">
              <button
                onClick={() => setHistoryTab('milk')}
                className={`pb-3 text-sm font-bold border-b-2 transition ${
                  historyTab === 'milk'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                Milk Entries History ({customerMilkEntries.length})
              </button>
              <button
                onClick={() => setHistoryTab('products')}
                className={`pb-3 text-sm font-bold border-b-2 transition ${
                  historyTab === 'products'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-stone-400 hover:text-stone-700'
                }`}
              >
                Product Purchases ({customerProductEntries.length})
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-6">
              {historyTab === 'milk' ? (
                customerMilkEntries.length === 0 ? (
                  <div className="py-12 text-center text-sm text-stone-400">
                    No milk intake recorded for this customer yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerMilkEntries.map((m) => (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl border border-stone-200 bg-white flex items-center justify-between shadow-2xs"
                      >
                        <div>
                          <p className="font-bold text-stone-900 text-sm">{formatDate(m.entryDate)}</p>
                          <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                            <span>Morning: <strong>{m.morningLitres} L</strong></span>
                            <span>Evening: <strong>{m.eveningLitres} L</strong></span>
                            <span>Applied Rate: <strong>{formatCurrency(m.milkRate)}/L</strong></span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-stone-900 text-base">{formatCurrency(m.totalAmount)}</p>
                          <span className="text-xs text-stone-400 font-semibold">{m.totalLitres} L Total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : customerProductEntries.length === 0 ? (
                <div className="py-12 text-center text-sm text-stone-400">
                  No additional product purchases recorded for this customer yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {customerProductEntries.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl border border-stone-200 bg-white flex items-center justify-between shadow-2xs"
                    >
                      <div>
                        <p className="font-bold text-stone-900 text-sm">{p.productName}</p>
                        <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                          <span>Date: <strong>{formatDate(p.purchaseDate)}</strong></span>
                          <span>Quantity: <strong>{p.quantity} {p.unit}</strong></span>
                          <span>Price: <strong>{formatCurrency(p.unitPrice)}/{p.unit}</strong></span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-700 text-base">{formatCurrency(p.totalAmount)}</p>
                        {p.notes && <span className="text-xs text-stone-400 italic">{p.notes}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 text-right">
              <button
                onClick={() => setDetailCustomer(null)}
                className="px-6 py-2.5 bg-stone-800 text-white font-semibold text-sm rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

