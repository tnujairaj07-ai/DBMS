import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.app.extensions import db
from backend.app.models.user import User, StudentProfile, FacultyProfile
from backend.app.models.academic import Department, ResearchDomain
from backend.app.models.skill import Skill
from backend.app.models.project import ProjectIdea, ProjectTeam, TeamMember
from backend.app.models.allocation import (
    AllocationCycle,
    ProjectProposal,
    FacultyExpertise,
    FacultySkillExpertise,
    MentorPreference,
    MentorRecommendation,
    MentorAllocation,
    AllocationAuditLog
)

class Phase3LiveApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app('development')
        cls.client = cls.app.test_client()
        cls.app_context = cls.app.app_context()
        cls.app_context.push()

    @classmethod
    def tearDownClass(cls):
        cls.app_context.pop()

    def test_01_full_allocation_lifecycle(self):
        """Test full proposal, explainable scoring, stored procedure allocation, and audit log."""
        dept = Department.query.first()
        domain_ai = ResearchDomain.query.filter(ResearchDomain.name.like('%Intelligence%')).first()
        domain_web = ResearchDomain.query.filter(ResearchDomain.name.like('%Web%')).first()
        skill_python = Skill.query.filter_by(name='Python').first()

        # Clean existing test users and proposals
        test_emails = [
            "admin.phase3@university.edu",
            "prof.ai.phase3@university.edu",
            "prof.web.phase3@university.edu",
            "lead.student.phase3@university.edu"
        ]
        users = User.query.filter(User.email.in_(test_emails)).all()
        user_ids = [u.user_id for u in users]
        if user_ids:
            # Delete any allocations and audit logs where these users are involved
            allocs = MentorAllocation.query.filter(MentorAllocation.allocated_by.in_(user_ids)).all()
            for al in allocs:
                AllocationAuditLog.query.filter_by(allocation_id=al.allocation_id).delete(synchronize_session='fetch')
                db.session.delete(al)
            # Delete any proposals created by these students
            for u in users:
                if u.student_profile:
                    proposals = ProjectProposal.query.join(ProjectTeam).filter(ProjectTeam.leader_id == u.student_profile.student_id).all()
                    for p in proposals:
                        MentorRecommendation.query.filter_by(proposal_id=p.proposal_id).delete(synchronize_session='fetch')
                        MentorPreference.query.filter_by(proposal_id=p.proposal_id).delete(synchronize_session='fetch')
                        MentorAllocation.query.filter_by(proposal_id=p.proposal_id).delete(synchronize_session='fetch')
                        db.session.delete(p)
                    ProjectTeam.query.filter_by(leader_id=u.student_profile.student_id).delete(synchronize_session='fetch')
                if u.faculty_profile:
                    FacultyExpertise.query.filter_by(faculty_id=u.faculty_profile.faculty_id).delete(synchronize_session='fetch')
                    FacultySkillExpertise.query.filter_by(faculty_id=u.faculty_profile.faculty_id).delete(synchronize_session='fetch')
                    MentorAllocation.query.filter_by(faculty_id=u.faculty_profile.faculty_id).delete(synchronize_session='fetch')
                db.session.delete(u)
            db.session.commit()

        # 1. Create Admin
        admin = User(email="admin.phase3@university.edu", role="ADMIN")
        admin.set_password("Admin@123")
        db.session.add(admin)
        db.session.commit()

        login_admin = self.client.post('/api/auth/login', json={"email": "admin.phase3@university.edu", "password": "Admin@123"})
        self.assertEqual(login_admin.status_code, 200)
        token_admin = login_admin.get_json()['data']['access_token']
        headers_admin = {'Authorization': f'Bearer {token_admin}'}

        # 2. Admin creates Allocation Cycle
        cycle_name = "Fall 2026 Test Capstone Cycle"
        existing_cycle = AllocationCycle.query.filter_by(name=cycle_name).first()
        if existing_cycle:
            cycle_id = existing_cycle.cycle_id
        else:
            res_cycle = self.client.post('/api/allocation/cycles', headers=headers_admin, json={
                "name": cycle_name,
                "semester": 5,
                "academic_year": "2026-2027",
                "start_date": "2026-09-01",
                "end_date": "2026-12-15"
            })
            self.assertEqual(res_cycle.status_code, 201)
            cycle_id = res_cycle.get_json()['data']['cycle_id']

        # 3. Create Faculty AI (High Domain Fit & Low Load)
        res_fac_ai = self.client.post('/api/auth/register', json={
            "email": "prof.ai.phase3@university.edu",
            "password": "Password@123",
            "role": "FACULTY",
            "full_name": "Dr. AI Specialist",
            "department_id": dept.department_id,
            "employee_code": "FAC-AI-901",
            "designation": "Professor",
            "max_project_capacity": 3
        })
        self.assertEqual(res_fac_ai.status_code, 201)
        token_fac_ai = res_fac_ai.get_json()['data']['access_token']
        fac_ai_id = res_fac_ai.get_json()['data']['user']['faculty_profile']['faculty_id']

        # Faculty AI sets expertise: AI/ML level 5, Python level 5
        self.client.post('/api/allocation/faculty/expertise', headers={'Authorization': f'Bearer {token_fac_ai}'}, json={
            "domain_id": domain_ai.domain_id,
            "expertise_level": 5,
            "skill_id": skill_python.skill_id,
            "proficiency_level": 5
        })

        # 4. Create Student Leader & Team
        res_stu = self.client.post('/api/auth/register', json={
            "email": "lead.student.phase3@university.edu",
            "password": "Password@123",
            "role": "STUDENT",
            "full_name": "Project Lead Student",
            "department_id": dept.department_id,
            "roll_no": "ROLL-LEAD-501",
            "semester": 5
        })
        self.assertEqual(res_stu.status_code, 201)
        token_stu = res_stu.get_json()['data']['access_token']
        headers_stu = {'Authorization': f'Bearer {token_stu}'}

        # Create Team
        res_team = self.client.post('/api/projects/teams', headers=headers_stu, json={
            "team_name": "Deep Learning Pioneers",
            "max_members": 4
        })
        self.assertEqual(res_team.status_code, 201)
        team_id = res_team.get_json()['data']['team_id']

        # 5. Team submits Formal Proposal in AI/ML
        res_prop = self.client.post('/api/allocation/proposals', headers=headers_stu, json={
            "team_id": team_id,
            "cycle_id": cycle_id,
            "domain_id": domain_ai.domain_id,
            "title": "Autonomous Medical Diagnosis via Vision Transformers",
            "problem_statement": "Detecting early-stage anomalies in clinical radiology scans.",
            "objectives": "Achieve >95% accuracy with interpretable attention maps."
        })
        self.assertEqual(res_prop.status_code, 201)
        proposal_id = res_prop.get_json()['data']['proposal_id']

        # 6. Team sets Preferences: Rank 1 -> Dr. AI Specialist
        res_pref = self.client.post(f'/api/allocation/proposals/{proposal_id}/preferences', headers=headers_stu, json={
            "preferences": [
                {"faculty_id": fac_ai_id, "preference_rank": 1}
            ]
        })
        self.assertEqual(res_pref.status_code, 200)

        # 7. Query Explainable Recommendation Engine
        res_rec = self.client.get(f'/api/allocation/recommendations/{proposal_id}')
        self.assertEqual(res_rec.status_code, 200)
        rec_data = res_rec.get_json()['data']
        self.assertTrue(len(rec_data['recommendations']) >= 1)

        top_rec = rec_data['recommendations'][0]
        self.assertEqual(top_rec['faculty_id'], fac_ai_id)
        self.assertTrue(top_rec['match_score'] >= 85.0)
        self.assertEqual(top_rec['breakdown']['domain_match'], 100.0)
        self.assertEqual(top_rec['breakdown']['student_rank'], 1)
        print("\nEXPLAINABLE SCORING VERIFIED:")
        print(f"Top Mentor: {top_rec['faculty_name']} ({top_rec['designation']})")
        print(f"Match Score: {top_rec['match_score']}/100")
        print(f"Breakdown: {top_rec['breakdown']}")

        # 8. Admin executes Atomic Allocation via Stored Procedure
        res_alloc = self.client.post('/api/allocation/allocate', headers=headers_admin, json={
            "proposal_id": proposal_id,
            "faculty_id": fac_ai_id,
            "reason": "Top scoring mentor with highest domain fit and #1 student preference."
        })
        self.assertEqual(res_alloc.status_code, 201)
        alloc_data = res_alloc.get_json()['data']
        self.assertEqual(alloc_data['status'], 'ACTIVE')

        # 9. Verify Proposal status is now ALLOCATED
        prop_check = self.client.get(f'/api/allocation/proposals/{proposal_id}')
        self.assertEqual(prop_check.get_json()['data']['status'], 'ALLOCATED')

        # 10. Verify Audit Log was recorded
        audit_res = self.client.get('/api/allocation/audit-logs', headers=headers_admin)
        self.assertEqual(audit_res.status_code, 200)
        logs = audit_res.get_json()['data']
        self.assertTrue(any(l['allocation_id'] == alloc_data['allocation_id'] for l in logs))
        print("STORED PROCEDURE & AUDIT LOG VERIFIED: Allocation ID", alloc_data['allocation_id'])

if __name__ == '__main__':
    unittest.main()
