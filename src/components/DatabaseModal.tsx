import React, { useState, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Database,
  Edit2,
  Check,
  X,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Building2
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useDatabase } from '../context/DatabaseContext';
import { BrokerContact } from '../../types';
import { Modal } from './Modal';
import { cn } from '../lib/utils';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useGlobal();
  const { brokerList, setBrokerList } = useDatabase();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<BrokerContact>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredBrokers = brokerList.filter(b => 
    (b.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (b.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
    (b.location?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    const newBroker: BrokerContact = {
      id: crypto.randomUUID(),
      name: 'New Broker',
      email: 'broker@example.com',
      phone: '',
      location: 'City, State',
      type: 'Broker',
      rating: 5,
      haulerName: 'New Broker',
      brokerEmail: 'broker@example.com'
    };
    setBrokerList([newBroker, ...brokerList]);
    setEditingId(newBroker.id);
    setEditForm(newBroker);
    showToast('New broker added');
  };

  const handleSave = (id: string) => {
    setBrokerList(brokerList.map(b => b.id === id ? { ...b, ...editForm } as BrokerContact : b));
    setEditingId(null);
    showToast('Broker updated');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this broker?')) {
      setBrokerList(brokerList.filter(b => b.id !== id));
      showToast('Broker deleted');
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Location', 'Type', 'Rating'],
      ...brokerList.map(b => [b.name, b.email, b.phone, b.location, b.type, b.rating])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hauler_database.csv';
    a.click();
    showToast('Database exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1); // Skip header
      const newBrokers: BrokerContact[] = lines
        .filter(line => line.trim())
        .map(line => {
          const [name, email, phone, location, type, rating] = line.split(',');
          const cleanName = name?.trim() || 'Imported';
          const cleanEmail = email?.trim() || '';
          return {
            id: crypto.randomUUID(),
            name: cleanName,
            email: cleanEmail,
            phone: phone?.trim() || '',
            location: location?.trim() || '',
            type: type?.trim() || 'Broker',
            rating: parseInt(rating) || 5,
            haulerName: cleanName,
            brokerEmail: cleanEmail
          };
        });
      
      setBrokerList([...newBrokers, ...brokerList]);
      showToast(`Imported ${newBrokers.length} brokers`);
    };
    reader.readAsText(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Broker Database"
      icon={<Database size={20} />}
      className="max-w-6xl"
      footer={
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            {brokerList.length} Total Contacts
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 transition-all"
            >
              <Upload size={14} />
              Import CSV
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
              accept=".csv"
            />
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 transition-all"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or location..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>
          <button
            onClick={handleAdd}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20"
          >
            <Plus size={18} />
            Add Contact
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredBrokers.map((broker) => (
                <tr key={broker.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === broker.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold"
                        />
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold"
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white">{broker.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                            <Mail size={10} />
                            {broker.email}
                          </span>
                          {broker.phone && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                              <Phone size={10} />
                              {broker.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === broker.id ? (
                      <input
                        type="text"
                        value={editForm.location || ''}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400">
                        <MapPin size={12} className="text-indigo-500" />
                        {broker.location}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === broker.id ? (
                      <select
                        value={editForm.type || 'Broker'}
                        onChange={(e) => setEditForm({ ...editForm, type: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold"
                      >
                        <option value="Broker">Broker</option>
                        <option value="Hauler">Hauler</option>
                        <option value="Carrier">Carrier</option>
                      </select>
                    ) : (
                      <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {broker.type}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingId === broker.id ? (
                        <>
                          <button
                            onClick={() => handleSave(broker.id)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(broker.id);
                              setEditForm(broker);
                            }}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(broker.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBrokers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-300">
                        <Building2 size={32} />
                      </div>
                      <p className="text-sm font-bold text-gray-400">No contacts found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};
