import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, customersApi, salesApi, calculatorApi } from '../services/api';
import { Product, Customer, CreateSaleItem } from '../types';
import { formatCurrency, formatWeight } from '../utils/format';
import { Calculator, ShoppingCart, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SaleLineItem extends CreateSaleItem {
  product?: Product;
  line_total: number;
}

export default function QuickSale() {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<number | undefined>();
  const [saleItems, setSaleItems] = useState<SaleLineItem[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showCalculator, setShowCalculator] = useState(false);

  // Fetch products and customers
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll(true),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll(true),
  });

  const products = productsData?.data || [];
  const customers = customersData?.data || [];

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: salesApi.create,
    onSuccess: () => {
      toast.success('Sale completed successfully!');
      // Reset form
      setSaleItems([]);
      setSelectedCustomer(undefined);
      setPaymentAmount('');
      setPaymentMethod('cash');
      // Refetch dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create sale');
    },
  });

  // Add item to sale
  const addItem = (product: Product, quantity?: number, weight_kg?: number) => {
    let lineTotal = 0;
    if (product.pricing_type === 'per_kg' && weight_kg) {
      lineTotal = weight_kg * (product.price_per_kg || 0);
    } else if (quantity) {
      lineTotal = quantity * product.sell_price;
    }

    const newItem: SaleLineItem = {
      product_id: product.id,
      product,
      quantity,
      weight_kg,
      line_total: parseFloat(lineTotal.toFixed(2)),
    };

    setSaleItems([...saleItems, newItem]);
  };

  // Remove item from sale
  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  // Calculate totals
  const subtotalIncGST = saleItems.reduce((sum, item) => sum + item.line_total, 0);
  const gstAmount = subtotalIncGST - (subtotalIncGST / 1.15);
  const subtotalExGST = subtotalIncGST - gstAmount;

  // Handle submit
  const handleSubmit = () => {
    if (saleItems.length === 0) {
      toast.error('Please add items to the sale');
      return;
    }

    const payment = parseFloat(paymentAmount) || 0;

    createSaleMutation.mutate({
      customer_id: selectedCustomer,
      items: saleItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        weight_kg: item.weight_kg,
      })),
      payment_amount: payment > 0 ? payment : undefined,
      payment_method: payment > 0 ? paymentMethod : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quick Sale</h1>
          <p className="text-gray-600 mt-1">Fast sales entry with built-in calculator</p>
        </div>
        <button
          onClick={() => setShowCalculator(!showCalculator)}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <Calculator className="w-5 h-5" />
          <span>{showCalculator ? 'Hide' : 'Show'} Calculator</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="card">
            <h2 className="card-header">Customer</h2>
            <select
              value={selectedCustomer || ''}
              onChange={(e) => setSelectedCustomer(e.target.value ? parseInt(e.target.value) : undefined)}
              className="input"
            >
              <option value="">Walk-in Customer</option>
              {customers.map((customer: Customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.customer_type === 'mates' && '(Mate)'}
                </option>
              ))}
            </select>
          </div>

          {/* Product Grid */}
          <div className="card">
            <h2 className="card-header">Select Products</h2>
            <ProductGrid products={products} onAddItem={addItem} />
          </div>
        </div>

        {/* Right Column - Sale Summary & Calculator */}
        <div className="space-y-6">
          {/* Calculator Widget */}
          {showCalculator && <CalculatorWidget />}

          {/* Sale Items */}
          <div className="card">
            <h2 className="card-header">Sale Items</h2>
            <div className="space-y-2">
              {saleItems.map((item, index) => (
                <div key={index} className="sale-item">
                  <div className="flex-1">
                    <p className="font-medium">{item.product?.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity ? `${item.quantity} × ${formatCurrency(item.product?.sell_price || 0)}` : ''}
                      {item.weight_kg ? `${formatWeight(item.weight_kg)} × ${formatCurrency(item.product?.price_per_kg || 0)}/kg` : ''}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold">{formatCurrency(item.line_total)}</span>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {saleItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No items added</p>
                </div>
              )}
            </div>

            {/* Totals */}
            {saleItems.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal (ex GST)</span>
                  <span>{formatCurrency(subtotalExGST)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST (15%)</span>
                  <span>{formatCurrency(gstAmount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total (inc GST)</span>
                  <span className="text-primary-600">{formatCurrency(subtotalIncGST)}</span>
                </div>
              </div>
            )}

            {/* Payment */}
            {saleItems.length > 0 && (
              <div className="mt-6 space-y-3">
                <div>
                  <label className="label">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="input"
                  >
                    <option value="cash">Cash</option>
                    <option value="eftpos">EFTPOS</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit">On Account</option>
                  </select>
                </div>

                <div>
                  <label className="label">Payment Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder={formatCurrency(subtotalIncGST)}
                    className="input"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={createSaleMutation.isPending}
                  className="btn btn-primary w-full btn-lg"
                >
                  {createSaleMutation.isPending ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Grid Component
function ProductGrid({ products, onAddItem }: { products: Product[]; onAddItem: (product: Product, quantity?: number, weight_kg?: number) => void }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <>
      <div className="product-grid">
        {products.map((product: Product) => (
          <div
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className="product-card"
          >
            <h3 className="font-semibold text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {product.pricing_type === 'per_kg'
                ? `${formatCurrency(product.price_per_kg || 0)}/kg`
                : formatCurrency(product.sell_price)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Stock: {formatWeight(product.stock_quantity)} {product.unit_type}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Add Modal */}
      {selectedProduct && (
        <QuickAddModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={onAddItem}
        />
      )}
    </>
  );
}

// Quick Add Modal Component
function QuickAddModal({ product, onClose, onAdd }: { product: Product; onClose: () => void; onAdd: (product: Product, quantity?: number, weight_kg?: number) => void }) {
  const [quantity, setQuantity] = useState('1');
  const [weight, setWeight] = useState('');

  const handleAdd = () => {
    if (product.pricing_type === 'per_kg') {
      const weightKg = parseFloat(weight);
      if (weightKg > 0) {
        onAdd(product, undefined, weightKg);
        onClose();
      }
    } else {
      const qty = parseFloat(quantity);
      if (qty > 0) {
        onAdd(product, qty);
        onClose();
      }
    }
  };

  const commonWeights = [
    { label: '125g', kg: 0.125 },
    { label: '200g', kg: 0.200 },
    { label: '250g', kg: 0.250 },
    { label: '500g', kg: 0.500 },
    { label: '1kg', kg: 1.000 },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{product.name}</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        {product.pricing_type === 'per_kg' ? (
          <div className="space-y-4">
            <p className="text-gray-600">Price: {formatCurrency(product.price_per_kg || 0)}/kg</p>

            <div>
              <label className="label">Quick Weights</label>
              <div className="grid grid-cols-3 gap-2">
                {commonWeights.map((w) => (
                  <button
                    key={w.label}
                    onClick={() => setWeight(w.kg.toString())}
                    className="weight-btn"
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Custom Weight (kg)</label>
              <input
                type="number"
                step="0.001"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input"
                autoFocus
              />
            </div>

            {weight && (
              <p className="text-lg font-semibold text-primary-600">
                Total: {formatCurrency(parseFloat(weight) * (product.price_per_kg || 0))}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">Price: {formatCurrency(product.sell_price)}</p>

            <div>
              <label className="label">Quantity</label>
              <input
                type="number"
                step="1"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input"
                autoFocus
              />
            </div>

            {quantity && (
              <p className="text-lg font-semibold text-primary-600">
                Total: {formatCurrency(parseFloat(quantity) * product.sell_price)}
              </p>
            )}
          </div>
        )}

        <button onClick={handleAdd} className="btn btn-primary w-full mt-6">
          <Plus className="w-5 h-5 mr-2" />
          Add to Sale
        </button>
      </div>
    </div>
  );
}

// Calculator Widget Component
function CalculatorWidget() {
  const [operation, setOperation] = useState<'cost_to_price' | 'weight_price' | 'gst_add' | 'gst_remove' | 'profit'>('cost_to_price');
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
    try {
      const parsedInputs: any = {};
      Object.keys(inputs).forEach(key => {
        parsedInputs[key] = parseFloat(inputs[key]);
      });

      const response = await calculatorApi.calculate({
        operation,
        ...parsedInputs,
      });

      setResult(response.data.result);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Calculation error');
    }
  };

  return (
    <div className="card bg-gray-50">
      <h2 className="card-header flex items-center">
        <Calculator className="w-5 h-5 mr-2" />
        Calculator
      </h2>

      <div className="space-y-4">
        <select
          value={operation}
          onChange={(e) => {
            setOperation(e.target.value as any);
            setInputs({});
            setResult(null);
          }}
          className="input"
        >
          <option value="cost_to_price">Cost → Price (with margin)</option>
          <option value="weight_price">Weight → Price</option>
          <option value="gst_add">Add GST</option>
          <option value="gst_remove">Remove GST</option>
          <option value="profit">Calculate Profit</option>
        </select>

        {operation === 'cost_to_price' && (
          <>
            <input
              type="number"
              step="0.01"
              placeholder="Cost"
              value={inputs.cost || ''}
              onChange={(e) => setInputs({ ...inputs, cost: e.target.value })}
              className="input"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Margin %"
              value={inputs.margin || ''}
              onChange={(e) => setInputs({ ...inputs, margin: e.target.value })}
              className="input"
            />
          </>
        )}

        {operation === 'weight_price' && (
          <>
            <input
              type="number"
              step="0.001"
              placeholder="Weight (kg)"
              value={inputs.weight || ''}
              onChange={(e) => setInputs({ ...inputs, weight: e.target.value })}
              className="input"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price per kg"
              value={inputs.price_per_kg || ''}
              onChange={(e) => setInputs({ ...inputs, price_per_kg: e.target.value })}
              className="input"
            />
          </>
        )}

        {(operation === 'gst_add' || operation === 'gst_remove') && (
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={inputs.amount || ''}
            onChange={(e) => setInputs({ ...inputs, amount: e.target.value })}
            className="input"
          />
        )}

        {operation === 'profit' && (
          <>
            <input
              type="number"
              step="0.01"
              placeholder="Cost"
              value={inputs.cost || ''}
              onChange={(e) => setInputs({ ...inputs, cost: e.target.value })}
              className="input"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Sell Price"
              value={inputs.price || ''}
              onChange={(e) => setInputs({ ...inputs, price: e.target.value })}
              className="input"
            />
          </>
        )}

        <button onClick={calculate} className="btn btn-primary w-full">
          Calculate
        </button>

        {result && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
