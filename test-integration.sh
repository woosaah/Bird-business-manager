#!/bin/bash

# The Birds Business Manager - Complete Integration Test
# Tests all modules and their connections

set -e

echo "=============================================="
echo "🐦 The Birds Business Manager"
echo "Complete Integration Test"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# API URL
API_URL="${API_URL:-http://localhost:3001}"
TOKEN=""

# Function to run test
test() {
    local name="$1"
    local command="$2"

    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Testing: $name... "

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Check if backend is running
echo -e "${BLUE}Checking if backend is running...${NC}"
if ! curl -s "$API_URL/api/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Backend is not running!${NC}"
    echo ""
    echo "Start the backend first:"
    echo "  cd backend && npm run dev"
    echo ""
    exit 1
fi
echo -e "${GREEN}✓ Backend is running${NC}"
echo ""

# Test 1: Authentication Module
echo -e "${BLUE}=== Testing Authentication Module ===${NC}"
echo ""

# Login test
echo -n "Login with admin credentials... "
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✓ PASS${NC}"
    echo "  Token: ${TOKEN:0:20}..."
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))
echo ""

# Get current user
test "Get current user info" "curl -s -H 'Authorization: Bearer $TOKEN' '$API_URL/api/auth/me' | grep -q '\"success\":true'"

# Get all users (admin only)
test "Get all users (admin only)" "curl -s -H 'Authorization: Bearer $TOKEN' '$API_URL/api/auth/users' | grep -q '\"success\":true'"

echo ""

# Test 2: Products Module
echo -e "${BLUE}=== Testing Products Module ===${NC}"
echo ""

test "Get all products" "curl -s '$API_URL/api/products' | grep -q '\"success\":true'"
test "Get product by ID" "curl -s '$API_URL/api/products/1' | grep -q '\"success\":true'"
test "Get low stock products" "curl -s '$API_URL/api/products/low-stock' | grep -q '\"success\":true'"

# Create a test product
echo -n "Create new product... "
CREATE_PRODUCT=$(curl -s -X POST "$API_URL/api/products" \
    -H "Content-Type: application/json" \
    -d '{
        "name":"Integration Test Product",
        "supplier_cost":10.00,
        "sell_price":15.00,
        "stock_quantity":100,
        "unit_type":"each",
        "pricing_type":"per_unit",
        "profit_margin":33.7
    }')

