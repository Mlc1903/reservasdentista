#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Dental Clinic Dashboard
Tests authentication, CRUD operations, data relationships, and mock data system
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Base URL from environment
BASE_URL = "https://smileadmin.preview.emergentagent.com/api"

class DentalClinicAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        self.current_user = None
        
    def log_test(self, test_name, success, message, details=None):
        """Log test results"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_authentication_endpoints(self):
        """Test all authentication endpoints"""
        print("\n=== Testing Authentication Endpoints ===")
        
        # Test 1: Login with valid credentials
        try:
            login_data = {
                "email": "admin@clinic.com",
                "password": "admin123"
            }
            response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('user'):
                    self.current_user = data['user']
                    self.log_test("Auth Login Valid", True, "Successfully logged in with demo credentials")
                else:
                    self.log_test("Auth Login Valid", False, "Login response missing success or user data", data)
            else:
                self.log_test("Auth Login Valid", False, f"Login failed with status {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Auth Login Valid", False, f"Login request failed: {str(e)}")
        
        # Test 2: Login with invalid credentials
        try:
            invalid_login = {
                "email": "wrong@email.com",
                "password": "wrongpass"
            }
            response = self.session.post(f"{self.base_url}/auth/login", json=invalid_login)
            
            if response.status_code == 401:
                data = response.json()
                if not data.get('success') and data.get('error'):
                    self.log_test("Auth Login Invalid", True, "Correctly rejected invalid credentials")
                else:
                    self.log_test("Auth Login Invalid", False, "Invalid login should return error", data)
            else:
                self.log_test("Auth Login Invalid", False, f"Expected 401 status, got {response.status_code}")
        except Exception as e:
            self.log_test("Auth Login Invalid", False, f"Invalid login test failed: {str(e)}")
        
        # Test 3: Get current user
        try:
            response = self.session.get(f"{self.base_url}/auth/user")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('user'):
                    self.log_test("Auth Get User", True, "Successfully retrieved current user")
                else:
                    self.log_test("Auth Get User", True, "No current user (expected when not logged in)")
            else:
                self.log_test("Auth Get User", False, f"Get user failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Auth Get User", False, f"Get user request failed: {str(e)}")
        
        # Test 4: Register new user
        try:
            register_data = {
                "email": f"test_{datetime.now().timestamp()}@clinic.com",
                "password": "testpass123",
                "name": "Test User"
            }
            response = self.session.post(f"{self.base_url}/auth/register", json=register_data)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('user'):
                    self.log_test("Auth Register", True, "Successfully registered new user")
                else:
                    self.log_test("Auth Register", False, "Registration response missing success or user data", data)
            else:
                self.log_test("Auth Register", False, f"Registration failed with status {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Auth Register", False, f"Registration request failed: {str(e)}")
        
        # Test 5: Logout
        try:
            response = self.session.post(f"{self.base_url}/auth/logout")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.log_test("Auth Logout", True, "Successfully logged out")
                else:
                    self.log_test("Auth Logout", False, "Logout response missing success flag", data)
            else:
                self.log_test("Auth Logout", False, f"Logout failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Auth Logout", False, f"Logout request failed: {str(e)}")
    
    def test_dentists_crud(self):
        """Test CRUD operations for dentists"""
        print("\n=== Testing Dentists CRUD Operations ===")
        
        # Test 1: Get all dentists
        try:
            response = self.session.get(f"{self.base_url}/dentists")
            
            if response.status_code == 200:
                dentists = response.json()
                if isinstance(dentists, list) and len(dentists) > 0:
                    self.log_test("Dentists GET All", True, f"Retrieved {len(dentists)} dentists")
                    # Verify mock data structure
                    first_dentist = dentists[0]
                    required_fields = ['id', 'fullName', 'specialty', 'email', 'phone']
                    if all(field in first_dentist for field in required_fields):
                        self.log_test("Dentists Data Structure", True, "Dentist data has all required fields")
                    else:
                        missing = [f for f in required_fields if f not in first_dentist]
                        self.log_test("Dentists Data Structure", False, f"Missing fields: {missing}")
                else:
                    self.log_test("Dentists GET All", False, "No dentists returned or invalid format", dentists)
            else:
                self.log_test("Dentists GET All", False, f"GET dentists failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Dentists GET All", False, f"GET dentists request failed: {str(e)}")
        
        # Test 2: Create new dentist
        new_dentist_id = None
        try:
            new_dentist = {
                "fullName": "Dr. Test Dentist",
                "specialty": "Pediatric Dentist",
                "email": "test.dentist@clinic.com",
                "phone": "+1-555-9999"
            }
            response = self.session.post(f"{self.base_url}/dentists", json=new_dentist)
            
            if response.status_code == 200:
                created_dentist = response.json()
                if created_dentist.get('id') and created_dentist.get('fullName') == new_dentist['fullName']:
                    new_dentist_id = created_dentist['id']
                    self.log_test("Dentists POST Create", True, "Successfully created new dentist")
                else:
                    self.log_test("Dentists POST Create", False, "Created dentist missing id or data", created_dentist)
            else:
                self.log_test("Dentists POST Create", False, f"POST dentist failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Dentists POST Create", False, f"POST dentist request failed: {str(e)}")
        
        # Test 3: Update dentist (if created successfully)
        if new_dentist_id:
            try:
                update_data = {
                    "fullName": "Dr. Updated Test Dentist",
                    "specialty": "Oral Surgeon",
                    "email": "updated.dentist@clinic.com",
                    "phone": "+1-555-8888"
                }
                response = self.session.put(f"{self.base_url}/dentists/{new_dentist_id}", json=update_data)
                
                if response.status_code == 200:
                    updated_dentist = response.json()
                    if updated_dentist.get('fullName') == update_data['fullName']:
                        self.log_test("Dentists PUT Update", True, "Successfully updated dentist")
                    else:
                        self.log_test("Dentists PUT Update", False, "Updated dentist data incorrect", updated_dentist)
                else:
                    self.log_test("Dentists PUT Update", False, f"PUT dentist failed with status {response.status_code}")
            except Exception as e:
                self.log_test("Dentists PUT Update", False, f"PUT dentist request failed: {str(e)}")
            
            # Test 4: Delete dentist
            try:
                response = self.session.delete(f"{self.base_url}/dentists/{new_dentist_id}")
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success'):
                        self.log_test("Dentists DELETE", True, "Successfully deleted dentist")
                    else:
                        self.log_test("Dentists DELETE", False, "Delete response missing success flag", result)
                else:
                    self.log_test("Dentists DELETE", False, f"DELETE dentist failed with status {response.status_code}")
            except Exception as e:
                self.log_test("Dentists DELETE", False, f"DELETE dentist request failed: {str(e)}")
    
    def test_patients_crud(self):
        """Test CRUD operations for patients"""
        print("\n=== Testing Patients CRUD Operations ===")
        
        # Test 1: Get all patients
        try:
            response = self.session.get(f"{self.base_url}/patients")
            
            if response.status_code == 200:
                patients = response.json()
                if isinstance(patients, list) and len(patients) > 0:
                    self.log_test("Patients GET All", True, f"Retrieved {len(patients)} patients")
                    # Verify data structure
                    first_patient = patients[0]
                    required_fields = ['id', 'fullName', 'phone']
                    if all(field in first_patient for field in required_fields):
                        self.log_test("Patients Data Structure", True, "Patient data has required fields")
                    else:
                        missing = [f for f in required_fields if f not in first_patient]
                        self.log_test("Patients Data Structure", False, f"Missing fields: {missing}")
                else:
                    self.log_test("Patients GET All", False, "No patients returned or invalid format", patients)
            else:
                self.log_test("Patients GET All", False, f"GET patients failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Patients GET All", False, f"GET patients request failed: {str(e)}")
        
        # Test 2: Create new patient
        new_patient_id = None
        try:
            new_patient = {
                "fullName": "Test Patient",
                "email": "test.patient@email.com",
                "phone": "+1-555-7777"
            }
            response = self.session.post(f"{self.base_url}/patients", json=new_patient)
            
            if response.status_code == 200:
                created_patient = response.json()
                if created_patient.get('id') and created_patient.get('fullName') == new_patient['fullName']:
                    new_patient_id = created_patient['id']
                    self.log_test("Patients POST Create", True, "Successfully created new patient")
                else:
                    self.log_test("Patients POST Create", False, "Created patient missing id or data", created_patient)
            else:
                self.log_test("Patients POST Create", False, f"POST patient failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Patients POST Create", False, f"POST patient request failed: {str(e)}")
        
        # Test 3: Update and Delete patient (if created successfully)
        if new_patient_id:
            try:
                update_data = {
                    "fullName": "Updated Test Patient",
                    "email": "updated.patient@email.com",
                    "phone": "+1-555-6666"
                }
                response = self.session.put(f"{self.base_url}/patients/{new_patient_id}", json=update_data)
                
                if response.status_code == 200:
                    self.log_test("Patients PUT Update", True, "Successfully updated patient")
                else:
                    self.log_test("Patients PUT Update", False, f"PUT patient failed with status {response.status_code}")
            except Exception as e:
                self.log_test("Patients PUT Update", False, f"PUT patient request failed: {str(e)}")
            
            try:
                response = self.session.delete(f"{self.base_url}/patients/{new_patient_id}")
                if response.status_code == 200:
                    self.log_test("Patients DELETE", True, "Successfully deleted patient")
                else:
                    self.log_test("Patients DELETE", False, f"DELETE patient failed with status {response.status_code}")
            except Exception as e:
                self.log_test("Patients DELETE", False, f"DELETE patient request failed: {str(e)}")
    
    def test_treatments_crud(self):
        """Test CRUD operations for treatments"""
        print("\n=== Testing Treatments CRUD Operations ===")
        
        # Test 1: Get all treatments
        try:
            response = self.session.get(f"{self.base_url}/treatments")
            
            if response.status_code == 200:
                treatments = response.json()
                if isinstance(treatments, list) and len(treatments) > 0:
                    self.log_test("Treatments GET All", True, f"Retrieved {len(treatments)} treatments")
                    # Verify data structure
                    first_treatment = treatments[0]
                    required_fields = ['id', 'name', 'cost', 'duration', 'description']
                    if all(field in first_treatment for field in required_fields):
                        self.log_test("Treatments Data Structure", True, "Treatment data has required fields")
                    else:
                        missing = [f for f in required_fields if f not in first_treatment]
                        self.log_test("Treatments Data Structure", False, f"Missing fields: {missing}")
                else:
                    self.log_test("Treatments GET All", False, "No treatments returned or invalid format", treatments)
            else:
                self.log_test("Treatments GET All", False, f"GET treatments failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Treatments GET All", False, f"GET treatments request failed: {str(e)}")
        
        # Test 2: Create new treatment
        new_treatment_id = None
        try:
            new_treatment = {
                "name": "Test Treatment",
                "cost": 250.00,
                "duration": "45 minutes",
                "description": "Test treatment for API testing"
            }
            response = self.session.post(f"{self.base_url}/treatments", json=new_treatment)
            
            if response.status_code == 200:
                created_treatment = response.json()
                if created_treatment.get('id') and created_treatment.get('name') == new_treatment['name']:
                    new_treatment_id = created_treatment['id']
                    self.log_test("Treatments POST Create", True, "Successfully created new treatment")
                else:
                    self.log_test("Treatments POST Create", False, "Created treatment missing id or data", created_treatment)
            else:
                self.log_test("Treatments POST Create", False, f"POST treatment failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Treatments POST Create", False, f"POST treatment request failed: {str(e)}")
        
        # Test 3: Update and Delete treatment (if created successfully)
        if new_treatment_id:
            try:
                update_data = {
                    "name": "Updated Test Treatment",
                    "cost": 300.00,
                    "duration": "60 minutes",
                    "description": "Updated test treatment"
                }
                response = self.session.put(f"{self.base_url}/treatments/{new_treatment_id}", json=update_data)
                
                if response.status_code == 200:
                    self.log_test("Treatments PUT Update", True, "Successfully updated treatment")
                else:
                    self.log_test("Treatments PUT Update", False, f"PUT treatment failed with status {response.status_code}")
            except Exception as e:
                self.log_test("Treatments PUT Update", False, f"PUT treatment request failed: {str(e)}")
            
            try:
                response = self.session.delete(f"{self.base_url}/treatments/{new_treatment_id}")
                if response.status_code == 200:
                    self.log_test("Treatments DELETE", True, "Successfully deleted treatment")
                else:
                    self.log_test("Treatments DELETE", False, f"DELETE treatment failed with status {response.status_code}")
            except Exception as e:
                self.log_test("Treatments DELETE", False, f"DELETE treatment request failed: {str(e)}")
    
    def test_appointments_crud(self):
        """Test CRUD operations for appointments with data relationships"""
        print("\n=== Testing Appointments CRUD Operations ===")
        
        # First get existing data for relationships
        dentists = []
        patients = []
        treatments = []
        
        try:
            dentists = self.session.get(f"{self.base_url}/dentists").json()
            patients = self.session.get(f"{self.base_url}/patients").json()
            treatments = self.session.get(f"{self.base_url}/treatments").json()
        except Exception as e:
            self.log_test("Appointments Setup", False, f"Failed to get related data: {str(e)}")
            return
        
        # Test 1: Get all appointments
        try:
            response = self.session.get(f"{self.base_url}/appointments")
            
            if response.status_code == 200:
                appointments = response.json()
                if isinstance(appointments, list) and len(appointments) > 0:
                    self.log_test("Appointments GET All", True, f"Retrieved {len(appointments)} appointments")
                    
                    # Verify data relationships
                    first_appointment = appointments[0]
                    required_fields = ['id', 'patientId', 'dentistId', 'treatmentId', 'appointmentDate', 'appointmentTime', 'status']
                    if all(field in first_appointment for field in required_fields):
                        self.log_test("Appointments Data Structure", True, "Appointment data has required fields")
                        
                        # Check if relationships are enriched
                        if 'patients' in first_appointment and 'dentists' in first_appointment and 'treatments' in first_appointment:
                            self.log_test("Appointments Data Relationships", True, "Appointments include enriched relationship data")
                        else:
                            self.log_test("Appointments Data Relationships", False, "Appointments missing enriched relationship data")
                    else:
                        missing = [f for f in required_fields if f not in first_appointment]
                        self.log_test("Appointments Data Structure", False, f"Missing fields: {missing}")
                else:
                    self.log_test("Appointments GET All", False, "No appointments returned or invalid format", appointments)
            else:
                self.log_test("Appointments GET All", False, f"GET appointments failed with status {response.status_code}")
        except Exception as e:
            self.log_test("Appointments GET All", False, f"GET appointments request failed: {str(e)}")
        
        # Test 2: Create new appointment with relationships
        new_appointment_id = None
        if dentists and patients and treatments:
            try:
                tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
                new_appointment = {
                    "patientId": patients[0]['id'],
                    "dentistId": dentists[0]['id'],
                    "treatmentId": treatments[0]['id'],
                    "appointmentDate": tomorrow,
                    "appointmentTime": "10:00",
                    "notes": "Test appointment for API testing"
                }
                response = self.session.post(f"{self.base_url}/appointments", json=new_appointment)
                
                if response.status_code == 200:
                    created_appointment = response.json()
                    if created_appointment.get('id') and created_appointment.get('patientId') == new_appointment['patientId']:
                        new_appointment_id = created_appointment['id']
                        self.log_test("Appointments POST Create", True, "Successfully created new appointment with relationships")
                    else:
                        self.log_test("Appointments POST Create", False, "Created appointment missing id or data", created_appointment)
                else:
                    self.log_test("Appointments POST Create", False, f"POST appointment failed with status {response.status_code}")
            except Exception as e:
                self.log_test("Appointments POST Create", False, f"POST appointment request failed: {str(e)}")
        
        # Test 3: Update and Delete appointment (if created successfully)
        if new_appointment_id:
            try:
                update_data = {
                    "appointmentDate": (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d'),
                    "appointmentTime": "14:00",
                    "notes": "Updated test appointment"
                }
                response = self.session.put(f"{self.base_url}/appointments/{new_appointment_id}", json=update_data)
                
                if response.status_code == 200:
                    self.log_test("Appointments PUT Update", True, "Successfully updated appointment")
                else:
                    self.log_test("Appointments PUT Update", False, f"PUT appointment failed with status {response.status_code}")
            except Exception as e:
                self.log_test("Appointments PUT Update", False, f"PUT appointment request failed: {str(e)}")
            
            try:
                response = self.session.delete(f"{self.base_url}/appointments/{new_appointment_id}")
                if response.status_code == 200:
                    self.log_test("Appointments DELETE", True, "Successfully deleted appointment")
                else:
                    self.log_test("Appointments DELETE", False, f"DELETE appointment failed with status {response.status_code}")
            except Exception as e:
                self.log_test("Appointments DELETE", False, f"DELETE appointment request failed: {str(e)}")
    
    def test_error_handling(self):
        """Test error handling for invalid requests"""
        print("\n=== Testing Error Handling ===")
        
        # Test 1: Invalid endpoint
        try:
            response = self.session.get(f"{self.base_url}/invalid-endpoint")
            if response.status_code == 404:
                self.log_test("Error Handling Invalid Endpoint", True, "Correctly returned 404 for invalid endpoint")
            else:
                self.log_test("Error Handling Invalid Endpoint", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Error Handling Invalid Endpoint", False, f"Invalid endpoint test failed: {str(e)}")
        
        # Test 2: Invalid ID for update
        try:
            response = self.session.put(f"{self.base_url}/dentists/invalid-id", json={"fullName": "Test"})
            if response.status_code == 404:
                self.log_test("Error Handling Invalid ID", True, "Correctly returned 404 for invalid ID")
            else:
                self.log_test("Error Handling Invalid ID", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_test("Error Handling Invalid ID", False, f"Invalid ID test failed: {str(e)}")
        
        # Test 3: Invalid JSON
        try:
            response = self.session.post(f"{self.base_url}/dentists", data="invalid json")
            if response.status_code >= 400:
                self.log_test("Error Handling Invalid JSON", True, "Correctly handled invalid JSON")
            else:
                self.log_test("Error Handling Invalid JSON", False, f"Should reject invalid JSON, got {response.status_code}")
        except Exception as e:
            self.log_test("Error Handling Invalid JSON", True, f"Request failed as expected: {str(e)}")
    
    def test_mock_data_system(self):
        """Test that mock data system is working properly"""
        print("\n=== Testing Mock Data System ===")
        
        # Verify that we're using mock data (Supabase not configured)
        try:
            # Check if we get the expected mock data
            dentists_response = self.session.get(f"{self.base_url}/dentists")
            patients_response = self.session.get(f"{self.base_url}/patients")
            treatments_response = self.session.get(f"{self.base_url}/treatments")
            appointments_response = self.session.get(f"{self.base_url}/appointments")
            
            if all(r.status_code == 200 for r in [dentists_response, patients_response, treatments_response, appointments_response]):
                dentists = dentists_response.json()
                patients = patients_response.json()
                treatments = treatments_response.json()
                appointments = appointments_response.json()
                
                # Check for expected mock data
                expected_dentist_names = ["Dr. Maria Rodriguez", "Dr. James Wilson"]
                expected_patient_names = ["John Smith", "Sarah Johnson"]
                expected_treatment_names = ["Dental Cleaning", "Root Canal"]
                
                dentist_names = [d.get('fullName') for d in dentists]
                patient_names = [p.get('fullName') for p in patients]
                treatment_names = [t.get('name') for t in treatments]
                
                if any(name in dentist_names for name in expected_dentist_names):
                    self.log_test("Mock Data Dentists", True, "Mock dentist data is present")
                else:
                    self.log_test("Mock Data Dentists", False, f"Expected mock dentists not found. Got: {dentist_names}")
                
                if any(name in patient_names for name in expected_patient_names):
                    self.log_test("Mock Data Patients", True, "Mock patient data is present")
                else:
                    self.log_test("Mock Data Patients", False, f"Expected mock patients not found. Got: {patient_names}")
                
                if any(name in treatment_names for name in expected_treatment_names):
                    self.log_test("Mock Data Treatments", True, "Mock treatment data is present")
                else:
                    self.log_test("Mock Data Treatments", False, f"Expected mock treatments not found. Got: {treatment_names}")
                
                if len(appointments) > 0:
                    self.log_test("Mock Data Appointments", True, "Mock appointment data is present")
                else:
                    self.log_test("Mock Data Appointments", False, "No mock appointments found")
                
                self.log_test("Mock Data System", True, "Mock data system is functioning properly")
            else:
                self.log_test("Mock Data System", False, "Failed to retrieve data from mock system")
        except Exception as e:
            self.log_test("Mock Data System", False, f"Mock data system test failed: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🏥 Starting Dental Clinic Dashboard Backend API Tests")
        print(f"🌐 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Run all test suites
        self.test_authentication_endpoints()
        self.test_dentists_crud()
        self.test_patients_crud()
        self.test_treatments_crud()
        self.test_appointments_crud()
        self.test_error_handling()
        self.test_mock_data_system()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🚨 FAILED TESTS:")
            for test in self.test_results:
                if not test['success']:
                    print(f"   • {test['test']}: {test['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = DentalClinicAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)