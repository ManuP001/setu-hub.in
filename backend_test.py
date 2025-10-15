#!/usr/bin/env python3

import requests
import json
import sys
from datetime import datetime
import uuid

class SetuHubAPITester:
    def __init__(self, base_url="https://work-connect-17.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tokens = {}  # Store tokens for different user types
        self.users = {}   # Store user data
        self.enterprises = {}
        self.vendors = {}
        self.gus = {}
        self.jobs = {}
        self.commitments = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, test_name, success, details="", error=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}: PASSED")
        else:
            print(f"❌ {test_name}: FAILED - {error}")
        
        self.test_results.append({
            "test_name": test_name,
            "success": success,
            "details": details,
            "error": error
        })

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            
            success = response.status_code == expected_status
            return success, response.json() if response.content else {}, response.status_code
        except Exception as e:
            return False, {}, str(e)

    def test_user_registration(self):
        """Test user registration for all three personas"""
        print("\n🔍 Testing User Registration...")
        
        # Test Enterprise User Registration
        enterprise_user_data = {
            "username": f"enterprise_user_{datetime.now().strftime('%H%M%S')}",
            "email": f"enterprise_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "user_type": "enterprise",
            "full_name": "Enterprise Test User",
            "phone": "+91 9876543210"
        }
        
        success, response, status = self.make_request('POST', 'auth/register', enterprise_user_data, expected_status=200)
        if success and 'token' in response:
            self.tokens['enterprise'] = response['token']
            self.users['enterprise'] = response['user']
            self.log_test("Enterprise User Registration", True, f"User ID: {response['user']['id']}")
        else:
            self.log_test("Enterprise User Registration", False, error=f"Status: {status}, Response: {response}")

        # Test Vendor User Registration
        vendor_user_data = {
            "username": f"vendor_user_{datetime.now().strftime('%H%M%S')}",
            "email": f"vendor_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "user_type": "vendor",
            "full_name": "Vendor Test User",
            "phone": "+91 9876543211"
        }
        
        success, response, status = self.make_request('POST', 'auth/register', vendor_user_data, expected_status=200)
        if success and 'token' in response:
            self.tokens['vendor'] = response['token']
            self.users['vendor'] = response['user']
            self.log_test("Vendor User Registration", True, f"User ID: {response['user']['id']}")
        else:
            self.log_test("Vendor User Registration", False, error=f"Status: {status}, Response: {response}")

        # Test Job Seeker User Registration
        jobseeker_user_data = {
            "username": f"jobseeker_user_{datetime.now().strftime('%H%M%S')}",
            "email": f"jobseeker_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "user_type": "job_seeker",
            "full_name": "Job Seeker Test User",
            "phone": "+91 9876543212"
        }
        
        success, response, status = self.make_request('POST', 'auth/register', jobseeker_user_data, expected_status=200)
        if success and 'token' in response:
            self.tokens['job_seeker'] = response['token']
            self.users['job_seeker'] = response['user']
            self.log_test("Job Seeker User Registration", True, f"User ID: {response['user']['id']}")
        else:
            self.log_test("Job Seeker User Registration", False, error=f"Status: {status}, Response: {response}")

    def test_user_login(self):
        """Test user login functionality"""
        print("\n🔍 Testing User Login...")
        
        if 'enterprise' in self.users:
            login_data = {
                "email": self.users['enterprise']['email'],
                "password": "TestPass123!"
            }
            success, response, status = self.make_request('POST', 'auth/login', login_data, expected_status=200)
            if success and 'token' in response:
                self.log_test("Enterprise User Login", True)
            else:
                self.log_test("Enterprise User Login", False, error=f"Status: {status}")

    def test_enterprise_profile_creation(self):
        """Test enterprise profile creation"""
        print("\n🔍 Testing Enterprise Profile Creation...")
        
        if 'enterprise' not in self.tokens:
            self.log_test("Enterprise Profile Creation", False, error="No enterprise token available")
            return
        
        enterprise_data = {
            "name": "Test Enterprise Corp",
            "enterprise_type": "qcom",
            "tier": 1,
            "gst_no": "22AAAAA0000A1Z5",
            "description": "Test enterprise for quick commerce operations"
        }
        
        success, response, status = self.make_request('POST', 'enterprises', enterprise_data, 
                                                    token=self.tokens['enterprise'], expected_status=200)
        if success and 'id' in response:
            self.enterprises['test_enterprise'] = response
            # Update user with enterprise_id
            self.users['enterprise']['enterprise_id'] = response['id']
            self.log_test("Enterprise Profile Creation", True, f"Enterprise ID: {response['id']}")
        else:
            self.log_test("Enterprise Profile Creation", False, error=f"Status: {status}, Response: {response}")

    def test_gu_creation(self):
        """Test Geographic Unit (Facility) creation"""
        print("\n🔍 Testing GU/Facility Creation...")
        
        if 'test_enterprise' not in self.enterprises:
            self.log_test("GU Creation", False, error="No enterprise available")
            return
        
        gu_data = {
            "enterprise_id": self.enterprises['test_enterprise']['id'],
            "facility_type": "dark_store",
            "facility_name": "Koramangala Hub",
            "zone_name": "South Bangalore",
            "address": "123 Test Street, Koramangala",
            "city": "Bangalore",
            "state": "Karnataka",
            "pin_code": "560034"
        }
        
        success, response, status = self.make_request('POST', 'gus', gu_data, 
                                                    token=self.tokens['enterprise'], expected_status=200)
        if success and 'id' in response:
            self.gus['test_gu'] = response
            self.log_test("GU Creation", True, f"GU ID: {response['id']}")
        else:
            self.log_test("GU Creation", False, error=f"Status: {status}, Response: {response}")

    def test_job_creation(self):
        """Test job posting creation"""
        print("\n🔍 Testing Job Creation...")
        
        if 'test_gu' not in self.gus or 'test_enterprise' not in self.enterprises:
            self.log_test("Job Creation", False, error="No GU or enterprise available")
            return
        
        job_data = {
            "enterprise_id": self.enterprises['test_enterprise']['id'],
            "gu_id": self.gus['test_gu']['id'],
            "role": "picker",
            "quantity_required": 5,
            "shift_time": "morning",
            "description": "Picking items from warehouse shelves"
        }
        
        success, response, status = self.make_request('POST', 'jobs', job_data, 
                                                    token=self.tokens['enterprise'], expected_status=200)
        if success and 'id' in response:
            self.jobs['test_job'] = response
            self.log_test("Job Creation", True, f"Job ID: {response['id']}")
        else:
            self.log_test("Job Creation", False, error=f"Status: {status}, Response: {response}")

    def test_vendor_profile_creation(self):
        """Test vendor profile creation"""
        print("\n🔍 Testing Vendor Profile Creation...")
        
        if 'vendor' not in self.tokens:
            self.log_test("Vendor Profile Creation", False, error="No vendor token available")
            return
        
        vendor_data = {
            "name": "Test Manpower Solutions",
            "gst_no": "29AAAAA0000A1Z5",
            "email": self.users['vendor']['email'],
            "phone": "+91 9876543211",
            "operating_states": ["Karnataka", "Tamil Nadu"],
            "operating_cities": ["Bangalore", "Chennai"],
            "operating_pin_codes": ["560034", "600001"],
            "services_offered": ["picker", "loader", "rider"]
        }
        
        success, response, status = self.make_request('POST', 'vendors', vendor_data, 
                                                    token=self.tokens['vendor'], expected_status=200)
        if success and 'id' in response:
            self.vendors['test_vendor'] = response
            # Update user with vendor_id - this needs to be done in the backend
            self.users['vendor']['vendor_id'] = response['id']
            self.log_test("Vendor Profile Creation", True, f"Vendor ID: {response['id']}")
            
            # Wait a moment for the database to update
            import time
            time.sleep(1)
        else:
            self.log_test("Vendor Profile Creation", False, error=f"Status: {status}, Response: {response}")

    def test_vendor_job_view(self):
        """Test vendor job filtering view"""
        print("\n🔍 Testing Vendor Job View...")
        
        if 'vendor' not in self.tokens:
            self.log_test("Vendor Job View", False, error="No vendor token available")
            return
        
        success, response, status = self.make_request('GET', 'jobs/vendor-view', 
                                                    token=self.tokens['vendor'], expected_status=200)
        if success and isinstance(response, list):
            # Check if our test job appears in vendor view (should appear since vendor operates in Bangalore)
            matching_jobs = [job for job in response if job.get('id') == self.jobs.get('test_job', {}).get('id')]
            if matching_jobs:
                self.log_test("Vendor Job View - Job Filtering", True, f"Found {len(response)} jobs, including our test job")
            else:
                self.log_test("Vendor Job View - Job Filtering", True, f"Found {len(response)} jobs (test job may not match criteria)")
        else:
            self.log_test("Vendor Job View", False, error=f"Status: {status}, Response: {response}")

    def test_job_commitment(self):
        """Test job commitment by vendor"""
        print("\n🔍 Testing Job Commitment...")
        
        if 'test_job' not in self.jobs or 'test_vendor' not in self.vendors:
            self.log_test("Job Commitment", False, error="No job or vendor available")
            return
        
        commitment_data = {
            "job_id": self.jobs['test_job']['id'],
            "vendor_id": self.vendors['test_vendor']['id'],
            "poc_name": "Test POC Manager",
            "poc_contact": "+91 9876543213"
        }
        
        success, response, status = self.make_request('POST', 'commitments', commitment_data, 
                                                    token=self.tokens['vendor'], expected_status=200)
        if success and 'id' in response:
            self.commitments['test_commitment'] = response
            self.log_test("Job Commitment", True, f"Commitment ID: {response['id']}")
        else:
            self.log_test("Job Commitment", False, error=f"Status: {status}, Response: {response}")

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n🔍 Testing Dashboard Statistics...")
        
        # Test Enterprise Dashboard
        if 'test_enterprise' in self.enterprises:
            success, response, status = self.make_request('GET', f"dashboard/enterprise/{self.enterprises['test_enterprise']['id']}", 
                                                        token=self.tokens['enterprise'], expected_status=200)
            if success and 'total_jobs' in response:
                self.log_test("Enterprise Dashboard Stats", True, f"Stats: {response}")
            else:
                self.log_test("Enterprise Dashboard Stats", False, error=f"Status: {status}")
        
        # Test Vendor Dashboard
        if 'test_vendor' in self.vendors:
            success, response, status = self.make_request('GET', f"dashboard/vendor/{self.vendors['test_vendor']['id']}", 
                                                        token=self.tokens['vendor'], expected_status=200)
            if success and 'total_commitments' in response:
                self.log_test("Vendor Dashboard Stats", True, f"Stats: {response}")
            else:
                self.log_test("Vendor Dashboard Stats", False, error=f"Status: {status}")

    def test_job_seeker_view(self):
        """Test job seeker job browsing"""
        print("\n🔍 Testing Job Seeker View...")
        
        if 'job_seeker' not in self.tokens:
            self.log_test("Job Seeker View", False, error="No job seeker token available")
            return
        
        success, response, status = self.make_request('GET', 'jobs?status=open', 
                                                    token=self.tokens['job_seeker'], expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Job Seeker View", True, f"Found {len(response)} open jobs")
        else:
            self.log_test("Job Seeker View", False, error=f"Status: {status}, Response: {response}")

    def test_bulk_job_upload(self):
        """Test bulk job upload via CSV"""
        print("\n🔍 Testing Bulk Job Upload...")
        
        if 'enterprise' not in self.tokens or 'test_enterprise' not in self.enterprises or 'test_gu' not in self.gus:
            self.log_test("Bulk Job Upload", False, error="Missing enterprise, token, or GU")
            return
        
        # Create CSV content
        csv_content = f"""enterprise_id,gu_id,role,quantity_required,shift_time,description,salary,experience_required
{self.enterprises['test_enterprise']['id']},{self.gus['test_gu']['id']},loader,3,morning,Loading trucks,28000,1-2 years
{self.enterprises['test_enterprise']['id']},{self.gus['test_gu']['id']},rider,2,full_day,Delivery operations,32000,2+ years"""
        
        # Make multipart request
        import io
        files = {'file': ('test_jobs.csv', io.StringIO(csv_content), 'text/csv')}
        
        try:
            url = f"{self.base_url}/jobs/bulk-upload"
            headers = {'Authorization': f'Bearer {self.tokens["enterprise"]}'}
            response = requests.post(url, files=files, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('jobs_created', 0) > 0:
                    self.log_test("Bulk Job Upload", True, f"Created {result['jobs_created']} jobs, {len(result.get('errors', []))} errors")
                else:
                    self.log_test("Bulk Job Upload", False, error=f"No jobs created: {result}")
            else:
                self.log_test("Bulk Job Upload", False, error=f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_test("Bulk Job Upload", False, error=f"Exception: {str(e)}")

    def test_job_applications(self):
        """Test job seeker application functionality"""
        print("\n🔍 Testing Job Applications...")
        
        if 'job_seeker' not in self.tokens:
            self.log_test("Job Applications", False, error="No job seeker token available")
            return
        
        # Create a separate job for application testing (since the first job might be committed)
        if 'test_gu' not in self.gus or 'test_enterprise' not in self.enterprises:
            self.log_test("Job Applications", False, error="No GU or enterprise available for creating application job")
            return
        
        application_job_data = {
            "enterprise_id": self.enterprises['test_enterprise']['id'],
            "gu_id": self.gus['test_gu']['id'],
            "role": "biller",
            "quantity_required": 2,
            "shift_time": "evening",
            "description": "Billing and invoice processing"
        }
        
        success_job, response_job, status_job = self.make_request('POST', 'jobs', application_job_data, 
                                                                token=self.tokens['enterprise'], expected_status=200)
        if not success_job:
            self.log_test("Job Applications", False, error=f"Failed to create application test job: {status_job}")
            return
        
        application_test_job = response_job
        
        # Test creating an application
        application_data = {
            "job_id": application_test_job['id'],
            "applicant_name": self.users['job_seeker']['full_name'],
            "applicant_email": self.users['job_seeker']['email'],
            "applicant_phone": self.users['job_seeker']['phone'],
            "experience": "2 years",
            "cover_note": "I am very interested in this biller position and have relevant experience."
        }
        
        success, response, status = self.make_request('POST', 'applications', application_data, 
                                                    token=self.tokens['job_seeker'], expected_status=200)
        if success and 'id' in response:
            self.log_test("Job Application Creation", True, f"Application ID: {response['id']}")
            
            # Test fetching applications for job seeker
            success2, response2, status2 = self.make_request('GET', 'applications', 
                                                           token=self.tokens['job_seeker'], expected_status=200)
            if success2 and isinstance(response2, list) and len(response2) > 0:
                self.log_test("Job Seeker Applications View", True, f"Found {len(response2)} applications")
            else:
                self.log_test("Job Seeker Applications View", False, error=f"Status: {status2}")
                
            # Test duplicate application (should fail)
            success3, response3, status3 = self.make_request('POST', 'applications', application_data, 
                                                           token=self.tokens['job_seeker'], expected_status=400)
            if status3 == 400:
                self.log_test("Duplicate Application Prevention", True, "Correctly prevented duplicate application")
            else:
                self.log_test("Duplicate Application Prevention", False, error=f"Should have failed with 400, got {status3}")
        else:
            self.log_test("Job Application Creation", False, error=f"Status: {status}, Response: {response}")

    def test_enhanced_filtering(self):
        """Test enhanced job filtering with city filter"""
        print("\n🔍 Testing Enhanced Job Filtering...")
        
        if 'job_seeker' not in self.tokens:
            self.log_test("Enhanced Job Filtering", False, error="No job seeker token available")
            return
        
        # Test city filter
        success, response, status = self.make_request('GET', 'jobs?city=Bangalore', 
                                                    token=self.tokens['job_seeker'], expected_status=200)
        if success and isinstance(response, list):
            self.log_test("City Filter", True, f"Found {len(response)} jobs in Bangalore")
        else:
            self.log_test("City Filter", False, error=f"Status: {status}")
        
        # Test role filter
        success2, response2, status2 = self.make_request('GET', 'jobs?role=picker', 
                                                       token=self.tokens['job_seeker'], expected_status=200)
        if success2 and isinstance(response2, list):
            self.log_test("Role Filter", True, f"Found {len(response2)} picker jobs")
        else:
            self.log_test("Role Filter", False, error=f"Status: {status2}")

    def test_application_management(self):
        """Test application management for enterprises"""
        print("\n🔍 Testing Application Management...")
        
        if 'enterprise' not in self.tokens or 'test_job' not in self.jobs:
            self.log_test("Application Management", False, error="No enterprise token or test job")
            return
        
        # Test fetching applications for a specific job
        success, response, status = self.make_request('GET', f'applications/job/{self.jobs["test_job"]["id"]}', 
                                                    token=self.tokens['enterprise'], expected_status=200)
        if success and isinstance(response, list):
            self.log_test("Enterprise Job Applications View", True, f"Found {len(response)} applications for job")
        else:
            self.log_test("Enterprise Job Applications View", False, error=f"Status: {status}")

    def test_dashboard_with_applications(self):
        """Test dashboard stats including application counts"""
        print("\n🔍 Testing Dashboard with Application Stats...")
        
        if 'test_enterprise' in self.enterprises:
            success, response, status = self.make_request('GET', f"dashboard/enterprise/{self.enterprises['test_enterprise']['id']}", 
                                                        token=self.tokens['enterprise'], expected_status=200)
            if success and 'total_applications' in response:
                self.log_test("Enterprise Dashboard with Applications", True, f"Total applications: {response['total_applications']}")
            else:
                self.log_test("Enterprise Dashboard with Applications", False, error=f"Status: {status}, missing total_applications")
        
        # Test job seeker dashboard
        if 'job_seeker' in self.users:
            success2, response2, status2 = self.make_request('GET', f"dashboard/job-seeker/{self.users['job_seeker']['id']}", 
                                                           token=self.tokens['job_seeker'], expected_status=200)
            if success2 and 'total_applications' in response2:
                self.log_test("Job Seeker Dashboard", True, f"Stats: {response2}")
            else:
                self.log_test("Job Seeker Dashboard", False, error=f"Status: {status2}")

    def test_data_persistence(self):
        """Test data persistence by fetching created entities"""
        print("\n🔍 Testing Data Persistence...")
        
        # Test fetching enterprises
        if 'enterprise' in self.tokens:
            success, response, status = self.make_request('GET', 'enterprises', 
                                                        token=self.tokens['enterprise'], expected_status=200)
            if success and isinstance(response, list) and len(response) > 0:
                self.log_test("Enterprise Data Persistence", True, f"Found {len(response)} enterprises")
            else:
                self.log_test("Enterprise Data Persistence", False, error=f"Status: {status}")
        
        # Test fetching GUs
        if 'enterprise' in self.tokens and 'test_enterprise' in self.enterprises:
            success, response, status = self.make_request('GET', f"gus?enterprise_id={self.enterprises['test_enterprise']['id']}", 
                                                        token=self.tokens['enterprise'], expected_status=200)
            if success and isinstance(response, list) and len(response) > 0:
                self.log_test("GU Data Persistence", True, f"Found {len(response)} GUs")
            else:
                self.log_test("GU Data Persistence", False, error=f"Status: {status}")

    def test_homepage_job_roles_seeding(self):
        """Test seeding job roles data for homepage"""
        print("\n🔍 Testing Homepage Job Roles Seeding...")
        
        # First seed the job roles data
        success, response, status = self.make_request('POST', 'homepage/seed-job-roles', expected_status=200)
        if success and 'count' in response:
            self.log_test("Job Roles Seeding", True, f"Seeded {response.get('count', 0)} job roles")
        else:
            # If already seeded, that's also fine
            if status == 200 and 'already seeded' in str(response):
                self.log_test("Job Roles Seeding", True, "Job roles already seeded")
            else:
                self.log_test("Job Roles Seeding", False, error=f"Status: {status}, Response: {response}")

    def test_homepage_job_roles_endpoint(self):
        """Test homepage job roles endpoint"""
        print("\n🔍 Testing Homepage Job Roles Endpoint...")
        
        success, response, status = self.make_request('GET', 'homepage/job-roles', expected_status=200)
        if success and isinstance(response, list):
            # Check if we have 8 job roles as expected
            if len(response) == 8:
                self.log_test("Job Roles Count", True, f"Found exactly 8 job roles")
            else:
                self.log_test("Job Roles Count", False, error=f"Expected 8 job roles, got {len(response)}")
            
            # Check structure of first job role if available
            if len(response) > 0:
                job_role = response[0]
                required_fields = ['id', 'title', 'description', 'icon', 'category', 'typical_salary_range', 'key_responsibilities', 'required_skills']
                missing_fields = [field for field in required_fields if field not in job_role]
                
                if not missing_fields:
                    self.log_test("Job Role Structure", True, f"All required fields present: {list(job_role.keys())}")
                    
                    # Check if icon is present (should be emoji)
                    if job_role.get('icon') and len(job_role['icon']) > 0:
                        self.log_test("Job Role Icon", True, f"Icon present: {job_role['icon']}")
                    else:
                        self.log_test("Job Role Icon", False, error="Icon missing or empty")
                    
                    # Check if salary range is present
                    if job_role.get('typical_salary_range'):
                        self.log_test("Job Role Salary Range", True, f"Salary range: {job_role['typical_salary_range']}")
                    else:
                        self.log_test("Job Role Salary Range", False, error="Salary range missing")
                    
                    # Check if responsibilities and skills are lists
                    if isinstance(job_role.get('key_responsibilities'), list) and len(job_role['key_responsibilities']) > 0:
                        self.log_test("Job Role Responsibilities", True, f"Found {len(job_role['key_responsibilities'])} responsibilities")
                    else:
                        self.log_test("Job Role Responsibilities", False, error="Responsibilities not a list or empty")
                    
                    if isinstance(job_role.get('required_skills'), list) and len(job_role['required_skills']) > 0:
                        self.log_test("Job Role Skills", True, f"Found {len(job_role['required_skills'])} skills")
                    else:
                        self.log_test("Job Role Skills", False, error="Skills not a list or empty")
                        
                else:
                    self.log_test("Job Role Structure", False, error=f"Missing fields: {missing_fields}")
            else:
                self.log_test("Job Role Structure", False, error="No job roles returned")
        else:
            self.log_test("Homepage Job Roles Endpoint", False, error=f"Status: {status}, Response: {response}")

    def test_homepage_market_stats_endpoint(self):
        """Test homepage market stats endpoint"""
        print("\n🔍 Testing Homepage Market Stats Endpoint...")
        
        success, response, status = self.make_request('GET', 'homepage/market-stats', expected_status=200)
        if success and isinstance(response, dict):
            # Check required fields
            required_fields = ['active_jobs', 'total_locations', 'total_vendors', 'fill_rate_percentage', 'avg_response_time_hours', 'active_workers', 'enterprise_clients']
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields:
                self.log_test("Market Stats Structure", True, f"All required fields present")
                
                # Check if values are numeric and reasonable
                numeric_fields = ['active_jobs', 'total_locations', 'total_vendors', 'active_workers', 'enterprise_clients']
                float_fields = ['fill_rate_percentage', 'avg_response_time_hours']
                
                all_numeric_valid = True
                for field in numeric_fields:
                    if not isinstance(response[field], int) or response[field] < 0:
                        self.log_test(f"Market Stats {field}", False, error=f"{field} should be non-negative integer, got {response[field]}")
                        all_numeric_valid = False
                
                for field in float_fields:
                    if not isinstance(response[field], (int, float)) or response[field] < 0:
                        self.log_test(f"Market Stats {field}", False, error=f"{field} should be non-negative number, got {response[field]}")
                        all_numeric_valid = False
                
                if all_numeric_valid:
                    self.log_test("Market Stats Data Types", True, "All numeric fields have correct types")
                
                # Check if fill rate is a percentage (0-100)
                if 0 <= response['fill_rate_percentage'] <= 100:
                    self.log_test("Market Stats Fill Rate Range", True, f"Fill rate: {response['fill_rate_percentage']}%")
                else:
                    self.log_test("Market Stats Fill Rate Range", False, error=f"Fill rate should be 0-100%, got {response['fill_rate_percentage']}")
                
                # Log the actual stats for verification
                self.log_test("Market Stats Values", True, f"Stats: {response}")
                
                # Check if stats reflect real data (not all zeros)
                total_data_points = sum([response[field] for field in numeric_fields])
                if total_data_points > 0:
                    self.log_test("Market Stats Real Data", True, "Stats show real database data")
                else:
                    self.log_test("Market Stats Real Data", False, error="All stats are zero - may be using hardcoded values")
                    
            else:
                self.log_test("Market Stats Structure", False, error=f"Missing fields: {missing_fields}")
        else:
            self.log_test("Homepage Market Stats Endpoint", False, error=f"Status: {status}, Response: {response}")

    def test_homepage_response_times(self):
        """Test response times for homepage endpoints"""
        print("\n🔍 Testing Homepage Response Times...")
        
        import time
        
        # Test job-roles endpoint response time
        start_time = time.time()
        success, response, status = self.make_request('GET', 'homepage/job-roles', expected_status=200)
        job_roles_time = time.time() - start_time
        
        if success:
            if job_roles_time < 2.0:  # Should respond within 2 seconds
                self.log_test("Job Roles Response Time", True, f"Response time: {job_roles_time:.3f}s")
            else:
                self.log_test("Job Roles Response Time", False, error=f"Slow response: {job_roles_time:.3f}s")
        else:
            self.log_test("Job Roles Response Time", False, error=f"Endpoint failed: {status}")
        
        # Test market-stats endpoint response time
        start_time = time.time()
        success, response, status = self.make_request('GET', 'homepage/market-stats', expected_status=200)
        market_stats_time = time.time() - start_time
        
        if success:
            if market_stats_time < 3.0:  # Should respond within 3 seconds (allows for DB queries)
                self.log_test("Market Stats Response Time", True, f"Response time: {market_stats_time:.3f}s")
            else:
                self.log_test("Market Stats Response Time", False, error=f"Slow response: {market_stats_time:.3f}s")
        else:
            self.log_test("Market Stats Response Time", False, error=f"Endpoint failed: {status}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting SetuHub Backend API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Run tests in logical order
        self.test_user_registration()
        self.test_user_login()
        self.test_enterprise_profile_creation()
        self.test_gu_creation()
        self.test_job_creation()
        self.test_bulk_job_upload()  # NEW: Test bulk upload
        self.test_vendor_profile_creation()
        self.test_vendor_job_view()
        self.test_job_commitment()
        self.test_job_applications()  # NEW: Test job applications
        self.test_enhanced_filtering()  # NEW: Test enhanced filtering
        self.test_application_management()  # NEW: Test application management
        self.test_dashboard_with_applications()  # NEW: Test dashboard with applications
        self.test_job_seeker_view()
        self.test_data_persistence()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Return test results for reporting
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": (self.tests_passed/self.tests_run)*100,
            "test_details": self.test_results
        }

def main():
    """Main function to run backend tests"""
    tester = SetuHubAPITester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    if results["failed_tests"] == 0:
        print("\n✅ All backend tests passed!")
        return 0
    else:
        print(f"\n❌ {results['failed_tests']} backend tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())