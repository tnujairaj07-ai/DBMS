import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  ShieldAlert,
  Layers,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  History,
  Lock,
  Plus,
  Play,
  BarChart3,
  AlertCircle,
  X,
  FileCheck,
  Calendar,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

const AdminAllocationPage = () => {
  const { user, role } = useAuth();

  const [activeTab, setActiveTab] = useState('proposals'); // 'proposals' | 'workload' | 'audit' | 'cycles'
  const [proposals, setProposals] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Allocation Modal State
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [allocationReason, setAllocationReason] = useState('Top-scoring faculty mentor by domain and skill fit.');
  const [allocating, setAllocating] = useState(false);

  // New Cycle Modal State
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [cycleForm, setCycleForm] = useState({
    name: 'Capstone Cycle 2026-2027',
    academic_year: '2026-2027',
    semester: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0],
    proposal_deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'proposals') {
        const res = await api.get('/allocation/proposals');
        setProposals(res.data.data || []);
      } else if (activeTab === 'workload') {
        const res = await api.get('/allocation/faculty-workload');
        setWorkload(res.data.data || []);
      } else if (activeTab === 'audit') {
        const res = await api.get('/allocation/audit-logs');
        setAuditLogs(res.data.data || []);
      } else if (activeTab === 'cycles') {
        const res = await api.get('/allocation/cycles');
        setCycles(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load tab data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAllocateModal = async (prop) => {
    setSelectedProposal(prop);
    setMessage({ type: '', text: '' });
    setIsAllocateModalOpen(true);
    setAllocating(false);

    try {
      const res = await api.get(`/allocation/recommendations/${prop.proposal_id}`);
      const recs = res.data.data?.recommendations || [];
      setRecommendations(recs);
      if (recs.length > 0) {
        setSelectedFacultyId(recs[0].faculty_id);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  };

  const handleExecuteAllocation = async (e) => {
    e.preventDefault();
    if (!selectedProposal || !selectedFacultyId) return;

    setAllocating(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/allocation/allocate', {
        proposal_id: selectedProposal.proposal_id,
        faculty_id: parseInt(selectedFacultyId, 10),
        reason: allocationReason,
      });

      if (res.data.success) {
        setMessage({
          type: 'success',
          text: `Allocation successful! Stored Procedure transaction committed with Row-Lock. Allocation ID: ${res.data.data.allocation_id}`,
        });
        setIsAllocateModalOpen(false);
        loadData();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Database Stored Procedure rollback occurred. Allocation failed.',
      });
    } finally {
      setAllocating(false);
    }
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/allocation/cycles', cycleForm);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'New allocation cycle initialized!' });
        setIsCycleModalOpen(false);
        loadData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create cycle.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2.5 border border-indigo-200/70">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
            Department Admin Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Mentor Allocation & Workload Governance
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            Execute ACID-compliant supervisor allocations with InnoDB row-level locking, explainable scoring, and automated capacity triggers.
          </p>
        </div>
      </div>

      {/* Message Banner */}
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
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('proposals')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'proposals'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          Proposals & Allocation Engine
        </button>

        <button
          onClick={() => setActiveTab('workload')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'workload'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Faculty Workload View (vw_faculty_workload)
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          Allocation Audit Trail
        </button>

        <button
          onClick={() => setActiveTab('cycles')}
          className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cycles'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Allocation Cycles
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: Proposals Allocation Engine */}
          {activeTab === 'proposals' && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-slate-500">
                Proposals awaiting supervisor review and allocation:
              </div>

              <div className="grid grid-cols-1 gap-4">
                {proposals.map((prop) => (
                  <div
                    key={prop.proposal_id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-all"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {prop.domain_name}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            prop.status === 'ALLOCATED'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          {prop.status}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{prop.cycle_name}</span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">{prop.title}</h3>
                      <p className="text-xs text-slate-500">
                        Team: <strong className="text-slate-700">{prop.team_name}</strong> • Problem:{' '}
                        <span className="italic">{prop.problem_statement.substring(0, 110)}...</span>
                      </p>

                      {prop.allocation && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Allocated to: {prop.allocation.faculty_name} ({prop.allocation.designation})
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                      {prop.status !== 'ALLOCATED' ? (
                        <button
                          onClick={() => handleOpenAllocateModal(prop)}
                          className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                        >
                          <Lock className="w-4 h-4" />
                          Match & Allocate (Stored Proc)
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Allocation Locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Faculty Workload View */}
          {activeTab === 'workload' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-xs text-purple-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  Live metrics directly computed via MySQL View <strong>vw_faculty_workload</strong>. Prevents
                  over-allocation beyond designated project caps.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workload.map((fac) => {
                  const utilPct = fac.capacity_utilization_pct || 0;
                  const isFull = fac.remaining_capacity <= 0;

                  return (
                    <div
                      key={fac.faculty_id}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">{fac.faculty_name}</h3>
                            <p className="text-xs text-slate-500 font-medium">
                              {fac.designation} • {fac.department_name}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isFull
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {isFull ? 'CAPACITY FULL' : `${fac.remaining_capacity} SLOTS LEFT`}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-500">Capacity Utilization</span>
                            <span className="text-slate-900 font-bold">
                              {fac.active_projects_count} / {fac.max_project_capacity} ({utilPct}%)
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                utilPct >= 100
                                  ? 'bg-rose-500'
                                  : utilPct >= 66
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(utilPct, 100)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Expert Domains */}
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                            Expert Domains
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {fac.domains && fac.domains.length > 0 ? (
                              fac.domains.map((d, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                                >
                                  {d.name} (Lvl {d.level})
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">No domain mapped</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Allocation Audit Trail */}
          {activeTab === 'audit' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">ACID Allocation Audit Trail</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enforces database integrity; all allocation events are logged via MySQL foreign keys and triggers.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3">Log ID</th>
                      <th className="px-6 py-3">Alloc ID</th>
                      <th className="px-6 py-3">Action</th>
                      <th className="px-6 py-3">Admin</th>
                      <th className="px-6 py-3">Reason</th>
                      <th className="px-6 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((l) => (
                      <tr key={l.log_id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-900">#{l.log_id}</td>
                        <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">
                          Alloc #{l.allocation_id}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                            {l.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-600">{l.performed_by_name}</td>
                        <td className="px-6 py-4 text-xs text-slate-700 italic">{l.reason}</td>
                        <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                          {new Date(l.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Allocation Cycles */}
          {activeTab === 'cycles' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-sm font-semibold text-slate-500">Managed allocation cycles:</div>
                <button
                  onClick={() => setIsCycleModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-sm shadow-xs hover:bg-purple-700 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Create New Cycle
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cycles.map((c) => (
                  <div
                    key={c.cycle_id}
                    className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">
                        {c.academic_year} • Sem {c.semester}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900">{c.name}</h3>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Proposal Submission Deadline:</span>
                        <strong className="text-slate-900">
                          {new Date(c.proposal_deadline).toLocaleDateString()}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Cycle Duration:</span>
                        <strong className="text-slate-900">
                          {new Date(c.start_date).toLocaleDateString()} —{' '}
                          {new Date(c.end_date).toLocaleDateString()}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ----------------- ATOMIC ALLOCATION MODAL (STORED PROCEDURE) ----------------- */}
      {isAllocateModalOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setIsAllocateModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Execute Mentor Allocation</h2>
                <p className="text-xs text-slate-500">
                  Invokes MySQL Stored Procedure <code>sp_allocate_mentor_transaction</code> with row-level locking
                </p>
              </div>
            </div>

            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-1">
                Project Proposal
              </div>
              <div className="text-base font-bold text-slate-900">{selectedProposal.title}</div>
              <div className="text-xs text-slate-500 mt-1">
                Domain: <strong className="text-slate-700">{selectedProposal.domain_name}</strong> • Team:{' '}
                <strong className="text-slate-700">{selectedProposal.team_name}</strong>
              </div>
            </div>

            <form onSubmit={handleExecuteAllocation} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Faculty Supervisor (Ranked by Explainable Match Score)
                </label>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {recommendations.map((rec) => (
                    <label
                      key={rec.faculty_id}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedFacultyId === rec.faculty_id
                          ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="faculty_choice"
                          value={rec.faculty_id}
                          checked={selectedFacultyId === rec.faculty_id}
                          onChange={() => setSelectedFacultyId(rec.faculty_id)}
                          className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <div className="text-sm font-bold text-slate-900">{rec.faculty_name}</div>
                          <div className="text-xs text-slate-500">
                            {rec.designation} • Cap: {rec.remaining_capacity} slots remaining
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-extrabold text-purple-600">{rec.match_score}%</div>
                        <div className="text-[10px] text-slate-400 font-semibold">Match Score</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Allocation Reason / Administrative Justification *
                </label>
                <input
                  type="text"
                  required
                  value={allocationReason}
                  onChange={(e) => setAllocationReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocating || !selectedFacultyId}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  {allocating ? 'Executing Stored Procedure...' : 'Commit Transaction (Allocate)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- CREATE CYCLE MODAL ----------------- */}
      {isCycleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setIsCycleModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">New Allocation Cycle</h2>
                <p className="text-xs text-slate-500">Define academic term and submission window</p>
              </div>
            </div>

            <form onSubmit={handleCreateCycle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Cycle Name *
                </label>
                <input
                  type="text"
                  required
                  value={cycleForm.name}
                  onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    required
                    value={cycleForm.academic_year}
                    onChange={(e) => setCycleForm({ ...cycleForm, academic_year: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Semester *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    required
                    value={cycleForm.semester}
                    onChange={(e) => setCycleForm({ ...cycleForm, semester: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Proposal Submission Deadline *
                </label>
                <input
                  type="date"
                  required
                  value={cycleForm.proposal_deadline}
                  onChange={(e) => setCycleForm({ ...cycleForm, proposal_deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCycleModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                >
                  Create Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAllocationPage;