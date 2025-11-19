# Docker Setup Guide

Run The Birds Business Manager using Docker containers.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Install Docker

**Ubuntu:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**macOS:**
Download Docker Desktop from https://www.docker.com/products/docker-desktop

**Windows:**
Download Docker Desktop from https://www.docker.com/products/docker-desktop

## Quick Start with Docker

### 1. Start All Services

```bash
# Start everything (database, backend, frontend)
docker-compose up
```

This will:
- ✅ Start PostgreSQL database
- ✅ Apply database schema automatically
- ✅ Start backend API on http://localhost:3001
- ✅ Start frontend on http://localhost:3000

### 2. Access the Application

Open your browser to:
```
http://localhost:3000
```

Backend API available at:
```
http://localhost:3001/api
```

### 3. Stop Services

```bash
# Stop all services (Ctrl+C in the terminal)
# Or run:
docker-compose down
```

## Docker Commands

### Start in Background (Detached Mode)

```bash
docker-compose up -d
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop and Remove Everything

```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (deletes database)
docker-compose down -v
```

### Rebuild Containers

```bash
# Rebuild after code changes
docker-compose up --build

# Force rebuild
docker-compose build --no-cache
docker-compose up
```

## Database Management

### Access Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d the_birds_db

# List tables
\dt

# Query products
SELECT * FROM products;

# Exit
\q
```

### Backup Database

```bash
docker-compose exec postgres pg_dump -U postgres the_birds_db > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d the_birds_db
```

### Reset Database

```bash
# Stop services
docker-compose down -v

# Start fresh (schema will be applied automatically)
docker-compose up
```

## Development with Docker

### Backend Hot Reload

The backend automatically reloads when you change files in `backend/src/`.

### Frontend Hot Reload

The frontend automatically reloads when you change files in `frontend/src/`.

### Install New Dependencies

If you add dependencies to `package.json`:

```bash
# Rebuild the container
docker-compose up --build backend

# Or rebuild everything
docker-compose up --build
```

### Run Commands Inside Container

```bash
# Backend
docker-compose exec backend npm install new-package
docker-compose exec backend npm run build

# Frontend
docker-compose exec frontend npm install new-package

# PostgreSQL
docker-compose exec postgres psql -U postgres -d the_birds_db
```

## Production Deployment with Docker

### 1. Create Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: the_birds_db
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: the_birds_db
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      NODE_ENV: production
    ports:
      - "3001:3001"
    depends_on:
      - postgres
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always

volumes:
  postgres_data:
```

### 2. Create Production Dockerfiles

**backend/Dockerfile.prod:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

**frontend/Dockerfile.prod:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Deploy

```bash
# Create .env file with production credentials
echo "DB_USER=birds_user" > .env
echo "DB_PASSWORD=secure_password_here" >> .env

# Start production
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Troubleshooting

### Port Already in Use

If ports 3000, 3001, or 5432 are already in use, edit `docker-compose.yml`:

```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Change to different port

  backend:
    ports:
      - "3002:3001"  # Change to different port

  frontend:
    ports:
      - "3001:3000"  # Change to different port
```

### Database Connection Error

Check if PostgreSQL is healthy:
```bash
docker-compose ps
docker-compose logs postgres
```

### Container Won't Start

```bash
# View detailed logs
docker-compose logs backend

# Check container status
docker ps -a

# Remove and rebuild
docker-compose down
docker-compose up --build
```

### Permission Errors

```bash
# Fix ownership (Linux)
sudo chown -R $USER:$USER .

# Rebuild
docker-compose up --build
```

## Advantages of Docker Setup

✅ **Consistency** - Same environment everywhere
✅ **Isolation** - No conflicts with system packages
✅ **Easy Setup** - One command to start everything
✅ **Portable** - Run on any OS that supports Docker
✅ **Clean** - Easy to tear down and start fresh

## Comparison: Docker vs Local

| Feature | Docker | Local Install |
|---------|--------|---------------|
| Setup Time | 2 minutes | 5-10 minutes |
| Dependencies | Isolated | May conflict |
| Database | Containerized | System PostgreSQL |
| Portability | High | Medium |
| Performance | Near-native | Native |

Choose **Docker** if:
- You want quick setup
- You're on Windows/macOS
- You want isolated environment
- You're deploying to production

Choose **Local Install** if:
- You're developing heavily
- You need maximum performance
- You prefer native tools

---

For local installation, see [QUICKSTART.md](../QUICKSTART.md)
