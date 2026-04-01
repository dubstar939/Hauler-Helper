import React, { useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { 
  X, 
  Send, 
  Paperclip, 
  Trash2, 
  Sparkles, 
  ChevronDown,
  FileText,
  Mail,
  Copy
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useDatabase } from '../context/DatabaseContext';
import { Hauler, EmailTemplate, HaulerAttachment, HaulerStatus } from '../../types';
import { cn, formatFileSize, htmlToPlainText } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { PLACEHOLDERS, EMAIL_SIGNATURE } from '../../constants';

interface EmailDraftModalProps {
  hauler: Hauler | null;
  onClose: () => void;
}

const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['clean']
  ],
};

export const EmailDraftModal: React.FC<EmailDraftModalProps> = ({ hauler, onClose }) => {
  const { showToast } = useGlobal();
  const { templates } = useDatabase();
  const { 
    updateHaulerField, 
    facilityAddress, 
    location, 
    clientRef, 
    accountInfo
  } = useGlobal();
  
  const quillRef = useRef<any>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  if (!hauler) return null;

  const applyTemplate = (template: EmailTemplate) => {
    const placeholders = {
      '{haulerName}': hauler.name,
      '{address}': facilityAddress || location || "Facility Address",
      '{location}': location || "Specified Area",
      '{clientRef}': clientRef || "xxxx.xxxx.xxxxx",
      '{accountInfo}': accountInfo || "ACCOUNT NAME (ACC #)",
      '{signature}': EMAIL_SIGNATURE.trim()
    };
    let newSubject = template.subject;
    let newContent = template.content;
    Object.entries(placeholders).forEach(([key, val]) => {
      newSubject = newSubject.replace(new RegExp(key, 'g'), val);
      newContent = newContent.replace(new RegExp(key, 'g'), val);
    });
    
    const htmlContent = newContent.replace(/\r?\n/g, '<br/>');
    updateHaulerField(hauler.id, 'draftSubject', newSubject);
    updateHaulerField(hauler.id, 'draftContent', htmlContent);
    showToast(`Applied template: ${template.name}`);
  };

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newAttachment: HaulerAttachment = {
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream'
    };
    const updated = [...(hauler.attachments || []), newAttachment];
    updateHaulerField(hauler.id, 'attachments', updated);
    if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    showToast(`Attached: ${file.name}`);
  };

  const handleRemoveAttachment = (index: number) => {
    const updated = hauler.attachments.filter((_, i) => i !== index);
    updateHaulerField(hauler.id, 'attachments', updated);
  };

  const handleSend = () => {
    const subject = encodeURIComponent(hauler.draftSubject || '');
    const plainTextBody = htmlToPlainText(hauler.draftContent || '');
    const body = encodeURIComponent(plainTextBody);
    
    window.location.href = `mailto:${hauler.email}?subject=${subject}&body=${body}`;
    updateHaulerField(hauler.id, 'status', HaulerStatus.SENT);
    showToast(`Opening Outlook for ${hauler.name}...`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Mail size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Draft Email</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">To: {hauler.name} ({hauler.email})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-400 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-8">
          {/* Main Editor */}
          <div className="flex-1 space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Subject Line</label>
              <input
                type="text"
                value={hauler.draftSubject || ''}
                onChange={(e) => updateHaulerField(hauler.id, 'draftSubject', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                placeholder="Email Subject"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-[400px]">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Email Content</label>
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden border border-transparent focus-within:border-indigo-500/30 transition-all">
                <ReactQuill
                  theme="snow"
                  value={hauler.draftContent || ''}
                  onChange={(val) => updateHaulerField(hauler.id, 'draftContent', val)}
                  modules={QUILL_MODULES}
                  className="h-full border-none"
                />
              </div>
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Attachments</label>
                <button
                  onClick={() => attachmentInputRef.current?.click()}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 hover:underline"
                >
                  <Paperclip size={14} />
                  Add File
                </button>
                <input
                  type="file"
                  ref={attachmentInputRef}
                  onChange={handleAddAttachment}
                  className="hidden"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {hauler.attachments?.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-bold border border-indigo-100 dark:border-indigo-900/30">
                    <FileText size={12} />
                    {file.name} ({formatFileSize(file.size)})
                    <button onClick={() => handleRemoveAttachment(idx)} className="hover:text-red-500">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {(!hauler.attachments || hauler.attachments.length === 0) && (
                  <p className="text-xs text-gray-400 italic">No attachments added</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Templates & Placeholders */}
          <div className="w-full lg:w-72 space-y-6">
            <div>
              <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                Templates
              </h3>
              <div className="space-y-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className="w-full text-left p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group"
                  >
                    <p className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">{t.name}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{t.category}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4">Placeholders</h3>
              <div className="grid grid-cols-1 gap-2">
                {PLACEHOLDERS.map((p) => (
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
                    className="text-left px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-[10px] font-bold text-gray-600 dark:text-gray-400 transition-colors flex items-center justify-between group"
                  >
                    {p.label}
                    <span className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">{p.key}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(htmlToPlainText(hauler.draftContent || ''));
                showToast("Body copied to clipboard");
              }}
              className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <Copy size={16} />
              Copy Body
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
            >
              <Send size={18} />
              Send via Outlook
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
