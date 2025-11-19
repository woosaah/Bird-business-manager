# API Examples

Quick reference for using The Birds Business Manager API.

## Base URL

Development: `http://localhost:3001/api`
Production: `http://your-server/api`

## Health Check

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-11-19T12:00:00.000Z"
}
```

## Products

### Get All Products

```bash
curl http://localhost:3001/api/products
```

### Get Single Product

```bash
curl http://localhost:3001/api/products/1
```

### Create Product (Unit-Based)

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wild Bird Seed 20kg",
    "supplier_cost": 45.00,
    "sell_price": 60.00,
    "stock_quantity": 50,
    "unit_type": "bag",
    "pricing_type": "per_unit",
    "profit_margin": 33.7
  }'
```

### Create Product (Weight-Based)

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cuttlefish",
    "supplier_cost": 30.00,
    "price_per_kg": 40.00,
    "stock_quantity": 25,
    "unit_type": "kg",
    "pricing_type": "per_kg",
    "profit_margin": 33.7
  }'
```

### Update Product

```bash
curl -X PUT http://localhost:3001/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "sell_price": 65.00,
    "stock_quantity": 45
  }'
```

### Update Stock

```bash
# Add 10 to stock
curl -X PATCH http://localhost:3001/api/products/1/stock \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 10,
    "operation": "add"
  }'

# Set stock to 50
curl -X PATCH http://localhost:3001/api/products/1/stock \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 50,
    "operation": "set"
  }'
```

### Get Low Stock Products

```bash
curl http://localhost:3001/api/products/low-stock?threshold=10
```

## Customers

### Get All Customers

```bash
curl http://localhost:3001/api/customers
```

### Get Customer with History

```bash
curl http://localhost:3001/api/customers/2
```

Response includes:
- Customer details
- Purchase history
- Statistics (total purchases, total spent)

### Create Customer

```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "021-123-4567",
    "customer_type": "retail",
    "credit_limit": 500
  }'
```

### Create Customer with Mate's Discount

```bash
curl -X POST http://localhost:3001/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob the Breeder",
    "email": "bob@birds.com",
    "phone": "021-987-6543",
    "customer_type": "mates",
    "discount_amount": 5.00,
    "credit_limit": 1000
  }'
```

### Update Customer Balance

```bash
# Add to balance
curl -X PATCH http://localhost:3001/api/customers/2/balance \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.00,
    "operation": "add"
  }'

# Set balance
curl -X PATCH http://localhost:3001/api/customers/2/balance \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "operation": "set"
  }'
```

### Get Customers with Outstanding Balance

```bash
curl http://localhost:3001/api/customers/with-balance
```

## Sales

### Create Sale (Unit-Based Products)

```bash
curl -X POST http://localhost:3001/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 2,
    "items": [
      {
        "product_id": 1,
        "quantity": 2
      },
      {
        "product_id": 2,
        "quantity": 1
      }
    ],
    "payment_amount": 150.00,
    "payment_method": "cash"
  }'
```

### Create Sale (Weight-Based Product)

```bash
curl -X POST http://localhost:3001/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "items": [
      {
        "product_id": 4,
        "weight_kg": 0.5
      }
    ],
    "payment_amount": 20.00,
    "payment_method": "eftpos"
  }'
```

### Create Sale (Mixed Products, Part Payment)

```bash
curl -X POST http://localhost:3001/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 3,
    "items": [
      {
        "product_id": 1,
        "quantity": 3
      },
      {
        "product_id": 4,
        "weight_kg": 0.25
      }
    ],
    "payment_amount": 100.00,
    "payment_method": "bank_transfer",
    "notes": "Partial payment, will pay rest next week"
  }'
```

### Get All Sales

```bash
curl http://localhost:3001/api/sales
```

### Get Sales by Status

```bash
curl "http://localhost:3001/api/sales?status=owing"
```

### Get Sales by Customer

```bash
curl "http://localhost:3001/api/sales?customer_id=2"
```

### Get Sales by Date Range

```bash
curl "http://localhost:3001/api/sales?start_date=2025-11-01&end_date=2025-11-30"
```

### Get Single Sale

```bash
curl http://localhost:3001/api/sales/1
```

### Add Payment to Sale

```bash
curl -X POST http://localhost:3001/api/sales/1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.00,
    "payment_method": "cash",
    "notes": "Second payment"
  }'
```

### Get Sales Statistics

```bash
curl http://localhost:3001/api/sales/stats

# With date range
curl "http://localhost:3001/api/sales/stats?start_date=2025-11-01&end_date=2025-11-30"
```

## Calculator

### Cost to Price with Margin

```bash
curl -X POST http://localhost:3001/api/calculator \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "cost_to_price",
    "cost": 45.00,
    "margin": 33.7
  }'
