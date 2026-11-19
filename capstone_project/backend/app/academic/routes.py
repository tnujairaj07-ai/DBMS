from flask import Blueprint
from sqlalchemy import text
from backend.app.extensions import db
from backend.app.models.academic import Department, ResearchDomain
from backend.app.utils.responses import success_response, error_response

academic_bp = Blueprint('academic', __name__, url_prefix='/api/academic')

DOMAIN_STYLE_MAP = [
    {
        'code': 'CS-AI-401',
        'level': 'Advanced',
        'duration': '8 Modules • 16 Weeks',
        'bgColor': 'bg-[#fffbeb]',
        'borderColor': 'border-[#fef3c7]',
        'illustrationType': 'ai',
        'keywords': ['python', 'pytorch', 'tensorflow', 'scikit-learn', 'opencv', 'nlp', 'natural language'],
    },
    {
        'code': 'CS-CLD-402',
        'level': 'Intermediate',
        'duration': '6 Modules • 12 Weeks',
        'bgColor': 'bg-[#f5f3ff]',
        'borderColor': 'border-[#ede9fe]',
        'illustrationType': 'cloud',
        'keywords': ['docker', 'kubernetes', 'aws', 'ci/cd', 'go', 'redis'],
    },
    {
        'code': 'CS-SEC-403',
        'level': 'Advanced',
        'duration': '7 Modules • 14 Weeks',
        'bgColor': 'bg-[#fdf2f8]',
        'borderColor': 'border-[#fce7f3]',
        'illustrationType': 'cyber',
        'keywords': ['c++', 'java', 'go', 'docker', 'ci/cd', 'postgresql'],
    },
    {
        'code': 'CS-DAT-405',
        'level': 'Intermediate',
        'duration': '6 Modules • 12 Weeks',
        'bgColor': 'bg-[#eff6ff]',
        'borderColor': 'border-[#dbeafe]',
        'illustrationType': 'data',
        'keywords': ['mysql', 'postgresql', 'mongodb', 'redis', 'python', 'scikit-learn'],
    },
    {
        'code': 'CS-IOT-406',
        'level': 'Intermediate',
        'duration': '6 Modules • 12 Weeks',
        'bgColor': 'bg-[#fff7ed]',
        'borderColor': 'border-[#ffedd5]',
        'illustrationType': 'iot',
        'keywords': ['c++', 'python', 'opencv', 'mongodb', 'docker'],
    },
    {
        'code': 'CS-DEV-404',
        'level': 'Intermediate',
        'duration': '7 Modules • 14 Weeks',
        'bgColor': 'bg-[#f0fdf4]',
        'borderColor': 'border-[#dcfce7]',
        'illustrationType': 'dev',
        'keywords': ['react', 'javascript', 'typescript', 'tailwind', 'next.js', 'flask', 'fastapi', 'node', 'django', 'figma'],
    },
    {
        'code': 'CS-DB-407',
        'level': 'Intermediate',
        'duration': '6 Modules • 12 Weeks',
        'bgColor': 'bg-[#f8fafc]',
        'borderColor': 'border-[#e2e8f0]',
        'illustrationType': 'data',
        'keywords': ['mysql', 'postgresql', 'mongodb', 'redis', 'sql'],
    },
    {
        'code': 'CS-GEN-408',
        'level': 'Advanced',
        'duration': '8 Modules • 16 Weeks',
        'bgColor': 'bg-[#fefce8]',
        'borderColor': 'border-[#fef08a]',
        'illustrationType': 'ai',
        'keywords': ['python', 'pytorch', 'tensorflow', 'nlp', 'natural language', 'fastapi'],
    },
    {
        'code': 'CS-BLK-409',
        'level': 'Advanced',
        'duration': '6 Modules • 12 Weeks',
        'bgColor': 'bg-[#faf5ff]',
        'borderColor': 'border-[#f3e8ff]',
        'illustrationType': 'cyber',
        'keywords': ['go', 'javascript', 'typescript', 'node', 'postgresql'],
    },
    {
        'code': 'CS-CV-410',
        'level': 'Advanced',
        'duration': '7 Modules • 14 Weeks',
        'bgColor': 'bg-[#ecfeff]',
        'borderColor': 'border-[#cffafe]',
        'illustrationType': 'iot',
        'keywords': ['opencv', 'pytorch', 'tensorflow', 'python', 'c++'],
    },
    {
        'code': 'CS-OPS-411',
        'level': 'Intermediate',
        'duration': '6 Modules • 12 Weeks',
        'bgColor': 'bg-[#f0f9ff]',
        'borderColor': 'border-[#e0f2fe]',
        'illustrationType': 'cloud',
        'keywords': ['docker', 'kubernetes', 'aws', 'ci/cd', 'go'],
    },
    {
        'code': 'CS-HCI-412',
        'level': 'Intermediate',
        'duration': '5 Modules • 10 Weeks',
        'bgColor': 'bg-[#fff1f2]',
        'borderColor': 'border-[#ffe4e6]',
        'illustrationType': 'dev',
        'keywords': ['figma', 'ui/ux', 'react', 'tailwind', 'javascript'],
    },
]


@academic_bp.route('/departments', methods=['GET'])
def get_departments():
    """Retrieve all academic departments."""
    depts = Department.query.order_by(Department.name.asc()).all()
    return success_response([d.to_dict() for d in depts])


@academic_bp.route('/domains', methods=['GET'])
def get_domains():
    """Retrieve all research domains."""
    domains = ResearchDomain.query.order_by(ResearchDomain.name.asc()).all()
    return success_response([d.to_dict() for d in domains])


