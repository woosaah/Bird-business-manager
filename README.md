# The Birds Business Manager

A complete inventory, sales, and invoicing system built specifically for bird seed businesses. Features real-time stock tracking, customer management, GST calculations, weight-based pricing, and integrated calculator for fast sales entry.

## Features

### 🏪 Core Functionality
- **Quick Sale Interface** - Fast sales entry with built-in calculator
- **Product Management** - Support for unit-based and weight-based pricing (per kg)
- **Customer Management** - Track retail, wholesale, and mate's discount customers
- **Inventory Tracking** - Real-time stock updates with low stock alerts
- **Invoice Generation** - Professional PDF invoices with GST breakdown
- **Credit/Tab System** - Track customer balances and part payments

### 📊 Business Intelligence
- **Dashboard Analytics** - Today, week, and month sales at a glance
- **Sales Trends** - Daily, weekly, and monthly performance
- **Product Analytics** - Top sellers and slow movers
- **Customer Analytics** - Top buyers and purchase patterns
- **Reports** - Inventory valuation, GST reporting, profit margins

### 🔧 Technical Features
- **Built-in Calculator** - Cost→Price, Weight→Price, GST calculations, Profit margins
- **Auto Port Detection** - Automatically finds available ports (3000-4000 range)
- **Weight-Based Pricing** - Quick weight buttons (125g, 200g, 250g, 500g, 1kg)
- **GST Compliance** - Automatic 15% GST calculations for New Zealand
- **Responsive Design** - Works on desktop, tablet, and mobile

### 🔌 Integrations (Ready for Setup)
- **Xero Accounting** - OAuth 2.0 sync for invoices and payments
- **Facebook Integration** - Post opening hours to your business page
- **Email Service** - Send invoices directly to customers

## Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL database
- TypeScript
- Port auto-detection (3001+)

**Frontend:**
- React 18 + TypeScript
- Vite (fast build tool)
- TailwindCSS
- React Query (data fetching)
- React Router (navigation)

**Key Libraries:**
- `@h1dd3nsn1p3r/pdf-invoice` - PDF generation
- `xero-node` - Xero integration
- `fb` - Facebook Graph API
- `nodemailer` - Email delivery

## Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Ubuntu Server (recommended) or Linux/macOS

### Quick Start (Development)

1. **Clone the repository**
```bash
git clone <repository-url>
cd Bird-business-manager
```

2. **Setup Database**
```bash
cd deployment
chmod +x setup-database.sh
./setup-database.sh
```

3. **Configure Backend**
```bash
cd ../backend
cp .env.example .env
nano .env  # Edit with your database credentials
```

4. **Install and Start Backend**
```bash
npm install
npm run dev
```
Backend will start on http://localhost:3001 (or next available port)

5. **Install and Start Frontend** (in a new terminal)
```bash
cd ../frontend
npm install
npm run dev
```
Frontend will start on http://localhost:3000 (or next available port)

6. **Access the application**
```
Open http://localhost:3000 in your browser
```

### Production Deployment

For production deployment on Ubuntu Server:

```bash
cd deployment
chmod +x install.sh
sudo ./install.sh
```

This will:
- Install to `/opt/birds-business-manager`
- Setup PostgreSQL database
- Build frontend and backend
- Install systemd service for auto-start
- Configure permissions

Then configure your environment:
```bash
sudo nano /opt/birds-business-manager/backend/.env
sudo systemctl start birds-backend
sudo systemctl status birds-backend
```

## Configuration

### Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=the_birds_db
DB_USER=postgres
DB_PASSWORD=your_password

# Server
BACKEND_PORT=3001
NODE_ENV=production

# Business Settings
DEFAULT_PROFIT_MARGIN=33.7
GST_RATE=0.15
INVOICE_PREFIX=FTB

# Xero (optional)
XERO_CLIENT_ID=your_client_id
XERO_CLIENT_SECRET=your_secret
XERO_REDIRECT_URI=http://localhost:3001/api/xero/callback

