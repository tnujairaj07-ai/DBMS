import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Sparkles,
  Plus,
  Trash2,
  Check,
  Star,
  AlertCircle,
  Edit3,
  Eye,
  GitBranch,
  Briefcase,
  Globe,
  ExternalLink,
  FolderGit2,
  Users,
  MessageSquareQuote,
  X,
  GraduationCap,
  Award,
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
          className={`w-2.5 h-1.5 rounded-full ${
            n <= level ? activeClass : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
};

export default function StudentProfileWorkspace() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const profile = user?.student_profile;

  const [loading, setLoading] = useState(true);
  const [publicData, setPublicData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [catalogSkills, setCatalogSkills] = useState([]);
  const [mySkills, setMySkills] = useState({ offered: [], wanted: [] });
  const [projects, setProjects] = useState([]);

  // Add skill state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skillType, setSkillType] = useState('OFFERED');
  const [proficiency, setProficiency] = useState(3);
  const [addingSkill, setAddingSkill] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState({ type: '', text: '' });

  // Edit Profile Modal state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    headline: '',
    semester: '',
    cgpa: '',
    bio: '',
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    open_to_mentor: true,
    open_to_collaborate: true,
  });

  // Add/Edit Project Modal state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [savingProject, setSavingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    tech_stack: '',
    github_url: '',
    live_demo_url: '',
    project_type: 'PERSONAL',
  });

  const loadAll = async () => {
    if (!user?.user_id) return;
    try {
      setLoading(true);
      const [pubRes, catsRes, skillsRes, mySkillsRes, projRes] = await Promise.all([
        api.get(`/users/profile/${user.user_id}/public`).catch(() => ({ data: { data: null } })),
        api.get('/skills/categories').catch(() => ({ data: { data: [] } })),
        api.get('/skills').catch(() => ({ data: { data: [] } })),
        api.get('/skills/my').catch(() => ({ data: { data: { offered: [], wanted: [] } } })),
        api.get('/users/profile/projects').catch(() => ({ data: { data: [] } })),
      ]);

      if (pubRes.data?.data) setPublicData(pubRes.data.data);
      if (catsRes.data?.data) setCategories(catsRes.data.data);
      if (skillsRes.data?.data) {
        setCatalogSkills(skillsRes.data.data);
        if (skillsRes.data.data.length > 0 && !selectedSkillId) {
          setSelectedSkillId(skillsRes.data.data[0].skill_id);
        }
      }
      if (mySkillsRes.data?.data) setMySkills(mySkillsRes.data.data);
      if (projRes.data?.data) setProjects(projRes.data.data);
    } catch (err) {
      console.error('Failed to load profile workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user?.user_id]);

  const openEditProfileModal = () => {
    setProfileForm({
      full_name: profile?.full_name || '',
      headline: profile?.headline || '',
      semester: profile?.semester || '',
      cgpa: profile?.cgpa ?? '',
      bio: profile?.bio || '',
      github_url: profile?.github_url || '',
      linkedin_url: profile?.linkedin_url || '',
      portfolio_url: profile?.portfolio_url || '',
      open_to_mentor: profile?.open_to_mentor ?? true,
      open_to_collaborate: profile?.open_to_collaborate ?? true,
    });
    setShowEditProfile(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedbackBanner({ type: '', text: '' });
    try {
      const res = await api.put('/users/profile/student', {
        ...profileForm,
        semester: profileForm.semester ? parseInt(profileForm.semester, 10) : undefined,
        cgpa: profileForm.cgpa === '' ? null : parseFloat(profileForm.cgpa),
      });
      if (res.data.success) {
        await refreshProfile();
        await loadAll();
        setShowEditProfile(false);
        setFeedbackBanner({ type: 'success', text: 'Your academic profile has been updated.' });
      }
    } catch (err) {
      setFeedbackBanner({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleAvailability = async (field) => {
    const nextVal = !(profile?.[field] ?? true);
    try {
      const res = await api.put('/users/profile/student', { [field]: nextVal });
      if (res.data.success) {
        await refreshProfile();
        setFeedbackBanner({
          type: 'success',
          text:
            field === 'open_to_mentor'
              ? `Peer Mentoring status set to ${nextVal ? 'Open' : 'Paused'}.`
              : `Team Collaboration status set to ${nextVal ? 'Open' : 'Paused'}.`,
        });
      }
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const openAddProjectModal = () => {
    setEditingProjectId(null);
    setProjectForm({
      title: '',
      description: '',
      tech_stack: '',
      github_url: '',
      live_demo_url: '',
      project_type: 'PERSONAL',
    });
    setShowProjectModal(true);
  };

  const openEditProjectModal = (proj) => {
    setEditingProjectId(proj.project_id);
    setProjectForm({
      title: proj.title || '',
      description: proj.description || '',
      tech_stack: proj.tech_stack || '',
      github_url: proj.github_url || '',
      live_demo_url: proj.live_demo_url || '',
      project_type: proj.project_type || 'PERSONAL',
    });
    setShowProjectModal(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    setSavingProject(true);
    setFeedbackBanner({ type: '', text: '' });
    try {
      if (editingProjectId) {
        await api.put(`/users/profile/projects/${editingProjectId}`, projectForm);
        setFeedbackBanner({ type: 'success', text: 'Portfolio project updated.' });
      } else {
        await api.post('/users/profile/projects', projectForm);
        setFeedbackBanner({ type: 'success', text: 'Project added to your proof-of-work portfolio!' });
      }
      setShowProjectModal(false);
      await loadAll();
    } catch (err) {
      setFeedbackBanner({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save project.',
      });
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await api.delete(`/users/profile/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p.project_id !== projectId));
      setFeedbackBanner({ type: 'success', text: 'Project removed from portfolio.' });
    } catch (err) {
      console.error('Delete project failed:', err);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) return;
    setAddingSkill(true);
    setFeedbackBanner({ type: '', text: '' });
    try {
      const res = await api.post('/skills/my', {
        skill_id: parseInt(selectedSkillId, 10),
        skill_type: skillType,
        proficiency_level: parseInt(proficiency, 10),
      });
      if (res.data.success) {
        setFeedbackBanner({
          type: 'success',
          text: `Skill added to your ${skillType === 'OFFERED' ? 'Teaching & Mentorship' : 'Learning Wishlist'} profile.`,
        });
        const updated = await api.get('/skills/my');
        if (updated.data.success) setMySkills(updated.data.data);
      }
    } catch (err) {
      setFeedbackBanner({
        type: 'error',
        text: err.response?.data?.message || 'Failed to add skill.',
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

  const filteredCatalogSkills = selectedCategory
    ? catalogSkills.filter((s) => s.category_id === parseInt(selectedCategory, 10))
    : catalogSkills;

  const stats = publicData?.stats || {};
  const reviews = publicData?.reviews || [];
  const teams = publicData?.teams || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[45vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {feedbackBanner.text && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackBanner.text}</span>
          </div>
          <button onClick={() => setFeedbackBanner({ type: '', text: '' })}>
            <X className="w-4 h-4 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* 1. HERO IDENTITY & LINKS CARD */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 text-slate-900 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center text-2xl font-bold shrink-0">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : 'S'}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {profile?.full_name || user?.email}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Semester {profile?.semester || '—'}
                </span>
              </div>

              <p className="text-sm font-medium text-indigo-700">
                {profile?.headline || (
                  <button
                    onClick={openEditProfileModal}
                    className="italic text-slate-400 hover:text-indigo-600 underline decoration-dashed"
                  >
                    + Add a short headline (e.g., Full-Stack Developer & ML Enthusiast)
                  </button>
                )}
              </p>

              <p className="text-xs text-slate-500">
                {profile?.department_name || 'Department'} ({profile?.department_code || 'DEPT'}) • Roll No:{' '}
                <span className="font-semibold text-slate-800">{profile?.roll_no}</span>
              </p>

              {/* Availability Toggles */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => handleToggleAvailability('open_to_mentor')}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                    profile?.open_to_mentor !== false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/70'
                  }`}
                  title="Click to toggle peer mentoring availability"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      profile?.open_to_mentor !== false ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  {profile?.open_to_mentor !== false ? 'Open to Peer Mentor' : 'Mentoring Paused'}
                </button>

                <button
                  onClick={() => handleToggleAvailability('open_to_collaborate')}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                    profile?.open_to_collaborate !== false
                      ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100/70'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/70'
                  }`}
                  title="Click to toggle project collaboration availability"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      profile?.open_to_collaborate !== false ? 'bg-sky-500' : 'bg-slate-400'
                    }`}
                  />
                  {profile?.open_to_collaborate !== false ? 'Looking for Capstone Projects' : 'Not Seeking Team'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <button
              onClick={openEditProfileModal}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
            <button
              onClick={() => navigate(`/students/${user.user_id}`)}
              className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Public View
            </button>
          </div>
        </div>

        {/* Bio + Proof Links Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            {profile?.bio || (
              <span className="text-slate-400 italic">
                No academic bio yet. Click &ldquo;Edit Profile&rdquo; to tell peers and faculty about your interests and strengths.
              </span>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {profile?.github_url ? (
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
            ) : (
              <button
                onClick={openEditProfileModal}
                className="px-3 py-1.5 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center gap-1.5"
              >
                <GitBranch className="w-3.5 h-3.5" />
                + Add GitHub
              </button>
            )}

            {profile?.linkedin_url && (
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

            {profile?.portfolio_url && (
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

      {/* 2. CREDIBILITY & IMPACT METRICS STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CGPA</div>
            <div className="text-xl font-black text-slate-900">{profile?.cgpa ?? 'N/A'}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Peer Rating</div>
            <div className="text-xl font-black text-slate-900">
              {Number(stats.avg_peer_rating ?? profile?.avg_peer_rating ?? 0).toFixed(1)}
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
      </div>

      {/* 3. PROOF-OF-WORK PORTFOLIO (GITHUB PROJECTS) */}
      <div className="bg-white rounded-[28px] border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-indigo-600" />
              Proof-of-Work Portfolio (GitHub Projects)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showcase real repositories and live demos so peers and team leads can verify your technical expertise.
            </p>
          </div>
          <button
            onClick={openAddProjectModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add GitHub Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Code2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No portfolio projects added yet</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Adding at least 1–2 GitHub projects significantly increases trust when students choose peer mentors or teammates.
            </p>
            <button
              onClick={openAddProjectModal}
              className="mt-4 px-4 py-2 bg-white border border-slate-300 hover:border-indigo-400 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-bold transition-colors"
            >
              + Add Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div
                key={proj.project_id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        PROJECT_TYPE_STYLES[proj.project_type] || PROJECT_TYPE_STYLES.PERSONAL
                      }`}
                    >
                      {proj.project_type}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditProjectModal(proj)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Edit project"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.project_id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900">{proj.title}</h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">
                    {proj.description}
                  </p>

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
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
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
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-blue-400 text-slate-700 hover:text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
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

      {/* 4. SKILLS MATRIX & COMPACT ADD SKILL BAR */}
      <div className="bg-white rounded-[28px] border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Skills & Competencies
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Declare skills you can teach peers or technologies you want to learn for your capstone project.
          </p>
        </div>

        {/* Compact Add Skill Form */}
        <form
          onSubmit={handleAddSkill}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end p-4 rounded-2xl bg-slate-50 border border-slate-200/80"
        >
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Intent</label>
            <select
              value={skillType}
              onChange={(e) => setSkillType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="OFFERED">Can Teach (Offered)</option>
              <option value="WANTED">Want to Learn (Wishlist)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                const first = catalogSkills.find(
                  (s) => !e.target.value || s.category_id === parseInt(e.target.value, 10)
                );
                if (first) setSelectedSkillId(first.skill_id);
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Skill</label>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
            >
              {filteredCatalogSkills.map((s) => (
                <option key={s.skill_id} value={s.skill_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Proficiency ({proficiency}/5)
            </label>
            <select
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">1 - Beginner</option>
              <option value="2">2 - Elementary</option>
              <option value="3">3 - Intermediate</option>
              <option value="4">4 - Advanced</option>
              <option value="5">5 - Expert</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={addingSkill}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {addingSkill ? 'Saving...' : 'Add Skill'}
            </button>
          </div>
        </form>

        {/* Two Columns: Offered vs Wanted */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Offered */}
          <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Skills Offered (Can Mentor)
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {mySkills.offered.length}
              </span>
            </div>

            {mySkills.offered.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-emerald-200 rounded-xl bg-white/60">
                No offered skills yet. Add skills you can teach others.
              </div>
            ) : (
              <div className="space-y-2">
                {mySkills.offered.map((s) => (
                  <div
                    key={s.user_skill_id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white border border-emerald-200/80 rounded-xl"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{s.skill_name}</div>
                      <div className="text-[10px] text-slate-400">{s.category_name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ProficiencyBars level={s.proficiency_level} color="emerald" />
                      <button
                        onClick={() => handleDeleteSkill(s.user_skill_id)}
                        className="text-slate-300 hover:text-rose-600 transition-colors"
                        title="Remove skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wanted */}
          <div className="p-5 rounded-2xl border border-blue-100 bg-blue-50/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Skills Wanted (Learning Wishlist)
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {mySkills.wanted.length}
              </span>
            </div>

            {mySkills.wanted.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-blue-200 rounded-xl bg-white/60">
                No wishlist skills yet. Add technologies you want to learn.
              </div>
            ) : (
              <div className="space-y-2">
                {mySkills.wanted.map((s) => (
                  <div
                    key={s.user_skill_id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white border border-blue-200/80 rounded-xl"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{s.skill_name}</div>
                      <div className="text-[10px] text-slate-400">{s.category_name}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <ProficiencyBars level={s.proficiency_level} color="blue" />
                      <button
                        onClick={() => handleDeleteSkill(s.user_skill_id)}
                        className="text-slate-300 hover:text-rose-600 transition-colors"
                        title="Remove skill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. ACTIVE TEAMS & VERIFIED PEER REVIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams */}
        <div className="bg-white rounded-[28px] border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-600" />
            Active Capstone Teams ({teams.length})
          </h3>
          {teams.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">Not part of any active capstone team yet.</p>
          ) : (
            <div className="space-y-2.5">
              {teams.map((t) => (
                <div
                  key={t.team_id}
                  onClick={() => navigate(`/teams/${t.team_id}`)}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{t.team_name}</div>
                    <div className="text-[11px] text-slate-500">
                      {t.idea_title || 'Open Project'} • Role: {t.role_in_team}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Peer Reviews */}
        <div className="bg-white rounded-[28px] border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-4">
            <MessageSquareQuote className="w-4 h-4 text-amber-500" />
            Verified Peer Mentorship Reviews ({reviews.length})
          </h3>
          {reviews.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">
              No peer mentorship reviews yet. Complete 1-on-1 sessions to build verified reviews.
            </p>
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

      {/* ========================================================= */}
      {/* MODAL 1: EDIT STUDENT PROFILE                             */}
      {/* ========================================================= */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">Edit Academic Profile</h3>
              <button
                onClick={() => setShowEditProfile(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Headline / Tagline</label>
                  <input
                    type="text"
                    placeholder="e.g., Full-Stack Dev & ML Enthusiast"
                    value={profileForm.headline}
                    onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={profileForm.semester}
                    onChange={(e) => setProfileForm({ ...profileForm, semester: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CGPA (0 - 10)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={profileForm.cgpa}
                    onChange={(e) => setProfileForm({ ...profileForm, cgpa: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Academic Bio</label>
                <textarea
                  rows="3"
                  placeholder="Describe your research interests, capstone focus, and what you enjoy building or teaching..."
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GitHub Profile URL</label>
                  <input
                    type="text"
                    placeholder="https://github.com/username"
                    value={profileForm.github_url}
                    onChange={(e) => setProfileForm({ ...profileForm, github_url: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">LinkedIn URL</label>
                    <input
                      type="text"
                      placeholder="https://linkedin.com/in/username"
                      value={profileForm.linkedin_url}
                      onChange={(e) => setProfileForm({ ...profileForm, linkedin_url: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Portfolio / Website</label>
                    <input
                      type="text"
                      placeholder="https://your-portfolio.dev"
                      value={profileForm.portfolio_url}
                      onChange={(e) => setProfileForm({ ...profileForm, portfolio_url: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileForm.open_to_mentor}
                    onChange={(e) => setProfileForm({ ...profileForm, open_to_mentor: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  Open to Peer Mentoring
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profileForm.open_to_collaborate}
                    onChange={(e) => setProfileForm({ ...profileForm, open_to_collaborate: e.target.checked })}
                    className="rounded text-indigo-600"
                  />
                  Open to Capstone Team Collaboration
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD / EDIT GITHUB PROJECT                        */}
      {/* ========================================================= */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingProjectId ? 'Edit Portfolio Project' : 'Add Proof-of-Work Project'}
              </h3>
              <button
                onClick={() => setShowProjectModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Smart Attendance with OpenCV"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={projectForm.project_type}
                    onChange={(e) => setProjectForm({ ...projectForm, project_type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="PERSONAL">Personal</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="HACKATHON">Hackathon</option>
                    <option value="OPEN_SOURCE">Open Source</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="What does this project do, what problem does it solve, and what was your role?"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tech Stack (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Python, Flask, React, MySQL, Docker"
                  value={projectForm.tech_stack}
                  onChange={(e) => setProjectForm({ ...projectForm, tech_stack: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GitHub Repository URL *</label>
                <input
                  type="text"
                  required
                  placeholder="https://github.com/username/repo-name"
                  value={projectForm.github_url}
                  onChange={(e) => setProjectForm({ ...projectForm, github_url: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Live Demo URL (optional)</label>
                <input
                  type="text"
                  placeholder="https://my-demo-app.vercel.app"
                  value={projectForm.live_demo_url}
                  onChange={(e) => setProjectForm({ ...projectForm, live_demo_url: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProject}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {savingProject ? 'Saving...' : editingProjectId ? 'Update Project' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
