import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  LayoutDashboard,
  Sparkles,
  Compass,
  Users,
  FileText,
  CheckCircle2,
  MessageSquare,
  Calendar,
  BookOpen,
  Inbox,
  Layers,
  ShieldAlert,
  BarChart3,
  PieChart,
  Home,
  LogOut,
  ChevronRight,
  UserCheck,
  Star
} from 'lucide-react';

export default function AppSidebar() {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDisplayName = () => {
    if (!user) return 'Guest User';
    if (user.role === 'STUDENT' && user.student_profile) {
      return user.student_profile.full_name;
    }
    if (user.role === 'FACULTY' && user.faculty_profile) {
      return user.faculty_profile.full_name;
    }
    return user.email.split('@')[0];
  };

  const getSubTitle = () => {
    if (!user) return '';
    if (user.role === 'STUDENT' && user.student_profile) {
      return `Roll: ${user.student_profile.roll_no || 'Sem ' + (user.student_profile.semester || '7')}`;
    }
    if (user.role === 'FACULTY' && user.faculty_profile) {
      return user.faculty_profile.designation || 'Faculty Supervisor';
    }
    return user.role;
  };

  const getRoleBadgeClasses = () => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'FACULTY':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'ADMIN':
        return 'Admin Command';
      case 'FACULTY':
        return 'Faculty Portal';
      default:
        return 'Student Hub';
    }
  };

  const isActive = (path) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' && !location.search.includes('skills');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Nav item renderer
  const renderNavItem = (to, icon, label, badge = null, specialClass = '') => {
    const active = isActive(to);
    return (
      <Link
        key={to}
        to={to}
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all ${
          active
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80 font-bold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        } ${specialClass}`}
      >
        <span className={active ? (role === 'FACULTY' ? 'text-emerald-600' : 'text-blue-600') : 'text-slate-400'}>
          {icon}
        </span>
        <span className="truncate flex-1">{label}</span>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="w-64 sm:w-72 bg-slate-50/95 border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0 h-screen overflow-y-auto select-none">
      <div className="space-y-6">
        {/* Brand Logo & Portal Tag */}
        <Link to={role === 'FACULTY' ? '/faculty/review-queue' : '/dashboard'} className="flex items-center gap-3 px-1 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xl font-black bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent tracking-tight">
              LearnLink
            </span>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {getRoleTitle()}
            </span>
          </div>
        </Link>

        {/* User Profile Pill */}
        {user && (
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
              role === 'FACULTY' ? 'from-emerald-500 to-teal-600' : 'from-blue-600 to-indigo-600'
            } text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs`}>
              {getDisplayName()[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">
                {getDisplayName()}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {getSubTitle()}
              </div>
              <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border mt-0.5 ${getRoleBadgeClasses()}`}>
                {role}
              </span>
            </div>
          </div>
        )}

        {/* Role-Based Navigation Sections */}
        <nav className="space-y-1">
          {/* ========================================================= */}
          {/* 1. STUDENT NAVIGATION                                     */}
          {/* ========================================================= */}
          {role === 'STUDENT' && (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1 pt-1">
                Student Workspace
              </div>
              {renderNavItem('/dashboard', <LayoutDashboard className="w-4 h-4" />, 'Dashboard Overview')}
              {renderNavItem('/dashboard?tab=skills', <Sparkles className="w-4 h-4" />, 'My Skills & Profile')}
              {renderNavItem('/courses', <Compass className="w-4 h-4" />, 'Courses & Mentors')}
              {renderNavItem('/teams', <Users className="w-4 h-4" />, 'Teams')}
              {renderNavItem('/proposals', <FileText className="w-4 h-4" />, 'Project Proposals')}
              {renderNavItem('/milestones', <CheckCircle2 className="w-4 h-4" />, 'Milestones & Tasks')}
              {renderNavItem('/peer-mentors', <MessageSquare className="w-4 h-4" />, 'Peer Mentorship')}
              {renderNavItem('/consultations', <Calendar className="w-4 h-4" />, 'Supervisor Meetings')}
              {renderNavItem('/ideas', <BookOpen className="w-4 h-4" />, 'Project Idea Catalog')}
            </>
          )}

          {/* ========================================================= */}
          {/* 2. FACULTY NAVIGATION                                     */}
          {/* ========================================================= */}
          {role === 'FACULTY' && (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 px-3 pb-1 pt-1">
                Faculty Supervision
              </div>
              {renderNavItem('/faculty/review-queue', <Inbox className="w-4 h-4" />, 'Review Queue', 'Active')}
              {renderNavItem('/faculty/profile', <Layers className="w-4 h-4" />, 'Mentoring Capacity')}
              {renderNavItem('/consultations', <Calendar className="w-4 h-4" />, 'Consultation Meetings')}
              {renderNavItem('/proposals', <FileText className="w-4 h-4" />, 'Proposals & Teams')}
              {renderNavItem('/milestones', <CheckCircle2 className="w-4 h-4" />, 'Milestones & Grading')}
              {renderNavItem('/courses', <Compass className="w-4 h-4" />, 'Courses & Specializations')}
              {renderNavItem('/teams', <Users className="w-4 h-4" />, 'Teams')}
              {renderNavItem('/ideas', <BookOpen className="w-4 h-4" />, 'Project Ideas')}
              {renderNavItem('/peer-mentors', <MessageSquare className="w-4 h-4" />, 'Peer Mentorship')}
            </>
          )}

          {/* ========================================================= */}
          {/* 3. ADMIN NAVIGATION                                       */}
          {/* ========================================================= */}
          {role === 'ADMIN' && (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 px-3 pb-1 pt-1">
                Admin Management
              </div>
              {renderNavItem('/admin/allocations', <ShieldAlert className="w-4 h-4" />, 'Allocations Command')}
              {renderNavItem('/reports/milestones', <BarChart3 className="w-4 h-4" />, 'Progress Reports')}
              {renderNavItem('/analytics', <PieChart className="w-4 h-4" />, 'Executive Analytics')}

              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1 pt-3">
                Academic Modules
              </div>
              {renderNavItem('/proposals', <FileText className="w-4 h-4" />, 'Project Proposals')}
              {renderNavItem('/milestones', <CheckCircle2 className="w-4 h-4" />, 'Milestones Lifecycle')}
              {renderNavItem('/courses', <Compass className="w-4 h-4" />, 'Courses & Mentors')}
              {renderNavItem('/teams', <Users className="w-4 h-4" />, 'Teams')}
              {renderNavItem('/consultations', <Calendar className="w-4 h-4" />, 'Consultations')}
              {renderNavItem('/peer-mentors', <MessageSquare className="w-4 h-4" />, 'Peer Mentorship')}
              {renderNavItem('/ideas', <BookOpen className="w-4 h-4" />, 'Project Ideas')}
            </>
          )}

          {/* ========================================================= */}
          {/* 4. GUEST / PUBLIC NAVIGATION                              */}
          {/* ========================================================= */}
          {!user && (
            <>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1 pt-1">
                Navigation
              </div>
              {renderNavItem('/courses', <Compass className="w-4 h-4" />, 'Courses & Mentors')}
              {renderNavItem('/ideas', <BookOpen className="w-4 h-4" />, 'Project Ideas')}
              {renderNavItem('/login', <UserCheck className="w-4 h-4" />, 'Sign In')}
              {renderNavItem('/register', <Sparkles className="w-4 h-4" />, 'Create Account')}
            </>
          )}
        </nav>
      </div>

      {/* Bottom Actions: Public Home & Logout */}
      <div className="mt-8 pt-4 border-t border-slate-200/80 space-y-2">
        <div className="px-3 py-2 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl text-[10px] text-slate-500 font-medium">
          <div className="font-bold text-slate-700">MySQL 8.0 ACID Engine</div>
          <span>Academic Term 2026-2027</span>
        </div>

        <div className="flex items-center justify-between px-1 pt-2">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>

          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
