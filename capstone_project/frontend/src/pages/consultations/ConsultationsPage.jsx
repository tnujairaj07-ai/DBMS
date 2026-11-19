import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  Plus,
  FileText,
  X,
  AlertCircle,
  ExternalLink,
  Users
} from 'lucide-react';

const ConsultationsPage = () => {
  const { user, role } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Book Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [allocationId, setAllocationId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [mode, setMode] = useState('OFFLINE');
  const [locationOrLink, setLocationOrLink] = useState('Department Lab 304');
  const [agenda, setAgenda] = useState('');
  const [booking, setBooking] = useState(false);

  // Complete Modal State
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [minutes, setMinutes] = useState('');
  const [completing, setCompleting] = useState(false);

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [meetRes, propRes] = await Promise.all([
        api.get('/consultations/my-consultations'),
        api.get('/allocation/proposals', { params: { status: 'ALLOCATED' } }),
      ]);
      setMeetings(meetRes.data.data || []);
      setAllocations(propRes.data.data?.filter((p) => p.allocation) || []);
      if (propRes.data.data?.length > 0 && propRes.data.data[0].allocation) {
        setAllocationId(propRes.data.data[0].allocation.allocation_id);
      }
    } catch (err) {
      console.error('Failed to load consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBook = () => {
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16);
    setScheduledAt(tomorrow);
    setAgenda('');
    setMessage({ type: '', text: '' });
    setIsBookModalOpen(true);
  };

  const handleBookMeeting = async (e) => {
    e.preventDefault();
    if (!allocationId || !scheduledAt || !agenda) return;

    setBooking(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/consultations/schedule', {
        allocation_id: parseInt(allocationId, 10),
        scheduled_at: scheduledAt,
        mode: mode,
        location_or_link: locationOrLink,
        agenda: agenda,
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: 'Supervisor consultation meeting booked!' });
        setIsBookModalOpen(false);
        loadData();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to schedule meeting.',
      });
    } finally {
      setBooking(false);
    }
  };

  const handleOpenComplete = (m) => {
    setActiveMeeting(m);
    setMinutes('');
    setMessage({ type: '', text: '' });
    setIsCompleteModalOpen(true);
  };

  const handleCompleteMeeting = async (e) => {
    e.preventDefault();
    if (!activeMeeting) return;

    setCompleting(true);
    try {
      const res = await api.post(`/consultations/${activeMeeting.meeting_id}/complete`, {
        minutes_of_meeting: minutes,
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Consultation marked as completed with minutes recorded.' });
        setIsCompleteModalOpen(false);
        loadData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to complete consultation.' });
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2.5 border border-indigo-200/70">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            Academic Consultations
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Supervisor Consultation Meetings
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            Schedule progress check-ins, record minutes of meetings, and maintain transparent supervisor-student dialogue.
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={handleOpenBook}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Book Consultation Meeting
          </button>
        </div>
      </div>

      {/* Global alert messages */}
      {message.text && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-center justify-between shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-slate-400 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Consultations Scheduled</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Book a consultation meeting with your project supervisor to align on research progress.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Consultations Timeline ({meetings.length})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {meetings.map((m) => (
              <div
                key={m.meeting_id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1.5">
                      {m.mode === 'ONLINE' ? (
                        <>
                          <Video className="w-3.5 h-3.5 text-indigo-600" /> Online Meeting
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-indigo-600" /> In-Person Lab
                        </>
                      )}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        m.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{m.proposal_title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Team: <strong className="text-slate-800">{m.team_name}</strong> • Supervisor:{' '}
                      <strong className="text-slate-800">{m.faculty_name}</strong>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scheduled At:</span>
                      <strong className="text-slate-800">
                        {new Date(m.scheduled_at).toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Venue / URL:</span>
                      <strong className="text-slate-800 font-mono">{m.location_or_link}</strong>
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Agenda
                    </div>
                    <p className="text-xs text-slate-700 italic">"{m.agenda}"</p>
                  </div>

                  {m.minutes_of_meeting && (
                    <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-1">
                      <div className="text-emerald-800 font-bold uppercase text-[10px]">
                        Minutes of Meeting (Recorded)
                      </div>
                      <p className="text-slate-700 italic">"{m.minutes_of_meeting}"</p>
                    </div>
                  )}
                </div>

                {m.status !== 'COMPLETED' && (
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenComplete(m)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Completed & Add Minutes
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- BOOK MEETING MODAL ----------------- */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsBookModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Schedule Consultation</h2>
                <p className="text-xs text-slate-500">Book progress review with project supervisor</p>
              </div>
            </div>

            <form onSubmit={handleBookMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Project Allocation *
                </label>
                <select
                  required
                  value={allocationId}
                  onChange={(e) => setAllocationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                >
                  {allocations.map((p) => (
                    <option key={p.allocation.allocation_id} value={p.allocation.allocation_id}>
                      {p.title} ({p.allocation.faculty_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mode *
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="OFFLINE">In-Person (Offline)</option>
                    <option value="ONLINE">Video Call (Online)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Location / Meeting URL *
                </label>
                <input
                  type="text"
                  required
                  value={locationOrLink}
                  onChange={(e) => setLocationOrLink(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Planned Agenda *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Outline key discussion points (e.g. schema design review, testing results)..."
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {booking ? 'Scheduling...' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- COMPLETE MEETING MODAL ----------------- */}
      {isCompleteModalOpen && activeMeeting && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsCompleteModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Record Minutes of Meeting</h2>
                <p className="text-xs text-slate-500">{activeMeeting.proposal_title}</p>
              </div>
            </div>

            <form onSubmit={handleCompleteMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Minutes of Meeting & Action Items *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Document decisions made, required fixes, next milestone targets..."
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCompleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completing}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {completing ? 'Saving...' : 'Save & Mark Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationsPage;