import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../services/api';
import { Customer } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { Plus, Edit, Users, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Customers() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<number | null>(null);

  const { data: customersData, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(true),
  });

  const { data: customersWithBalance } = useQuery({
    queryKey: ['customers', 'with-balance'],
    queryFn: () => customersApi.getWithBalance(),
  });

  const customers = customersData?.data || [];
  const owing = customersWithBalance?.data || [];

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
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage customer database and credit accounts</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customers with Outstanding Balances */}
      {owing.length > 0 && (
        <div className="card bg-orange-50 border border-orange-200">
          <div className="flex items-center space-x-2 text-orange-800 mb-3">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Outstanding Balances</span>
          </div>
          <div className="space-y-2">
            {owing.map((customer: Customer) => (
              <div key={customer.id} className="flex items-center justify-between py-2 px-3 bg-white rounded">
                <span className="font-medium">{customer.name}</span>
                <span className="text-orange-600 font-semibold">
                  {formatCurrency(customer.balance_owing)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customers Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Balance Owing</th>
                <th>Credit Limit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer: Customer) => (
                <tr key={customer.id}>
                  <td className="font-medium">{customer.name}</td>
                  <td>
                    <span
                      className={`badge ${
                        customer.customer_type === 'mates'
                          ? 'badge-success'
                          : customer.customer_type === 'wholesale'
                          ? 'badge-info'
                          : 'badge-secondary'
                      }`}
                    >
                      {customer.customer_type}
                    </span>
                  </td>
                  <td className="text-sm text-gray-600">{customer.email || '-'}</td>
                  <td className="text-sm text-gray-600">{customer.phone || '-'}</td>
                  <td>
                    <span
                      className={`font-semibold ${
                        customer.balance_owing > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}
                    >
                      {formatCurrency(customer.balance_owing)}
                    </span>
                  </td>
                  <td>{formatCurrency(customer.credit_limit)}</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewingCustomer(customer.id)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => setEditingCustomer(customer)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {customers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No customers found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary mt-4"
              >
                Add Your First Customer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <CustomerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['customers'] });
          }}
        />
      )}

      {editingCustomer && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSuccess={() => {
            setEditingCustomer(null);
            queryClient.invalidateQueries({ queryKey: ['customers'] });
          }}
        />
      )}

      {viewingCustomer && (
        <CustomerDetailsModal
          customerId={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
        />
      )}
    </div>
  );
}

// Customer Modal Component
function CustomerModal({
  customer,
  onClose,
  onSuccess,
}: {
  customer?: Customer;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    customer_type: customer?.customer_type || 'retail',
    discount_amount: customer?.discount_amount?.toString() || '',
    credit_limit: customer?.credit_limit?.toString() || '0',
    notes: customer?.notes || '',
  });

  const createMutation = useMutation({
    mutationFn: customer
      ? (data: any) => customersApi.update(customer.id, data)
      : customersApi.create,
    onSuccess: () => {
      toast.success(customer ? 'Customer updated' : 'Customer created');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save customer');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : undefined,
      credit_limit: parseFloat(formData.credit_limit),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {customer ? 'Edit Customer' : 'Add New Customer'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Customer Name</label>
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
              <label className="label">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Customer Type</label>
              <select
                value={formData.customer_type}
                onChange={(e) => setFormData({ ...formData, customer_type: e.target.value as any })}
                className="input"
              >
                <option value="retail">Retail</option>
                <option value="wholesale">Wholesale</option>
                <option value="mates">Mates</option>
              </select>
            </div>

            <div>
              <label className="label">Discount Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Credit Limit ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {createMutation.isPending ? 'Saving...' : 'Save Customer'}
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

// Customer Details Modal Component
function CustomerDetailsModal({ customerId, onClose }: { customerId: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['customers', customerId],
    queryFn: () => customersApi.getById(customerId),
  });

  const customerData = data?.data;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{customerData?.customer.name}</h2>
              <button onClick={onClose} className="btn btn-secondary">
                Close
              </button>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Contact Information</h3>
                <p className="text-sm text-gray-600">Email: {customerData?.customer.email || 'N/A'}</p>
                <p className="text-sm text-gray-600">Phone: {customerData?.customer.phone || 'N/A'}</p>
                <p className="text-sm text-gray-600">Address: {customerData?.customer.address || 'N/A'}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Account Details</h3>
                <p className="text-sm text-gray-600">
                  Type: <span className="badge">{customerData?.customer.customer_type}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Balance Owing: {formatCurrency(customerData?.customer.balance_owing || 0)}
                </p>
                <p className="text-sm text-gray-600">
                  Credit Limit: {formatCurrency(customerData?.customer.credit_limit || 0)}
                </p>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Purchases</p>
                <p className="text-2xl font-bold">{customerData?.statistics.total_purchases || 0}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold">{formatCurrency(customerData?.statistics.total_spent || 0)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold">{formatCurrency(customerData?.statistics.total_paid || 0)}</p>
              </div>
            </div>

            {/* Purchase History */}
            <div>
              <h3 className="font-semibold mb-3">Purchase History</h3>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerData?.purchase_history?.map((sale: any) => (
                      <tr key={sale.id}>
                        <td className="font-medium">{sale.invoice_number}</td>
                        <td>{formatDate(sale.sale_date)}</td>
                        <td>{sale.item_count}</td>
                        <td>{formatCurrency(sale.total)}</td>
                        <td>
                          <span
                            className={`badge ${
                              sale.payment_status === 'paid'
                                ? 'badge-success'
                                : sale.payment_status === 'partial'
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {sale.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {!customerData?.purchase_history?.length && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No purchase history</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