@academic_bp.route('/courses-mentors', methods=['GET'])
def get_courses_with_mentors():
    """Retrieve all research domain courses with live specialized faculty supervisors and ranked peer mentors."""
    try:
        domains = ResearchDomain.query.order_by(ResearchDomain.domain_id.asc()).all()

        # 1. Active allocation counts per faculty
        alloc_rows = db.session.execute(
            text("SELECT faculty_id, COUNT(*) AS active_count FROM mentor_allocations WHERE status = 'ACTIVE' GROUP BY faculty_id")
        ).fetchall()
        alloc_map = {r.faculty_id: int(r.active_count) for r in alloc_rows}

        # 2. Faculty skills map
        fac_skill_rows = db.session.execute(
            text(
                """
                SELECT fse.faculty_id, s.name AS skill_name
                FROM faculty_skill_expertise fse
                JOIN skills s ON fse.skill_id = s.skill_id
                ORDER BY fse.proficiency_level DESC
                """
            )
        ).fetchall()
        fac_skills_map = {}
        for r in fac_skill_rows:
            fac_skills_map.setdefault(r.faculty_id, []).append(r.skill_name)

        # 3. Faculty domain expertise joined with profile & department
        fac_domain_rows = db.session.execute(
            text(
                """
                SELECT fe.domain_id, fe.expertise_level,
                       fp.faculty_id, fp.user_id, fp.full_name, fp.designation, fp.max_project_capacity,
                       d.name AS dept_name, d.code AS dept_code
                FROM faculty_expertise fe
                JOIN faculty_profiles fp ON fe.faculty_id = fp.faculty_id
                JOIN departments d ON fp.department_id = d.department_id
                ORDER BY fe.expertise_level DESC, fp.full_name ASC
                """
            )
        ).fetchall()

        fac_by_domain = {}
        for r in fac_domain_rows:
            active_cnt = alloc_map.get(r.faculty_id, 0)
            fac_by_domain.setdefault(r.domain_id, []).append({
                'id': r.faculty_id,
                'user_id': r.user_id,
                'name': r.full_name,
                'designation': r.designation,
                'dept': r.dept_name,
                'dept_code': r.dept_code,
                'expertise_level': r.expertise_level,
                'rating': round(4.5 + (r.expertise_level * 0.09), 2),
                'reviewsCount': 8 + (r.faculty_id % 20),
                'capacity': f"{active_cnt} / {r.max_project_capacity} Teams Allocated",
                'active_projects': active_cnt,
                'max_capacity': r.max_project_capacity,
                'skills': fac_skills_map.get(r.faculty_id, [])[:6],
                'bio': f"{r.designation} in {r.dept_name}. Supervising capstone teams with expertise level {r.expertise_level}/5.",
            })

        # 4. Ranked peer mentors from vw_peer_mentor_rankings + student_profiles
        peer_rows = db.session.execute(
            text(
                """
                SELECT v.student_id, v.full_name, v.department_name, v.semester,
                       v.avg_peer_rating, v.total_reviews, v.total_sessions_completed,
                       v.offered_skills,
                       sp.user_id, sp.headline, sp.bio, sp.open_to_mentor
                FROM vw_peer_mentor_rankings v
                JOIN student_profiles sp ON v.student_id = sp.student_id
                WHERE sp.open_to_mentor = 1
                ORDER BY v.avg_peer_rating DESC, v.total_sessions_completed DESC, v.student_id ASC
                LIMIT 120
                """
            )
        ).fetchall()

        all_peers = []
        for idx, p in enumerate(peer_rows, start=1):
            skills_list = [s.strip() for s in (p.offered_skills or '').split(',') if s.strip()]
            all_peers.append({
                'id': p.student_id,
                'user_id': p.user_id,
                'name': p.full_name,
                'rank': f"Rank #{idx} Peer Mentor",
                'semester': f"Semester {p.semester}",
                'dept': p.department_name,
                'rating': float(p.avg_peer_rating or 0.0),
                'reviewsCount': int(p.total_reviews or 0),
                'sessionsCount': int(p.total_sessions_completed or 0),
                'skills': skills_list[:6],
                'bio': p.bio or p.headline or f"Peer mentor in {p.department_name} offering 1-on-1 guidance.",
            })

        courses = []
        for idx, dom in enumerate(domains):
            style = DOMAIN_STYLE_MAP[idx % len(DOMAIN_STYLE_MAP)]
            keywords = style['keywords']

            # Match peer mentors whose offered skills overlap domain keywords
            matched_peers = [
                pm for pm in all_peers
                if any(kw in sk.lower() for sk in pm['skills'] for kw in keywords)
            ]
            if not matched_peers:
                matched_peers = all_peers[:12]

            dom_faculty = fac_by_domain.get(dom.domain_id, [])

            courses.append({
                'id': dom.domain_id,
                'domain': dom.name,
                'code': style['code'],
                'title': dom.name,
                'level': style['level'],
                'duration': style['duration'],
                'bgColor': style['bgColor'],
                'borderColor': style['borderColor'],
                'illustrationType': style['illustrationType'],
                'description': dom.description,
                'primarySkill': ', '.join([k.title() for k in keywords[:3]]),
                'facultySupervisors': dom_faculty,
                'peerMentors': matched_peers[:18],
            })

        return success_response(courses)
    except Exception as e:
        return error_response(f"Failed to load courses and mentors: {str(e)}", 500)
