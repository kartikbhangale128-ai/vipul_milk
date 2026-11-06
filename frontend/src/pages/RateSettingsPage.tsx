import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  PlusCircle, 
  Calendar, 
  Clock, 
  IndianRupee, 
  AlertTriangle,
  History,
  Package,
  Layers
} from 'lucide-react';
import api from '../services/api';
import { MilkRate, MilkRateRequest, Product, AddProductPriceRequest, CreateProductRequest } from '../types';
import { formatDate, formatCurrency, getTodayDateString } from '../utils/formatters';

export const RateSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'milk' | 'products'>('milk');

  // Milk Rates state
  const [rates, setRates] = useState<MilkRate[]>([]);
  const [currentRate, setCurrentRate] = useState<MilkRate | null>(null);
  const [milkRateModalOpen, setMilkRateModalOpen] = useState(false);
  const [newRateValue, setNewRateValue] = useState('');
  const [newEffectiveDate, setNewEffectiveDate] = useState(getTodayDateString());
  const [rateNote, setRateNote] = useState('');
  const [savingMilkRate, setSavingMilkRate] = useState(false);
  const [milkRateError, setMilkRateError] = useState<string | null>(null);

  // Products & Product Prices state
  const [products, setProducts] = useState<Product[]>([]);
  const [productPriceModalOpen, setProductPriceModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProductPriceValue, setNewProductPriceValue] = useState('');
  const [newProductPriceDate, setNewProductPriceDate] = useState(getTodayDateString());
  const [savingProductPrice, setSavingProductPrice] = useState(false);
  const [productPriceError, setProductPriceError] = useState<string | null>(null);

  // New Product Modal state
  const [newProductModalOpen, setNewProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('kg');
  const [newProductInitialPrice, setNewProductInitialPrice] = useState('');
  const [savingNewProduct, setSavingNewProduct] = useState(false);
  const [newProductError, setNewProductError] = useState<string | null>(null);

  const loadMilkRates = async () => {
    try {
      const [allRes, currRes] = await Promise.all([
        api.get<MilkRate[]>('/milk-rates'),
        api.get<MilkRate>('/milk-rates/current'),
      ]);
      setRates(allRes.data);
      setCurrentRate(currRes.data);
    } catch (err) {
      console.error('Failed to load milk rates', err);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.get<Product[]>('/products?includeInactive=true');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products', err);
    }
  };

  useEffect(() => {
    loadMilkRates();
    loadProducts();
  }, []);

  const handleAddMilkRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateVal = parseFloat(newRateValue);
    if (isNaN(rateVal) || rateVal <= 0) {
      setMilkRateError('Please enter a valid rate per litre');
      return;
    }

    try {
      setSavingMilkRate(true);
      setMilkRateError(null);
      const req: MilkRateRequest = {
        ratePerLitre: rateVal,
        effectiveFrom: newEffectiveDate,
        note: rateNote.trim() || undefined,
      };
      await api.post('/milk-rates', req);
      setMilkRateModalOpen(false);
      setNewRateValue('');
      setRateNote('');
      loadMilkRates();
    } catch (err: any) {
      setMilkRateError(err.response?.data?.message || 'Failed to save rate');
    } finally {
      setSavingMilkRate(false);
    }
  };

  const handleAddProductPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const priceVal = parseFloat(newProductPriceValue);
    if (isNaN(priceVal) || priceVal < 0) {
      setProductPriceError('Please enter a valid product price');
      return;
    }

    try {
      setSavingProductPrice(true);
      setProductPriceError(null);
      const req: AddProductPriceRequest = {
        price: priceVal,
        effectiveFrom: newProductPriceDate,
      };
      await api.post(`/products/${selectedProduct.id}/prices`, req);
      setProductPriceModalOpen(false);
      setNewProductPriceValue('');
      loadProducts();
    } catch (err: any) {
      setProductPriceError(err.response?.data?.message || 'Failed to add product price');
    } finally {
      setSavingProductPrice(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceVal = parseFloat(newProductInitialPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      setNewProductError('Please enter a valid initial price');
      return;
    }

    try {
      setSavingNewProduct(true);
      setNewProductError(null);
      const req: CreateProductRequest = {
        name: newProductName.trim(),
        unit: newProductUnit.trim(),
        initialPrice: priceVal,
        effectiveFrom: getTodayDateString(),
      };
      await api.post('/products', req);
      setNewProductModalOpen(false);
      setNewProductName('');
      setNewProductInitialPrice('');
      loadProducts();
    } catch (err: any) {
      setNewProductError(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSavingNewProduct(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">Rate & Price Settings</h1>
          <p className="text-sm text-stone-500 mt-1">
            Configure authoritative standard milk rates & product pricing with strict immutable historical versioning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'milk' ? (
            <button
              onClick={() => {
                setNewRateValue('');
                setRateNote('');
                setNewEffectiveDate(getTodayDateString());
                setMilkRateError(null);
                setMilkRateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl shadow-xs transition min-h-[48px] cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Update Milk Rate</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setNewProductName('');
                setNewProductInitialPrice('');
                setNewProductError(null);
                setNewProductModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 rounded-xl shadow-xs transition min-h-[48px] cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Add New Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-6">
        <button
          onClick={() => setActiveTab('milk')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'milk'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Milk Rates (Standard per Litre)</span>
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'products'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Dairy Products & Price History</span>
        </button>
      </div>

      {activeTab === 'milk' ? (
        <div className="space-y-6">
          {/* Current Rate Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Active Standard Milk Rate</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-stone-900">
                  {currentRate ? formatCurrency(currentRate.ratePerLitre) : '₹0.00'}
                </span>
                <span className="text-stone-500 font-semibold text-sm">/ Litre</span>
              </div>
              <p className="text-xs text-stone-500 mt-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                Effective since <strong>{currentRate ? formatDate(currentRate.effectiveFrom) : '-'}</strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 max-w-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Critical Business Protection:</strong> Historical rates are never modified or overwritten.
                  New rates only apply on or after their specified effective date. Old entries and bills remain strictly intact.
                </div>
              </div>
            </div>
          </div>

          {/* Historical Milk Rates Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-stone-900">Historical Rate Log</h2>
              <span className="text-xs text-stone-400">{rates.length} rate revisions recorded</span>
            </div>

            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase text-xs">
                  <th className="py-3.5 px-4">Effective Date</th>
                  <th className="py-3.5 px-4 text-right">Rate / Litre</th>
                  <th className="py-3.5 px-4">Notes / Remarks</th>
                  <th className="py-3.5 px-4 text-right">Recorded On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rates.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      <div className="flex items-center gap-2">
                        {idx === 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Latest Rate" />
                        )}
                        {formatDate(r.effectiveFrom)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-stone-900 text-base">
                      {formatCurrency(r.ratePerLitre)}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500">
                      {r.note || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right text-stone-400 text-xs">
                      {formatDate(r.createdAt.split('T')[0])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Products and Price History View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">{p.name}</h3>
                    <span className="text-xs font-semibold text-stone-400">Sold in: {p.unit}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    p.active ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'
                  }`}>
                    {p.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200/80">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Current Price</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-stone-900">
                      {formatCurrency(p.currentPrice)}
                    </span>
                    <span className="text-xs text-stone-500 font-semibold">/ {p.unit}</span>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Since {formatDate(p.currentPriceEffectiveFrom)}
                  </p>
                </div>

                {/* Price History Preview */}
                <div className="mt-4">
                  <span className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-2">
                    Price Revisions ({p.priceHistory?.length || 0})
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {p.priceHistory?.map((h) => (
                      <div key={h.id} className="flex items-center justify-between text-xs py-1 border-b border-stone-100">
                        <span className="text-stone-500">{formatDate(h.effectiveFrom)}</span>
                        <span className="font-bold text-stone-800">{formatCurrency(h.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedProduct(p);
                    setNewProductPriceValue('');
                    setNewProductPriceDate(getTodayDateString());
                    setProductPriceError(null);
                    setProductPriceModalOpen(true);
                  }}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Update Price with Effective Date</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Milk Rate Modal */}
      {milkRateModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <h2 className="text-xl font-bold text-stone-900 mb-1">Set New Milk Rate</h2>
            <p className="text-xs text-stone-500 mb-5">
              Enter the new per-litre milk price and its starting effective date.
            </p>

            {milkRateError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {milkRateError}
              </div>
            )}

            <form onSubmit={handleAddMilkRate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  New Rate Per Litre (₹) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 font-bold">
                    ₹
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={newRateValue}
                    onChange={(e) => setNewRateValue(e.target.value)}
                    placeholder="e.g. 62.00"
                    className="w-full pl-9 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-bold text-lg min-h-[48px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Effective From Date *
                </label>
                <input
                  type="date"
                  required
                  value={newEffectiveDate}
                  onChange={(e) => setNewEffectiveDate(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-semibold text-sm min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Reason / Revision Note
                </label>
                <input
                  type="text"
                  value={rateNote}
                  onChange={(e) => setRateNote(e.target.value)}
                  placeholder="e.g. Fodder price hike, Winter seasonal revision"
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 text-sm"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                Notice: Existing customer entries on or before previous dates will continue using their historical rates.
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setMilkRateModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 min-h-[48px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMilkRate}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm min-h-[48px] cursor-pointer disabled:opacity-50"
                >
                  {savingMilkRate ? 'Saving...' : 'Apply Milk Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Price Revision Modal */}
      {productPriceModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <h2 className="text-xl font-bold text-stone-900 mb-1">
              Update {selectedProduct.name} Price
            </h2>
            <p className="text-xs text-stone-500 mb-5">
              Unit: {selectedProduct.unit}. Enter new price and effective start date.
            </p>

            {productPriceError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {productPriceError}
              </div>
            )}

            <form onSubmit={handleAddProductPrice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  New Price per {selectedProduct.unit} (₹) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={newProductPriceValue}
                  onChange={(e) => setNewProductPriceValue(e.target.value)}
                  placeholder="e.g. 450"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-bold text-lg min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Effective Date *
                </label>
                <input
                  type="date"
                  required
                  value={newProductPriceDate}
                  onChange={(e) => setNewProductPriceDate(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-semibold text-sm min-h-[48px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setProductPriceModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 min-h-[48px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProductPrice}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm min-h-[48px] cursor-pointer disabled:opacity-50"
                >
                  {savingProductPrice ? 'Saving...' : 'Save Price Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {newProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200">
            <h2 className="text-xl font-bold text-stone-900 mb-1">Add Dairy Product</h2>
            <p className="text-xs text-stone-500 mb-5">
              Add a new milk product for sales and billing records.
            </p>

            {newProductError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {newProductError}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Fresh Shrikhand"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-bold text-sm min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Unit of Measurement *
                </label>
                <select
                  value={newProductUnit}
                  onChange={(e) => setNewProductUnit(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-semibold text-sm min-h-[48px]"
                >
                  <option value="kg">kg (Kilogram)</option>
                  <option value="litre">litre (Litre)</option>
                  <option value="gram">gram (Gram)</option>
                  <option value="piece">piece (Pcs / Unit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Starting Price (₹) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={newProductInitialPrice}
                  onChange={(e) => setNewProductInitialPrice(e.target.value)}
                  placeholder="e.g. 300"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 text-stone-900 font-bold text-lg min-h-[48px]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setNewProductModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 min-h-[48px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewProduct}
                  className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm min-h-[48px] cursor-pointer disabled:opacity-50"
                >
                  {savingNewProduct ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

