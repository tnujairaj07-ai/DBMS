import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  Filter,
  UserCheck,
  BarChart3,
  X,
  AlertCircle,
  Search,
  UserPlus,
  Send,
  Users,
  Compass,
  Check
} from 'lucide-react';

const ProposalsPage = () => {
  const { user, role } = useAuth();

  // Active Tab: 'MY_PROPOSALS' | 'EXPLORE_PROPOSALS'
  const [activeTab, setActiveTab] = useState('MY_PROPOSALS');

  const [proposals, setProposals] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [domains, setDomains] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Explore tab
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [selectedCycle, setSelectedCycle] = useState('');

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);
  const [isExplanationModalOpen, setIsExplanationModalOpen] = useState(false);
  const [activeProposal, setActiveProposal] = useState(null);

  // Collaboration / Join Request Modal State
  const [collaborateTarget, setCollaborateTarget] = useState(null);
  const [collabMessage, setCollabMessage] = useState('');
  const [submittingCollab, setSubmittingCollab] = useState(false);
  const [collabFeedback, setCollabFeedback] = useState({ type: '', text: '' });

  // Form State for New Proposal
  const [proposalForm, setProposalForm] = useState({
    team_id: '',
    cycle_id: '',
    domain_id: '',
    title: '',
    problem_statement: '',
    objectives: '',
    methodology: '',
  });

  // Preference Form State
  const [facultyList, setFacultyList] = useState([]);
  const [preferences, setPreferences] = useState([
    { faculty_id: '', preference_rank: 1 },
    { faculty_id: '', preference_rank: 2 },
    { faculty_id: '', preference_rank: 3 },
  ]);

  // Recommendations state
  const [recommendationsData, setRecommendationsData] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);

  // Action status message
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchInitialData();
  }, [selectedCycle]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCycle) params.cycle_id = selectedCycle;

      const [propRes, cyclesRes, domainsRes, allTeamsRes] = await Promise.all([
        api.get('/allocation/proposals', { params }).catch(() => ({ data: { data: [] } })),
        api.get('/allocation/cycles').catch(() => ({ data: { data: [] } })),
        api.get('/academic/domains').catch(() => ({ data: { data: [] } })),
        api.get('/projects/teams').catch(() => ({ data: { data: [] } }))
      ]);

      setProposals(propRes.data?.data || []);
      setCycles(cyclesRes.data?.data || []);
      setDomains(domainsRes.data?.data || []);
      setAllTeams(allTeamsRes.data?.data || []);

      if (role === 'STUDENT') {
        const teamsRes = await api.get('/projects/teams/my').catch(() =>
          api.get('/projects/teams/my-teams').catch(() => ({ data: { data: [] } }))
        );
        setMyTeams(teamsRes.data?.data || []);
      }
    } catch (err) {
      console.error('Failed to load proposals data:', err);
    } finally {
      setLoading(false);
    }
  };

  const myTeamIds = myTeams.map((t) => t.team_id);

  // Section 1: User's / Team's Proposals
  const myProposals = role === 'STUDENT'
    ? proposals.filter((p) => myTeamIds.includes(p.team_id))
    : proposals;

  // Section 2: Explore University Proposals & Open Roles
  const exploreProposals = proposals.filter((p) => {
    const matchesSearch =
      searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.problem_statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.team_name && p.team_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDomain =
      domainFilter === 'ALL' ||
      (p.domain_name && p.domain_name.toLowerCase().includes(domainFilter.toLowerCase()));

    return matchesSearch && matchesDomain;
  });

  const handleOpenSubmitModal = () => {
    setMessage({ type: '', text: '' });
    const activeCycle = cycles.find((c) => c.status === 'ACTIVE') || cycles[0];
    const leaderTeam = myTeams.find((t) => t.is_leader || t.leader_id === user?.student_profile?.student_id) || myTeams[0];

    setProposalForm({
      team_id: leaderTeam ? leaderTeam.team_id : '',
      cycle_id: activeCycle ? activeCycle.cycle_id : '',
      domain_id: domains[0]?.domain_id || '',
      title: '',
      problem_statement: '',
      objectives: '',
      methodology: '',
    });
    setIsSubmitModalOpen(true);
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!proposalForm.team_id) {
      setMessage({ type: 'error', text: 'You must select a team to submit a proposal.' });
      return;
    }

    try {
      const res = await api.post('/allocation/proposals', proposalForm);
      if (res.data.success) {
        setIsSubmitModalOpen(false);
        setActiveTab('MY_PROPOSALS');
        await fetchInitialData();
        setMessage({ type: 'success', text: 'Project proposal submitted successfully!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit proposal.' });
    }
  };

  const handleOpenPreferences = async (prop) => {
    setActiveProposal(prop);
    setMessage({ type: '', text: '' });
    try {
      const [facRes, detailRes] = await Promise.all([
        api.get('/allocation/faculty-workload'),
        api.get(`/allocation/proposals/${prop.proposal_id}`),
      ]);

      setFacultyList(facRes.data.data || []);
      const existing = detailRes.data.data?.preferences || [];

      const newPrefs = [
        { faculty_id: existing.find((p) => p.preference_rank === 1)?.faculty_id || '', preference_rank: 1 },
        { faculty_id: existing.find((p) => p.preference_rank === 2)?.faculty_id || '', preference_rank: 2 },
        { faculty_id: existing.find((p) => p.preference_rank === 3)?.faculty_id || '', preference_rank: 3 },
      ];
      setPreferences(newPrefs);
      setIsPreferenceModalOpen(true);
    } catch (err) {
      console.error('Failed to load faculty workload or preferences:', err);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const selected = preferences.map((p) => p.faculty_id).filter(Boolean);
    if (new Set(selected).size !== selected.length) {
      setMessage({ type: 'error', text: 'You cannot select the same faculty for multiple preference ranks.' });
      return;
    }

    try {
      const res = await api.post(`/allocation/proposals/${activeProposal.proposal_id}/preferences`, {
        preferences: preferences.filter((p) => p.faculty_id),
      });

      if (res.data.success) {
        setIsPreferenceModalOpen(false);
        await fetchInitialData();
        setMessage({ type: 'success', text: 'Supervisor preferences saved successfully!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save preferences.' });
    }
  };

  const handleOpenExplanation = async (prop) => {
    setActiveProposal(prop);
    setIsExplanationModalOpen(true);
    setLoadingRecs(true);
    try {
      const res = await api.get(`/allocation/recommendations/${prop.proposal_id}`);
      setRecommendationsData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleSendCollaborationRequest = async (e) => {
    e.preventDefault();
    if (!collaborateTarget) return;

    setSubmittingCollab(true);
    setCollabFeedback({ type: '', text: '' });

    try {
      await api.post(`/projects/teams/${collaborateTarget.team_id}/join-requests`, {
        message: collabMessage.trim() || `I am interested in collaborating on your project proposal: "${collaborateTarget.title}".`
      });
      setCollabFeedback({ type: 'success', text: 'Collaboration request sent directly to the team leader!' });
      setTimeout(() => {
        setCollaborateTarget(null);
        setCollabMessage('');
        setCollabFeedback({ type: '', text: '' });
      }, 1800);
    } catch (err) {
      setCollabFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send collaboration request.'
      });
    } finally {
      setSubmittingCollab(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ALLOCATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ALLOCATED
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> SUBMITTED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> UNDER REVIEW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-blue-100 mb-3 border border-white/10">
            <FileText className="w-3.5 h-3.5 text-blue-300" />
            Project Proposals & Collaboration
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Project Proposals
          </h1>
          <p className="mt-2 text-sm text-blue-100/90 leading-relaxed">
            Review your submitted team proposals and supervisor assignments, or explore ongoing project proposals looking for skilled collaborators.
          </p>

          {role === 'STUDENT' && (
            <div className="mt-5 flex flex-wrap gap-4">
              <button
                onClick={handleOpenSubmitModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-indigo-700 font-bold text-xs sm:text-sm shadow-md hover:bg-blue-50 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Submit New Project Proposal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global alert messages */}
      {message.text && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Two Dedicated Tabs: My Proposals vs Explore Proposals */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('MY_PROPOSALS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'MY_PROPOSALS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          My Proposals
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
            activeTab === 'MY_PROPOSALS' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {myProposals.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('EXPLORE_PROPOSALS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'EXPLORE_PROPOSALS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          Explore Proposals & Open Roles
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
            activeTab === 'EXPLORE_PROPOSALS' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {exploreProposals.length}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: MY PROPOSALS                                       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'MY_PROPOSALS' && (
        <div className="space-y-6 animate-fade-in">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : myProposals.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Proposals Submitted Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {role === 'STUDENT'
                  ? 'Your team has not submitted a formal capstone research proposal for this cycle. Click below to submit one.'
                  : 'No project proposals have been allocated or submitted in this category.'}
              </p>
              {role === 'STUDENT' && (
                <button
                  onClick={handleOpenSubmitModal}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                >
                  Submit Proposal
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myProposals.map((prop) => {
                const isMyTeamLeader =
                  role === 'STUDENT' &&
                  myTeams.some((t) => t.team_id === prop.team_id && (t.is_leader || t.leader_id === user?.student_profile?.student_id));

                return (
                  <div
                    key={prop.proposal_id}
                    className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {prop.domain_name || 'Research Domain'}
                        </span>
                        {getStatusBadge(prop.status)}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                        {prop.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                        {prop.problem_statement}
                      </p>

                      <div className="bg-slate-50 rounded-2xl p-3.5 mb-4 border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Team:</span>
                          <strong className="text-slate-800">{prop.team_name}</strong>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Academic Cycle:</span>
                          <span className="text-slate-800 font-medium">{prop.cycle_name || 'Active Cycle'}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Submitted:</span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {new Date(prop.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Supervisor Allocation Card if Allocated */}
                      {prop.status === 'ALLOCATED' && prop.allocation && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                              {prop.allocation.faculty_name ? prop.allocation.faculty_name[0] : 'F'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                                Assigned Supervisor
                              </span>
                              <div className="font-bold text-sm text-emerald-950 truncate">
                                {prop.allocation.faculty_name}
                              </div>
                              <div className="text-xs text-emerald-700">
                                Match Score: <strong>{prop.allocation.match_score} / 100</strong>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                      {isMyTeamLeader && prop.status !== 'ALLOCATED' && (
                        <button
                          onClick={() => handleOpenPreferences(prop)}
                          className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Supervisor Preferences
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenExplanation(prop)}
                        className="flex-1 py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        Scoring Breakdown
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: EXPLORE PROPOSALS & OPEN ROLES (Collaboration Hub) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'EXPLORE_PROPOSALS' && (
        <div className="space-y-6 animate-fade-in">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search proposals by title, problem, or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Domain:</span>
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Domains</option>
                {domains.map((d) => (
                  <option key={d.domain_id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Proposals List */}
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : exploreProposals.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 text-slate-500 text-sm">
              No project proposals match the selected search or domain filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exploreProposals.map((prop) => {
                const isMyTeam = myTeamIds.includes(prop.team_id);
                const teamInfo = allTeams.find((t) => t.team_id === prop.team_id);
                const hasVacancy = teamInfo ? teamInfo.current_members_count < teamInfo.max_members : true;

                return (
                  <div
                    key={prop.proposal_id}
                    className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {prop.domain_name || 'Academic Track'}
                        </span>
                        {getStatusBadge(prop.status)}
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                        {prop.title}
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {prop.problem_statement}
                      </p>

                      {/* Team & Capacity Details */}
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Team:</span>
                          <strong className="text-slate-800">{prop.team_name}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Recruiting Status:</span>
                          <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                            hasVacancy ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {hasVacancy ? 'Open Roles Available' : 'Team Roster Full'}
                          </span>
                        </div>
                      </div>

                      {/* Skills Wanted / Missing Tag Callout */}
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-xs space-y-1">
                        <span className="font-bold text-amber-900 block flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                          Collaborator Profile & Skills Desired:
                        </span>
                        <p className="text-amber-800 text-[11px] leading-relaxed">
                          Looking for students proficient in <strong>{prop.domain_name}</strong> fundamentals, algorithmic modeling, and database architecture.
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                      {isMyTeam ? (
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200">
                          Your Team Proposal
                        </span>
                      ) : role === 'STUDENT' && hasVacancy ? (
                        <button
                          onClick={() => {
                            setCollaborateTarget(prop);
                            setCollabMessage('');
                            setCollabFeedback({ type: '', text: '' });
                          }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Request to Collaborate / Join Project
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          No open slots available
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: SUBMIT NEW PROPOSAL                                  */}
      {/* ------------------------------------------------------------- */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-xl font-extrabold text-slate-900">Submit Project Proposal</h2>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Team</label>
                  <select
                    value={proposalForm.team_id}
                    onChange={(e) => setProposalForm({ ...proposalForm, team_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Team --</option>
                    {myTeams.map((t) => (
                      <option key={t.team_id} value={t.team_id}>
                        {t.team_name} {t.is_leader ? '(Leader)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Research Domain</label>
                  <select
                    value={proposalForm.domain_id}
                    onChange={(e) => setProposalForm({ ...proposalForm, domain_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {domains.map((d) => (
                      <option key={d.domain_id} value={d.domain_id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Proposal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Real-Time Distributed Sensor Telemetry Platform"
                  value={proposalForm.title}
                  onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Problem Statement</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the core technical problem, motivation, and scope..."
                  value={proposalForm.problem_statement}
                  onChange={(e) => setProposalForm({ ...proposalForm, problem_statement: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Objectives</label>
                  <textarea
                    rows={2}
                    placeholder="Key project deliverables..."
                    value={proposalForm.objectives}
                    onChange={(e) => setProposalForm({ ...proposalForm, objectives: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Methodology / Tech Stack</label>
                  <textarea
                    rows={2}
                    placeholder="Frameworks, libraries, and architecture..."
                    value={proposalForm.methodology}
                    onChange={(e) => setProposalForm({ ...proposalForm, methodology: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/20"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: COLLABORATION / JOIN REQUEST MODAL                    */}
      {/* ------------------------------------------------------------- */}
      {collaborateTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Request to Collaborate</h2>
                <p className="text-xs text-slate-500">Proposal: {collaborateTarget.title}</p>
              </div>
              <button
                onClick={() => setCollaborateTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {collabFeedback.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  collabFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {collabFeedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {collabFeedback.text}
              </div>
            )}

            <form onSubmit={handleSendCollaborationRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pitch / Skills Note to Team Leader ({collaborateTarget.team_name}):
                </label>
                <textarea
                  rows={3}
                  value={collabMessage}
                  onChange={(e) => setCollabMessage(e.target.value)}
                  placeholder="e.g. Hi! I reviewed your project proposal and would love to collaborate on the PyTorch models and system architecture."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCollaborateTarget(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCollab}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingCollab ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: SUPERVISOR PREFERENCE MODAL                          */}
      {/* ------------------------------------------------------------- */}
      {isPreferenceModalOpen && activeProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">Rank Faculty Supervisors</h2>
              <button
                onClick={() => setIsPreferenceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Rank top 3 faculty supervisors for: <strong>{activeProposal.title}</strong>
            </p>

            <form onSubmit={handleSavePreferences} className="space-y-3">
              {[1, 2, 3].map((rank) => (
                <div key={rank}>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Choice #{rank} Preferred Supervisor
                  </label>
                  <select
                    value={preferences.find((p) => p.preference_rank === rank)?.faculty_id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPreferences((prev) =>
                        prev.map((p) => (p.preference_rank === rank ? { ...p, faculty_id: val ? parseInt(val, 10) : '' } : p))
                      );
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Faculty Supervisor --</option>
                    {facultyList.map((f) => (
                      <option key={f.faculty_id} value={f.faculty_id}>
                        {f.faculty_name} ({f.designation}) • {f.department_name} (Load: {f.allocated_teams}/{f.max_capacity})
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPreferenceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20"
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 4: EXPLAINABLE MATCHING BREAKDOWN MODAL                 */}
      {/* ------------------------------------------------------------- */}
      {isExplanationModalOpen && activeProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">Explainable Scoring Breakdown</h2>
              <button
                onClick={() => setIsExplanationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingRecs ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : recommendationsData && recommendationsData.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recommendationsData.map((rec, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-sm">{rec.faculty_name}</span>
                      <span className="font-extrabold text-purple-700 text-xs px-2 py-0.5 bg-purple-50 rounded-lg border border-purple-200">
                        {rec.composite_score} / 100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div>Domain Match: <strong>{rec.breakdown?.domain_match || 0}%</strong></div>
                      <div>Skill Match: <strong>{rec.breakdown?.skill_match || 0}%</strong></div>
                      <div>Student Pref: <strong>{rec.breakdown?.student_preference || 0}%</strong></div>
                      <div>Workload Balance: <strong>{rec.breakdown?.workload_balance || 0}%</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No recommendation calculations found for this proposal yet.
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsExplanationModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalsPage;