```

Response:
```json
{
  "success": true,
  "operation": "cost_to_price",
  "result": {
    "sell_price": 67.87,
    "profit": 22.87
  }
}
```

### Weight to Price

```bash
curl -X POST http://localhost:3001/api/calculator \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "weight_price",
    "weight": 0.375,
    "price_per_kg": 40.00
  }'
```

Response:
```json
{
  "success": true,
  "operation": "weight_price",
  "result": {
    "price": 15.00
  }
}
```

### Add GST

```bash
curl -X POST http://localhost:3001/api/calculator \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "gst_add",
    "amount": 100.00
  }'
```

Response:
```json
{
  "success": true,
  "operation": "gst_add",
  "result": {
    "amount_ex_gst": 100.00,
    "gst_amount": 15.00,
    "amount_inc_gst": 115.00
  }
}
```

### Remove GST

```bash
curl -X POST http://localhost:3001/api/calculator \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "gst_remove",
    "amount": 115.00
  }'
```

Response:
```json
{
  "success": true,
  "operation": "gst_remove",
  "result": {
    "amount_inc_gst": 115.00,
    "gst_amount": 15.00,
    "amount_ex_gst": 100.00
  }
}
```

### Calculate Profit

```bash
curl -X POST http://localhost:3001/api/calculator \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "profit",
    "cost": 45.00,
    "price": 60.00
  }'
```

Response:
```json
{
  "success": true,
  "operation": "profit",
  "result": {
    "profit": 15.00,
    "margin_percent": 25.00
  }
}
```

### Get Weight Prices

```bash
curl "http://localhost:3001/api/calculator/weight-prices?price_per_kg=40"
```

Response:
```json
{
  "success": true,
  "data": {
    "125g": 5.00,
    "200g": 8.00,
    "250g": 10.00,
    "500g": 20.00,
    "1kg": 40.00
  }
}
```

## Dashboard

### Get Dashboard Statistics

```bash
curl http://localhost:3001/api/dashboard/stats
```

Response:
```json
{
  "success": true,
  "data": {
    "today_sales": 150.00,
    "week_sales": 800.00,
    "month_sales": 3500.00,
    "total_owing": 250.00,
    "low_stock_count": 3,
    "pending_xero_sync": 0,
    "recent_sales": [...]
  }
}
```

### Get Sales Trends

```bash
# Daily
curl "http://localhost:3001/api/dashboard/trends?period=daily"

# Weekly
curl "http://localhost:3001/api/dashboard/trends?period=weekly"

# Monthly
curl "http://localhost:3001/api/dashboard/trends?period=monthly"
```

### Get Top Products

```bash
curl "http://localhost:3001/api/dashboard/top-products?limit=10"
```

### Get Customer Analytics

```bash
curl "http://localhost:3001/api/dashboard/customer-analytics?limit=10"
```

### Get Inventory Summary

```bash
curl http://localhost:3001/api/dashboard/inventory
```

## Error Responses

All errors return a consistent format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Server Error

## Complete Sale Example

Here's a complete example of creating a sale with error handling:

```bash
#!/bin/bash

# Create a sale
RESPONSE=$(curl -s -X POST http://localhost:3001/api/sales \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 2,
    "items": [
      {"product_id": 1, "quantity": 2},
      {"product_id": 4, "weight_kg": 0.5}
    ],
    "payment_amount": 140.00,
    "payment_method": "cash"
  }')

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  INVOICE=$(echo "$RESPONSE" | grep -o '"invoice_number":"[^"]*"' | cut -d'"' -f4)
  echo "✓ Sale created successfully!"
  echo "  Invoice: $INVOICE"
else
  ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo "✗ Sale failed: $ERROR"
fi
```

## Testing with HTTPie

If you have [HTTPie](https://httpie.io/) installed:

```bash
# Get products
http GET :3001/api/products

# Create product
http POST :3001/api/products \
  name="Test Product" \
  supplier_cost:=30.00 \
  sell_price:=40.00 \
  stock_quantity:=100 \
  unit_type=bag \
  pricing_type=per_unit

# Create sale
http POST :3001/api/sales \
  customer_id:=2 \
  items:='[{"product_id":1,"quantity":2}]' \
  payment_amount:=120.00 \
  payment_method=cash
```

## Postman Collection

To import into Postman, create a new collection and add these endpoints. Set a collection variable:
- `baseUrl` = `http://localhost:3001/api`

Then use `{{baseUrl}}/products` in your requests.

---

For more information, see the [main README](../README.md).