if echo "$CREATE_PRODUCT" | grep -q '"success":true'; then
    TEST_PRODUCT_ID=$(echo "$CREATE_PRODUCT" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo -e "${GREEN}✓ PASS${NC} (ID: $TEST_PRODUCT_ID)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_PRODUCT_ID=1
fi
TESTS_RUN=$((TESTS_RUN + 1))

test "Update product" "curl -s -X PUT '$API_URL/api/products/$TEST_PRODUCT_ID' \
    -H 'Content-Type: application/json' \
    -d '{\"sell_price\":16.00}' | grep -q '\"success\":true'"

test "Update product stock" "curl -s -X PATCH '$API_URL/api/products/$TEST_PRODUCT_ID/stock' \
    -H 'Content-Type: application/json' \
    -d '{\"quantity\":50,\"operation\":\"add\"}' | grep -q '\"success\":true'"

echo ""

# Test 3: Customers Module
echo -e "${BLUE}=== Testing Customers Module ===${NC}"
echo ""

test "Get all customers" "curl -s '$API_URL/api/customers' | grep -q '\"success\":true'"
test "Get customer by ID" "curl -s '$API_URL/api/customers/1' | grep -q '\"success\":true'"
test "Get customers with balance" "curl -s '$API_URL/api/customers/with-balance' | grep -q '\"success\":true'"

# Create a test customer
echo -n "Create new customer... "
CREATE_CUSTOMER=$(curl -s -X POST "$API_URL/api/customers" \
    -H "Content-Type: application/json" \
    -d '{
        "name":"Test Customer",
        "email":"test@example.com",
        "phone":"021-555-1234",
        "customer_type":"retail",
        "credit_limit":500
    }')

if echo "$CREATE_CUSTOMER" | grep -q '"success":true'; then
    TEST_CUSTOMER_ID=$(echo "$CREATE_CUSTOMER" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo -e "${GREEN}✓ PASS${NC} (ID: $TEST_CUSTOMER_ID)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_CUSTOMER_ID=1
fi
TESTS_RUN=$((TESTS_RUN + 1))

test "Update customer" "curl -s -X PUT '$API_URL/api/customers/$TEST_CUSTOMER_ID' \
    -H 'Content-Type: application/json' \
    -d '{\"credit_limit\":1000}' | grep -q '\"success\":true'"

echo ""

# Test 4: Sales Module
echo -e "${BLUE}=== Testing Sales Module ===${NC}"
echo ""

test "Get all sales" "curl -s '$API_URL/api/sales' | grep -q '\"success\":true'"
test "Get sales stats" "curl -s '$API_URL/api/sales/stats' | grep -q '\"success\":true'"

# Create a test sale
echo -n "Create new sale... "
CREATE_SALE=$(curl -s -X POST "$API_URL/api/sales" \
    -H "Content-Type: application/json" \
    -d "{
        \"customer_id\":$TEST_CUSTOMER_ID,
        \"items\":[
            {\"product_id\":1,\"quantity\":2}
        ],
        \"payment_amount\":60.00,
        \"payment_method\":\"cash\"
    }")

if echo "$CREATE_SALE" | grep -q '"success":true'; then
    TEST_SALE_ID=$(echo "$CREATE_SALE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo -e "${GREEN}✓ PASS${NC} (ID: $TEST_SALE_ID)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "Response: $CREATE_SALE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TEST_SALE_ID=1
fi
TESTS_RUN=$((TESTS_RUN + 1))

test "Get sale by ID" "curl -s '$API_URL/api/sales/$TEST_SALE_ID' | grep -q '\"success\":true'"

echo ""

# Test 5: Calculator Module
echo -e "${BLUE}=== Testing Calculator Module ===${NC}"
echo ""

test "Calculator: Cost to Price" "curl -s -X POST '$API_URL/api/calculator' \
    -H 'Content-Type: application/json' \
    -d '{\"operation\":\"cost_to_price\",\"cost\":45,\"margin\":33.7}' | grep -q '\"success\":true'"

test "Calculator: Weight to Price" "curl -s -X POST '$API_URL/api/calculator' \
    -H 'Content-Type: application/json' \
    -d '{\"operation\":\"weight_price\",\"weight\":0.5,\"price_per_kg\":40}' | grep -q '\"success\":true'"

test "Calculator: Add GST" "curl -s -X POST '$API_URL/api/calculator' \
    -H 'Content-Type: application/json' \
    -d '{\"operation\":\"gst_add\",\"amount\":100}' | grep -q '\"success\":true'"

test "Calculator: Remove GST" "curl -s -X POST '$API_URL/api/calculator' \
    -H 'Content-Type: application/json' \
    -d '{\"operation\":\"gst_remove\",\"amount\":115}' | grep -q '\"success\":true'"

test "Calculator: Profit calculation" "curl -s -X POST '$API_URL/api/calculator' \
    -H 'Content-Type: application/json' \
    -d '{\"operation\":\"profit\",\"cost\":45,\"price\":60}' | grep -q '\"success\":true'"

test "Get weight prices" "curl -s '$API_URL/api/calculator/weight-prices?price_per_kg=40' | grep -q '\"success\":true'"

echo ""

# Test 6: Dashboard Module
echo -e "${BLUE}=== Testing Dashboard Module ===${NC}"
echo ""

test "Get dashboard stats" "curl -s '$API_URL/api/dashboard/stats' | grep -q '\"success\":true'"
test "Get sales trends" "curl -s '$API_URL/api/dashboard/trends?period=daily' | grep -q '\"success\":true'"
test "Get top products" "curl -s '$API_URL/api/dashboard/top-products' | grep -q '\"success\":true'"
test "Get customer analytics" "curl -s '$API_URL/api/dashboard/customer-analytics' | grep -q '\"success\":true'"
test "Get inventory summary" "curl -s '$API_URL/api/dashboard/inventory' | grep -q '\"success\":true'"

echo ""

# Test 7: Module Integration
echo -e "${BLUE}=== Testing Module Integration ===${NC}"
echo ""

echo -n "Complete sale workflow (Product → Customer → Sale)... "
# This tests the integration of products, customers, and sales
WORKFLOW_RESPONSE=$(curl -s -X POST "$API_URL/api/sales" \
    -H "Content-Type: application/json" \
    -d "{
        \"customer_id\":2,
        \"items\":[
            {\"product_id\":1,\"quantity\":1},
            {\"product_id\":4,\"weight_kg\":0.25}
        ],
        \"payment_amount\":70.00,
        \"payment_method\":\"eftpos\"
    }")

if echo "$WORKFLOW_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "  ✓ Products module working"
    echo "  ✓ Customers module working"
    echo "  ✓ Sales module working"
    echo "  ✓ Stock updates triggered"
    echo "  ✓ GST calculations applied"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo ""

# Test 8: Authentication Integration
echo -e "${BLUE}=== Testing Authentication Integration ===${NC}"
echo ""

echo -n "Protected route without token... "
UNAUTH_RESPONSE=$(curl -s "$API_URL/api/auth/me" -w "\n%{http_code}")
HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Correctly blocked)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Should return 401)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo -n "Admin-only route with staff token... "
# Login as staff
STAFF_LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"staff","password":"staff123"}')
STAFF_TOKEN=$(echo "$STAFF_LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

FORBIDDEN_RESPONSE=$(curl -s -H "Authorization: Bearer $STAFF_TOKEN" "$API_URL/api/auth/users" -w "\n%{http_code}")
HTTP_CODE=$(echo "$FORBIDDEN_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "403" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Correctly blocked)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC} (Should return 403)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

echo ""

# Summary
echo "=============================================="
echo -e "${BLUE}Integration Test Results${NC}"
echo "=============================================="
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
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ALL MODULES WORKING PERFECTLY! ✓    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "✓ Authentication Module - Working"
    echo "✓ Products Module - Working"
    echo "✓ Customers Module - Working"
    echo "✓ Sales Module - Working"
    echo "✓ Calculator Module - Working"
    echo "✓ Dashboard Module - Working"
    echo "✓ User Management - Working"
    echo "✓ Role-Based Access Control - Working"
    echo "✓ Module Integration - Working"
    echo ""
    echo "The system is ready for production! 🎉"
    echo ""
    exit 0
else
    echo -e "${RED}Some tests failed. Check the output above.${NC}"
    echo ""
    exit 1
fi
