import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Lightbulb,
  Plus,
  Search,
  Filter,
  Layers,
  Sparkles,
  Users,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react';

const ProjectIdeasPage = () => {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [domains, setDomains] = useState([]);
  const [catalogSkills, setCatalogSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Propose Idea Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [domainId, setDomainId] = useState('');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [requiredSkills, setRequiredSkills] = useState([]); // [{ skill_id, importance_level }]
  const [tempSkillId, setTempSkillId] = useState('');
  const [tempImportance, setTempImportance] = useState('REQUIRED');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [ideasRes, domainsRes, skillsRes] = await Promise.all([
        api.get('/projects/ideas', {
          params: {
            domain_id: selectedDomain || undefined,
            difficulty_level: selectedDifficulty || undefined,
            search: searchTerm || undefined,
          },
        }),
        api.get('/academic/domains'),
        api.get('/skills'),
      ]);

      if (ideasRes.data.success) setIdeas(ideasRes.data.data);
      if (domainsRes.data.success) {
        setDomains(domainsRes.data.data);
        if (domainsRes.data.data.length > 0 && !domainId) {
          setDomainId(domainsRes.data.data[0].domain_id);
        }
      }
      if (skillsRes.data.success) {
        setCatalogSkills(skillsRes.data.data);
        if (skillsRes.data.data.length > 0 && !tempSkillId) {
          setTempSkillId(skillsRes.data.data[0].skill_id);
        }
      }
    } catch (err) {
      console.error("Failed to load project ideas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDomain, selectedDifficulty, searchTerm]);

  const handleAddSkillToIdea = () => {
    if (!tempSkillId) return;
    const sId = parseInt(tempSkillId, 10);
    if (requiredSkills.some((s) => s.skill_id === sId)) return;

    const skillObj = catalogSkills.find((s) => s.skill_id === sId);
    setRequiredSkills((prev) => [
      ...prev,
      { skill_id: sId, name: skillObj?.name, importance_level: tempImportance },
    ]);
  };

  const handleRemoveSkillFromIdea = (sId) => {
    setRequiredSkills((prev) => prev.filter((s) => s.skill_id !== sId));
  };

  const handleSubmitIdea = async (e) => {
    e.preventDefault();
    if (!title.trim() || !abstract.trim() || !domainId) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post('/projects/ideas', {
        title,
        abstract,
        domain_id: parseInt(domainId, 10),
        difficulty_level: difficulty,
        skills: requiredSkills.map((s) => ({
          skill_id: s.skill_id,
          importance_level: s.importance_level,
        })),
      });

      if (res.data.success) {
        setShowModal(false);
        setTitle('');
        setAbstract('');
        setRequiredSkills([]);
        await loadData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to publish idea.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyBadge = (level) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ADVANCED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            Research & Project Ideas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse student and faculty problem statements, review required skills, and form collaborative teams.
          </p>
        </div>

        {user && (
          <button
            onClick={() => setShowModal(true)}
            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-xs transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Propose Project Idea
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or keyword..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Research Domains</option>
          {domains.map((d) => (
            <option key={d.domain_id} value={d.domain_id}>{d.name}</option>
          ))}
        </select>

        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Difficulty Levels</option>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
      </div>

      {/* Ideas Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : ideas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
          No project ideas found matching your filters. Propose the first one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ideas.map((idea) => (
            <div
              key={idea.idea_id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {idea.domain_name}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyBadge(idea.difficulty_level)}`}>
                    {idea.difficulty_level}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{idea.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{idea.abstract}</p>

                {/* Required Skills Tags */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Recommended / Required Skills:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {idea.requirements?.map((req) => (
                      <span
                        key={req.requirement_id}
                        className={`text-xs px-2.5 py-0.5 rounded-lg border font-medium ${
                          req.importance_level === 'REQUIRED'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {req.skill_name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>By: {idea.creator_name}</span>
                <Link
                  to={`/teams?idea_id=${idea.idea_id}`}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5" />
                  View / Create Team
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Propose Idea Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Propose New Project Idea</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitIdea} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI-Powered Smart Campus Energy Management"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Research Domain</label>
                  <select
                    value={domainId}
                    onChange={(e) => setDomainId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    {domains.map((d) => (
                      <option key={d.domain_id} value={d.domain_id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty Level</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Problem Statement & Abstract</label>
                <textarea
                  rows="3"
                  required
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  placeholder="Describe the challenge, target methodology, and expected results..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              {/* Required Skills Selector */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Tag Required / Recommended Skills
                </label>
                <div className="flex gap-2">
                  <select
                    value={tempSkillId}
                    onChange={(e) => setTempSkillId(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    {catalogSkills.map((s) => (
                      <option key={s.skill_id} value={s.skill_id}>{s.name}</option>
                    ))}
                  </select>
                  <select
                    value={tempImportance}
                    onChange={(e) => setTempImportance(e.target.value)}
                    className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="REQUIRED">Required</option>
                    <option value="NICE_TO_HAVE">Nice to have</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddSkillToIdea}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>

                {/* Added Skills Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {requiredSkills.map((s) => (
                    <span
                      key={s.skill_id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
                    >
                      <span>{s.name}</span>
                      <span className="text-[10px] text-slate-400">({s.importance_level})</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkillFromIdea(s.skill_id)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Idea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectIdeasPage;
