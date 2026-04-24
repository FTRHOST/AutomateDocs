import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileEdit, ExternalLink, Save, FileText, Loader2, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { TemplateConfig, FieldMapping } from '../types';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTemplate, setNewTemplate] = useState<TemplateConfig>({
    id: '',
    name: '',
    description: '',
    fields: [{ placeholder: '', label: '', type: 'text' }]
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Kalibalik@') {
      setIsAuthorized(true);
    } else {
      alert('Password salah!');
    }
  };

  const handleEdit = (template: TemplateConfig) => {
    setNewTemplate(template);
    setEditingId(template.id);
    setIsAdding(true);
  };

  const handleAddTemplate = async () => {
    if (!newTemplate.id || !newTemplate.name) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      });
      
      if (res.ok) {
        setIsAdding(false);
        setEditingId(null);
        setNewTemplate({
          id: '',
          name: '',
          description: '',
          fields: [{ placeholder: '', label: '', type: 'text' }]
        });
        fetchTemplates();
      }
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeTemplate = async (id: string) => {
    if (!confirm('Yakin ingin menghapus template ini?')) return;
    setLoading(true);
    try {
      await fetch(`/api/templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
    } finally {
      setLoading(false);
    }
  };

  const addField = () => {
    setNewTemplate({
      ...newTemplate,
      fields: [...newTemplate.fields, { placeholder: '', label: '', type: 'text' }]
    });
  };

  const updateField = (index: number, field: Partial<FieldMapping>) => {
    const newFields = [...newTemplate.fields];
    newFields[index] = { ...newFields[index], ...field };
    setNewTemplate({ ...newTemplate, fields: newFields });
  };

  const removeField = (index: number) => {
    setNewTemplate({
      ...newTemplate,
      fields: newTemplate.fields.filter((_, i) => i !== index)
    });
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl border border-gray-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
          <Settings className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Akses Admin</h2>
          <p className="text-gray-500">Masukkan kata sandi untuk melanjutkan.</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Kata sandi..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
            Masuk
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-500">Kelola template dokumen dan pemetaan field.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium"
        >
          <Plus className="w-4 h-4" />
          Tambah Template
        </button>
      </div>

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Template</label>
              <input
                type="text"
                placeholder="Contoh: Surat Penawaran"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={newTemplate.name}
                onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Google Doc ID</label>
              <input
                type="text"
                placeholder="ID dari URL Google Docs"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                value={newTemplate.id}
                onChange={e => setNewTemplate({ ...newTemplate, id: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Field Mapping</h3>
              <button onClick={addField} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Tambah Field
              </button>
            </div>
            
            {newTemplate.fields.map((field, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Label di Form</label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm"
                    value={field.label}
                    onChange={e => updateField(index, { label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Placeholder di Doc</label>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">{'{{'}</span>
                    <input
                      type="text"
                      placeholder="nama"
                      className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm font-mono"
                      value={field.placeholder}
                      onChange={e => updateField(index, { placeholder: e.target.value })}
                    />
                    <span className="text-gray-400">{'}}'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Tipe</label>
                  <select
                    className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm"
                    value={field.type}
                    onChange={e => updateField(index, { type: e.target.value as any })}
                  >
                    <option value="text">Text</option>
                    <option value="date">Date</option>
                    <option value="number">Number</option>
                  </select>
                </div>
                <button
                  onClick={() => removeField(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-top">
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
                setNewTemplate({
                  id: '',
                  name: '',
                  description: '',
                  fields: [{ placeholder: '', label: '', type: 'text' }]
                });
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Batal
            </button>
            <button
              onClick={handleAddTemplate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingId ? 'Simpan Perubahan' : 'Simpan Template'}
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loading && !isAdding && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}
        {!loading && templates.map(template => (
          <div key={template.id} className="bg-white p-6 rounded-xl border border-gray-200 flex justify-between items-center hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{template.name}</h3>
                <p className="text-sm text-gray-500 font-mono">{template.id}</p>
                <div className="flex gap-2 mt-1">
                  {template.fields.map(f => (
                    <span key={f.placeholder} className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-500 rounded uppercase tracking-tighter">
                      {f.placeholder}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleEdit(template)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <FileEdit className="w-5 h-5" />
              </button>
              <a
                href={`https://docs.google.com/document/d/${template.id}/edit`}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <button
                onClick={() => removeTemplate(template.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && !isAdding && (
          <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500">Belum ada template</h3>
            <p className="text-gray-400 mb-6">Mulai dengan menambahkan template Google Doc baru.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-sm font-medium hover:bg-gray-50"
            >
              Tambah Template Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
