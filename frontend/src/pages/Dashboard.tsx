import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/api';
import { DollarSign, TrendingUp, AlertTriangle, Package, Users, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  const dashboardData = stats?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Today's Sales */}
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm font-medium">Today's Sales</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(dashboardData?.today_sales || 0)}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-white text-opacity-50" />
          </div>
        </div>

        {/* This Week */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm font-medium">This Week</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(dashboardData?.week_sales || 0)}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-white text-opacity-50" />
          </div>
        </div>

        {/* This Month */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm font-medium">This Month</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(dashboardData?.month_sales || 0)}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-white text-opacity-50" />
          </div>
        </div>

        {/* Total Owing */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm font-medium">Total Owing</p>
              <p className="text-3xl font-bold mt-1">
                {formatCurrency(dashboardData?.total_owing || 0)}
              </p>
            </div>
            <Users className="w-12 h-12 text-white text-opacity-50" />
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm font-medium">Low Stock Items</p>
              <p className="text-3xl font-bold mt-1">{dashboardData?.low_stock_count || 0}</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-white text-opacity-50" />
          </div>
        </div>

        {/* Pending Xero Sync */}
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-opacity-80 text-sm font-medium">Pending Xero Sync</p>
              <p className="text-3xl font-bold mt-1">{dashboardData?.pending_xero_sync || 0}</p>
            </div>
            <FileText className="w-12 h-12 text-white text-opacity-50" />
          </div>
        </div>
      </div>

      {/* Recent Sales */}
      <div className="card">
        <h2 className="card-header">Recent Sales</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData?.recent_sales?.map((sale: any) => (
                <tr key={sale.id}>
                  <td className="font-medium">{sale.invoice_number}</td>
                  <td>{sale.customer_name || 'Walk-in'}</td>
                  <td>{formatDate(sale.sale_date)}</td>
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

          {!dashboardData?.recent_sales?.length && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No recent sales</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
