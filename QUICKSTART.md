# Quick Start Guide

Get The Birds Business Manager running in 5 minutes!

## Prerequisites

Before you begin, install:
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 12+** - Database server

### Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

## Installation

### 1. Clone & Setup

```bash
# Clone the repository
git clone <repository-url>
cd Bird-business-manager

# Run quick start script
chmod +x quick-start.sh
./quick-start.sh
```

The script will:
- ✓ Install all dependencies (backend & frontend)
- ✓ Create environment file
- ✓ Setup PostgreSQL database
- ✓ Apply database schema with sample data

### 2. Configure Database (if needed)

If the automatic setup didn't work, edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=the_birds_db
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. Start Development Servers

**Option A - Both servers together:**
```bash
npm run dev
```

**Option B - Separate terminals:**

Terminal 1 (Backend):
```bash
npm run dev:backend
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
```

### 4. Access the Application

Open your browser to:
```
http://localhost:3000
```

Backend API runs on:
```
http://localhost:3001
```

(Ports may vary if already in use - the app will auto-detect available ports)

## First Steps

### 1. Check the Dashboard
- View sales statistics
- See recent transactions
- Check low stock alerts

### 2. Add Your Products

Go to **Products** → Click "Add Product"

Example product setup:

**Wild Bird Seed 20kg**
- Unit Type: `bag`
- Pricing Type: `per_unit`
- Supplier Cost: `$45.00` (inc GST)
- Profit Margin: `33.7%`
- Sell Price: `$60.00` (auto-calculated)
- Stock Quantity: `50`

**Cuttlefish (weight-based)**
- Unit Type: `kg`
- Pricing Type: `per_kg`
- Supplier Cost: `$30.00`
- Price per KG: `$40.00`
- Stock Quantity: `25` (kg)

### 3. Add Customers

Go to **Customers** → Click "Add Customer"

Example customers:
- **Walk-in Customer** (already exists)
- **Regular Customer** - Type: `retail`, Credit Limit: `$500`
- **Mate's Discount** - Type: `mates`, Discount: `$5` per item

### 4. Make a Test Sale

Go to **Quick Sale**:

1. Select customer
2. Click on a product
3. For weight-based products, use quick weight buttons or enter custom weight
4. Review totals (shows ex-GST, GST, and total inc-GST)
5. Enter payment amount
6. Click "Complete Sale"

Your first invoice will be: `FTB-000001`

### 5. Use the Calculator

Click "Show Calculator" in Quick Sale to:
- Calculate selling price from cost + margin
- Calculate price for any weight (e.g., "How much is 375g at $40/kg?")
- Add/remove GST from amounts
- Calculate profit margins

## Sample Data

The database comes with sample data:

**Products:**
- Wild Bird Seed Mix 20kg - $60.00
- Canary Seed 20kg - $67.00
- Breeding Aid 1L - $33.50
- Cuttlefish - $40.00/kg

**Customers:**
- Walk-in Customer
- John Smith (retail)
- Bob the Breeder (mates discount)

## Troubleshooting

### "Database connection error"
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Check database exists
sudo -u postgres psql -l | grep the_birds_db
```

### "Port already in use"
The app auto-detects available ports. If you see an error:
```bash
# Check what's using the port
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### "Cannot find module"
```bash
# Reinstall dependencies
npm run install:all
```

### Database schema not applied
```bash
# Manually apply schema
cd deployment
./setup-database.sh
```

## Development Tips

### Hot Reload
Both frontend and backend support hot reload - changes are reflected immediately.

### API Testing
Test the API directly:
```bash
# Get all products
curl http://localhost:3001/api/products

# Health check
curl http://localhost:3001/api/health
```

### Database Access
```bash
# Access database
sudo -u postgres psql -d the_birds_db

# View tables
\dt

# View products
SELECT * FROM products;

# Exit
\q
```

### Logs
Backend logs appear in terminal. For production:
```bash
# View systemd logs
journalctl -u birds-backend -f
```

## Next Steps

- ✓ Configure business settings in **Settings** page
- ✓ Set up Xero integration (optional)
- ✓ Configure email for invoice delivery (optional)
- ✓ Set up Facebook posting (optional)
- ✓ Customize profit margins per product
- ✓ Add your actual product catalog

## Production Deployment

For production deployment to Ubuntu Server:

```bash
cd deployment
chmod +x install.sh
sudo ./install.sh
```

See [README.md](README.md) for full deployment documentation.

## Getting Help

- Check [README.md](README.md) for full documentation
- Review database schema in `database/schema.sql`
- Check API endpoints in backend controllers
- View example data in database

---

**Ready to start?** Run `./quick-start.sh` and you'll be selling bird seed in minutes! 🐦
