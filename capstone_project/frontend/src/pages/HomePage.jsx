import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  GraduationCap,
  Sparkles,
  Layers,
  BookOpen,
  ArrowRight,
  Database,
  ShieldCheck,
  Cpu
} from 'lucide-react';

const HomePage = () => {
  const { user, role } = useAuth();
  const [stats, setStats] = useState({ depts: 0, domains: 0, skills: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [deptsRes, domainsRes, skillsRes] = await Promise.all([
          api.get('/academic/departments'),
          api.get('/academic/domains'),
          api.get('/skills'),
        ]);
        setStats({
          depts: deptsRes.data.data?.length || 0,
          domains: domainsRes.data.data?.length || 0,
          skills: skillsRes.data.data?.length || 0,
        });
      } catch (err) {
        // Silent catch for initial load
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-8 sm:p-12 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/10">
            <Database className="w-3.5 h-3.5 text-blue-300" />
            <span>DBMS Capstone Platform • Phase 1 Active</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            LearnLink Platform
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Skill-based peer mentorship, balanced project team formation, and explainable faculty supervisor allocation powered by a high-integrity MySQL relational database.
          </p>

          {!user ? (
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/courses"
                className="py-2.5 px-5 bg-white text-blue-700 font-bold rounded-xl text-sm shadow-md hover:bg-blue-50 transition-all flex items-center gap-2"
              >
                Explore Courses & Mentors
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register"
                className="py-2.5 px-5 bg-blue-600/60 hover:bg-blue-600 text-white font-semibold rounded-xl text-sm border border-blue-400/30 transition-all"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="py-2.5 px-5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm border border-white/20 transition-all"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div className="pt-2 flex flex-wrap gap-3">
              {role === 'STUDENT' ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 py-2.5 px-5 bg-white text-blue-700 font-bold rounded-xl text-sm shadow-md hover:bg-blue-50 transition-all"
                  >
                    Open Student Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 py-2.5 px-5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm border border-white/20 transition-all"
                  >
                    Browse Courses & Mentors
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/faculty/review-queue"
                    className="inline-flex items-center gap-2 py-2.5 px-5 bg-white text-emerald-800 font-bold rounded-xl text-sm shadow-md hover:bg-emerald-50 transition-all"
                  >
                    Open Supervisor Review Queue
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/faculty/profile"
                    className="inline-flex items-center gap-2 py-2.5 px-5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm border border-white/20 transition-all"
                  >
                    Mentoring Capacity
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Background Decorative Rings */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Database Master Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.depts || 5}</div>
            <div className="text-xs font-medium text-slate-500">Academic Departments</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.domains || 6}</div>
            <div className="text-xs font-medium text-slate-500">Research Domains</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{stats.skills || 23}</div>
            <div className="text-xs font-medium text-slate-500">Catalog Skills Available</div>
          </div>
        </div>
      </div>

      {/* Platform Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">Skill-Based Profiles</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Students list offered skills for peer assistance and wanted skills for learning. Stored in 3NF with CHECK and UNIQUE constraints.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">Capacity & Workload Locks</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Faculty supervision limits are strictly validated using MySQL triggers and row-locking transactions to guarantee fairness.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">Explainable Scoring Engine</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Transparent multi-criteria recommendation formula calculating domain fit, skill match, workload, and preferences.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
