import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, User, Users, Sparkles, BookOpen, Layers, FileText, ShieldAlert, Inbox, BarChart3, CheckCircle2, Calendar, PieChart, MessageSquare, LayoutDashboard, Compass } from 'lucide-react';

const Navbar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeClass = () => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'FACULTY':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getDisplayName = () => {
    if (!user) return '';
    if (user.role === 'STUDENT' && user.student_profile) {
      return user.student_profile.full_name;
    }
    if (user.role === 'FACULTY' && user.faculty_profile) {
      return user.faculty_profile.full_name;
    }
    return user.email.split('@')[0];
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                LearnLink
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                DBMS Capstone
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          {user ? (
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
                {role === 'STUDENT' && (
                  <Link
                    to="/dashboard"
                    className="px-3 py-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1.5 font-bold"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/courses"
                  className="px-3 py-2 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <Compass className="w-4 h-4 text-indigo-500" />
                  Courses & Mentors
                </Link>
                <Link
                  to="/ideas"
                  className="px-3 py-2 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  Project Ideas
                </Link>
                <Link
                  to="/teams"
                  className="px-3 py-2 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4 text-indigo-500" />
                  Teams
                </Link>
                <Link
                  to="/proposals"
                  className="px-3 py-2 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Proposals
                </Link>
                <Link
                  to="/milestones"
                  className="px-3 py-2 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  Milestones
                </Link>
                <Link
                  to="/peer-mentors"
                  className="px-3 py-2 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  Peer Mentors
                </Link>
                <Link
                  to="/consultations"
                  className="px-3 py-2 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  Consultations
                </Link>

                {role === 'FACULTY' && (
                  <Link
                    to="/faculty/review-queue"
                    className="px-3 py-2 rounded-lg hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-1.5 text-emerald-700 font-semibold"
                  >
                    <Inbox className="w-4 h-4 text-emerald-600" />
                    Review Queue
                  </Link>
                )}

                {role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin/allocations"
                      className="px-3 py-2 rounded-lg hover:text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-1.5 text-purple-700 font-semibold"
                    >
                      <ShieldAlert className="w-4 h-4 text-purple-600" />
                      Allocations Command
                    </Link>
                    <Link
                      to="/reports/milestones"
                      className="px-3 py-2 rounded-lg hover:text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-1.5 text-purple-700 font-semibold"
                    >
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                      Progress Reports
                    </Link>
                    <Link
                      to="/analytics"
                      className="px-3 py-2 rounded-lg hover:text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-1.5 text-purple-700 font-semibold"
                    >
                      <PieChart className="w-4 h-4 text-purple-600" />
                      Executive Analytics
                    </Link>
                  </>
                )}

                {role === 'STUDENT' && (
                  <Link
                    to="/student/profile"
                    className="px-3 py-2 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    My Skills & Profile
                  </Link>
                )}

                {role === 'FACULTY' && (
                  <Link
                    to="/faculty/profile"
                    className="px-3 py-2 rounded-lg hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
                  >
                    <Layers className="w-4 h-4 text-emerald-500" />
                    Mentoring Capacity
                  </Link>
                )}
              </nav>

              {/* User Profile Pill */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800">{getDisplayName()}</div>
                  <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeClass()}`}>
                    {role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
