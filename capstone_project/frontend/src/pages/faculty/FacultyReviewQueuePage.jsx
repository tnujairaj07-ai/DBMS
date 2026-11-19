import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Inbox,
  CheckCircle2,
  Clock,
  ExternalLink,
  Award,
  AlertCircle,
  X,
  FileCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const FacultyReviewQueuePage = () => {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grading Modal State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [score, setScore] = useState(85);
  const [comments, setComments] = useState('');
  const [decision, setDecision] = useState('APPROVED'); // 'APPROVED' | 'CHANGES_REQUESTED'
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadReviewQueue();
  }, []);

  const loadReviewQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/milestones/faculty/review-queue');
      setQueue(res.data.data || []);
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGradeModal = (item) => {
    setActiveItem(item);
    setScore(85);
    setComments('');
    setDecision('APPROVED');
    setMessage({ type: '', text: '' });
    setIsGradeModalOpen(true);
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!activeItem || score === '' || !comments) return;

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post(`/milestones/submissions/${activeItem.submission.submission_id}/feedback`, {
        score: parseInt(score, 10),
        comments: comments,
        decision: decision,
      });

      if (res.data.success) {
        setMessage({
          type: 'success',
          text: `Evaluation recorded! Milestone status transitioned to ${res.data.data.milestone_status} via database trigger.`,
        });
        setIsGradeModalOpen(false);
        loadReviewQueue();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to submit evaluation.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2.5 border border-emerald-200/70">
            <Inbox className="w-3.5 h-3.5 text-emerald-600" />
            Faculty Review Queue
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Supervisor Evaluation Queue
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            Review student milestone submissions, inspect deliverables and repository links, and award rubric grades.
          </p>
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">All Caught Up!</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            There are currently no student deliverables awaiting your evaluation across your assigned capstone projects.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Pending Submissions Awaiting Evaluation ({queue.length})
          </div>

          <div className="grid grid-cols-1 gap-6">
            {queue.map((item) => (
              <div
                key={item.milestone_id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {item.milestone_name}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      Iteration #{item.submission.version_no}
                    </span>
                    <span className="text-xs text-slate-400">
                      Submitted on {new Date(item.submission.submitted_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{item.proposal_title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Team: <strong className="text-slate-800">{item.team_name}</strong> • Student:{' '}
                      <strong className="text-slate-800">{item.submission.student_name}</strong>
                    </p>
                  </div>

                  {/* Submission artifact link & notes */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                    <div className="text-slate-500 font-bold">Deliverable Repository / File URL:</div>
                    <a
                      href={item.submission.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 font-mono break-all font-semibold"
                    >
                      {item.submission.file_url} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                    {item.submission.notes && (
                      <p className="text-slate-600 italic pt-1">"{item.submission.notes}"</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end w-full md:w-auto">
                  <button
                    onClick={() => handleOpenGradeModal(item)}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    Evaluate & Grade
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------- EVALUATION & GRADING MODAL ----------------- */}
      {isGradeModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsGradeModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Faculty Evaluation</h2>
                <p className="text-xs text-slate-500">{activeItem.milestone_name}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Rubric Score (0 to 100) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Evaluation Decision *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                      decision === 'APPROVED'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value="APPROVED"
                      checked={decision === 'APPROVED'}
                      onChange={() => setDecision('APPROVED')}
                      className="sr-only"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Approve Milestone
                  </label>

                  <label
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                      decision === 'CHANGES_REQUESTED'
                        ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value="CHANGES_REQUESTED"
                      checked={decision === 'CHANGES_REQUESTED'}
                      onChange={() => setDecision('CHANGES_REQUESTED')}
                      className="sr-only"
                    />
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Request Changes
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Constructive Remarks & Feedback *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail strengths, technical gaps, test feedback, or mandatory revisions..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGradeModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Recording Grade...' : 'Save Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyReviewQueuePage;