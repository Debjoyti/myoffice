import requests
import sys
import json
from datetime import datetime, timedelta

class BizOpsPlatformTester:
    def __init__(self, base_url="http://127.0.0.1:8000/api"):
        self.base_url = base_url
        self.token = None
        self.user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'stores': [],
            'employees': [],
            'purchase_requests': [],
            'purchase_orders': [],
            'hr_fields': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.text}")
                except:
                    pass
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login(self):
        """Test login with admin credentials"""
        print("\n\n=== AUTHENTICATION TESTS ===")
        
        # First try to register admin user
        register_success, register_response = self.run_test(
            "Register Admin User",
            "POST",
            "auth/register",
            200,
            data={
                "email": "admin@test.com", 
                "password": "Test@123",
                "name": "Admin User",
                "role": "admin"
            }
        )
        
        if register_success and 'access_token' in register_response:
            self.token = register_response['access_token']
            self.user = register_response['user']
            print(f"✅ Registered and logged in as: {self.user.get('name', 'Unknown')} ({self.user.get('role', 'Unknown')})")
            return True
        else:
            # If registration fails (user might already exist), try login
            success, response = self.run_test(
                "Admin Login",
                "POST",
                "auth/login",
                200,
                data={"email": "admin@test.com", "password": "Test@123"}
            )
            if success and 'access_token' in response:
                self.token = response['access_token']
                self.user = response['user']
                print(f"✅ Logged in as: {self.user.get('name', 'Unknown')} ({self.user.get('role', 'Unknown')})")
                return True
        return False

    def test_dashboard_stats(self):
        """Test enhanced dashboard with new stats"""
        print("\n\n=== DASHBOARD TESTS ===")
        success, response = self.run_test(
            "Enhanced Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            expected_fields = [
                'total_employees', 'active_employees', 'total_projects', 
                'pending_leaves', 'total_leads', 'total_expenses',
                'pending_purchase_requests', 'total_stores'
            ]
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                print(f"❌ Missing dashboard fields: {missing_fields}")
                return False
            else:
                print(f"✅ All 8 dashboard stats present: {list(response.keys())}")
                return True
        return False

    def test_store_management(self):
        """Test complete store CRUD operations"""
        print("\n\n=== STORE MANAGEMENT TESTS ===")
        
        # Create Main Warehouse
        store_data = {
            "name": "Main Warehouse",
            "location": "Mumbai, Maharashtra",
            "manager": "Vikram Singh",
            "contact": "+91 98765 43210"
        }
        success, response = self.run_test(
            "Create Main Warehouse Store",
            "POST",
            "stores",
            200,
            data=store_data
        )
        if success and 'id' in response:
            store_id = response['id']
            self.created_resources['stores'].append(store_id)
            print(f"✅ Created store with ID: {store_id}")
        else:
            return False

        # Create Branch Office
        branch_data = {
            "name": "Branch Office",
            "location": "Delhi",
            "manager": "Rajesh Kumar",
            "contact": "+91 98765 43211"
        }
        success, response = self.run_test(
            "Create Branch Office Store",
            "POST",
            "stores",
            200,
            data=branch_data
        )
        if success and 'id' in response:
            branch_id = response['id']
            self.created_resources['stores'].append(branch_id)
        else:
            return False

        # Get all stores
        success, response = self.run_test(
            "Get All Stores",
            "GET",
            "stores",
            200
        )
        if success:
            stores = response if isinstance(response, list) else []
            print(f"✅ Retrieved {len(stores)} stores")
        else:
            return False

        # Get specific store
        success, response = self.run_test(
            "Get Specific Store",
            "GET",
            f"stores/{store_id}",
            200
        )
        if not success:
            return False

        # Update store
        updated_data = {
            "name": "Main Warehouse Updated",
            "location": "Mumbai, Maharashtra",
            "manager": "Vikram Singh",
            "contact": "+91 98765 43210"
        }
        success, response = self.run_test(
            "Update Store",
            "PUT",
            f"stores/{store_id}",
            200,
            data=updated_data
        )
        if not success:
            return False

        return True

    def test_employee_creation(self):
        """Create test employees for purchase requests"""
        print("\n=== EMPLOYEE SETUP FOR TESTING ===")
        
        # Create department
        success, dept_res = self.run_test("Create Dept", "POST", "departments", 200, data={"name": "IT Setup Test"})
        dept_id = dept_res.get("id") if success else "dummy"

        # Create position
        success, pos_res = self.run_test("Create Pos", "POST", "positions", 200, data={"title": "Test Engineer", "department_id": dept_id})
        pos_id = pos_res.get("id") if success else "dummy"

        employee_data = {
            "name": "Test Employee",
            "email": "test.employee@company.com",
            "phone": "+91 98765 43212",
            "department": "IT",
            "designation": "Software Engineer",
            "date_of_joining": "2024-01-15",
            "position_id": pos_id
        }
        success, response = self.run_test(
            "Create Test Employee",
            "POST",
            "employees",
            200,
            data=employee_data
        )
        if success and 'id' in response:
            emp_id = response['id']
            self.created_resources['employees'].append(emp_id)
            return emp_id
        return None

    def test_purchase_request_system(self):
        """Test complete purchase request workflow"""
        print("\n\n=== PURCHASE REQUEST SYSTEM TESTS ===")
        
        # Ensure we have stores and employees
        if not self.created_resources['stores']:
            print("\n❌ No stores available for testing")
            return False
            
        employee_id = self.test_employee_creation()
        if not employee_id:
            print("\n❌ Failed to create test employee")
            return False

        store_id = self.created_resources['stores'][0]
        
        # Create purchase request
        pr_data = {
            "store_id": store_id,
            "requested_by": employee_id,
            "items": [
                {"name": "Laptops", "quantity": 5, "unit_price": 50000, "total": 250000},
                {"name": "Chairs", "quantity": 10, "unit_price": 5000, "total": 50000},
                {"name": "Desks", "quantity": 5, "unit_price": 15000, "total": 75000}
            ],
            "total_amount": 375000,
            "reason": "Office expansion"
        }
        success, response = self.run_test(
            "Create Purchase Request",
            "POST",
            "purchase-requests",
            200,
            data=pr_data
        )
        if success and 'id' in response:
            pr_id = response['id']
            self.created_resources['purchase_requests'].append(pr_id)
            print(f"✅ Created purchase request with ID: {pr_id}")
            
            # Verify status is pending
            if response.get('status') != 'pending':
                print(f"❌ Expected status 'pending', got '{response.get('status')}'")
                return False
        else:
            return False

        # Get all purchase requests
        success, response = self.run_test(
            "Get All Purchase Requests",
            "GET",
            "purchase-requests",
            200
        )
        if not success:
            return False

        # Approve purchase request (as admin)
        success, response = self.run_test(
            "Approve Purchase Request",
            "PATCH",
            f"purchase-requests/{pr_id}/approve",
            200
        )
        if not success:
            return False

        # Create another request for rejection test
        pr_data2 = {
            "store_id": store_id,
            "requested_by": employee_id,
            "items": [
                {"name": "Expensive Equipment", "quantity": 1, "unit_price": 1000000, "total": 1000000}
            ],
            "total_amount": 1000000,
            "reason": "Unnecessary purchase"
        }
        success, response = self.run_test(
            "Create Second Purchase Request",
            "POST",
            "purchase-requests",
            200,
            data=pr_data2
        )
        if success and 'id' in response:
            pr_id2 = response['id']
            self.created_resources['purchase_requests'].append(pr_id2)
            
            # Reject this request
            success, response = self.run_test(
                "Reject Purchase Request",
                "PATCH",
                f"purchase-requests/{pr_id2}/reject",
                200
            )
            if not success:
                return False
        else:
            return False

        return True

    def test_purchase_orders(self):
        """Test purchase order creation from approved requests"""
        print("\n\n=== PURCHASE ORDER TESTS ===")
        
        if not self.created_resources['purchase_requests']:
            print("\n❌ No purchase requests available for testing")
            return False

        # Use the first (approved) purchase request
        pr_id = self.created_resources['purchase_requests'][0]
        store_id = self.created_resources['stores'][0]
        
        # Create purchase order
        po_data = {
            "purchase_request_id": pr_id,
            "store_id": store_id,
            "supplier_name": "Tech Solutions Pvt Ltd",
            "supplier_contact": "+91 99887 76655",
            "items": [
                {"name": "Laptops", "quantity": 5, "unit_price": 50000, "total": 250000},
                {"name": "Chairs", "quantity": 10, "unit_price": 5000, "total": 50000},
                {"name": "Desks", "quantity": 5, "unit_price": 15000, "total": 75000}
            ],
            "total_amount": 375000,
            "delivery_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "created_by": self.user['id']
        }
        success, response = self.run_test(
            "Create Purchase Order",
            "POST",
            "purchase-orders",
            200,
            data=po_data
        )
        if success and 'id' in response:
            po_id = response['id']
            self.created_resources['purchase_orders'].append(po_id)
            print(f"✅ Created purchase order with ID: {po_id}")
            
            # Verify correct amount
            if response.get('total_amount') != 375000:
                print(f"❌ Expected amount 375000, got {response.get('total_amount')}")
                return False
        else:
            return False

        # Get all purchase orders
        success, response = self.run_test(
            "Get All Purchase Orders",
            "GET",
            "purchase-orders",
            200
        )
        if not success:
            return False

        # Update purchase order status
        success, response = self.run_test(
            "Update Purchase Order Status",
            "PATCH",
            f"purchase-orders/{po_id}/status",
            200,
            data={"status": "approved"}
        )
        if not success:
            return False

        return True

    def test_hr_configuration(self):
        """Test HR custom fields system"""
        print("\n\n=== HR CONFIGURATION TESTS ===")
        
        # Create Blood Group field
        field_data1 = {
            "field_name": "Blood Group",
            "field_type": "dropdown",
            "is_required": True,
            "options": ["A+", "B+", "O+", "AB+", "A-", "B-", "O-", "AB-"],
            "applies_to": "employee"
        }
        success, response = self.run_test(
            "Create Blood Group HR Field",
            "POST",
            "hr-fields",
            200,
            data=field_data1
        )
        if success and 'id' in response:
            field_id1 = response['id']
            self.created_resources['hr_fields'].append(field_id1)
            print(f"✅ Created HR field with ID: {field_id1}")
        else:
            return False

        # Create Emergency Contact field
        field_data2 = {
            "field_name": "Emergency Contact",
            "field_type": "text",
            "is_required": False,
            "applies_to": "employee"
        }
        success, response = self.run_test(
            "Create Emergency Contact HR Field",
            "POST",
            "hr-fields",
            200,
            data=field_data2
        )
        if success and 'id' in response:
            field_id2 = response['id']
            self.created_resources['hr_fields'].append(field_id2)
        else:
            return False

        # Get all HR fields
        success, response = self.run_test(
            "Get All HR Fields",
            "GET",
            "hr-fields",
            200
        )
        if success:
            fields = response if isinstance(response, list) else []
            print(f"✅ Retrieved {len(fields)} HR fields")
        else:
            return False

        # Get HR fields for employees only
        success, response = self.run_test(
            "Get Employee HR Fields",
            "GET",
            "hr-fields?applies_to=employee",
            200
        )
        if not success:
            return False

        return True

    def test_integration_workflow(self):
        """Test complete procurement workflow integration"""
        print("\n\n=== INTEGRATION WORKFLOW TEST ===")
        
        # Verify we have all required resources
        required_resources = ['stores', 'employees', 'purchase_requests', 'purchase_orders']
        for resource in required_resources:
            if not self.created_resources[resource]:
                print(f"❌ Missing {resource} for integration test")
                return False

        # Test dashboard stats update
        success, response = self.run_test(
            "Verify Dashboard Stats After Operations",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            stats = response
            print(f"✅ Dashboard stats after operations:")
            print(f"   - Total Stores: {stats.get('total_stores', 0)}")
            print(f"   - Pending Purchase Requests: {stats.get('pending_purchase_requests', 0)}")
            print(f"   - Total Employees: {stats.get('total_employees', 0)}")
            return True
        return False

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n\n=== CLEANUP TEST DATA ===")
        
        # Delete HR fields
        for field_id in self.created_resources['hr_fields']:
            self.run_test(f"Delete HR Field {field_id}", "DELETE", f"hr-fields/{field_id}", 200)
        
        # Delete employees
        for emp_id in self.created_resources['employees']:
            self.run_test(f"Delete Employee {emp_id}", "DELETE", f"employees/{emp_id}", 200)
        
        # Delete stores (this should be done last as other resources depend on them)
        for store_id in self.created_resources['stores']:
            self.run_test(f"Delete Store {store_id}", "DELETE", f"stores/{store_id}", 200)

    def run_all_tests(self):
        """Run all backend tests"""
        print("\n🚀 Starting BizOps Platform Backend Tests")
        print("\n=" * 50)
        
        # Authentication
        if not self.test_login():
            print("\n❌ Authentication failed, stopping tests")
            return False

        # Dashboard
        if not self.test_dashboard_stats():
            print("\n❌ Dashboard tests failed")
            return False

        # Store Management
        if not self.test_store_management():
            print("\n❌ Store management tests failed")
            return False

        # Purchase Request System
        if not self.test_purchase_request_system():
            print("\n❌ Purchase request tests failed")
            return False

        # Purchase Orders
        if not self.test_purchase_orders():
            print("\n❌ Purchase order tests failed")
            return False

        # HR Configuration
        if not self.test_hr_configuration():
            print("\n❌ HR configuration tests failed")
            return False

        # Integration Test
        if not self.test_integration_workflow():
            print("\n❌ Integration workflow test failed")
            return False

        # Cleanup
        self.cleanup_test_data()

        # Final Results
        print("\n\n" + "=" * 50)
        print(f"📊 BACKEND TEST RESULTS")
        print(f"Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL BACKEND TESTS PASSED!")
            return True
        else:
            print("\n❌ Some backend tests failed")
            return False

def main():
    tester = BizOpsPlatformTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())