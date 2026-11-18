import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.app.extensions import db
from backend.app.models.user import User, StudentProfile
from backend.app.models.academic import Department, ResearchDomain
from backend.app.models.skill import Skill, UserSkill
from backend.app.models.project import ProjectIdea, ProjectTeam, TeamMember, TeamJoinRequest

class Phase2LiveApiTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app('development')
        cls.client = cls.app.test_client()
        cls.app_context = cls.app.app_context()
        cls.app_context.push()

    @classmethod
    def tearDownClass(cls):
        cls.app_context.pop()

    def test_01_create_idea_and_team(self):
        """Test full flow: Student creates idea with skills, creates team, another joins, and skill gap is evaluated."""
        dept = Department.query.first()
        domain = ResearchDomain.query.first()
        skill_python = Skill.query.filter_by(name='Python').first()
        skill_react = Skill.query.filter_by(name='React.js').first()
        skill_opencv = Skill.query.filter_by(name='OpenCV').first()

        # Clean existing test data if any
        for email in ["student.alpha@university.edu", "student.beta@university.edu", "peer.gamma@university.edu"]:
            u = User.query.filter_by(email=email).first()
            if u:
                ProjectIdea.query.filter_by(created_by=u.user_id).delete()
                if u.student_profile:
                    ProjectTeam.query.filter_by(leader_id=u.student_profile.student_id).delete()
                db.session.delete(u)
        db.session.commit()

        # 1. Register Student A (Leader)
        user_a_email = "student.alpha@university.edu"
        res_a = self.client.post('/api/auth/register', json={
            "email": user_a_email,
            "password": "Password@123",
            "role": "STUDENT",
            "full_name": "Student Alpha (Leader)",
            "department_id": dept.department_id,
            "roll_no": "ROLL-ALPHA-101",
            "semester": 5
        })
        self.assertEqual(res_a.status_code, 201)
        token_a = res_a.get_json()['data']['access_token']
        headers_a = {'Authorization': f'Bearer {token_a}'}

        # Student A offers Python
        self.client.post('/api/skills/my', headers=headers_a, json={
            "skill_id": skill_python.skill_id,
            "skill_type": "OFFERED",
            "proficiency_level": 4
        })

        # 2. Register Student B (Member)
        user_b_email = "student.beta@university.edu"
        user_b = User.query.filter_by(email=user_b_email).first()
        if user_b:
            db.session.delete(user_b)
            db.session.commit()

        res_b = self.client.post('/api/auth/register', json={
            "email": user_b_email,
            "password": "Password@123",
            "role": "STUDENT",
            "full_name": "Student Beta (Member)",
            "department_id": dept.department_id,
            "roll_no": "ROLL-BETA-102",
            "semester": 5
        })
        self.assertEqual(res_b.status_code, 201)
        token_b = res_b.get_json()['data']['access_token']
        headers_b = {'Authorization': f'Bearer {token_b}'}

        # Student B offers React.js
        self.client.post('/api/skills/my', headers=headers_b, json={
            "skill_id": skill_react.skill_id,
            "skill_type": "OFFERED",
            "proficiency_level": 5
        })

        # 3. Register Student C (Peer Mentor who offers OpenCV)
        user_c_email = "peer.gamma@university.edu"
        user_c = User.query.filter_by(email=user_c_email).first()
        if user_c:
            db.session.delete(user_c)
            db.session.commit()

        res_c = self.client.post('/api/auth/register', json={
            "email": user_c_email,
            "password": "Password@123",
            "role": "STUDENT",
            "full_name": "Peer Mentor Gamma",
            "department_id": dept.department_id,
            "roll_no": "ROLL-GAMMA-103",
            "semester": 7
        })
        self.assertEqual(res_c.status_code, 201)
        token_c = res_c.get_json()['data']['access_token']
        headers_c = {'Authorization': f'Bearer {token_c}'}

        # Student C offers OpenCV
        self.client.post('/api/skills/my', headers=headers_c, json={
            "skill_id": skill_opencv.skill_id,
            "skill_type": "OFFERED",
            "proficiency_level": 5
        })

        # 4. Student A proposes an idea: "Smart AI Attendance System"
        # Requires: Python (Covered by A), React (Covered by B), OpenCV (Missing!)
        idea_res = self.client.post('/api/projects/ideas', headers=headers_a, json={
            "title": "Smart AI Attendance System",
            "abstract": "Automated face recognition and attendance tracking with React web dashboard.",
            "domain_id": domain.domain_id,
            "difficulty_level": "ADVANCED",
            "skills": [
                {"skill_id": skill_python.skill_id, "importance_level": "REQUIRED"},
                {"skill_id": skill_react.skill_id, "importance_level": "REQUIRED"},
                {"skill_id": skill_opencv.skill_id, "importance_level": "REQUIRED"}
            ]
        })
        self.assertEqual(idea_res.status_code, 201)
        idea_id = idea_res.get_json()['data']['idea_id']

        # 5. Student A creates team "Visionaries" linked to this idea
        team_res = self.client.post('/api/projects/teams', headers=headers_a, json={
            "team_name": "Visionaries Alpha",
            "idea_id": idea_id,
            "max_members": 4
        })
        self.assertEqual(team_res.status_code, 201)
        team_id = team_res.get_json()['data']['team_id']

        # 6. Student B requests to join "Visionaries"
        join_res = self.client.post(f'/api/projects/teams/{team_id}/join-requests', headers=headers_b, json={
            "message": "Hi, I have strong React skills and want to contribute to the UI!"
        })
        self.assertEqual(join_res.status_code, 201)
        join_req_id = join_res.get_json()['data']['join_request_id']

        # 7. Student A (Leader) views requests and accepts Student B
        reqs_res = self.client.get(f'/api/projects/teams/{team_id}/join-requests', headers=headers_a)
        self.assertEqual(reqs_res.status_code, 200)
        self.assertEqual(len(reqs_res.get_json()['data']), 1)

        accept_res = self.client.post(f'/api/projects/teams/{team_id}/join-requests/{join_req_id}/respond', headers=headers_a, json={
            "action": "ACCEPT"
        })
        self.assertEqual(accept_res.status_code, 200)

        # 8. Check team detail: should now have 2 active members (Alpha & Beta)
        detail_res = self.client.get(f'/api/projects/teams/{team_id}')
        self.assertEqual(detail_res.status_code, 200)
        self.assertEqual(detail_res.get_json()['data']['current_members_count'], 2)

        # 9. Test Skill-Gap Endpoint:
        # Team has Python (A) and React (B), but lacks OpenCV.
        # It must report:
        # - total_required_skills = 3
        # - covered_skills_count = 2
        # - missing_required_count = 1 (from Stored Function fn_get_team_skill_gap_count!)
        # - recommended_peers contains Student C (Peer Mentor Gamma who offers OpenCV!)
        gap_res = self.client.get(f'/api/projects/teams/{team_id}/skill-gap')
        self.assertEqual(gap_res.status_code, 200)
        gap_data = gap_res.get_json()['data']

        self.assertEqual(gap_data['total_required_skills'], 3)
        self.assertEqual(gap_data['covered_skills_count'], 2)
        self.assertEqual(gap_data['missing_required_count'], 1)
        self.assertAlmostEqual(gap_data['coverage_percentage'], 66.7, delta=0.5)

        # Verify peer recommendation
        recommended = gap_data['recommended_peers']
        self.assertTrue(len(recommended) >= 1)
        self.assertEqual(recommended[0]['full_name'], 'Peer Mentor Gamma')
        self.assertEqual(recommended[0]['skill_name'], 'OpenCV')
        print("\nSKILL GAP ANALYSIS SUCCESS:")
        print(f"Team: {gap_data['team_name']}, Idea: {gap_data['idea_title']}")
        print(f"Coverage: {gap_data['coverage_percentage']}% ({gap_data['covered_skills_count']}/{gap_data['total_required_skills']})")
        print(f"Missing count from Stored Function: {gap_data['missing_required_count']}")
        print(f"Recommended Peer Mentor: {recommended[0]['full_name']} for {recommended[0]['skill_name']}")

if __name__ == '__main__':
    unittest.main()
