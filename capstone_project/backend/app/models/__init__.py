from backend.app.models.academic import Department, ResearchDomain
from backend.app.models.user import User, StudentProfile, FacultyProfile
from backend.app.models.skill import SkillCategory, Skill, UserSkill
from backend.app.models.project import (
    ProjectIdea,
    ProjectSkillRequirement,
    ProjectTeam,
    TeamMember,
    TeamJoinRequest
)
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
from backend.app.models.milestone import (
    MilestoneTemplate,
    ProjectMilestone,
    MilestoneSubmission,
    FacultyFeedback
)
from backend.app.models.peer_learning import (
    AvailabilitySlot,
    PeerRequest,
    PeerSession,
    SessionReview,
    ConsultationMeeting,
    Notification
)

__all__ = [
    'Department',
    'ResearchDomain',
    'User',
    'StudentProfile',
    'FacultyProfile',
    'SkillCategory',
    'Skill',
    'UserSkill',
    'ProjectIdea',
    'ProjectSkillRequirement',
    'ProjectTeam',
    'TeamMember',
    'TeamJoinRequest',
    'AllocationCycle',
    'ProjectProposal',
    'FacultyExpertise',
    'FacultySkillExpertise',
    'MentorPreference',
    'MentorRecommendation',
    'MentorAllocation',
    'AllocationAuditLog',
    'MilestoneTemplate',
    'ProjectMilestone',
    'MilestoneSubmission',
    'FacultyFeedback',
    'AvailabilitySlot',
    'PeerRequest',
    'PeerSession',
    'SessionReview',
    'ConsultationMeeting',
    'Notification'
]
