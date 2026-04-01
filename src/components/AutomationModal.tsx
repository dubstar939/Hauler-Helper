import React, { useState } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Clock, 
  Mail, 
  Check, 
  X, 
  ChevronRight, 
  Play, 
  Pause,
  Settings,
  ArrowRight,
  Sparkles,
  Layout,
  Tag
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useDatabase } from '../context/DatabaseContext';
import { FollowUpSequence, FollowUpStep } from '../../types';
import { Modal } from './Modal';
import { cn } from '../lib/utils';

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomationModal: React.FC<AutomationModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useGlobal();
  const { templates, followUpSequences: sequences, setFollowUpSequences: setSequences } = useDatabase();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FollowUpSequence>>({});

  const handleAddSequence = () => {
    const newSequence: FollowUpSequence = {
      id: crypto.randomUUID(),
      name: 'New Sequence',
      steps: [],
      isActive: false
    };
    setSequences([newSequence, ...sequences]);
    setEditingId(newSequence.id);
    setEditForm(newSequence);
    showToast('New automation sequence created');
  };

  const handleSave = (id: string) => {
    setSequences(sequences.map(s => s.id === id ? { ...s, ...editForm } as FollowUpSequence : s));
    setEditingId(null);
    showToast('Sequence saved');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this sequence?')) {
      setSequences(sequences.filter(s => s.id !== id));
      showToast('Sequence deleted');
    }
  };

  const handleAddStep = () => {
    const newStep: FollowUpStep = {
      id: crypto.randomUUID(),
      delayDays: 3,
      templateId: templates[0]?.id || '',
      type: 'email'
    };
    const updatedSteps = [...(editForm.steps || []), newStep];
    setEditForm({ ...editForm, steps: updatedSteps });
  };

  const handleRemoveStep = (stepId: string) => {
    const updatedSteps = (editForm.steps || []).filter(s => s.id !== stepId);
    setEditForm({ ...editForm, steps: updatedSteps });
  };

  const updateStep = (stepId: string, field: keyof FollowUpStep, value: any) => {
    const updatedSteps = (editForm.steps || []).map(s => s.id === stepId ? { ...s, [field]: value } : s);
    setEditForm({ ...editForm, steps: updatedSteps });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Automation Sequences"
      icon={<Zap size={20} />}
      className="max-w-6xl"
      footer={
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            {sequences.length} Active Automations
          </p>
          <button
            onClick={handleAddSequence}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl transition-all shadow-xl shadow-indigo-500/20"
          >
            <Plus size={18} />
            Create New Sequence
          </button>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-8 h-[600px]">
        {/* Sequence List */}
        <div className="w-full lg:w-80 space-y-3 overflow-y-auto pr-2">
          {sequences.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setEditingId(s.id);
                setEditForm(s);
              }}
              className={cn(
                "w-full text-left p-4 rounded-2xl border transition-all group relative",
                editingId === s.id 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-lg shadow-indigo-500/10" 
                  : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-500/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    s.isActive ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  )} />
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{s.steps.length} Steps</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="p-1 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={12} />
                </button>
              </div>
              <p className="text-sm font-black text-gray-900 dark:text-white truncate">{s.name}</p>
              {editingId === s.id && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <ChevronRight size={20} />
                </div>
              )}
            </button>
          ))}
          {sequences.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-xs font-bold text-gray-400">No sequences found.</p>
            </div>
          )}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {editingId ? (
            <div className="flex-1 flex flex-col space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Sequence Name</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                    placeholder="e.g. New Hauler Onboarding"
                  />
                </div>
                <div className="flex flex-col items-end">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 mr-1">Status</label>
                  <button
                    onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all",
                      editForm.isActive 
                        ? "bg-green-500 text-white shadow-lg shadow-green-500/20" 
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    )}
                  >
                    {editForm.isActive ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                    {editForm.isActive ? 'Active' : 'Paused'}
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 ml-1">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sequence Steps</label>
                  <button
                    onClick={handleAddStep}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 hover:underline"
                  >
                    <Plus size={14} />
                    Add Step
                  </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                  {(editForm.steps || []).map((step, idx) => (
                    <div key={step.id} className="relative flex items-start gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg shadow-indigo-500/20 z-10">
                          {idx + 1}
                        </div>
                        {idx < (editForm.steps?.length || 0) - 1 && (
                          <div className="w-0.5 h-full bg-gray-100 dark:bg-gray-800 absolute top-8 left-4 -translate-x-1/2" />
                        )}
                      </div>
                      
                      <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent hover:border-indigo-500/30 transition-all">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Delay (Days)</label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                              <input
                                type="number"
                                value={step.delayDays}
                                onChange={(e) => updateStep(step.id, 'delayDays', parseInt(e.target.value))}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border-none rounded-lg text-xs font-bold"
                              />
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Email Template</label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                              <select
                                value={step.templateId}
                                onChange={(e) => updateStep(step.id, 'templateId', e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-900 border-none rounded-lg text-xs font-bold appearance-none"
                              >
                                {templates.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStep(step.id)}
                          className="absolute -right-2 -top-2 p-1.5 bg-white dark:bg-gray-900 text-gray-400 hover:text-red-500 rounded-lg shadow-md border border-gray-100 dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(editForm.steps || []).length === 0 && (
                    <div className="py-12 text-center bg-gray-50 dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-bold text-gray-400">No steps added to this sequence yet.</p>
                      <button
                        onClick={handleAddStep}
                        className="mt-4 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Add your first step
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSave(editingId)}
                  className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl transition-all shadow-xl shadow-indigo-500/20"
                >
                  <Check size={18} />
                  Save Sequence
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-gray-300">
                <Zap size={40} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Select a Sequence</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
                  Choose an automation sequence from the list to edit or create a new one to get started.
                </p>
              </div>
              <button
                onClick={handleAddSequence}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
              >
                <Plus size={18} />
                Create New Sequence
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
