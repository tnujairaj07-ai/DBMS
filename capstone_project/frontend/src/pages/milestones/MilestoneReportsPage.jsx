import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  Search,
  Filter
} from 'lucide-react';

const MilestoneReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/milestones/reports/progress');
      setReports(res.data.data || []);
    } catch (err) {
      console.error('Failed to load milestone progress analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.proposal_title.toLowerCase().includes(search.toLowerCase()) ||
      r.team_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.faculty_name && r.faculty_name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'COMPLETED' && r.progress_percent >= 100) ||
      (statusFilter === 'IN_PROGRESS' && r.progress_percent > 0 && r.progress_percent < 100) ||
      (statusFilter === 'NOT_STARTED' && r.progress_percent === 0) ||
      (statusFilter === 'OVERDUE' && r.overdue_milestones > 0);

    return matchesSearch && matchesStatus;
  });

  const totalProjects = reports.length;
  const avgProgress =
    totalProjects > 0
      ? Math.round(reports.reduce((acc, r) => acc + parseFloat(r.progress_percent || 0), 0) / totalProjects)
      : 0;
  const totalOverdue = reports.reduce((acc, r) => acc + parseInt(r.overdue_milestones || 0, 10), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2.5 border border-indigo-200/70">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            Milestone Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Department Milestone Analytics & Audits
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            Aggregate tracking of project milestones, student progress velocity, faculty grading averages, and overdue deadlines.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalProjects}</div>
            <div className="text-xs font-semibold text-slate-500">Tracked Capstone Projects</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{avgProgress}%</div>
            <div className="text-xs font-semibold text-slate-500">Department Average Velocity</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-xl">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600">{totalOverdue}</div>
            <div className="text-xs font-semibold text-slate-500">Overdue Milestone Deliverables</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search project or mentor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Milestone Statuses</option>
            <option value="IN_PROGRESS">In Progress (1-99%)</option>
            <option value="COMPLETED">Completed (100%)</option>
            <option value="NOT_STARTED">Not Started (0%)</option>
            <option value="OVERDUE">Has Overdue Milestones</option>
          </select>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filteredReports.length}</span> active projects
        </div>
      </div>

      {/* Reports Table */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Project Title & Team</th>
                  <th className="px-6 py-4">Faculty Supervisor</th>
                  <th className="px-6 py-4">Milestones</th>
                  <th className="px-6 py-4">Progress %</th>
                  <th className="px-6 py-4">Average Grade</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((row) => (
                  <tr key={row.proposal_id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{row.proposal_title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Team: <strong className="text-slate-700">{row.team_name}</strong> • Cycle:{' '}
                        {row.cycle_name}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {row.faculty_name ? (
                        <div>
                          <div className="font-semibold text-slate-900 text-xs">{row.faculty_name}</div>
                          <div className="text-[11px] text-slate-400">{row.faculty_designation}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 font-semibold italic">Unallocated</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {row.completed_milestones} / {row.total_milestones}
                        </span>
                        {parseInt(row.overdue_milestones, 10) > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            {row.overdue_milestones} overdue
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 w-48">
                      <div className="space-y-1">
                        <div className="text-xs font-extrabold text-indigo-600">{row.progress_percent}%</div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${row.progress_percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900">
                      {parseFloat(row.average_score) > 0 ? (
                        <span className="text-emerald-600 font-extrabold">{row.average_score} / 100</span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Not graded</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/projects/${row.proposal_id}/milestones`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors"
                      >
                        Timeline <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneReportsPage;