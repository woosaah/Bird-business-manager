import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/api';
import { formatCurrency } from '../utils/format';
import { BarChart3, TrendingUp, Package, Users, Download } from 'lucide-react';

export default function Reports() {
  const { data: topProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => dashboardApi.getTopProducts(10),
  });

  const { data: customerAnalytics } = useQuery({
    queryKey: ['customer-analytics'],
    queryFn: () => dashboardApi.getCustomerAnalytics(10),
  });

  const { data: inventory } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: () => dashboardApi.getInventory(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
        </div>
        <button className="btn btn-secondary flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>Export Reports</span>
        </button>
      </div>

      {/* Inventory Summary */}
      <div className="card">
        <h2 className="card-header flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Inventory Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Products</p>
            <p className="text-2xl font-bold">{inventory?.data?.summary.total_products || 0}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Active Products</p>
            <p className="text-2xl font-bold">{inventory?.data?.summary.active_products || 0}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Low Stock</p>
            <p className="text-2xl font-bold">{inventory?.data?.summary.low_stock || 0}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(inventory?.data?.summary.total_value || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="card">
          <h2 className="card-header flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Top Selling Products
          </h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Times Sold</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts?.data?.map((product: any) => (
                  <tr key={product.id}>
                    <td className="font-medium">{product.name}</td>
                    <td>{product.times_sold}</td>
                    <td className="font-semibold">{formatCurrency(product.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!topProducts?.data?.length && (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="card">
          <h2 className="card-header flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Top Customers
          </h2>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Purchases</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {customerAnalytics?.data?.top_customers?.map((customer: any) => (
                  <tr key={customer.id}>
                    <td className="font-medium">{customer.name}</td>
                    <td>{customer.purchase_count}</td>
                    <td className="font-semibold">{formatCurrency(customer.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!customerAnalytics?.data?.top_customers?.length && (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Type Breakdown */}
      <div className="card">
        <h2 className="card-header">Customer Type Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {customerAnalytics?.data?.type_breakdown?.map((type: any) => (
            <div key={type.customer_type} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 capitalize">{type.customer_type}</p>
                  <p className="text-2xl font-bold">{type.count}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Owing</p>
                  <p className="text-lg font-semibold text-orange-600">
                    {formatCurrency(type.total_owing)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
