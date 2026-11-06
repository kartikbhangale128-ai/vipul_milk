import React, { useEffect, useState } from 'react';
import { 
  ShoppingBag, 
  PlusCircle, 
  Search, 
  Trash2, 
  Edit3, 
  Calendar, 
  IndianRupee, 
  ChevronLeft, 
  ChevronRight,
  Package,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { Customer, Product, ProductEntry, ProductEntryRequest, PageResponse } from '../types';
import { formatDate, formatCurrency, getTodayDateString } from '../utils/formatters';

export const ProductSalesPage: React.FC = () => {
  const [sales, setSales] = useState<ProductEntry[]>([]);
  const [activeCustomers, setActiveCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<ProductEntry | null>(null);
  const [formData, setFormData] = useState<{
    customerId: string;
    productId: string;
    purchaseDate: string;
    quantity: string;
    notes: string;
  }>({
    customerId: '',
    productId: '',
    purchaseDate: getTodayDateString(),
    quantity: '1',
    notes: '',
  });

  const [applicablePrice, setApplicablePrice] = useState<number | null>(null);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get<Customer[]>('/customers/active-list'),
        api.get<Product[]>('/products'),
      ]);
      setActiveCustomers(custRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load initial data', err);
    }
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      const res = await api.get<PageResponse<ProductEntry>>('/product-entries', {
        params: {
          page,
          size: 15,
        },
      });
      setSales(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } catch (err) {
      console.error('Failed to load product sales', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSales();
  }, [page]);

  // When product or date changes in form, dynamically lookup authoritative backend price
  useEffect(() => {
    if (formData.productId && formData.purchaseDate) {
      setFetchingPrice(true);
      api.get(`/products/${formData.productId}/applicable-price`, {
        params: { date: formData.purchaseDate },
      })
      .then((res) => {
        setApplicablePrice(res.data.price);
      })
      .catch((err) => {
        setApplicablePrice(null);
      })
      .finally(() => {
        setFetchingPrice(false);
      });
    } else {
      setApplicablePrice(null);
    }
  }, [formData.productId, formData.purchaseDate]);

  const handleOpenAdd = () => {
    setEditingSale(null);
    setFormData({
      customerId: activeCustomers.length > 0 ? String(activeCustomers[0].id) : '',
      productId: products.length > 0 ? String(products[0].id) : '',
      purchaseDate: getTodayDateString(),
      quantity: '1',
      notes: '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (sale: ProductEntry) => {
    setEditingSale(sale);
    setFormData({
      customerId: String(sale.customerId),
      productId: String(sale.productId),
      purchaseDate: sale.purchaseDate,
      quantity: String(sale.quantity),
      notes: sale.notes || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.productId) {
      setFormError('Customer and Product selection are required');
      return;
    }
    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setFormError('Quantity must be greater than zero');
      return;
    }

    try {
      setSaving(true);
      const payload: ProductEntryRequest = {
        customerId: Number(formData.customerId),
        productId: Number(formData.productId),
        purchaseDate: formData.purchaseDate,
        quantity: qty,
        notes: formData.notes.trim() || undefined,
      };

      if (editingSale) {
        await api.put(`/product-entries/${editingSale.id}`, payload);
      } else {
        await api.post('/product-entries', payload);
      }

      setModalOpen(false);
      loadSales();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to record purchase');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSale = async (sale: ProductEntry) => {
    if (!window.confirm(`Delete purchase of ${sale.quantity} ${sale.unit} ${sale.productName} for ${sale.customerName}?`)) {
      return;
    }

    try {
      await api.delete(`/product-entries/${sale.id}`);
      loadSales();
    } catch (err) {
      alert('Failed to delete purchase record');
    }
  };

  const selectedProductObj = products.find((p) => String(p.id) === formData.productId);
  const calculatedTotal = (applicablePrice ?? 0) * (parseFloat(formData.quantity) || 0);

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">Product Sales & Purchases</h1>
          <p className="text-sm text-stone-500 mt-1">
            Record customer purchases for Paneer, Ghee, Basundi, Khava and other dairy items.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl shadow-xs transition duration-150 min-h-[48px] self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Record Product Sale</span>
        </button>
      </div>

      {/* Sales List Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-xs tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4 text-right">Quantity</th>
                <th className="py-3.5 px-4 text-right">Applied Rate</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Loading product sales...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    No product purchases recorded yet.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4 font-medium text-stone-700 whitespace-nowrap">
                      {formatDate(sale.purchaseDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{sale.customerName}</div>
                      <div className="text-[11px] text-stone-400 font-mono">{sale.customerCode}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-stone-800">
                      <span className="inline-flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-amber-600" />
                        {sale.productName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-stone-700">
                      {sale.quantity} <span className="text-xs text-stone-400">{sale.unit}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-stone-600">
                      {formatCurrency(sale.unitPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-stone-900">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(sale)}
                          className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                          title="Edit Purchase"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale)}
                          className="p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer"
                          title="Delete Purchase"
                        >
                          <Trash2 className="w-4 h-4" />
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
              Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> ({totalElements} sales recorded)
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

      {/* Record Product Sale Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200">
            <h2 className="text-xl font-bold text-stone-900 mb-1">
              {editingSale ? 'Edit Product Purchase' : 'Record Product Purchase'}
            </h2>
            <p className="text-xs text-stone-500 mb-5">
              The system automatically loads the correct historical product price based on purchase date.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveSale} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Customer *
                </label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-semibold text-sm min-h-[48px]"
                >
                  <option value="">Select customer...</option>
                  {activeCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Product *
                  </label>
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-semibold text-sm min-h-[48px]"
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-semibold text-sm min-h-[48px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Quantity ({selectedProductObj?.unit || 'units'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g. 0.5 or 1"
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-bold text-sm min-h-[48px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Unit Price (Backend Resolved)
                  </label>
                  <div className="px-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-800 font-bold text-sm min-h-[48px] flex items-center">
                    {fetchingPrice ? 'Resolving...' : applicablePrice != null ? formatCurrency(applicablePrice) : 'No Price'}
                  </div>
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Total Purchase Amount</span>
                  <p className="text-xs text-amber-700 mt-0.5">Authoritative calculation based on historical rate</p>
                </div>
                <span className="text-2xl font-black text-amber-900">
                  {formatCurrency(calculatedTotal)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Optional Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Festival advance, extra parcel"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm"
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
                  disabled={saving || fetchingPrice}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm min-h-[48px] cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingSale ? 'Update Purchase' : 'Save Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

