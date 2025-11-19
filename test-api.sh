#!/bin/bash

# The Birds Business Manager - API Test Script

echo "=========================================="
echo "🐦 The Birds Business Manager"
echo "API Test Suite"
echo "=========================================="
echo ""

API_URL="${API_URL:-http://localhost:3001/api}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"

    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Testing: $name... "

    if [ -z "$data" ]; then
        response=$(curl -s -X $method "$API_URL$endpoint" -w "\n%{http_code}")
    else
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        if [ "$VERBOSE" = "true" ]; then
            echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "Response: $body"
    fi
    echo ""
}

# Check if server is running
echo "Checking if backend is running..."
if ! curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Backend is not running!${NC}"
    echo ""
    echo "Start the backend first:"
    echo "  npm run dev:backend"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ Backend is running${NC}"
echo ""

# Run tests
echo "Running API tests..."
echo ""

# Health Check
test_api "Health Check" "GET" "/health"

# Products
test_api "Get All Products" "GET" "/products"
test_api "Get Product by ID" "GET" "/products/1"
test_api "Get Low Stock Products" "GET" "/products/low-stock?threshold=10"

# Customers
test_api "Get All Customers" "GET" "/customers"
test_api "Get Customer by ID" "GET" "/customers/2"
test_api "Get Customers with Balance" "GET" "/customers/with-balance"

# Sales
test_api "Get All Sales" "GET" "/sales"
test_api "Get Sales Stats" "GET" "/sales/stats"

# Dashboard
test_api "Get Dashboard Stats" "GET" "/dashboard/stats"
test_api "Get Sales Trends" "GET" "/dashboard/trends?period=daily"
test_api "Get Top Products" "GET" "/dashboard/top-products?limit=5"
test_api "Get Customer Analytics" "GET" "/dashboard/customer-analytics?limit=5"
test_api "Get Inventory Summary" "GET" "/dashboard/inventory"

# Calculator
test_api "Calculator - Cost to Price" "POST" "/calculator" \
    '{"operation":"cost_to_price","cost":45,"margin":33.7}'

test_api "Calculator - Weight to Price" "POST" "/calculator" \
    '{"operation":"weight_price","weight":0.375,"price_per_kg":40}'

test_api "Calculator - Add GST" "POST" "/calculator" \
    '{"operation":"gst_add","amount":100}'

test_api "Calculator - Remove GST" "POST" "/calculator" \
    '{"operation":"gst_remove","amount":115}'

test_api "Calculator - Profit" "POST" "/calculator" \
    '{"operation":"profit","cost":45,"price":60}'

test_api "Get Weight Prices" "GET" "/calculator/weight-prices?price_per_kg=40"

# Summary
echo "=========================================="
echo "Test Results"
echo "=========================================="
echo ""
echo "Tests Run:    $TESTS_RUN"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
else
    echo -e "Tests Failed: $TESTS_FAILED"
fi
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}Some tests failed. Check the output above.${NC}"
    echo ""
    exit 1
fi
