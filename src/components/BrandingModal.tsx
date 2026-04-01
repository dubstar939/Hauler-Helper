import React from 'react';
import { 
  Palette, 
  Type, 
  Check, 
  RefreshCw, 
  Moon, 
  Sun,
  Layout,
  Monitor,
  Smartphone
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Modal } from './Modal';
import { cn } from '../lib/utils';

interface BrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIMARY_COLORS = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Purple', value: '#9333ea' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Cyan', value: '#0891b2' },
  { name: 'Slate', value: '#475569' },
];

const FONTS = [
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'System', value: 'system-ui, sans-serif' },
];

export const BrandingModal: React.FC<BrandingModalProps> = ({ isOpen, onClose }) => {
  const { 
    themeConfig, 
    setThemeConfig, 
    isDarkMode, 
    toggleDarkMode,
    showToast 
  } = useGlobal();

  const handleReset = () => {
    setThemeConfig({
      primaryColor: '#4f46e5',
      fontFamily: 'Inter, sans-serif',
      borderRadius: '1rem'
    });
    showToast('Theme reset to default');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Branding & Theme"
      icon={<Palette size={20} />}
      className="max-w-2xl"
      footer={
        <div className="flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <RefreshCw size={14} />
            Reset to Default
          </button>
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl transition-all shadow-xl shadow-indigo-500/20"
          >
            Save Changes
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Appearance */}
        <section>
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <Layout size={14} className="text-indigo-500" />
            Appearance
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => isDarkMode && toggleDarkMode()}
              className={cn(
                "flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all",
                !isDarkMode 
                  ? "bg-indigo-50 border-indigo-500 shadow-lg shadow-indigo-500/10" 
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-500/50"
              )}
            >
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">
                <Sun size={24} />
              </div>
              <span className="text-sm font-black text-gray-900 dark:text-white">Light Mode</span>
              {!isDarkMode && <Check size={16} className="text-indigo-500" />}
            </button>
            <button
              onClick={() => !isDarkMode && toggleDarkMode()}
              className={cn(
                "flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all",
                isDarkMode 
                  ? "bg-indigo-900/20 border-indigo-500 shadow-lg shadow-indigo-500/10" 
                  : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-500/50"
              )}
            >
              <div className="w-12 h-12 bg-indigo-900 text-indigo-400 rounded-xl flex items-center justify-center shadow-sm">
                <Moon size={24} />
              </div>
              <span className="text-sm font-black text-gray-900 dark:text-white">Dark Mode</span>
              {isDarkMode && <Check size={16} className="text-indigo-500" />}
            </button>
          </div>
        </section>

        {/* Primary Color */}
        <section>
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <Palette size={14} className="text-indigo-500" />
            Primary Color
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {PRIMARY_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setThemeConfig({ ...themeConfig, primaryColor: color.value })}
                className="group flex flex-col items-center gap-2"
              >
                <div 
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                    themeConfig.primaryColor === color.value ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-105"
                  )}
                  style={{ backgroundColor: color.value }}
                >
                  {themeConfig.primaryColor === color.value && <Check size={20} className="text-white" />}
                </div>
                <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors">
                  {color.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <Type size={14} className="text-indigo-500" />
            Typography
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FONTS.map((font) => (
              <button
                key={font.value}
                onClick={() => setThemeConfig({ ...themeConfig, fontFamily: font.value })}
                className={cn(
                  "px-4 py-3 rounded-xl border text-sm font-bold transition-all text-left flex items-center justify-between",
                  themeConfig.fontFamily === font.value 
                    ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-600 dark:text-indigo-400" 
                    : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-indigo-500/50 text-gray-600 dark:text-gray-400"
                )}
                style={{ fontFamily: font.value }}
              >
                {font.name}
                {themeConfig.fontFamily === font.value && <Check size={14} />}
              </button>
            ))}
          </div>
        </section>

        {/* Preview */}
        <section className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Live Preview</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: themeConfig.primaryColor }} />
              <h4 className="text-lg font-black text-gray-900 dark:text-white" style={{ fontFamily: themeConfig.fontFamily }}>
                This is how your app looks
              </h4>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed" style={{ fontFamily: themeConfig.fontFamily }}>
              The quick brown fox jumps over the lazy dog. This preview shows your selected font and primary color in action.
            </p>
            <div className="flex gap-2">
              <button 
                className="px-4 py-2 text-xs font-black text-white rounded-lg shadow-lg"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                Primary Button
              </button>
              <button className="px-4 py-2 text-xs font-black text-gray-500 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                Secondary
              </button>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
};
