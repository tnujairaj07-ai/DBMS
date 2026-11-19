import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Briefcase,
  Layers,
  Save,
  Check,
  AlertCircle,
  BookOpen,
  Sparkles,
  Plus,
  Search,
  X,
} from 'lucide-react';

const FacultyProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const profile = user?.faculty_profile;

  const [capacity, setCapacity] = useState(profile?.max_project_capacity || 3);
  const [designation, setDesignation] = useState(profile?.designation || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Course / Domain & Skill Specialization states
  const [loadingExpertise, setLoadingExpertise] = useState(true);
  const [myDomains, setMyDomains] = useState([]);
  const [mySkills, setMySkills] = useState([]);
  const [allDomains, setAllDomains] = useState([]);
  const [allSkills, setAllSkills] = useState([]);

  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [domainLevel, setDomainLevel] = useState(4);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skillLevel, setSkillLevel] = useState(4);
  const [savingExpertise, setSavingExpertise] = useState(false);
  const [domainSearch, setDomainSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setDesignation(profile.designation || '');
      setCapacity(profile.max_project_capacity || 3);
    }
  }, [profile]);

  const loadSpecializationData = async () => {
    try {
      setLoadingExpertise(true);
      const [expRes, domRes, skillRes] = await Promise.all([
        api.get('/allocation/faculty/expertise'),
        api.get('/academic/domains'),
        api.get('/skills'),
      ]);

      if (expRes.data?.success) {
        setMyDomains(expRes.data.data?.domains || []);
        setMySkills(expRes.data.data?.skills || []);
      }
      if (domRes.data?.success) {
        const doms = domRes.data.data || [];
        setAllDomains(doms);
        if (doms.length > 0 && !selectedDomainId) {
          setSelectedDomainId(doms[0].domain_id);
        }
      }
      if (skillRes.data?.success) {
        const sks = skillRes.data.data || [];
        setAllSkills(sks);
        if (sks.length > 0 && !selectedSkillId) {
          setSelectedSkillId(sks[0].skill_id);
        }
      }
    } catch (err) {
      console.error('Failed to load faculty specialization data:', err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load course & specialization data.',
      });
    } finally {
      setLoadingExpertise(false);
    }
  };

  useEffect(() => {
    loadSpecializationData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.put('/users/profile/faculty', {
        full_name: fullName,
        designation: designation,
        max_project_capacity: parseInt(capacity, 10),
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: 'Faculty settings updated successfully!' });
        await refreshProfile();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddDomainExpertise = async (e) => {
    e.preventDefault();
    if (!selectedDomainId) return;
    setSavingExpertise(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/allocation/faculty/expertise', {
        domain_id: parseInt(selectedDomainId, 10),
        expertise_level: parseInt(domainLevel, 10),
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Course / Research domain specialization saved.' });
        await loadSpecializationData();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update domain specialization.',
      });
    } finally {
      setSavingExpertise(false);
    }
  };

  const handleAddSkillExpertise = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) return;
    setSavingExpertise(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.post('/allocation/faculty/expertise', {
        skill_id: parseInt(selectedSkillId, 10),
        proficiency_level: parseInt(skillLevel, 10),
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Technical skill specialization saved.' });
        await loadSpecializationData();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update skill expertise.',
      });
    } finally {
      setSavingExpertise(false);
    }
  };

  const filteredAllDomains = allDomains.filter((d) =>
    d.name.toLowerCase().includes(domainSearch.trim().toLowerCase())
  );
  const filteredMyDomains = myDomains.filter((d) =>
    (d.domain_name || '').toLowerCase().includes(domainSearch.trim().toLowerCase())
  );
  const filteredAllSkills = allSkills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.trim().toLowerCase())
  );
  const filteredMySkills = mySkills.filter((s) =>
    (s.skill_name || '').toLowerCase().includes(skillSearch.trim().toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Faculty Profile Overview Card */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center text-xl font-bold shrink-0">
            {profile?.full_name ? profile.full_name[0].toUpperCase() : 'F'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{profile?.full_name || 'Faculty Profile'}</h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Faculty Supervisor
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {profile?.department_name} ({profile?.department_code}) • Employee ID: {profile?.employee_code}
            </p>
          </div>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Designation
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Maximum Project Supervision Capacity
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  The DBMS allocation engine enforces this limit via strict database triggers and atomic transactions.
                </p>
              </div>

              <div className="w-28">
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-900 text-center focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-2xs transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Updating...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Course / Research Domain & Technical Skill Specializations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specialized Courses / Research Domains */}
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 p-6 space-y-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Specialized Courses & Research Domains
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Students see you under these courses in the Courses & Mentors catalog.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70 shrink-0">
              {allDomains.length} Courses
            </span>
          </div>

          {/* Search Courses / Domains */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={domainSearch}
              onChange={(e) => {
                const q = e.target.value;
                setDomainSearch(q);
                const firstMatch = allDomains.find((d) =>
                  d.name.toLowerCase().includes(q.trim().toLowerCase())
                );
                if (firstMatch) setSelectedDomainId(firstMatch.domain_id);
              }}
              placeholder="Search courses or research domains..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white"
            />
            {domainSearch && (
              <button
                type="button"
                onClick={() => setDomainSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <form onSubmit={handleAddDomainExpertise} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Course / Domain</label>
              <select
                value={selectedDomainId}
                onChange={(e) => setSelectedDomainId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                {filteredAllDomains.map((d) => (
                  <option key={d.domain_id} value={d.domain_id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Level (1-5)</label>
              <div className="flex gap-1.5">
                <select
                  value={domainLevel}
                  onChange={(e) => setDomainLevel(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={savingExpertise || filteredAllDomains.length === 0}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </form>

          {loadingExpertise ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading specializations...</div>
          ) : filteredMyDomains.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              {domainSearch ? `No assigned domains match "${domainSearch}".` : 'No course domains assigned yet. Add a domain above.'}
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {filteredMyDomains.map((d) => (
                <div
                  key={d.expertise_id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80"
                >
                  <span className="text-xs font-semibold text-slate-800">{d.domain_name}</span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70">
                    Level {d.expertise_level}/5
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technical Skill Expertise */}
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 p-6 space-y-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Technical Skill Expertise
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Used by the recommendation engine to match you with capstone teams.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
              {allSkills.length} Skills
            </span>
          </div>

          {/* Search Technical Skills */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={skillSearch}
              onChange={(e) => {
                const q = e.target.value;
                setSkillSearch(q);
                const firstMatch = allSkills.find((s) =>
                  s.name.toLowerCase().includes(q.trim().toLowerCase())
                );
                if (firstMatch) setSelectedSkillId(firstMatch.skill_id);
              }}
              placeholder="Search technical skills..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white"
            />
            {skillSearch && (
              <button
                type="button"
                onClick={() => setSkillSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <form onSubmit={handleAddSkillExpertise} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Technical Skill</label>
              <select
                value={selectedSkillId}
                onChange={(e) => setSelectedSkillId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                {filteredAllSkills.map((s) => (
                  <option key={s.skill_id} value={s.skill_id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Level (1-5)</label>
              <div className="flex gap-1.5">
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={savingExpertise || filteredAllSkills.length === 0}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </form>

          {loadingExpertise ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading skills...</div>
          ) : filteredMySkills.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              {skillSearch ? `No assigned skills match "${skillSearch}".` : 'No technical skills added yet.'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
              {filteredMySkills.map((s) => (
                <div
                  key={s.fse_id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs font-semibold text-emerald-900"
                >
                  <span>{s.skill_name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-200/70 text-emerald-800">
                    {s.proficiency_level}/5
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyProfilePage;
