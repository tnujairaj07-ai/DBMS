import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  BarChart3,
  TrendingUp,
  Users,
  GraduationCap,
  FileText,
  CheckCircle2,
  Sparkles,
  PieChart,
  Layers,
  Award
} from 'lucide-react';

const ExecutiveAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/department-analytics');
      setAnalytics(res.data.data || []);
    } catch (err) {
      console.error('Failed to load executive analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = analytics.reduce((acc, d) => acc + parseInt(d.total_students || 0, 10), 0);
  const totalFaculty = analytics.reduce((acc, d) => acc + parseInt(d.total_faculty || 0, 10), 0);
  const totalProposals = analytics.reduce((acc, d) => acc + parseInt(d.total_proposals || 0, 10), 0);
  const totalAllocated = analytics.reduce((acc, d) => acc + parseInt(d.allocated_proposals || 0, 10), 0);
  const totalPeerSessions = analytics.reduce((acc, d) => acc + parseInt(d.total_peer_sessions || 0, 10), 0);
  const overallAllocRate =
    totalProposals > 0 ? Math.round((totalAllocated / totalProposals) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-purple-200 mb-4 border border-white/10">
            <PieChart className="w-3.5 h-3.5 text-purple-300" />
            Executive Intelligence • vw_department_analytics
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Institutional Department Analytics
          </h1>
          <p className="mt-3 text-base text-purple-100/90 leading-relaxed">
            High-level executive metrics tracking student participation, supervisor allocation ratios, peer mentoring
            velocity, and milestone progress across academic departments.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalStudents}</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">Enrolled Students</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalFaculty}</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">Faculty Supervisors</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalProposals}</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">Research Proposals</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-purple-600">{overallAllocRate}%</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">Allocation Ratio</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-amber-600">{totalPeerSessions}</div>
          <div className="text-xs font-semibold text-slate-500 mt-0.5">Peer Sessions Done</div>
        </div>
      </div>

      {/* Analytics Table */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Department Performance Breakdown</h3>
              <p className="text-xs text-slate-500">Live data aggregated via MySQL view vw_department_analytics</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Students / Faculty</th>
                  <th className="px-6 py-4">Proposals Tracked</th>
                  <th className="px-6 py-4">Supervisor Allocation %</th>
                  <th className="px-6 py-4">Peer Sessions</th>
                  <th className="px-6 py-4">Avg Project Velocity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.map((dept) => {
                  const allocPct = parseFloat(dept.allocation_rate_percent || 0);

                  return (
                    <tr key={dept.department_id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{dept.department_name}</div>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-xs font-semibold">
                          {dept.department_code}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-slate-800">
                          {dept.total_students} students
                        </div>
                        <div className="text-[11px] text-slate-400">{dept.total_faculty} faculty</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-900">
                          {dept.allocated_proposals} / {dept.total_proposals} Allocated
                        </div>
                      </td>

                      <td className="px-6 py-4 w-48">
                        <div className="space-y-1">
                          <div className="text-xs font-extrabold text-purple-600">{allocPct}%</div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 rounded-full"
                              style={{ width: `${Math.min(allocPct, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                          <Sparkles className="w-3.5 h-3.5" /> {dept.total_peer_sessions} sessions
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-emerald-600 font-bold text-xs">
                          {dept.avg_milestone_progress}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveAnalyticsPage;