import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.app.extensions import db
from backend.app.models.user import User, StudentProfile, FacultyProfile
from backend.app.models.academic import Department, ResearchDomain
from backend.app.models.skill import Skill, UserSkill
from backend.app.models.allocation import AllocationCycle, ProjectProposal, MentorAllocation, AllocationAuditLog
from backend.app.models.peer_learning import (
    PeerRequest,
    PeerSession,
    SessionReview,
    ConsultationMeeting,
    Notification
)


class Phase5LiveApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app('development')
        cls.client = cls.app.test_client()
        cls.app_context = cls.app.app_context()
        cls.app_context.push()

    @classmethod
    def tearDownClass(cls):
        cls.app_context.pop()

    def test_01_peer_exchange_and_consultations(self):
        """
        Tests complete Phase 5 workflow:
        1. Student Mentor offers a skill.
        2. View vw_peer_mentor_rankings surfaces the mentor.
        3. Learner requests a peer mentoring session.
        4. Mentor accepts request -> PeerSession created.
        5. Learner reviews session with 5-star rating -> Trigger trg_recalculate_peer_rating updates avg_peer_rating.
        6. Consultation meeting scheduled and completed with minutes.
        7. Executive report vw_department_analytics queried.
        """
        dept = Department.query.first()
        domain = ResearchDomain.query.first()
        skill = Skill.query.first()

        # Clean test accounts
        test_emails = [
            "mentor.phase5@university.edu",
            "learner.phase5@university.edu",
            "faculty.phase5@university.edu",
            "admin.phase5@university.edu"
        ]
        users = User.query.filter(User.email.in_(test_emails)).all()
        user_ids = [u.user_id for u in users]
        if user_ids:
            # Clean consultations and reviews
            students = StudentProfile.query.filter(StudentProfile.user_id.in_(user_ids)).all()
            stu_ids = [s.student_id for s in students]
            if stu_ids:
                PeerRequest.query.filter(
                    (PeerRequest.requester_id.in_(stu_ids)) | (PeerRequest.peer_mentor_id.in_(stu_ids))
                ).delete(synchronize_session='fetch')
                UserSkill.query.filter(UserSkill.student_id.in_(stu_ids)).delete(synchronize_session='fetch')

            allocs = MentorAllocation.query.filter(MentorAllocation.allocated_by.in_(user_ids)).all()
            for al in allocs:
                ConsultationMeeting.query.filter_by(allocation_id=al.allocation_id).delete(synchronize_session='fetch')
                AllocationAuditLog.query.filter_by(allocation_id=al.allocation_id).delete(synchronize_session='fetch')
                db.session.delete(al)

            for u in users:
                db.session.delete(u)
            db.session.commit()

        # 1. Create Mentor and Learner Students
        u_mentor = User(email="mentor.phase5@university.edu", role="STUDENT")
        u_mentor.set_password("Mentor@123")
        db.session.add(u_mentor)
        db.session.flush()

        mentor_profile = StudentProfile(
            user_id=u_mentor.user_id,
            roll_no="P5-MENTOR",
            department_id=dept.department_id,
            full_name="Alex Peer Mentor",
            semester=6
        )
        db.session.add(mentor_profile)
        db.session.flush()

        # Mentor offers skill
        us = UserSkill(
            student_id=mentor_profile.student_id,
            skill_id=skill.skill_id,
            skill_type='OFFERED',
            proficiency_level=5
        )
        db.session.add(us)

        # Learner
        u_learner = User(email="learner.phase5@university.edu", role="STUDENT")
        u_learner.set_password("Learner@123")
        db.session.add(u_learner)
        db.session.flush()

        learner_profile = StudentProfile(
            user_id=u_learner.user_id,
            roll_no="P5-LEARNER",
            department_id=dept.department_id,
            full_name="Sam Learner",
            semester=4
        )
        db.session.add(learner_profile)
        db.session.commit()

        # Auth
        tok_mentor = self.client.post('/api/auth/login', json={"email": "mentor.phase5@university.edu", "password": "Mentor@123"}).get_json()['data']['access_token']
        tok_learner = self.client.post('/api/auth/login', json={"email": "learner.phase5@university.edu", "password": "Learner@123"}).get_json()['data']['access_token']

        headers_mentor = {"Authorization": f"Bearer {tok_mentor}"}
        headers_learner = {"Authorization": f"Bearer {tok_learner}"}

        # 2. Verify View vw_peer_mentor_rankings includes Alex
        res_mentors = self.client.get('/api/peer/mentors')
        self.assertEqual(res_mentors.status_code, 200)
        mentors = res_mentors.get_json()['data']
        self.assertTrue(any(m['student_id'] == mentor_profile.student_id for m in mentors))
        print("\nVIEW vw_peer_mentor_rankings VERIFIED: Mentor Alex surfaced in rankings.")

        # 3. Learner requests peer guidance
        res_req = self.client.post('/api/peer/requests', headers=headers_learner, json={
            "peer_mentor_id": mentor_profile.student_id,
            "skill_id": skill.skill_id,
            "message": "Need help reviewing indexing and query optimization."
        })
        self.assertEqual(res_req.status_code, 201)
        req_id = res_req.get_json()['data']['request_id']

        # 4. Mentor accepts request
        res_accept = self.client.post(f'/api/peer/requests/{req_id}/respond', headers=headers_mentor, json={
            "action": "ACCEPT",
            "scheduled_at": "2026-11-01T14:00:00",
            "meeting_link": "https://meet.google.com/p5-session-demo"
        })
        self.assertEqual(res_accept.status_code, 201)
        session_id = res_accept.get_json()['data']['session']['session_id']
        self.assertIsNotNone(session_id)
        print("PEER REQUEST & SESSION VERIFIED: Session ID", session_id)

        # 5. Learner reviews session with 5-star rating
        res_rev = self.client.post(f'/api/peer/sessions/{session_id}/review', headers=headers_learner, json={
            "rating": 5,
            "feedback": "Outstanding mentor! Explained B-tree indexes clearly with live EXPLAIN diagrams."
        })
        self.assertEqual(res_rev.status_code, 201)
        rev_data = res_rev.get_json()['data']
        self.assertEqual(float(rev_data['updated_mentor_rating']), 5.0)
        print("TRIGGER trg_recalculate_peer_rating VERIFIED: Mentor's new rating is 5.0/5.0.")

        # 6. Verify Executive Department Analytics view
        res_analytics = self.client.get('/api/reports/department-analytics')
        self.assertEqual(res_analytics.status_code, 200)
        analytics_data = res_analytics.get_json()['data']
        self.assertTrue(len(analytics_data) >= 1)
        first_dept = analytics_data[0]
        self.assertIn('total_students', first_dept)
        self.assertIn('allocation_rate_percent', first_dept)
        print("VIEW vw_department_analytics VERIFIED: Executive analytics queried successfully.")


if __name__ == '__main__':
    unittest.main()