# Facebook (optional)
FB_PAGE_ACCESS_TOKEN=your_token
FB_PAGE_ID=your_page_id

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
```

## Database Schema

The system uses PostgreSQL with the following main tables:

- **products** - Product catalog with unit/kg pricing
- **customers** - Customer database with credit tracking
- **sales** - Sales transactions with invoice numbers
- **sale_items** - Individual line items (supports quantity or weight)
- **payments** - Payment tracking for part-payments
- **supplier_invoices** - Import supplier invoices
- **availability_schedule** - Opening hours management
- **xero_sync_log** - Xero synchronization tracking

## Usage Guide

### Making a Quick Sale

1. Navigate to **Quick Sale** from the sidebar
2. Select customer (or leave as "Walk-in")
3. Click on products to add to sale
   - For weight-based products: Use quick weight buttons or enter custom weight
   - For unit-based products: Enter quantity
4. Review totals (ex GST, GST amount, inc GST)
5. Enter payment method and amount
6. Click "Complete Sale"

### Using the Calculator

The built-in calculator supports:
- **Cost → Price**: Calculate selling price with margin
- **Weight → Price**: Calculate price for any weight
- **Add GST**: Add 15% GST to amount
- **Remove GST**: Calculate ex-GST amount
- **Profit**: Calculate profit and margin percentage

### Managing Products

**Add New Product:**
1. Go to **Products** → Click "Add Product"
2. Enter product details:
   - Name (e.g., "Wild Bird Seed 20kg")
   - Unit type (bag, bottle, kg, each)
   - Pricing type (per unit or per kg)
   - Supplier cost (inc GST)
   - Profit margin (default 33.7%)
   - Stock quantity
3. System auto-calculates sell price

**Weight-Based Products:**
- Set "Pricing Type" to "Per KG"
- Enter "Price per KG"
- Stock quantity is tracked in kilograms
- Quick weight buttons appear in sales for easy selection

### Managing Customers

**Add Customer:**
1. Go to **Customers** → Click "Add Customer"
2. Enter details (name, email, phone, address)
3. Set customer type:
   - **Retail**: Regular customers
   - **Wholesale**: Bulk buyers
   - **Mates**: Friends with special discount
4. Set discount amount (for mates) and credit limit

**Track Credit:**
- Customer balances update automatically on sales
- View outstanding balances on dashboard
- Add payments to reduce balance

## Business Rules

### Pricing
- All prices include GST (15% in New Zealand)
- Default profit margin: 33.7% (configurable per product)
- Mates discount: Typically $5 off per item (stored per customer)

### Weight-Based Products
Example: Cuttlefish at $40/kg
- 125g = $5.00
- 200g = $8.00
- 250g = $10.00
- 500g = $20.00
- 1kg = $40.00

Formula: `price = (weight_in_kg × price_per_kg)`, rounded to nearest $0.50

### Invoice Numbering
- Format: `FTB-NNNNNN` (e.g., FTB-000001)
- Sequential numbering
- Configurable prefix in settings

## API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `PATCH /api/products/:id/stock` - Update stock
- `GET /api/products/low-stock` - Get low stock products

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer with purchase history
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `GET /api/customers/with-balance` - Get customers with owing balance

### Sales
- `GET /api/sales` - List sales
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales` - Create sale
- `POST /api/sales/:id/payments` - Add payment
- `GET /api/sales/stats` - Get sales statistics

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/trends` - Sales trends
- `GET /api/dashboard/top-products` - Top selling products
- `GET /api/dashboard/customer-analytics` - Customer analytics

### Calculator
- `POST /api/calculator` - Perform calculation

## Keyboard Shortcuts (Coming Soon)

- `Ctrl+N` - New sale
- `Ctrl+P` - Add product
- `Ctrl+K` - Open calculator
- `Tab` - Navigate between fields
- `Enter` - Confirm selection

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify database exists: `sudo -u postgres psql -l | grep the_birds_db`
- Check `.env` file has correct credentials

### Port already in use
- The app auto-detects available ports
- Check what's using the port: `lsof -i :3001`
- Kill the process or let auto-detection find another port

### Database connection error
- Verify credentials in `.env`
- Check PostgreSQL is accepting connections
- Ensure database exists and schema is applied

### Frontend can't connect to backend
- Check backend is running
- Verify `VITE_API_URL` in frontend build
- Check CORS settings if deployed separately

## Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production
```bash
# Build backend
cd backend
npm run build

# Build frontend
cd frontend
npm run build
```

### Database Migrations
```bash
# Apply schema
cd deployment
./setup-database.sh

# Manual schema updates
sudo -u postgres psql -d the_birds_db -f ../database/schema.sql
```

## Roadmap

- [ ] PDF invoice generation with @h1dd3nsn1p3r/pdf-invoice
- [ ] Xero OAuth integration and sync
- [ ] Facebook schedule posting
- [ ] Email invoice delivery
- [ ] Supplier invoice import (Topflite format)
- [ ] Advanced reporting (profit by product, customer lifetime value)
- [ ] Barcode scanning support
- [ ] Mobile app (React Native)
- [ ] Multi-location support

## Support

For issues, questions, or feature requests, please contact the development team.

## License

Proprietary - All rights reserved

---

**The Birds Business Manager** - Making bird seed sales a breeze! 🐦
