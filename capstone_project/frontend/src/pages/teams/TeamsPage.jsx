import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Users,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertCircle,
  Lightbulb,
  Search,
  Filter,
  UserPlus,
  Send,
  UserCheck,
  Sparkles,
  Check,
  Compass
} from 'lucide-react';

const TeamsPage = () => {
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedIdeaId = searchParams.get('idea_id');

  // Active Tab: 'MY_TEAMS' | 'ALL_TEAMS'
  const [activeTab, setActiveTab] = useState('MY_TEAMS');

  // Data states
  const [myTeams, setMyTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Team List
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');

  // Create Team Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [ideaId, setIdeaId] = useState(preselectedIdeaId || '');
  const [maxMembers, setMaxMembers] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join Request Modal State
  const [joinModalTeam, setJoinModalTeam] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [joinFeedback, setJoinFeedback] = useState({ type: '', text: '' });

  // Pending requests for teams where user is leader
  const [teamRequests, setTeamRequests] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allTeamsRes, myTeamsRes, ideasRes, domainsRes] = await Promise.all([
        api.get('/projects/teams').catch(() => ({ data: { data: [] } })),
        api.get('/projects/teams/my').catch(() => ({ data: { data: [] } })),
        api.get('/projects/ideas').catch(() => ({ data: { data: [] } })),
        api.get('/academic/domains').catch(() => ({ data: { data: [] } })),
      ]);

      const my = myTeamsRes.data?.data || [];
      const all = allTeamsRes.data?.data || [];
      setMyTeams(my);
      setAllTeams(all);
      setIdeas(ideasRes.data?.data || []);
      setDomains(domainsRes.data?.data || []);

      if (preselectedIdeaId) {
        setShowCreateModal(true);
        setIdeaId(preselectedIdeaId);
      }

      // If user is leader of any team in myTeams, fetch join requests
      const myStudentId = user?.student_profile?.student_id;
      const leaderTeams = my.filter((t) => t.leader_id === myStudentId);
      const reqMap = {};
      await Promise.all(
        leaderTeams.map(async (t) => {
          try {
            const reqRes = await api.get(`/projects/teams/${t.team_id}/join-requests`);
            reqMap[t.team_id] = reqRes.data?.data || [];
          } catch (e) {
            reqMap[t.team_id] = [];
          }
        })
      );
      setTeamRequests(reqMap);
    } catch (err) {
      console.error('Failed to load teams data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setCreateError('Team name is required.');
      return;
    }

    setSubmitting(true);
    setCreateError('');

    try {
      const res = await api.post('/projects/teams', {
        team_name: teamName.trim(),
        idea_id: ideaId ? parseInt(ideaId, 10) : null,
        max_members: parseInt(maxMembers, 10),
      });

      if (res.data.success) {
        setShowCreateModal(false);
        setTeamName('');
        setActiveTab('MY_TEAMS');
        await loadData();
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create team.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendJoinRequest = async (e) => {
    e.preventDefault();
    if (!joinModalTeam) return;

    setSubmittingJoin(true);
    setJoinFeedback({ type: '', text: '' });

    try {
      await api.post(`/projects/teams/${joinModalTeam.team_id}/join-requests`, {
        message: joinMessage.trim() || 'I would like to join your project team!'
      });
      setJoinFeedback({ type: 'success', text: 'Join request sent to team leader!' });
      setTimeout(() => {
        setJoinModalTeam(null);
        setJoinMessage('');
        setJoinFeedback({ type: '', text: '' });
      }, 1800);
    } catch (err) {
      setJoinFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send join request.'
      });
    } finally {
      setSubmittingJoin(false);
    }
  };

  const handleRespondRequest = async (teamId, reqId, action) => {
    try {
      await api.post(`/projects/teams/${teamId}/join-requests/${reqId}/respond`, {
        action // 'ACCEPT' or 'REJECT'
      });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to respond to request.');
    }
  };

  const myTeamIds = myTeams.map((t) => t.team_id);
  const myStudentId = user?.student_profile?.student_id;

  // Filtered University Team List
  const filteredTeamList = allTeams.filter((team) => {
    const matchesSearch =
      searchQuery === '' ||
      team.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (team.idea_title && team.idea_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (team.leader_name && team.leader_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDomain =
      domainFilter === 'ALL' ||
      (team.domain_name && team.domain_name.toLowerCase().includes(domainFilter.toLowerCase()));

    return matchesSearch && matchesDomain;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'FORMING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'READY':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ALLOCATED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-[28px] border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Collaboration Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Teams
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage your personal project teams, review incoming membership requests from friends, or discover active university teams seeking collaborators.
          </p>
        </div>

        {role === 'STUDENT' && (
          <button
            onClick={() => {
              setCreateError('');
              setShowCreateModal(true);
            }}
            className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Team with Friends
          </button>
        )}
      </div>

      {/* Tabs Navigation (My Teams vs Team List) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('MY_TEAMS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'MY_TEAMS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          My Teams
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
            activeTab === 'MY_TEAMS' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {myTeams.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ALL_TEAMS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'ALL_TEAMS'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          Team List (University Directory)
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
            activeTab === 'ALL_TEAMS' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {allTeams.length}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: MY TEAMS (Created by me or with friends)               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'MY_TEAMS' && (
        <div className="space-y-6 animate-fade-in">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : myTeams.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-900">No teams created yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  You haven't formed a capstone team yet. Click the button below to create a team, invite friends, and prepare for proposal submission.
                </p>
              </div>
              {role === 'STUDENT' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Create Team with Friends
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myTeams.map((team) => {
                const isLeader = team.leader_id === myStudentId;
                const pendingRequests = teamRequests[team.team_id] || [];

                return (
                  <div
                    key={team.team_id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-extrabold text-slate-900">
                              {team.team_name}
                            </h3>
                            {isLeader ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                                Created by You (Leader)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                Team Member
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">Team ID: #{team.team_id}</span>
                        </div>

                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(team.status)}`}>
                          {team.status}
                        </span>
                      </div>

                      {/* Linked Idea */}
                      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                        <span className="font-bold text-slate-700 block mb-0.5">Linked Project Track:</span>
                        <span className="text-slate-600 font-medium">
                          {team.idea_title || 'General Capstone Development'}
                        </span>
                      </div>

                      {/* Roster / Members */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-slate-700">Team Roster ({team.members?.length || 1} / {team.max_members})</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {team.max_members - (team.members?.length || 1)} slots available
                          </span>
                        </div>

                        <div className="space-y-2">
                          {(team.members || []).map((m) => (
                            <div
                              key={m.membership_id}
                              className="flex items-center justify-between p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 text-xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-[11px]">
                                  {m.student_name ? m.student_name[0] : 'S'}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-800 block leading-tight">
                                    {m.student_name}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Roll: {m.roll_no || '2024-CS'}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                m.member_role === 'LEADER'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-slate-200/80 text-slate-700'
                              }`}>
                                {m.member_role}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pending Join Requests (If leader) */}
                      {isLeader && pendingRequests.length > 0 && (
                        <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/70 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-amber-900 flex items-center gap-1.5">
                              <UserPlus className="w-3.5 h-3.5 text-amber-700" />
                              Join Requests Waiting Approval ({pendingRequests.length})
                            </span>
                          </div>

                          <div className="space-y-2">
                            {pendingRequests.map((req) => (
                              <div
                                key={req.request_id}
                                className="p-2.5 bg-white rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                              >
                                <div>
                                  <span className="font-bold text-slate-800 block">
                                    {req.student_name}
                                  </span>
                                  <p className="text-[11px] text-slate-500 italic">
                                    "{req.message || 'Looking to join your project team'}"
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleRespondRequest(team.team_id, req.request_id, 'ACCEPT')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition-colors"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRespondRequest(team.team_id, req.request_id, 'REJECT')}
                                    className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-[10px] transition-colors"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Team Action Link */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        to={`/teams/${team.team_id}`}
                        className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        Inspect Team Hub & Skill Gap Engine
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: TEAM LIST (University Directory across all domains)   */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'ALL_TEAMS' && (
        <div className="space-y-6 animate-fade-in">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search teams by name, project idea, or leader..."
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

          {/* Teams Grid */}
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredTeamList.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-500 text-sm">
              No university teams match the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeamList.map((team) => {
                const isMember = myTeamIds.includes(team.team_id);
                const hasVacancy = team.current_members_count < team.max_members;

                return (
                  <div
                    key={team.team_id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">
                            {team.team_name}
                          </h3>
                          <span className="text-[11px] text-slate-400">Leader: {team.leader_name}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(team.status)}`}>
                          {team.status}
                        </span>
                      </div>

                      {team.idea_title ? (
                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-800 block mb-0.5">Project Idea:</span>
                          <span className="line-clamp-2">{team.idea_title}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic bg-slate-50/50 p-2 rounded-xl">
                          Topic forming in progress...
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                          hasVacancy
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {team.current_members_count} / {team.max_members} Members
                          {hasVacancy && ' • Recruiting'}
                        </span>

                        {isMember && (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            Your Team
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                      {!isMember && hasVacancy && role === 'STUDENT' && (
                        <button
                          onClick={() => {
                            setJoinModalTeam(team);
                            setJoinMessage('');
                            setJoinFeedback({ type: '', text: '' });
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Request to Join Team
                        </button>
                      )}

                      <Link
                        to={`/teams/${team.team_id}`}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        Inspect Team Roster
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: CREATE TEAM MODAL                                    */}
      {/* ------------------------------------------------------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">Create Team with Friends</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Visionaries Alpha"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link to Project Idea (Optional)</label>
                <select
                  value={ideaId}
                  onChange={(e) => setIdeaId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- No Idea Linked (Forming) --</option>
                  {ideas.map((i) => (
                    <option key={i.idea_id} value={i.idea_id}>{i.title} ({i.domain_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Maximum Members (1 to 6)</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  required
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Confirm & Form Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: JOIN REQUEST MODAL                                   */}
      {/* ------------------------------------------------------------- */}
      {joinModalTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Request to Join Team</h2>
                <p className="text-xs text-slate-500">Sending request to {joinModalTeam.team_name}</p>
              </div>
              <button
                onClick={() => setJoinModalTeam(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {joinFeedback.text && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  joinFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {joinFeedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {joinFeedback.text}
              </div>
            )}

            <form onSubmit={handleSendJoinRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message to Team Leader ({joinModalTeam.leader_name}):
                </label>
                <textarea
                  rows={3}
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="e.g. Hi! I have strong proficiency in PyTorch and backend development and would love to contribute to your project."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setJoinModalTeam(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJoin}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingJoin ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
