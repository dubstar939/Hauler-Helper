import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill-new';
const QuillWrapper = ReactQuill as any;
import 'react-quill-new/dist/quill.snow.css';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Sparkles, 
  Copy, 
  ChevronRight,
  Layout,
  Tag
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useDatabase } from '../context/DatabaseContext';
import { EmailTemplate, HaulerType } from '../../types';
import { Modal } from './Modal';
import { cn } from '../lib/utils';
import { PLACEHOLDERS } from '../../constants';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ],
};

export const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useGlobal();
  const { templates, setTemplates } = useDatabase();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});
  const quillRef = useRef<any>(null);

  const handleAdd = () => {
    const newTemplate: EmailTemplate = {
      id: crypto.randomUUID(),
      name: 'New Template',
      subject: 'Subject Line',
      content: '<p>Email content goes here...</p>',
      category: HaulerType.NEW,
      attachments: []
    };
    setTemplates([newTemplate, ...templates]);
    setEditingId(newTemplate.id);
    setEditForm(newTemplate);
    showToast('New template created');
  };

  const handleSave = (id: string) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, ...editForm } as EmailTemplate : t));
    setEditingId(null);
    showToast('Template saved');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== id));
      showToast('Template deleted');
    }
  };

  const handleDuplicate = (template: EmailTemplate) => {
    const duplicated: EmailTemplate = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} (Copy)`
    };
    setTemplates([duplicated, ...templates]);
    showToast('Template duplicated');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Email Templates"
      icon={<FileText size={20} />}
      className="max-w-6xl"
      footer={
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            {templates.length} Saved Templates
          </p>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl transition-all shadow-xl shadow-indigo-500/20"
          >
            <Plus size={18} />
            Create New Template
          </button>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-8 h-[600px]">
        {/* Template List */}
        <div className="w-full lg:w-80 space-y-3 overflow-y-auto pr-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setEditingId(t.id);
                setEditForm(t);
              }}
              className={cn(
                "w-full text-left p-4 rounded-2xl border transition-all group relative",
                editingId === t.id 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-lg shadow-indigo-500/10" 
                  : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-500/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{t.category}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleDuplicate(t); }} className="p-1 hover:text-indigo-600">
                    <Copy size={12} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} className="p-1 hover:text-red-600">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p className="text-sm font-black text-gray-900 dark:text-white truncate">{t.name}</p>
              <p className="text-[10px] text-gray-400 mt-1 truncate">{t.subject}</p>
              {editingId === t.id && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500">
                  <ChevronRight size={20} />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {editingId ? (
            <div className="flex-1 flex flex-col space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Template Name</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                    placeholder="e.g. Initial Outreach"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Category</label>
                  <input
                    type="text"
                    value={editForm.category || ''}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                    placeholder="e.g. Follow-up"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Subject Line</label>
                <input
                  type="text"
                  value={editForm.subject || ''}
                  onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                  placeholder="Email Subject"
                />
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email Content</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400">Insert:</span>
                    {PLACEHOLDERS.slice(0, 3).map(p => (
                      <button
                        key={p.key}
                        onClick={() => {
                          const quill = quillRef.current?.getEditor();
                          if (quill) {
                            const range = quill.getSelection();
                            if (range) quill.insertText(range.index, p.key);
                            else quill.insertText(quill.getLength(), p.key);
                          }
                        }}
                        className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden border border-transparent focus-within:border-indigo-500/30 transition-all">
                  <QuillWrapper
                    theme="snow"
                    value={editForm.content || ''}
                    onChange={(val) => setEditForm({ ...editForm, content: val })}
                    modules={QUILL_MODULES}
                    className="h-full border-none"
                    ref={quillRef}
                  />
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
                  Save Template
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-gray-300">
                <Layout size={40} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Select a Template</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mt-2">
                  Choose a template from the list to edit or create a new one to get started.
                </p>
              </div>
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
              >
                <Plus size={18} />
                Create New Template
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
