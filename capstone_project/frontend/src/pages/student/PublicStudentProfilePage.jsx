import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  ArrowLeft,
  Star,
  GitBranch,
  Briefcase,
  Globe,
  ExternalLink,
  FolderGit2,
  GraduationCap,
  Award,
  Users,
  MessageSquareQuote,
  Sparkles,
  CalendarPlus,
  Check,
  AlertCircle,
  X,
  Edit3,
  Code2,
} from 'lucide-react';

const PROJECT_TYPE_STYLES = {
  PERSONAL: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ACADEMIC: 'bg-blue-50 text-blue-700 border-blue-200',
  HACKATHON: 'bg-amber-50 text-amber-700 border-amber-200',
  OPEN_SOURCE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const ProficiencyBars = ({ level, color = 'emerald' }) => {
  const activeClass = color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500';
  return (
    <div className="flex items-center gap-0.5" title={`Proficiency ${level}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`w-2.5 h-1.5 rounded-full ${n <= level ? activeClass : 'bg-slate-200'}`}
        />
      ))}
    </div>
  );
};

export default function PublicStudentProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, role } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Book Peer Session modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestStatus, setRequestStatus] = useState({ type: '', text: '' });

  const isOwnProfile = currentUser?.user_id === parseInt(userId, 10);

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/users/profile/${userId}/public`);
        if (res.data.success) {
          setData(res.data.data);
          const offered = res.data.data?.skills?.offered || [];
          if (offered.length > 0) {
            setSelectedSkillId(offered[0].skill_id);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Student profile not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchPublicProfile();
  }, [userId]);

  const openBookModal = (preselectedSkillId = null) => {
    const offered = data?.skills?.offered || [];
    if (preselectedSkillId) {
      setSelectedSkillId(preselectedSkillId);
    } else if (offered.length > 0 && !selectedSkillId) {
      setSelectedSkillId(offered[0].skill_id);
    }
    setBookingMessage('');
    setRequestStatus({ type: '', text: '' });
    setShowBookModal(true);
  };

  const handleBookSession = async (e) => {
    e.preventDefault();
    if (!selectedSkillId || !data?.student_profile?.student_id) return;
    setSubmittingRequest(true);
    setRequestStatus({ type: '', text: '' });
    try {
      const res = await api.post('/peer/requests', {
        peer_mentor_id: data.student_profile.student_id,
        skill_id: parseInt(selectedSkillId, 10),
        message: bookingMessage.trim() || 'Hi! I saw your profile and would love a 1-on-1 mentoring session.',
      });
      if (res.data.success) {
        setRequestStatus({
          type: 'success',
          text: 'Mentorship request sent! Track it in Peer Mentors.',
        });
        setTimeout(() => setShowBookModal(false), 1200);
      }
    } catch (err) {
      setRequestStatus({
        type: 'error',
        text: err.response?.data?.message || 'Could not send mentorship request.',
      });
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">{error || 'Profile unavailable'}</h2>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const profile = data.student_profile;
  const offeredSkills = data.skills?.offered || [];
  const wantedSkills = data.skills?.wanted || [];
  const projects = data.projects || [];
  const teams = data.teams || [];
  const reviews = data.reviews || [];
  const stats = data.stats || {};

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {isOwnProfile && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
            <span>Public Preview Mode — this is how peers and faculty see your profile.</span>
            <Link
              to="/?tab=skills"
              className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 inline-flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" />
              Edit My Profile
            </Link>
          </div>
        )}
      </div>

      {/* Hero Profile Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 text-slate-900 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center text-2xl font-bold shrink-0">
              {profile.full_name ? profile.full_name[0].toUpperCase() : 'S'}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{profile.full_name}</h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Semester {profile.semester}
                </span>
              </div>

              {profile.headline && (
                <p className="text-sm font-medium text-indigo-700">{profile.headline}</p>
              )}

              <p className="text-xs text-slate-500">
                {profile.department_name} ({profile.department_code}) • Roll No:{' '}
                <span className="font-semibold text-slate-800">{profile.roll_no}</span>
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {profile.open_to_mentor && (
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Available to Peer Mentor
                  </span>
                )}
                {profile.open_to_collaborate && (
                  <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    Open to Capstone Collaboration
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Visitor CTA Buttons */}
          {!isOwnProfile && role === 'STUDENT' && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {profile.open_to_mentor && offeredSkills.length > 0 && (
                <button
                  onClick={() => openBookModal()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Book 1-on-1 Session
                </button>
              )}
              <Link
                to="/teams"
                className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Users className="w-4 h-4" />
                Collaborate on Teams
              </Link>
            </div>
          )}
        </div>

        {/* Bio & External Links */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            {profile.bio || 'No academic bio provided yet.'}
          </p>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {profile.github_url && (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <GitBranch className="w-3.5 h-3.5" />
                GitHub
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5" />
                LinkedIn
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}
            {profile.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                Portfolio
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Credibility Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Peer Rating</div>
            <div className="text-xl font-black text-slate-900">
              {Number(stats.avg_peer_rating ?? 0).toFixed(1)}
              <span className="text-xs font-semibold text-slate-400 ml-1">({stats.reviews_count || 0})</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sessions Taught</div>
            <div className="text-xl font-black text-slate-900">{stats.sessions_taught || 0}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">GitHub Projects</div>
            <div className="text-xl font-black text-slate-900">{projects.length}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CGPA</div>
            <div className="text-xl font-black text-slate-900">{profile.cgpa ?? 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Proof-of-Work Portfolio */}
      <div className="bg-white rounded-[28px] border border-slate-200 p-6 sm:p-7 shadow-xs">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mb-1">
          <FolderGit2 className="w-5 h-5 text-indigo-600" />
          Proof-of-Work Projects ({projects.length})
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Inspect {profile.full_name}&apos;s GitHub repositories and technical implementations.
        </p>

        {projects.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
            <Code2 className="w-7 h-7 mx-auto mb-2 text-slate-300" />
            No GitHub portfolio projects listed yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.project_id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between gap-4"
              >
                <div>
                  <span
                    className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border mb-2 ${
                      PROJECT_TYPE_STYLES[proj.project_type] || PROJECT_TYPE_STYLES.PERSONAL
                    }`}
                  >
                    {proj.project_type}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">{proj.title}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{proj.description}</p>
                  {proj.tech_stack && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {proj.tech_stack
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((tech, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700"
                          >
                            {tech}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-200/70">
                  <a
                    href={proj.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    View Repository
                    <ExternalLink className="w-3 h-3 opacity-75" />
                  </a>
                  {proj.live_demo_url && (
                    <a
                      href={proj.live_demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-blue-400 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills Offered & Wanted */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[28px] border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Skills Offered (Can Teach)
          </h3>
          {offeredSkills.length === 0 ? (
            <p className="text-xs text-slate-400">No offered skills listed.</p>
          ) : (
            <div className="space-y-2.5">
              {offeredSkills.map((s) => (
                <div
                  key={s.user_skill_id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-emerald-50/40 border border-emerald-200/80 rounded-xl"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{s.skill_name}</div>
                    <div className="text-[10px] text-slate-500">{s.category_name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ProficiencyBars level={s.proficiency_level} color="emerald" />
                    {!isOwnProfile && role === 'STUDENT' && profile.open_to_mentor && (
                      <button
                        onClick={() => openBookModal(s.skill_id)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Learn
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[28px] border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Skills Wanted (Looking to Learn)
          </h3>
          {wantedSkills.length === 0 ? (
            <p className="text-xs text-slate-400">No wishlist skills listed.</p>
          ) : (
            <div className="space-y-2.5">
              {wantedSkills.map((s) => (
                <div
                  key={s.user_skill_id}
                  className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-blue-50/40 border border-blue-200/80 rounded-xl"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{s.skill_name}</div>
                    <div className="text-[10px] text-slate-500">{s.category_name}</div>
                  </div>
                  <ProficiencyBars level={s.proficiency_level} color="blue" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Teams & Verified Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[28px] border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-600" />
            Active Capstone Teams ({teams.length})
          </h3>
          {teams.length === 0 ? (
            <p className="text-xs text-slate-400">Not currently on an active team.</p>
          ) : (
            <div className="space-y-2.5">
              {teams.map((t) => (
                <Link
                  key={t.team_id}
                  to={`/teams/${t.team_id}`}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t.team_name}</div>
                    <div className="text-[11px] text-slate-500">
                      {t.idea_title || 'Open Project'} • {t.role_in_team}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {t.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[28px] border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-4">
            <MessageSquareQuote className="w-4 h-4 text-amber-500" />
            Verified Peer Reviews ({reviews.length})
          </h3>
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400">No peer reviews yet.</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {reviews.map((rev) => (
                <div key={rev.review_id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{rev.reviewer_name}</span>
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {rev.rating}.0
                    </span>
                  </div>
                  {rev.skill_name && (
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 mb-1.5">
                      Topic: {rev.skill_name}
                    </span>
                  )}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rev.feedback || 'Great mentoring session!'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Book 1-on-1 Session Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                Request 1-on-1 Session with {profile.full_name}
              </h3>
              <button
                onClick={() => setShowBookModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestStatus.text && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  requestStatus.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {requestStatus.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{requestStatus.text}</span>
              </div>
            )}

            <form onSubmit={handleBookSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Skill to Learn
                </label>
                <select
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {offeredSkills.map((s) => (
                    <option key={s.skill_id} value={s.skill_id}>
                      {s.skill_name} (Lvl {s.proficiency_level}/5)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message to Mentor
                </label>
                <textarea
                  rows="3"
                  placeholder="Share what topic or project problem you want help with..."
                  value={bookingMessage}
                  onChange={(e) => setBookingMessage(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {submittingRequest ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
