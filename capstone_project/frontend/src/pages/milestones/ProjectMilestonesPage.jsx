import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UploadCloud,
  FileText,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Calendar,
  Award,
  History,
  X,
  AlertCircle
} from 'lucide-react';

const ProjectMilestonesPage = () => {
  const { proposalId } = useParams();
  const { user, role } = useAuth();

  const [proposalsList, setProposalsList] = useState([]);
  const [selectedProposalId, setSelectedProposalId] = useState(proposalId || '');
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Submit Deliverable Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // History & Feedback Drawer State
  const [activeHistoryMilestone, setActiveHistoryMilestone] = useState(null);

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProposalsList();
  }, []);

  useEffect(() => {
    if (selectedProposalId) {
      loadProjectMilestones(selectedProposalId);
    }
  }, [selectedProposalId]);

  const fetchProposalsList = async () => {
    try {
      const res = await api.get('/allocation/proposals', { params: { status: 'ALLOCATED' } });
      const list = res.data.data || [];
      setProposalsList(list);
      if (!selectedProposalId && list.length > 0) {
        setSelectedProposalId(list[0].proposal_id);
      }
    } catch (err) {
      console.error('Failed to load allocated proposals:', err);
    }
  };

  const loadProjectMilestones = async (pId) => {
    try {
      setLoading(true);
      const res = await api.get(`/milestones/projects/${pId}`);
      setProjectData(res.data.data);
    } catch (err) {
      console.error('Failed to load project milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSubmit = (milestone) => {
    setSelectedMilestone(milestone);
    setFileUrl('');
    setNotes('');
    setMessage({ type: '', text: '' });
    setIsSubmitModalOpen(true);
  };

  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    if (!selectedMilestone || !fileUrl) return;

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post(`/milestones/${selectedMilestone.milestone_id}/submit`, {
        file_url: fileUrl,
        notes: notes,
      });

      if (res.data.success) {
        setMessage({
          type: 'success',
          text: 'Milestone deliverable submitted! Status transitioned to SUBMITTED via database trigger.',
        });
        setIsSubmitModalOpen(false);
        loadProjectMilestones(selectedProposalId);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit milestone deliverable.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status, isOverdue) => {
    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> OVERDUE
        </span>
      );
    }

    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> APPROVED
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> UNDER REVIEW
          </span>
        );
      case 'REVISIONS_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> REVISIONS REQUIRED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> PENDING
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2.5 border border-indigo-200/70">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Milestone Execution & Grading
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Project Milestone Timeline & Deliverables
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            Track student deliverables, document iterations, and faculty evaluation scores.
          </p>

          {/* Project Switcher */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">Select Allocated Project:</span>
            <select
              value={selectedProposalId}
              onChange={(e) => setSelectedProposalId(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {proposalsList.map((p) => (
                <option key={p.proposal_id} value={p.proposal_id} className="text-slate-900">
                  {p.title} ({p.team_name})
                </option>
              ))}
            </select>
          </div>
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
      ) : !projectData ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Allocated Project Selected</h3>
          <p className="text-sm text-slate-500 mt-1">
            Please select an allocated project above to view its milestone lifecycle.
          </p>
        </div>
      ) : (
        <>
          {/* Progress Overview Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Team: {projectData.team_name}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-0.5">{projectData.title}</h2>
                {projectData.allocation && (
                  <p className="text-xs text-slate-500 mt-1">
                    Supervisor: <strong className="text-slate-800">{projectData.allocation.faculty_name}</strong> (
                    {projectData.allocation.designation})
                  </p>
                )}
              </div>

              <div className="text-right">
                <div className="text-3xl font-black text-indigo-600">{projectData.progress_percent}%</div>
                <div className="text-xs font-semibold text-slate-500">Weightage Completed</div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Progress: {projectData.completed_weight}% / 100% Total Weightage</span>
                <span>{projectData.milestones.filter((m) => m.status === 'APPROVED').length} / 5 Milestones Completed</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${projectData.progress_percent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Milestones Linear Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Academic Milestone Stages</h3>

            <div className="space-y-4">
              {projectData.milestones.map((m, idx) => {
                const latest = m.latest_submission;
                const feedback = latest?.feedback;

                return (
                  <div
                    key={m.milestone_id}
                    className={`bg-white rounded-3xl p-6 border transition-all shadow-xs hover:shadow-md ${
                      m.is_overdue
                        ? 'border-rose-300 bg-rose-50/20'
                        : m.status === 'APPROVED'
                        ? 'border-emerald-200 bg-emerald-50/15'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                      {/* Left Block */}
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base shrink-0 ${
                            m.status === 'APPROVED'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : m.status === 'SUBMITTED'
                              ? 'bg-blue-600 text-white'
                              : m.is_overdue
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{m.sequence_no}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-bold text-slate-900">{m.name}</h4>
                            {getStatusBadge(m.status, m.is_overdue)}
                          </div>

                          <p className="text-xs text-slate-500 max-w-xl">{m.description}</p>

                          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                            <span className="flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-indigo-500" />
                              Weightage: <strong className="text-slate-800">{m.weightage_percent}%</strong>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Deadline: <strong className="text-slate-800">{new Date(m.due_date).toLocaleDateString()}</strong>
                            </span>
                            {m.submission_count > 0 && (
                              <span className="text-indigo-600">
                                {m.submission_count} submission {m.submission_count === 1 ? 'iteration' : 'iterations'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Action Block */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto justify-end">
                        {feedback && (
                          <div className="px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100 text-right">
                            <div className="text-xs font-bold text-emerald-800">Score Awarded</div>
                            <div className="text-xl font-black text-emerald-600">{feedback.score} / 100</div>
                          </div>
                        )}

                        {m.submission_count > 0 && (
                          <button
                            onClick={() => setActiveHistoryMilestone(m)}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                            View Submissions & Notes
                          </button>
                        )}

                        {role === 'STUDENT' && m.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleOpenSubmit(m)}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <UploadCloud className="w-4 h-4" />
                            {m.submission_count > 0 ? 'Submit Revision' : 'Submit Deliverable'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ----------------- SUBMIT DELIVERABLE MODAL ----------------- */}
      {isSubmitModalOpen && selectedMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Submit Milestone Deliverable</h2>
                <p className="text-xs text-slate-500">{selectedMilestone.name}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitDeliverable} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Artifact / Repository URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/myteam/project or Google Drive link"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Submission Notes / Change Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Highlight key implementations, test coverage, or addressed supervisor feedback..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Uploading Deliverable...' : 'Submit to Supervisor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- SUBMISSION HISTORY & FEEDBACK MODAL ----------------- */}
      {activeHistoryMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setActiveHistoryMilestone(null)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Submission Iterations & Feedback</h2>
                <p className="text-xs text-slate-500">{activeHistoryMilestone.name}</p>
              </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {activeHistoryMilestone.submissions && activeHistoryMilestone.submissions.length > 0 ? (
                activeHistoryMilestone.submissions.map((sub) => (
                  <div key={sub.submission_id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                        Iteration #{sub.version_no}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700">
                      Uploaded by: <strong className="text-slate-900">{sub.student_name}</strong>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                      <div className="text-slate-400 font-bold mb-1">Deliverable Link:</div>
                      <a
                        href={sub.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline flex items-center gap-1 font-mono break-all"
                      >
                        {sub.file_url} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                      {sub.notes && <div className="mt-2 text-slate-600 italic">"{sub.notes}"</div>}
                    </div>

                    {/* Faculty Feedback Section */}
                    {sub.feedback ? (
                      <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                            Supervisor Feedback ({sub.feedback.faculty_name})
                          </span>
                          <span className="text-sm font-black text-emerald-700">
                            Score: {sub.feedback.score} / 100
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 italic">"{sub.feedback.comments}"</p>
                        <div className="text-[11px] font-bold text-emerald-800">
                          Decision: {sub.feedback.decision}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Pending faculty evaluation
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">No submissions uploaded yet.</div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveHistoryMilestone(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800"
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

export default ProjectMilestonesPage;