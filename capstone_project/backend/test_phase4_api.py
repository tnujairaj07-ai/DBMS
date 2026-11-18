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
    MentorAllocation,
    AllocationAuditLog
)
from backend.app.models.milestone import (
    MilestoneTemplate,
    ProjectMilestone,
    MilestoneSubmission,
    FacultyFeedback
)


class Phase4LiveApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app('development')
        cls.client = cls.app.test_client()
        cls.app_context = cls.app.app_context()
        cls.app_context.push()

    @classmethod
    def tearDownClass(cls):
        cls.app_context.pop()

    def test_01_milestone_lifecycle(self):
        """
        Tests complete Phase 4 lifecycle:
        1. Template retrieval.
        2. Proposal creation & mentor allocation.
        3. Trigger auto-generation of 5 milestones.
        4. Student deliverable submission -> trigger transitions milestone to SUBMITTED.
        5. Faculty review queue & grading -> trigger transitions milestone to APPROVED.
        6. Analytics view vw_project_milestone_progress aggregation check.
        """
        dept = Department.query.first()
        domain = ResearchDomain.query.first()

        # Clean existing test users and entities
        test_emails = [
            "admin.phase4@university.edu",
            "faculty.phase4@university.edu",
            "student.phase4@university.edu"
        ]
        users = User.query.filter(User.email.in_(test_emails)).all()
        user_ids = [u.user_id for u in users]
        if user_ids:
            for u in users:
                if u.faculty_profile:
                    FacultyFeedback.query.filter_by(faculty_id=u.faculty_profile.faculty_id).delete(synchronize_session='fetch')
                if u.student_profile:
                    MilestoneSubmission.query.filter_by(submitted_by=u.student_profile.student_id).delete(synchronize_session='fetch')
            allocs = MentorAllocation.query.filter(MentorAllocation.allocated_by.in_(user_ids)).all()
            for al in allocs:
                AllocationAuditLog.query.filter_by(allocation_id=al.allocation_id).delete(synchronize_session='fetch')
                db.session.delete(al)
            for u in users:
                if u.student_profile:
                    proposals = ProjectProposal.query.join(ProjectTeam).filter(ProjectTeam.leader_id == u.student_profile.student_id).all()
                    for p in proposals:
                        ProjectMilestone.query.filter_by(proposal_id=p.proposal_id).delete(synchronize_session='fetch')
                        MentorAllocation.query.filter_by(proposal_id=p.proposal_id).delete(synchronize_session='fetch')
                        db.session.delete(p)
                    ProjectTeam.query.filter_by(leader_id=u.student_profile.student_id).delete(synchronize_session='fetch')
                if u.faculty_profile:
                    MentorAllocation.query.filter_by(faculty_id=u.faculty_profile.faculty_id).delete(synchronize_session='fetch')
                db.session.delete(u)
            AllocationCycle.query.filter_by(name="Phase 4 Evaluation Term").delete(synchronize_session='fetch')
            db.session.commit()

        # 1. Verify Milestone Templates
        res_tpl = self.client.get('/api/milestones/templates')
        self.assertEqual(res_tpl.status_code, 200)
        templates = res_tpl.get_json()['data']
        self.assertTrue(len(templates) >= 5)
        total_weight = sum(t['weightage_percent'] for t in templates)
        self.assertEqual(total_weight, 100)

        # 2. Create Users (Admin, Faculty, Student Leader)
        admin = User(email="admin.phase4@university.edu", role="ADMIN")
        admin.set_password("Admin@123")
        db.session.add(admin)

        u_fac = User(email="faculty.phase4@university.edu", role="FACULTY")
        u_fac.set_password("Fac@123")
        db.session.add(u_fac)
        db.session.flush()

        prof = FacultyProfile(
            user_id=u_fac.user_id,
            employee_code="FAC-P4",
            department_id=dept.department_id,
            full_name="Dr. Milestone Supervisor",
            designation="Associate Professor",
            max_project_capacity=3
        )
        db.session.add(prof)

        u_stu = User(email="student.phase4@university.edu", role="STUDENT")
        u_stu.set_password("Student@123")
        db.session.add(u_stu)
        db.session.flush()

        stu = StudentProfile(
            user_id=u_stu.user_id,
            roll_no="STU-P4",
            department_id=dept.department_id,
            full_name="Student Lead P4",
            semester=6
        )
        db.session.add(stu)
        db.session.commit()

        # Auth tokens
        tok_admin = self.client.post('/api/auth/login', json={"email": "admin.phase4@university.edu", "password": "Admin@123"}).get_json()['data']['access_token']
        tok_fac = self.client.post('/api/auth/login', json={"email": "faculty.phase4@university.edu", "password": "Fac@123"}).get_json()['data']['access_token']
        tok_stu = self.client.post('/api/auth/login', json={"email": "student.phase4@university.edu", "password": "Student@123"}).get_json()['data']['access_token']

        headers_admin = {"Authorization": f"Bearer {tok_admin}"}
        headers_fac = {"Authorization": f"Bearer {tok_fac}"}
        headers_stu = {"Authorization": f"Bearer {tok_stu}"}

        # 3. Create Cycle, Team, Proposal & Allocate Mentor
        res_cycle = self.client.post('/api/allocation/cycles', headers=headers_admin, json={
            "name": "Phase 4 Evaluation Term",
            "academic_year": "2026-2027",
            "semester": 6,
            "start_date": "2026-08-01",
            "end_date": "2027-01-31",
            "proposal_deadline": "2026-09-01"
        })
        cycle_id = res_cycle.get_json()['data']['cycle_id']

        res_team = self.client.post('/api/projects/teams', headers=headers_stu, json={
            "team_name": "Milestone Achievers",
            "max_members": 3
        })
        team_id = res_team.get_json()['data']['team_id']

        res_prop = self.client.post('/api/allocation/proposals', headers=headers_stu, json={
            "team_id": team_id,
            "cycle_id": cycle_id,
            "domain_id": domain.domain_id,
            "title": "Cloud-Native DBMS Milestone Engine",
            "problem_statement": "Automating academic milestone deliverables and real-time grading.",
            "objectives": "Track iterations and automate status updates."
        })
        proposal_id = res_prop.get_json()['data']['proposal_id']

        # Allocate mentor via stored procedure
        res_alloc = self.client.post('/api/allocation/allocate', headers=headers_admin, json={
            "proposal_id": proposal_id,
            "faculty_id": prof.faculty_id,
            "reason": "Faculty assigned for Phase 4 validation."
        })
        self.assertEqual(res_alloc.status_code, 201)

        # 4. Verify Trigger trg_auto_generate_milestones initialized 5 milestones
        res_m = self.client.get(f'/api/milestones/projects/{proposal_id}')
        self.assertEqual(res_m.status_code, 200)
        m_data = res_m.get_json()['data']
        self.assertEqual(len(m_data['milestones']), 5)
        self.assertEqual(m_data['progress_percent'], 0.0)

        first_milestone = m_data['milestones'][0]
        self.assertEqual(first_milestone['status'], 'PENDING')
        self.assertEqual(first_milestone['name'], "Project Synopsis & Literature Review")
        print("\nTRIGGER trg_auto_generate_milestones VERIFIED: 5 milestones instantiated automatically.")

        # 5. Student submits deliverable for Milestone 1
        m1_id = first_milestone['milestone_id']
        res_sub = self.client.post(f'/api/milestones/{m1_id}/submit', headers=headers_stu, json={
            "file_url": "https://github.com/learnlink/synopsis-v1.pdf",
            "notes": "Initial draft of literature review and architectural requirements."
        })
        self.assertEqual(res_sub.status_code, 201)
        sub_data = res_sub.get_json()['data']
        submission_id = sub_data['submission']['submission_id']
        self.assertEqual(sub_data['milestone_status'], 'SUBMITTED')
        print("TRIGGER trg_milestone_submitted VERIFIED: Milestone status updated to SUBMITTED.")

        # 6. Faculty reviews queue and evaluates submission
        res_queue = self.client.get('/api/milestones/faculty/review-queue', headers=headers_fac)
        self.assertEqual(res_queue.status_code, 200)
        queue_items = res_queue.get_json()['data']
        self.assertTrue(any(q['submission']['submission_id'] == submission_id for q in queue_items))

        # Faculty gives feedback with score 92 and decision APPROVED
        res_fb = self.client.post(f'/api/milestones/submissions/{submission_id}/feedback', headers=headers_fac, json={
            "score": 92,
            "comments": "Excellent analysis of DBMS principles and clear scope definition.",
            "decision": "APPROVED"
        })
        self.assertEqual(res_fb.status_code, 200)
        fb_data = res_fb.get_json()['data']
        self.assertEqual(fb_data['milestone_status'], 'APPROVED')
        print("TRIGGER trg_milestone_feedback_decision VERIFIED: Milestone status updated to APPROVED.")

        # 7. Check Analytics View vw_project_milestone_progress
        res_report = self.client.get('/api/milestones/reports/progress')
        self.assertEqual(res_report.status_code, 200)
        reports = res_report.get_json()['data']
        target_report = next((r for r in reports if r['proposal_id'] == proposal_id), None)
        self.assertIsNotNone(target_report)
        self.assertEqual(int(target_report['completed_milestones']), 1)
        self.assertEqual(float(target_report['progress_percent']), 15.0)
        self.assertEqual(float(target_report['average_score']), 92.0)
        print("VIEW vw_project_milestone_progress VERIFIED: Progress is 15.0%, Average Score is 92.0.")


if __name__ == '__main__':
    unittest.main()
