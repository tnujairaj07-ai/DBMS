import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Sparkles,
  BookOpen,
  Award,
  Plus,
  Trash2,
  Check,
  Star,
  GraduationCap,
  Layers,
  AlertCircle
} from 'lucide-react';

const StudentProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const profile = user?.student_profile;

  const [categories, setCategories] = useState([]);
  const [catalogSkills, setCatalogSkills] = useState([]);
  const [mySkills, setMySkills] = useState({ offered: [], wanted: [] });
  const [loading, setLoading] = useState(true);

  // Form states for adding a skill
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skillType, setSkillType] = useState('OFFERED');
  const [proficiency, setProficiency] = useState(3);
  const [addingSkill, setAddingSkill] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch skill catalog and student skills
  const loadData = async () => {
    try {
      setLoading(true);
      const [catsRes, skillsRes, mySkillsRes] = await Promise.all([
        api.get('/skills/categories'),
        api.get('/skills'),
        api.get('/skills/my'),
      ]);

      if (catsRes.data.success) setCategories(catsRes.data.data);
      if (skillsRes.data.success) {
        setCatalogSkills(skillsRes.data.data);
        if (skillsRes.data.data.length > 0) {
          setSelectedSkillId(skillsRes.data.data[0].skill_id);
        }
      }
      if (mySkillsRes.data.success) setMySkills(mySkillsRes.data.data);
    } catch (err) {
      console.error("Failed to load skills data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) return;

    setAddingSkill(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/skills/my', {
        skill_id: parseInt(selectedSkillId, 10),
        skill_type: skillType,
        proficiency_level: parseInt(proficiency, 10),
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: `Skill successfully ${skillType === 'OFFERED' ? 'added to your offered skills' : 'added to your wishlist'}!` });
        // Reload student's skills
        const updated = await api.get('/skills/my');
        if (updated.data.success) setMySkills(updated.data.data);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add skill.' });
    } finally {
      setAddingSkill(false);
    }
  };

  const handleDeleteSkill = async (userSkillId) => {
    try {
      const res = await api.delete(`/skills/my/${userSkillId}`);
      if (res.data.success) {
        setMySkills((prev) => ({
          offered: prev.offered.filter((s) => s.user_skill_id !== userSkillId),
          wanted: prev.wanted.filter((s) => s.user_skill_id !== userSkillId),
        }));
      }
    } catch (err) {
      console.error("Failed to delete skill:", err);
    }
  };

  const filteredCatalogSkills = selectedCategory
    ? catalogSkills.filter((s) => s.category_id === parseInt(selectedCategory, 10))
    : catalogSkills;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-blue-500/20">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{profile?.full_name}</h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Semester {profile?.semester}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {profile?.department_name} ({profile?.department_code}) • Roll No: {profile?.roll_no}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
            <div className="text-right">
              <div className="text-xs font-medium text-slate-500">CGPA</div>
              <div className="text-lg font-bold text-slate-900">{profile?.cgpa || 'N/A'}</div>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-right">
              <div className="text-xs font-medium text-slate-500">Peer Rating</div>
              <div className="text-lg font-bold text-amber-600 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                {profile?.avg_peer_rating || '0.0'}
              </div>
            </div>
          </div>
        </div>

        {profile?.bio && (
          <div className="mt-6 pt-6 border-t border-slate-100 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">Bio: </span>
            {profile.bio}
          </div>
        )}
      </div>

      {/* Add Skill Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Add Skills to Your Profile
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Declare skills you can offer as a peer mentor, or skills you want to learn for your research project.
        </p>

        {message.text && (
          <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleAddSkill} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Skill Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Intent</label>
            <select
              value={skillType}
              onChange={(e) => setSkillType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="OFFERED">Can Teach (Offered)</option>
              <option value="WANTED">Want to Learn (Wishlist)</option>
            </select>
          </div>

          {/* Filter Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Category Filter</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                const first = catalogSkills.find(
                  (s) => !e.target.value || s.category_id === parseInt(e.target.value, 10)
                );
                if (first) setSelectedSkillId(first.skill_id);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Catalog Skill */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Skill</label>
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
            >
              {filteredCatalogSkills.map((s) => (
                <option key={s.skill_id} value={s.skill_id}>
                  {s.name} ({s.category_name})
                </option>
              ))}
            </select>
          </div>

          {/* Proficiency */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Proficiency ({proficiency}/5)
            </label>
            <select
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="1">1 - Beginner</option>
              <option value="2">2 - Elementary</option>
              <option value="3">3 - Intermediate</option>
              <option value="4">4 - Advanced</option>
              <option value="5">5 - Expert</option>
            </select>
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={addingSkill}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {addingSkill ? 'Adding...' : 'Add Skill'}
            </button>
          </div>
        </form>
      </div>

      {/* Skills Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills Offered Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Skills Offered (Peer Mentorship)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Skills you can mentor peers on and contribute to project teams
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {mySkills.offered.length} Skills
            </span>
          </div>

          {mySkills.offered.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
              No skills added yet. Use the selector above to add skills you can mentor in.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {mySkills.offered.map((s) => (
                <div
                  key={s.user_skill_id}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs font-medium hover:bg-emerald-100/80 transition-colors"
                >
                  <span className="font-semibold">{s.skill_name}</span>
                  <span className="px-1.5 py-0.5 bg-emerald-200/60 rounded text-[10px] font-bold">
                    Lvl {s.proficiency_level}
                  </span>
                  <button
                    onClick={() => handleDeleteSkill(s.user_skill_id)}
                    title="Remove skill"
                    className="text-emerald-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills Wanted Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                Skills Wanted (Wishlist)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Technologies you need help with or want to learn for your project
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {mySkills.wanted.length} Skills
            </span>
          </div>

          {mySkills.wanted.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
              No wishlist skills added yet. Add skills you wish to learn from peer mentors.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5">
              {mySkills.wanted.map((s) => (
                <div
                  key={s.user_skill_id}
                  className="group flex items-center gap-2 px-3 py-1.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-blue-900 text-xs font-medium hover:bg-blue-100/80 transition-colors"
                >
                  <span className="font-semibold">{s.skill_name}</span>
                  <span className="px-1.5 py-0.5 bg-blue-200/60 rounded text-[10px] font-bold">
                    Target Lvl {s.proficiency_level}
                  </span>
                  <button
                    onClick={() => handleDeleteSkill(s.user_skill_id)}
                    title="Remove skill"
                    className="text-blue-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
