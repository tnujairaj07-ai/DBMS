import unittest
import os
import sys

# Ensure root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.app.extensions import db
from backend.app.models.user import User, StudentProfile, FacultyProfile
from backend.app.models.academic import Department
from backend.app.models.skill import Skill

class Phase1LiveApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app('development')
        cls.client = cls.app.test_client()
        cls.app_context = cls.app.app_context()
        cls.app_context.push()

    @classmethod
    def tearDownClass(cls):
        cls.app_context.pop()

    def test_01_lookup_endpoints(self):
        """Test department and domain catalog lookups."""
        dept_res = self.client.get('/api/academic/departments')
        self.assertEqual(dept_res.status_code, 200)
        self.assertTrue(len(dept_res.get_json()['data']) >= 5)

        domain_res = self.client.get('/api/academic/domains')
        self.assertEqual(domain_res.status_code, 200)
        self.assertTrue(len(domain_res.get_json()['data']) >= 6)

        skills_res = self.client.get('/api/skills')
        self.assertEqual(skills_res.status_code, 200)
        self.assertTrue(len(skills_res.get_json()['data']) >= 20)

    def test_02_student_flow(self):
        """Test student registration, login, and skill management."""
        dept = Department.query.first()
        student_data = {
            "email": "tanuj.student.test@university.edu",
            "password": "Password@123",
            "role": "STUDENT",
            "full_name": "Tanuj Airaj Test",
            "department_id": dept.department_id,
            "roll_no": "TEST-ROLL-999",
            "semester": 5,
            "cgpa": 8.75,
            "bio": "Enthusiastic about AI and DBMS."
        }

        # Clean existing test user if any
        existing = User.query.filter_by(email=student_data['email']).first()
        if existing:
            db.session.delete(existing)
            db.session.commit()

        # Register
        reg_res = self.client.post('/api/auth/register', json=student_data)
        self.assertEqual(reg_res.status_code, 201)
        reg_json = reg_res.get_json()
        token = reg_json['data']['access_token']
        self.assertIsNotNone(token)

        headers = {'Authorization': f'Bearer {token}'}

        # Verify /auth/me
        me_res = self.client.get('/api/auth/me', headers=headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.get_json()['data']['student_profile']['roll_no'], 'TEST-ROLL-999')

        # Add offered skill
        skill_python = Skill.query.filter_by(name='Python').first()
        add_skill_res = self.client.post('/api/skills/my', headers=headers, json={
            "skill_id": skill_python.skill_id,
            "skill_type": "OFFERED",
            "proficiency_level": 4
        })
        self.assertIn(add_skill_res.status_code, (200, 201))

        # Add wanted skill
        skill_cv = Skill.query.filter_by(name='OpenCV').first()
        add_cv_res = self.client.post('/api/skills/my', headers=headers, json={
            "skill_id": skill_cv.skill_id,
            "skill_type": "WANTED",
            "proficiency_level": 3
        })
        self.assertIn(add_cv_res.status_code, (200, 201))

        # Retrieve student skills
        my_skills_res = self.client.get('/api/skills/my', headers=headers)
        self.assertEqual(my_skills_res.status_code, 200)
        my_skills = my_skills_res.get_json()['data']
        self.assertEqual(len(my_skills['offered']), 1)
        self.assertEqual(len(my_skills['wanted']), 1)

    def test_03_faculty_flow(self):
        """Test faculty registration, login, and capacity management."""
        dept = Department.query.first()
        faculty_data = {
            "email": "prof.sharma.test@university.edu",
            "password": "Password@123",
            "role": "FACULTY",
            "full_name": "Dr. Sharma Test",
            "department_id": dept.department_id,
            "employee_code": "FAC-TEST-888",
            "designation": "Associate Professor",
            "max_project_capacity": 4
        }

        # Clean existing test faculty if any
        existing = User.query.filter_by(email=faculty_data['email']).first()
        if existing:
            db.session.delete(existing)
            db.session.commit()

        # Register
        reg_res = self.client.post('/api/auth/register', json=faculty_data)
        self.assertEqual(reg_res.status_code, 201)
        token = reg_res.get_json()['data']['access_token']
        headers = {'Authorization': f'Bearer {token}'}

        # Update capacity
        update_res = self.client.put('/api/users/profile/faculty', headers=headers, json={
            "full_name": "Dr. Sharma Test Updated",
            "designation": "Professor & HOD",
            "max_project_capacity": 5
        })
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.get_json()['data']['faculty_profile']['max_project_capacity'], 5)

if __name__ == '__main__':
    unittest.main()
