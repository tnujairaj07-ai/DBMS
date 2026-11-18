import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Users,
  Star,
  Search,
  Filter,
  MessageSquare,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  X,
  AlertCircle,
  Award,
  Video,
  Send,
  ThumbsUp
} from 'lucide-react';

const PeerMentorsPage = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'my-sessions' | 'requests'

  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [requestSkill, setRequestSkill] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [availableSkills, setAvailableSkills] = useState([]);
  const [requesting, setRequesting] = useState(false);

  // My Requests & Sessions State
  const [myRequests, setMyRequests] = useState({ sent: [], received: [] });
  const [mySessions, setMySessions] = useState([]);

  // Review Modal State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewSession, setReviewSession] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Respond Modal State
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/learnlink-session');

  const [alert, setAlert] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, [activeTab, skillFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'directory') {
        const res = await api.get('/peer/mentors', {
          params: { search: search || undefined, skill: skillFilter || undefined },
        });
        setMentors(res.data.data || []);
      } else if (activeTab === 'my-sessions' && role === 'STUDENT') {
        const res = await api.get('/peer/sessions/my-sessions');
        setMySessions(res.data.data || []);
      } else if (activeTab === 'requests' && role === 'STUDENT') {
        const res = await api.get('/peer/requests/my-requests');
        setMyRequests(res.data.data || { sent: [], received: [] });
      }
    } catch (err) {
      console.error('Failed to load peer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRequest = (mentor) => {
    setSelectedMentor(mentor);
    const skills = mentor.offered_skills ? mentor.offered_skills.split(', ') : [];
    setAvailableSkills(skills);
    setRequestSkill(skills[0] || '');
    setRequestMessage('Hi! I saw you offer help with this skill and would love a 1-on-1 peer session.');
    setAlert({ type: '', text: '' });
    setIsRequestModalOpen(true);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedMentor) return;

    setRequesting(true);
    setAlert({ type: '', text: '' });

    try {
      // Find skill ID
      const skillsRes = await api.get('/skills');
      const allSkills = skillsRes.data.data || [];
      const matched = allSkills.find((s) => s.name.toLowerCase() === requestSkill.toLowerCase());

      if (!matched) {
        setAlert({ type: 'error', text: 'Selected skill not found.' });
        return;
      }

      const res = await api.post('/peer/requests', {
        peer_mentor_id: selectedMentor.student_id,
        skill_id: matched.skill_id,
        message: requestMessage,
      });

      if (res.data.success) {
        setAlert({ type: 'success', text: 'Peer mentoring session request sent!' });
        setIsRequestModalOpen(false);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send peer request.',
      });
    } finally {
      setRequesting(false);
    }
  };

  const handleOpenRespond = (req) => {
    setActiveRequest(req);
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16);
    setScheduledAt(tomorrow);
    setIsRespondModalOpen(true);
  };

  const handleRespondRequest = async (action) => {
    if (!activeRequest) return;
    try {
      const res = await api.post(`/peer/requests/${activeRequest.request_id}/respond`, {
        action: action,
        scheduled_at: scheduledAt,
        meeting_link: meetingLink,
      });
      if (res.data.success) {
        setAlert({
          type: 'success',
          text: action === 'ACCEPT' ? 'Session scheduled!' : 'Request declined.',
        });
        setIsRespondModalOpen(false);
        loadData();
      }
    } catch (err) {
      setAlert({ type: 'error', text: err.response?.data?.message || 'Action failed.' });
    }
  };

  const handleOpenReview = (session) => {
    setReviewSession(session);
    setRating(5);
    setFeedback('');
    setAlert({ type: '', text: '' });
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewSession) return;

    setSubmittingReview(true);
    setAlert({ type: '', text: '' });

    try {
      const res = await api.post(`/peer/sessions/${reviewSession.session_id}/review`, {
        rating: parseInt(rating, 10),
        feedback: feedback,
      });

      if (res.data.success) {
        setAlert({
          type: 'success',
          text: `Review submitted! Mentor's average rating recalculated to ${res.data.data.updated_mentor_rating} / 5.0 via database trigger.`,
        });
        setIsReviewModalOpen(false);
        loadData();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit review.',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 mb-4 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            Phase 5 • Peer Skill Exchange & Star Reviews
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Peer Skill Mentors & Learning Sessions
          </h1>
          <p className="mt-3 text-base text-blue-100/90 leading-relaxed">
            Connect with skilled classmates offering hands-on technical guidance. Request 1-on-1 learning
            sessions and leave verified reviews with real-time database rating recalculation triggers.
          </p>
        </div>
      </div>

      {/* Global alert messages */}
      {alert.text && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-center justify-between shadow-xs ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span className="font-semibold">{alert.text}</span>
          </div>
          <button onClick={() => setAlert({ type: '', text: '' })} className="text-slate-400 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'directory'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          Ranked Peer Mentors (vw_peer_mentor_rankings)
        </button>

        {role === 'STUDENT' && (
          <>
            <button
              onClick={() => setActiveTab('my-sessions')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'my-sessions'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4" />
              My Learning Sessions
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'requests'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Requests Inbox
            </button>
          </>
        )}
      </div>

      {/* Tab 1: Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search mentor by name, roll no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Showing <span className="text-slate-900 font-bold">{mentors.length}</span> verified peer mentors
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : mentors.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No Peer Mentors Found</h3>
              <p className="text-sm text-slate-500 mt-1">
                No students currently offer matching skills in this directory.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((m, idx) => {
                const ratingNum = parseFloat(m.avg_peer_rating || 0);
                const skills = m.offered_skills ? m.offered_skills.split(', ') : [];

                return (
                  <div
                    key={m.student_id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold text-lg">
                            {m.full_name ? m.full_name[0] : 'S'}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{m.full_name}</h3>
                            <p className="text-xs text-slate-500">
                              {m.department_name} • Sem {m.semester}
                            </p>
                          </div>
                        </div>

                        {idx < 3 && (
                          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-extrabold text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                        )}
                      </div>

                      {/* Rating & Sessions Pill */}
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-black text-slate-900">
                            {ratingNum > 0 ? ratingNum.toFixed(1) : 'New'}
                          </span>
                          <span className="text-[11px] text-slate-400">({m.total_reviews} reviews)</span>
                        </div>

                        <span className="text-xs font-semibold text-slate-600">
                          <strong>{m.total_sessions_completed}</strong> sessions completed
                        </span>
                      </div>

                      {/* Offered Skills */}
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Offered Technical Skills
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.map((s, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {role === 'STUDENT' && (
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => handleOpenRequest(m)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Request Guidance Session
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: My Learning Sessions */}
      {activeTab === 'my-sessions' && (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Your Scheduled & Completed Sessions ({mySessions.length})
          </div>

          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : mySessions.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No Learning Sessions</h3>
              <p className="text-sm text-slate-500 mt-1">
                You have not booked any peer learning sessions yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mySessions.map((s) => (
                <div
                  key={s.session_id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {s.skill_name}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        s.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Peer Guidance: {s.skill_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.is_requester ? (
                        <>
                          Mentor: <strong className="text-slate-800">{s.peer_mentor_name}</strong>
                        </>
                      ) : (
                        <>
                          Learner: <strong className="text-slate-800">{s.requester_name}</strong>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scheduled Date:</span>
                      <strong className="text-slate-800">
                        {new Date(s.scheduled_at).toLocaleString()}
                      </strong>
                    </div>
                    {s.meeting_link && (
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-400">Session Link:</span>
                        <a
                          href={s.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-mono font-semibold"
                        >
                          Join Meeting <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Review Button if requester and no review yet */}
                  {s.is_requester && !s.review && (
                    <button
                      onClick={() => handleOpenReview(s)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-white" />
                      Leave Star Rating & Review
                    </button>
                  )}

                  {s.review && (
                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-emerald-800 font-bold">
                        <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                        You rated this session: {s.review.rating} / 5
                      </div>
                      {s.review.feedback && <p className="text-slate-600 italic">"{s.review.feedback}"</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Requests Inbox */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Received Requests (As a Peer Mentor) */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              Received Requests (You as Mentor)
            </h3>

            {myRequests.received.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
                No incoming peer learning requests.
              </div>
            ) : (
              myRequests.received.map((req) => (
                <div
                  key={req.request_id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {req.skill_name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">{req.requester_name}</div>
                    <p className="text-xs text-slate-600 italic mt-1">"{req.message}"</p>
                  </div>

                  {req.status === 'PENDING' ? (
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenRespond(req)}
                        className="flex-1 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 cursor-pointer"
                      >
                        Accept & Schedule
                      </button>
                      <button
                        onClick={() => {
                          setActiveRequest(req);
                          handleRespondRequest('DECLINE');
                        }}
                        className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-slate-500">Status: {req.status}</div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Sent Requests */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" />
              Sent Requests (You as Learner)
            </h3>

            {myRequests.sent.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
                You have not requested any peer sessions.
              </div>
            ) : (
              myRequests.sent.map((req) => (
                <div
                  key={req.request_id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {req.skill_name}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        req.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : req.status === 'DECLINED'
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-slate-900">
                    Mentor: {req.peer_mentor_name}
                  </div>
                  <p className="text-xs text-slate-600 italic">"{req.message}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ----------------- REQUEST SESSION MODAL ----------------- */}
      {isRequestModalOpen && selectedMentor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Request Guidance</h2>
                <p className="text-xs text-slate-500">Mentor: {selectedMentor.full_name}</p>
              </div>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Select Skill to Learn *
                </label>
                <select
                  required
                  value={requestSkill}
                  onChange={(e) => setRequestSkill(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                >
                  {availableSkills.map((s, i) => (
                    <option key={i} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Message / Learning Needs *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain what concepts, debugging questions, or project challenges you want guidance on..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requesting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {requesting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- SCHEDULE SESSION MODAL ----------------- */}
      {isRespondModalOpen && activeRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsRespondModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Schedule Peer Session</h2>
                <p className="text-xs text-slate-500">Learner: {activeRequest.requester_name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Meeting Link / Location *
                </label>
                <input
                  type="text"
                  required
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRespondModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRespondRequest('ACCEPT')}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  Confirm & Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- STAR RATING REVIEW MODAL ----------------- */}
      {isReviewModalOpen && reviewSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Rate Peer Session</h2>
                <p className="text-xs text-slate-500">
                  Mentor: {reviewSession.peer_mentor_name} • {reviewSession.skill_name}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Star Rating (1 to 5 Stars) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          val <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 font-bold text-slate-800 text-sm">{rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Review Comments / Learning Outcome *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share feedback on how the mentor helped you understand the concepts..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeerMentorsPage;