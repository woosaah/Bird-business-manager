import { useState } from 'react';
import { useQuery } from '@tantml:react-query';
import { salesApi } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';
import { FileText, Search, Calendar } from 'lucide-react';

export default function Sales() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: salesData, isLoading } = useQuery({
    queryKey: ['sales', statusFilter],
    queryFn: () => salesApi.getAll({ status: statusFilter || undefined, limit: 100 }),
  });

  const sales = salesData?.data || [];

  const filteredSales = sales.filter((sale: any) =>
    sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sales History</h1>
        <p className="text-gray-600 mt-1">View and manage all sales transactions</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by invoice or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="label">Payment Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="owing">Owing</option>
            </select>
          </div>

          <div>
            <label className="label">Date Range</label>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Last 30 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Subtotal (ex GST)</th>
                <th>GST</th>
                <th>Total (inc GST)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale: any) => (
                <tr key={sale.id} className="cursor-pointer hover:bg-gray-50">
                  <td className="font-medium">{sale.invoice_number}</td>
                  <td>{sale.customer_name || 'Walk-in'}</td>
                  <td>{formatDate(sale.sale_date)}</td>
                  <td>{formatCurrency(sale.subtotal)}</td>
                  <td>{formatCurrency(sale.gst_amount)}</td>
                  <td className="font-semibold">{formatCurrency(sale.total)}</td>
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

          {filteredSales.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No sales found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
