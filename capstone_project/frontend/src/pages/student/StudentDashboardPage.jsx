import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Bell,
  Search,
  Star,
  Users,
  Award,
  Layers,
  Sparkles,
  User,
  FileText,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Compass,
  Video,
  MapPin,
  TrendingUp,
  LayoutDashboard,
  GraduationCap,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  LogOut,
  Home,
  Bookmark
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const profile = user?.student_profile;

  // Active view tab: 'OVERVIEW' | 'PROFILE'
  const initialTab = searchParams.get('tab') === 'skills' ? 'PROFILE' : 'OVERVIEW';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Real academic data states
  const [myTeams, setMyTeams] = useState([]);
  const [allocatedProposal, setAllocatedProposal] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [peerSessions, setPeerSessions] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Skills & Profile states
  const [categories, setCategories] = useState([]);
  const [catalogSkills, setCatalogSkills] = useState([]);
  const [mySkills, setMySkills] = useState({ offered: [], wanted: [] });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skillType, setSkillType] = useState('OFFERED');
  const [proficiency, setProficiency] = useState(3);
  const [addingSkill, setAddingSkill] = useState(false);
  const [skillMessage, setSkillMessage] = useState({ type: '', text: '' });

  // Calendar State (Default: Current Date)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 27)); // Oct 27, 2026
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Update tab in URL if needed
  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'PROFILE') {
      setSearchParams({ tab: 'skills' });
    } else {
      setSearchParams({});
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [teamsRes, propsRes, sessionsRes, consultRes, catsRes, skillsRes, mySkillsRes] = await Promise.all([
        api.get('/projects/teams/my-teams').catch(() => ({ data: { data: [] } })),
        api.get('/allocation/proposals', { params: { status: 'ALLOCATED' } }).catch(() => ({ data: { data: [] } })),
        api.get('/peer/sessions/my-sessions').catch(() => ({ data: { data: [] } })),
        api.get('/consultations/my-consultations').catch(() => ({ data: { data: [] } })),
        api.get('/skills/categories').catch(() => ({ data: { data: [] } })),
        api.get('/skills').catch(() => ({ data: { data: [] } })),
        api.get('/skills/my').catch(() => ({ data: { data: { offered: [], wanted: [] } } }))
      ]);

      const teams = teamsRes.data.data || [];
      setMyTeams(teams);

      const allProps = propsRes.data.data || [];
      const myTeamIds = teams.map((t) => t.team_id);
      const matchedProp = allProps.find((p) => myTeamIds.includes(p.team_id)) || allProps[0] || null;
      setAllocatedProposal(matchedProp);

      if (matchedProp) {
        const milesRes = await api.get(`/milestones/projects/${matchedProp.proposal_id}`).catch(() => null);
        if (milesRes) {
          setMilestones(milesRes.data.data?.milestones || []);
        }
      }

      setPeerSessions(sessionsRes.data.data || []);
      setConsultations(consultRes.data.data || []);

      // Skills data
      if (catsRes.data?.data) setCategories(catsRes.data.data);
      if (skillsRes.data?.data) {
        setCatalogSkills(skillsRes.data.data);
        if (skillsRes.data.data.length > 0) {
          setSelectedSkillId(skillsRes.data.data[0].skill_id);
        }
      }
      if (mySkillsRes.data?.data) {
        setMySkills(mySkillsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) return;

    setAddingSkill(true);
    setSkillMessage({ type: '', text: '' });

    try {
      const res = await api.post('/skills/my', {
        skill_id: parseInt(selectedSkillId, 10),
        skill_type: skillType,
        proficiency_level: parseInt(proficiency, 10),
      });

      if (res.data.success) {
        setSkillMessage({
          type: 'success',
          text: `Skill successfully ${skillType === 'OFFERED' ? 'added to your offered skills' : 'added to your learning wishlist'}!`
        });
        const updated = await api.get('/skills/my');
        if (updated.data.success) setMySkills(updated.data.data);
      }
    } catch (err) {
      setSkillMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to add skill.'
      });
    } finally {
      setAddingSkill(false);
    }
  };

  const handleDeleteSkill = async (userSkillId) => {
    try {
      const res = await api.delete(`/skills/my/${userSkillId}`);
      if (res.data.success) {
        setMySkills((prev) => ({
          offered: prev.offered.filter((s) => s.user_skill_id !== userSkillId),
          wanted: prev.wanted.filter((s) => s.user_skill_id !== userSkillId),
        }));
      }
    } catch (err) {
      console.error('Failed to delete skill:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calendar helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday as 0

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const formattedToday = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const filteredCatalogSkills = selectedCategory
    ? catalogSkills.filter((s) => s.category_id === parseInt(selectedCategory, 10))
    : catalogSkills;

  return (
    <div className="h-full w-full flex flex-col xl:flex-row min-w-0 overflow-hidden">
      {/* ========================================================= */}
      {/* 2. MIDDLE MAIN CANVAS (Full Height Scrollable Content)     */}
      {/* ========================================================= */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 space-y-8 bg-white min-w-0 h-auto xl:h-screen overflow-y-auto">
        
        {/* Top Bar: Search Input, Tab Toggle & Date */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses, skills, peer mentors, deliverables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/courses?search=${searchQuery}`)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* View Mode Pill Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl shrink-0">
            <button
              onClick={() => switchTab('OVERVIEW')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'OVERVIEW'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Academic Overview
            </button>
            <button
              onClick={() => switchTab('PROFILE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'PROFILE'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Skills & Profile
            </button>
          </div>

          <div className="text-right text-xs font-bold text-slate-500 shrink-0 flex items-center justify-end gap-2 px-1">
            <CalendarIcon className="w-4 h-4 text-indigo-500" />
            <span>{formattedToday}</span>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* VIEW 1: ACADEMIC OVERVIEW & MILESTONES (Image 1 Layout)   */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Welcome Banner (Exact style & layout from Image 1) */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-50 via-indigo-50/60 to-purple-50/40 border border-indigo-100 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xs">
              <div className="relative z-10 max-w-xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/70 text-indigo-700 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Academic Term 2026-2027
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back, {profile?.full_name || user?.email?.split('@')[0]}!
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  You are making strong progress in your academic capstone track. Check your upcoming deliverables, consult with assigned supervisors, or connect with peer mentors.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => switchTab('PROFILE')}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Manage My Skills & Profile
                  </button>
                  <Link
                    to="/courses"
                    className="px-5 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-xs border border-indigo-200 hover:bg-indigo-50 transition-all flex items-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Browse Courses & Mentors
                  </Link>
                </div>
              </div>

              {/* 3D Isometric Book Stack & Graduation Cap Artwork (Exact Replica from Image 1) */}
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl overflow-visible">
                  <defs>
                    <linearGradient id="bookBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="bookPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6d28d9" />
                    </linearGradient>
                    <linearGradient id="bookRose" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#be123c" />
                    </linearGradient>
                    <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>

                  {/* Bottom Book (Blue) */}
                  <polygon points="30,140 100,165 170,140 100,115" fill="url(#bookBlue)" />
                  <polygon points="30,140 100,165 100,180 30,155" fill="#1e40af" />
                  <polygon points="100,165 170,140 170,155 100,180" fill="#2563eb" />
                  <polygon points="33,143 98,166 98,170 33,147" fill="#f8fafc" />

                  {/* Middle Book (Purple) */}
                  <polygon points="40,110 110,135 160,115 90,90" fill="url(#bookPurple)" />
                  <polygon points="40,110 110,135 110,147 40,122" fill="#5b21b6" />
                  <polygon points="110,135 160,115 160,127 110,147" fill="#7c3aed" />

                  {/* Top Book (Rose) */}
                  <polygon points="35,80 95,102 155,80 95,58" fill="url(#bookRose)" />
                  <polygon points="35,80 95,102 95,114 35,92" fill="#9f1239" />
                  <polygon points="95,102 155,80 155,92 95,114" fill="#e11d48" />

                  {/* Graduation Cap hovering on top */}
                  <polygon points="95,18 160,38 95,58 30,38" fill="url(#capGrad)" />
                  <rect x="75" y="44" width="40" height="15" rx="5" fill="#334155" />
                  <polygon points="95,38 105,42 105,48 95,44" fill="#f59e0b" />
                  <path d="M100,42 Q130,55 135,70" stroke="#f59e0b" strokeWidth="2.5" fill="none" />
                  <circle cx="135" cy="73" r="3.5" fill="#d97706" />

                  {/* Sparkling Accents */}
                  <circle cx="175" cy="40" r="4" fill="#f59e0b" />
                  <circle cx="20" cy="90" r="3" fill="#6366f1" />
                  <circle cx="170" cy="110" r="3" fill="#ec4899" />
                </svg>
              </div>
            </div>

            {/* Section 1: Dynamic Academic Track Cards (Image 1 style) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Active Academic Tracks</h2>
                <span className="text-xs font-semibold text-slate-400">DBMS Capstone Cycle</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Blue-Cyan Gradient */}
                <div className="rounded-[28px] p-6 text-white bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-md shadow-blue-500/15 flex flex-col justify-between h-48 hover:-translate-y-1 transition-transform">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                      Capstone Project
                    </span>
                    <h3 className="text-lg font-extrabold mt-1 line-clamp-1">
                      {allocatedProposal?.title || myTeams[0]?.idea_title || 'Smart Attendance System'}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-blue-300 border-2 border-blue-700 flex items-center justify-center text-[10px] font-black text-slate-800">
                          {profile?.full_name ? profile.full_name[0] : 'S'}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-indigo-300 border-2 border-blue-700 flex items-center justify-center text-[10px] font-black text-slate-800">
                          T
                        </div>
                      </div>
                      <span className="text-xs text-blue-100 font-semibold">
                        {myTeams.length > 0 ? `${myTeams[0].member_count || 3} Team Members` : 'Team Alpha'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-blue-100 pt-2 border-t border-white/10">
                      <span>Status: {allocatedProposal?.status || 'ALLOCATED'}</span>
                      <span className="font-bold underline cursor-pointer" onClick={() => navigate('/teams')}>View Team</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Indigo-Purple Gradient */}
                <div className="rounded-[28px] p-6 text-white bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 shadow-md shadow-indigo-500/15 flex flex-col justify-between h-48 hover:-translate-y-1 transition-transform">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-200">
                      Peer Learning Track
                    </span>
                    <h3 className="text-lg font-extrabold mt-1 line-clamp-1">
                      {mySkills.wanted[0]?.skill_name || 'Python & Computer Vision'}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-purple-300 border-2 border-purple-700 flex items-center justify-center text-[10px] font-black text-slate-800">
                          P
                        </div>
                        <div className="w-7 h-7 rounded-full bg-rose-300 border-2 border-purple-700 flex items-center justify-center text-[10px] font-black text-slate-800">
                          M
                        </div>
                      </div>
                      <span className="text-xs text-purple-100 font-semibold">1-on-1 Guidance</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-purple-100 pt-2 border-t border-white/10">
                      <span>{peerSessions.length} Scheduled Sessions</span>
                      <span className="font-bold underline cursor-pointer" onClick={() => navigate('/peer-mentors')}>Find Mentors</span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Coral-Rose Gradient */}
                <div className="rounded-[28px] p-6 text-white bg-gradient-to-br from-rose-500 via-pink-600 to-rose-600 shadow-md shadow-rose-500/15 flex flex-col justify-between h-48 hover:-translate-y-1 transition-transform">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-200">
                      Research & Supervision
                    </span>
                    <h3 className="text-lg font-extrabold mt-1 line-clamp-1">
                      {allocatedProposal?.allocation?.faculty_name || 'Dr. Supervisor'}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold">
                        Semester {profile?.semester || 6}
                      </span>
                      <span className="text-xs text-rose-100 font-medium">Evaluation Term</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-rose-100 pt-2 border-t border-white/10">
                      <span>100% Weightage Rubric</span>
                      <span className="font-bold underline cursor-pointer" onClick={() => navigate('/consultations')}>Book Slot</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Skills Strip Banner */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Your Declared Skills</h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {mySkills.offered.slice(0, 3).map((s) => (
                      <span key={s.user_skill_id} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                        {s.skill_name} (Lvl {s.proficiency_level})
                      </span>
                    ))}
                    {mySkills.wanted.slice(0, 2).map((s) => (
                      <span key={s.user_skill_id} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-lg text-[10px] font-medium">
                        Want: {s.skill_name}
                      </span>
                    ))}
                    {mySkills.offered.length === 0 && mySkills.wanted.length === 0 && (
                      <span className="text-xs text-slate-500 italic">No skills added yet.</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => switchTab('PROFILE')}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 shadow-2xs transition-colors shrink-0 flex items-center gap-1"
              >
                Manage Profile & Skills <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Section 2: Milestone Schedule & Submissions Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Milestone Schedule & Submissions</h2>
                <Link to="/milestones" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50/75 text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Stage</th>
                        <th className="px-6 py-4">Deliverable Milestone</th>
                        <th className="px-6 py-4">Supervisor / Mentor</th>
                        <th className="px-6 py-4">Deadline</th>
                        <th className="px-6 py-4">Artifact / Material</th>
                        <th className="px-6 py-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {milestones.length > 0 ? (
                        milestones.map((m) => (
                          <tr key={m.milestone_id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900">
                              UNIT {m.sequence_no}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{m.name}</div>
                              <span className="text-[11px] text-slate-400">{m.weightage_percent}% Weight</span>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">
                              {allocatedProposal?.allocation?.faculty_name || 'Dr. Supervisor'}
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-mono">
                              {new Date(m.due_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              {m.latest_submission ? (
                                <a
                                  href={m.latest_submission.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                                >
                                  View Artifact <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <Link
                                  to={`/projects/${m.proposal_id}/milestones`}
                                  className="text-slate-400 hover:text-indigo-600 font-medium"
                                >
                                  Pending Upload
                                </Link>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${
                                  m.status === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : m.status === 'SUBMITTED'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    m.status === 'APPROVED'
                                      ? 'bg-emerald-500'
                                      : m.status === 'SUBMITTED'
                                      ? 'bg-blue-500'
                                      : 'bg-amber-500'
                                  }`}
                                ></span>
                                {m.status === 'APPROVED' ? 'Approved' : m.status === 'SUBMITTED' ? 'Submitted' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <>
                          <tr className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-bold text-slate-900">STAGE 1</td>
                            <td className="px-6 py-4 font-bold text-slate-800">Project Synopsis & Literature Review</td>
                            <td className="px-6 py-4 text-slate-600">Dr. Aris Thorne</td>
                            <td className="px-6 py-4 text-slate-500 font-mono">31/10/2026</td>
                            <td className="px-6 py-4 text-indigo-600 font-semibold cursor-pointer">synopsis_v1.pdf</td>
                            <td className="px-6 py-4 text-right">
                              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Approved
                              </span>
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-bold text-slate-900">STAGE 2</td>
                            <td className="px-6 py-4 font-bold text-slate-800">Schema Design & Normalization Proofs</td>
                            <td className="px-6 py-4 text-slate-600">Dr. Aris Thorne</td>
                            <td className="px-6 py-4 text-slate-500 font-mono">15/11/2026</td>
                            <td className="px-6 py-4 text-slate-400">Pending Upload</td>
                            <td className="px-6 py-4 text-right">
                              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                In Progress
                              </span>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* VIEW 2: MY SKILLS & PROFILE (Full Integrated Module)     */}
        {/* --------------------------------------------------------- */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-8 animate-fade-in">
            {/* Profile Overview Card */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white rounded-[32px] p-6 sm:p-8 border border-indigo-100 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-blue-500/25 shrink-0">
                    {profile?.full_name ? profile.full_name[0].toUpperCase() : 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-2xl font-extrabold text-slate-900">
                        {profile?.full_name || user?.email}
                      </h1>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        Semester {profile?.semester || '7'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      {profile?.department_name || 'Computer Science & AI'} • Roll No: {profile?.roll_no || profile?.roll_number || '2024-CS-042'}
                    </p>
                  </div>
                </div>

                {/* Academic Quick Stats */}
                <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">CGPA</div>
                    <div className="text-lg font-black text-slate-900">{profile?.cgpa || '8.85'}</div>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Peer Rating</div>
                    <div className="text-lg font-black text-amber-500 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {profile?.avg_peer_rating || '4.9'}
                    </div>
                  </div>
                </div>
              </div>

              {profile?.bio && (
                <div className="mt-4 pt-4 border-t border-indigo-100/60 text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800">Academic Bio: </span>
                  {profile.bio}
                </div>
              )}
            </div>

            {/* Interactive Add Skill Section */}
            <div className="bg-white rounded-[28px] border border-slate-200 p-6 sm:p-8 shadow-xs">
              <h2 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Add Skills to Your Academic Profile
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">
                Declare competencies you can offer as a ranked peer mentor, or skills you wish to learn for your capstone project.
              </p>

              {skillMessage.text && (
                <div
                  className={`mb-4 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    skillMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {skillMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {skillMessage.text}
                </div>
              )}

              <form onSubmit={handleAddSkill} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
                {/* Intent Switcher */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Intent</label>
                  <select
                    value={skillType}
                    onChange={(e) => setSkillType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OFFERED">Can Teach (Offered)</option>
                    <option value="WANTED">Want to Learn (Wishlist)</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category Filter</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      const first = catalogSkills.find(
                        (s) => !e.target.value || s.category_id === parseInt(e.target.value, 10)
                      );
                      if (first) setSelectedSkillId(first.skill_id);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Skill Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Skill</label>
                  <select
                    value={selectedSkillId}
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    {filteredCatalogSkills.map((s) => (
                      <option key={s.skill_id} value={s.skill_id}>
                        {s.name} ({s.category_name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Proficiency */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Proficiency ({proficiency}/5)
                  </label>
                  <select
                    value={proficiency}
                    onChange={(e) => setProficiency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1 - Beginner</option>
                    <option value="2">2 - Elementary</option>
                    <option value="3">3 - Intermediate</option>
                    <option value="4">4 - Advanced</option>
                    <option value="5">5 - Expert</option>
                  </select>
                </div>

                {/* Submit */}
                <div>
                  <button
                    type="submit"
                    disabled={addingSkill}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {addingSkill ? 'Saving...' : 'Add Skill'}
                  </button>
                </div>
              </form>
            </div>

            {/* Skills Matrices: Offered vs Wanted */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skills Offered Card */}
              <div className="bg-white rounded-[28px] border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      Skills Offered (Peer Mentorship)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Skills you can mentor peers on and contribute to project teams
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {mySkills.offered.length} Skills
                  </span>
                </div>

                {mySkills.offered.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-2xl">
                    No offered skills added yet. Select a skill above to start teaching peers.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {mySkills.offered.map((s) => (
                      <div
                        key={s.user_skill_id}
                        className="group flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                      >
                        <span>{s.skill_name}</span>
                        <span className="px-1.5 py-0.2 bg-emerald-200/80 rounded text-[10px] font-bold">
                          Lvl {s.proficiency_level}
                        </span>
                        <button
                          onClick={() => handleDeleteSkill(s.user_skill_id)}
                          className="text-emerald-400 hover:text-rose-600 transition-colors"
                          title="Remove skill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills Wanted Card */}
              <div className="bg-white rounded-[28px] border border-slate-200 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      Skills Wanted (Learning Wishlist)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Technologies you need peer mentorship on to fill capstone skill gaps
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {mySkills.wanted.length} Wanted
                  </span>
                </div>

                {mySkills.wanted.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-2xl">
                    No wishlist skills yet. Add skills you wish to learn for your project.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {mySkills.wanted.map((s) => (
                      <div
                        key={s.user_skill_id}
                        className="group flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-semibold hover:bg-blue-100 transition-colors"
                      >
                        <span>{s.skill_name}</span>
                        <span className="px-1.5 py-0.2 bg-blue-200/80 rounded text-[10px] font-bold">
                          Goal Lvl {s.proficiency_level}
                        </span>
                        <button
                          onClick={() => handleDeleteSkill(s.user_skill_id)}
                          className="text-blue-400 hover:text-rose-600 transition-colors"
                          title="Remove skill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* 3. RIGHT SIDEBAR (Full Height Student Profile & Calendar)  */}
      {/* ========================================================= */}
      <aside className="w-full xl:w-80 bg-slate-50/95 p-6 border-t xl:border-t-0 xl:border-l border-slate-200/80 flex flex-col justify-between shrink-0 h-auto xl:h-screen overflow-y-auto">
        <div className="space-y-6">
          {/* Profile Card (Clickable to switch to profile tab) */}
          <div
            onClick={() => switchTab('PROFILE')}
            className="flex items-center gap-3.5 pb-6 border-b border-slate-200/80 cursor-pointer group"
            title="Click to view & edit your Skills and Profile"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'S'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                {profile?.full_name || user?.email?.split('@')[0]}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                Roll: {profile?.roll_no || profile?.roll_number || '2024-CS-042'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-100 text-blue-700">
                  Sem {profile?.semester || 7}
                </span>
                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {profile?.avg_peer_rating || '4.9'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Interactive Monthly Calendar (Image 1 replica) */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-800">
                {monthNames[month]} {year}
              </h4>
              <div className="flex items-center gap-1 text-slate-400">
                <button onClick={handlePrevMonth} className="p-1 hover:text-slate-700 rounded-md">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={handleNextMonth} className="p-1 hover:text-slate-700 rounded-md">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-2">
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
              <span>Su</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="py-1 text-transparent">0</div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isToday = dayNum === 27 && month === 9; // Oct 27
                const isMilestone = dayNum === 31;
                return (
                  <div
                    key={`day-${dayNum}`}
                    className={`py-1 rounded-xl font-medium transition-all cursor-pointer ${
                      isToday
                        ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/30'
                        : isMilestone
                        ? 'bg-blue-100 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reminders / Upcoming Events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Upcoming Deadlines
              </h4>
              <span className="text-[10px] text-indigo-600 font-bold">2 Due Soon</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 truncate">Literature Review Defense</h5>
                  <p className="text-[10px] text-slate-500">Oct 31, 2026 • With Faculty</p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 truncate">1-on-1 PyTorch Session</h5>
                  <p className="text-[10px] text-slate-500">Nov 03, 2026 • Sophia Reynolds</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-slate-200/80">
          <button
            onClick={() => switchTab('PROFILE')}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Edit My Skills & Profile
          </button>
        </div>
      </aside>
    </div>
  );
}
