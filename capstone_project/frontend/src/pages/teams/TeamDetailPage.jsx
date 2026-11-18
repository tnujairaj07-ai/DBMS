import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Users,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  UserPlus,
  Send,
  Star,
  BookOpen,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

const TeamDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const studentProfile = user?.student_profile;

  const [team, setTeam] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Join Request Application State
  const [joinMsg, setJoinMsg] = useState('');
  const [applying, setApplying] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({ type: '', text: '' });

  const isLeader = team && studentProfile && team.leader_id === studentProfile.student_id;
  const isMember = team && studentProfile && team.members?.some((m) => m.student_id === studentProfile.student_id);

  const loadData = async () => {
    try {
      setLoading(true);
      const teamRes = await api.get(`/projects/teams/${id}`);
      if (teamRes.data.success) {
        setTeam(teamRes.data.data);

        // Load skill gap if linked to idea
        if (teamRes.data.data.idea_id) {
          try {
            const gapRes = await api.get(`/projects/teams/${id}/skill-gap`);
            if (gapRes.data.success) setSkillGap(gapRes.data.data);
          } catch (gapErr) {
            console.error("Failed to load skill gap:", gapErr);
          }
        }
      }

      // If leader, load join requests
      if (teamRes.data.data.leader_id === studentProfile?.student_id) {
        try {
          const reqsRes = await api.get(`/projects/teams/${id}/join-requests`);
          if (reqsRes.data.success) setJoinRequests(reqsRes.data.data);
        } catch (reqErr) {
          console.error("Failed to load join requests:", reqErr);
        }
      }
    } catch (err) {
      console.error("Failed to load team hub:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, studentProfile?.student_id]);

  const handleApplyToJoin = async (e) => {
    e.preventDefault();
    setApplying(true);
    setActionFeedback({ type: '', text: '' });

    try {
      const res = await api.post(`/projects/teams/${id}/join-requests`, {
        message: joinMsg,
      });
      if (res.data.success) {
        setActionFeedback({ type: 'success', text: 'Application sent to the team leader!' });
        setJoinMsg('');
      }
    } catch (err) {
      setActionFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to submit application.' });
    } finally {
      setApplying(false);
    }
  };

  const handleRespondToRequest = async (reqId, action) => {
    try {
      const res = await api.post(`/projects/teams/${id}/join-requests/${reqId}/respond`, {
        action,
      });
      if (res.data.success) {
        await loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500">
        Team not found.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Team Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900">{team.team_name}</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {team.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Linked Idea: <strong className="text-slate-800">{team.idea_title || 'No idea linked yet'}</strong>
            {team.domain_name && ` (${team.domain_name})`}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
          <div className="text-right">
            <div className="text-xs font-medium text-slate-500">Team Size</div>
            <div className="text-lg font-bold text-slate-900">
              {team.current_members_count} / {team.max_members}
            </div>
          </div>
        </div>
      </div>

      {actionFeedback.text && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2.5 ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {actionFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {actionFeedback.text}
        </div>
      )}

      {/* Grid: Left Roster & Join, Right Skill Gap Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Team Roster & Join Management */}
        <div className="space-y-6">
          {/* Members List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Team Members ({team.members?.length || 0})
            </h2>

            <div className="space-y-3">
              {team.members?.map((m) => (
                <div
                  key={m.membership_id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{m.full_name}</div>
                    <div className="text-xs text-slate-500">
                      Roll: {m.roll_no} • {m.department_code}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    m.member_role === 'LEADER'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {m.member_role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Join Request Box for Non-Members */}
          {!isMember && user?.role === 'STUDENT' && team.status === 'FORMING' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                Want to Join this Team?
              </h3>
              <p className="text-xs text-slate-500">
                Send a request with the skills you can bring to this project.
              </p>
              <form onSubmit={handleApplyToJoin} className="space-y-2">
                <textarea
                  rows="2"
                  value={joinMsg}
                  onChange={(e) => setJoinMsg(e.target.value)}
                  placeholder="e.g. I have strong experience in Python & SQL and can handle the data pipeline..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <button
                  type="submit"
                  disabled={applying}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {applying ? 'Sending...' : 'Apply to Join'}
                </button>
              </form>
            </div>
          )}

          {/* Leader Review Join Requests */}
          {isLeader && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                <span>Pending Join Requests</span>
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                  {joinRequests.length}
                </span>
              </h3>

              {joinRequests.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center italic">
                  No pending join requests.
                </div>
              ) : (
                <div className="space-y-3">
                  {joinRequests.map((req) => (
                    <div
                      key={req.join_request_id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2"
                    >
                      <div className="text-xs">
                        <strong className="text-slate-800">{req.student_name}</strong>
                        <span className="text-slate-500"> ({req.student_roll})</span>
                      </div>
                      {req.message && (
                        <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 italic">
                          "{req.message}"
                        </p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleRespondToRequest(req.join_request_id, 'ACCEPT')}
                          className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespondToRequest(req.join_request_id, 'REJECT')}
                          className="flex-1 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: DBMS Skill-Gap Visualizer Engine */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Team Skill-Gap Analysis
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Calculated dynamically from MySQL View <code>vw_team_skill_gaps</code> & Stored Function <code>fn_get_team_skill_gap_count</code>.
                </p>
              </div>

              {skillGap && (
                <div className="text-right">
                  <span className="text-xl font-black text-indigo-600">
                    {skillGap.coverage_percentage}%
                  </span>
                  <span className="text-xs text-slate-500 block">Coverage</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {skillGap && (
              <div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      skillGap.coverage_percentage >= 100
                        ? 'bg-emerald-500'
                        : skillGap.coverage_percentage >= 50
                        ? 'bg-indigo-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${skillGap.coverage_percentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-2 font-medium">
                  <span>Covered: {skillGap.covered_skills_count} / {skillGap.total_required_skills} Skills</span>
                  <span>Missing Required: <strong className="text-rose-600 font-bold">{skillGap.missing_required_count}</strong></span>
                </div>
              </div>
            )}

            {/* Skills Breakdown Grid */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Project Skill Requirements Breakdown
              </h3>

              {!skillGap?.skills_breakdown?.length ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No skills required or no project idea attached to this team.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {skillGap.skills_breakdown.map((item) => (
                    <div
                      key={item.skill_id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        item.is_covered
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/60 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.is_covered ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                        <div>
                          <div className="font-bold text-sm flex items-center gap-2">
                            {item.skill_name}
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/70 border border-slate-200/60 text-slate-600">
                              {item.category_name}
                            </span>
                          </div>
                          <div className="text-[11px] mt-0.5 text-slate-600">
                            {item.is_covered ? (
                              <span>Covered by: <strong>{item.covered_by_members}</strong></span>
                            ) : (
                              <span className="text-rose-700 font-medium">Missing in team roster!</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.importance_level === 'REQUIRED'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {item.importance_level}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommended Peer Mentors Section */}
            {skillGap?.recommended_peers?.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Recommended Peer Mentors for Missing Skills
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Students offering guidance on technologies your team lacks:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {skillGap.recommended_peers.map((peer) => (
                    <div
                      key={`${peer.student_id}-${peer.skill_id}`}
                      className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">{peer.full_name}</span>
                          <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {peer.avg_peer_rating || '5.0'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {peer.department_code} • Roll: {peer.roll_no}
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-md border border-blue-200 text-blue-800 text-[11px] font-semibold">
                          <span>Offers: {peer.skill_name}</span>
                          <span className="text-blue-500">(Lvl {peer.proficiency_level})</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-blue-100/60 flex justify-end">
                        <Link
                          to={`/student/profile`}
                          className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                        >
                          Request Peer Help
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetailPage;
