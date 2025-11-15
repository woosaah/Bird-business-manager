import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../services/api';
import { Product } from '../types';
import { formatCurrency, formatWeight } from '../utils/format';
import { Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Products() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(true),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: () => productsApi.getLowStock(10),
  });

  const products = productsData?.data || [];
  const lowStock = lowStockData?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product catalog and inventory</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Low Stock Alert</span>
          </div>
          <p className="text-sm text-red-700 mt-1">
            {lowStock.length} product(s) are running low on stock
          </p>
        </div>
      )}

      {/* Products Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Pricing</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Margin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: Product) => (
                <tr key={product.id}>
                  <td className="font-medium">{product.name}</td>
                  <td>
                    <span className="badge badge-info">{product.unit_type}</span>
                  </td>
                  <td>
                    {product.pricing_type === 'per_kg' ? (
                      <span className="text-sm text-gray-600">Per KG</span>
                    ) : (
                      <span className="text-sm text-gray-600">Per Unit</span>
                    )}
                  </td>
                  <td>{formatCurrency(product.supplier_cost)}</td>
                  <td className="font-semibold">
                    {product.pricing_type === 'per_kg'
                      ? `${formatCurrency(product.price_per_kg || 0)}/kg`
                      : formatCurrency(product.sell_price)}
                  </td>
                  <td>
                    <span
                      className={`${
                        product.stock_quantity <= 10 ? 'text-red-600 font-semibold' : ''
                      }`}
                    >
                      {formatWeight(product.stock_quantity)}
                    </span>
                  </td>
                  <td>{product.profit_margin}%</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No products found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary mt-4"
              >
                Add Your First Product
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <ProductModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['products'] });
          }}
        />
      )}

      {editingProduct && (
        <ProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            setEditingProduct(null);
            queryClient.invalidateQueries({ queryKey: ['products'] });
          }}
        />
      )}
    </div>
  );
}

// Product Modal Component
function ProductModal({
  product,
  onClose,
  onSuccess,
}: {
  product?: Product;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    supplier_cost: product?.supplier_cost?.toString() || '',
    sell_price: product?.sell_price?.toString() || '',
    stock_quantity: product?.stock_quantity?.toString() || '0',
    unit_type: product?.unit_type || 'bag',
    pricing_type: product?.pricing_type || 'per_unit',
    price_per_kg: product?.price_per_kg?.toString() || '',
    profit_margin: product?.profit_margin?.toString() || '33.7',
    description: product?.description || '',
  });

  const createMutation = useMutation({
    mutationFn: product
      ? (data: any) => productsApi.update(product.id, data)
      : productsApi.create,
    onSuccess: () => {
      toast.success(product ? 'Product updated' : 'Product created');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save product');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      supplier_cost: parseFloat(formData.supplier_cost),
      sell_price: parseFloat(formData.sell_price),
      stock_quantity: parseFloat(formData.stock_quantity),
      price_per_kg: formData.price_per_kg ? parseFloat(formData.price_per_kg) : undefined,
      profit_margin: parseFloat(formData.profit_margin),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Product Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Unit Type</label>
              <select
                value={formData.unit_type}
                onChange={(e) => setFormData({ ...formData, unit_type: e.target.value as any })}
                className="input"
              >
                <option value="bag">Bag</option>
                <option value="bottle">Bottle</option>
                <option value="kg">Kilogram</option>
                <option value="each">Each</option>
              </select>
            </div>

            <div>
              <label className="label">Pricing Type</label>
              <select
                value={formData.pricing_type}
                onChange={(e) => setFormData({ ...formData, pricing_type: e.target.value as any })}
                className="input"
              >
                <option value="per_unit">Per Unit</option>
                <option value="per_kg">Per Kilogram</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Supplier Cost (inc GST)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.supplier_cost}
                onChange={(e) => setFormData({ ...formData, supplier_cost: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Profit Margin (%)</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.profit_margin}
                onChange={(e) => setFormData({ ...formData, profit_margin: e.target.value })}
                className="input"
              />
            </div>
          </div>

          {formData.pricing_type === 'per_kg' ? (
            <div>
              <label className="label">Price per KG</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price_per_kg}
                onChange={(e) => setFormData({ ...formData, price_per_kg: e.target.value })}
                className="input"
              />
            </div>
          ) : (
            <div>
              <label className="label">Sell Price (inc GST)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.sell_price}
                onChange={(e) => setFormData({ ...formData, sell_price: e.target.value })}
                className="input"
              />
            </div>
          )}

          <div>
            <label className="label">Stock Quantity</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn btn-primary flex-1"
            >
              {createMutation.isPending ? 'Saving...' : 'Save Product'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
