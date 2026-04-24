import React, { useState, useEffect } from 'react';
import { FileDown, Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TemplateConfig } from '../types';
import { getAccessToken } from '../services/googleAuth';
import { copyFile, replacePlaceholders, convertToPdf, uploadToDrive, deleteFile } from '../services/docService';
import { cn } from '../lib/utils';

export default function UserForm() {
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [result, setResult] = useState<{ link: string; emailSent: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        setTemplates(data);
      } catch (err) {
        console.error("Error fetching templates:", err);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleSelectTemplate = (template: TemplateConfig) => {
    setSelectedTemplate(template);
    setFormData({});
    setResult(null);
    setError(null);
  };

  const handleInputChange = (placeholder: string, value: string) => {
    setFormData(prev => ({ ...prev, [placeholder]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    setIsLoading(true);
    setError(null);
    let tempFileId = '';

    try {
      setCurrentStep('Menghubungkan ke Google...');
      const token = await getAccessToken();

      setCurrentStep('Menyiapkan template...');
      tempFileId = await copyFile(selectedTemplate.id, token);

      setCurrentStep('Mengisi data dokumen...');
      await replacePlaceholders(tempFileId, formData, token);

      setCurrentStep('Mengonversi ke PDF...');
      const pdfBlob = await convertToPdf(tempFileId, token);

      setCurrentStep('Mengunggah hasil...');
      const driveFile = await uploadToDrive(pdfBlob, `${selectedTemplate.name} - ${new Date().toLocaleDateString()}.pdf`, token);

      setCurrentStep('Membersihkan file sementara...');
      await deleteFile(tempFileId, token);

      setCurrentStep('Selesai!');
      setResult({ link: driveFile.webViewLink, emailSent: false });
      
      // Log to backend API
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          data: formData,
          status: 'success',
          pdfId: driveFile.id,
          pdfLink: driveFile.webViewLink,
        })
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memproses dokumen.');
      if (tempFileId) await deleteFile(tempFileId, await getAccessToken()).catch(() => {});
      
      // Log failure to backend API
      if (selectedTemplate) {
        await fetch('/api/records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: selectedTemplate.id,
            templateName: selectedTemplate.name,
            data: formData,
            status: 'failed',
            errorMessage: err.message,
          })
        }).catch(e => console.error("Failed to log error record", e));
      }
    } finally {
      setIsLoading(false);
      setCurrentStep('');
    }
  };

  if (!selectedTemplate) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Buat Dokumen Otomatis</h1>
          <p className="text-gray-500 text-lg">Pilih salah satu template di bawah untuk memulai.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingTemplates ? (
            <div className="col-span-full py-20 flex justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
          ) : templates.map(template => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all text-left group"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{template.name}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2">{template.description || 'Gunakan template ini untuk membuat dokumen PDF secara otomatis.'}</p>
              <div className="flex flex-wrap gap-2">
                {template.fields.slice(0, 3).map(f => (
                  <span key={f.placeholder} className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-400 rounded uppercase tracking-wider">
                    {f.placeholder}
                  </span>
                ))}
                {template.fields.length > 3 && (
                  <span className="text-[10px] font-bold text-gray-400">+{template.fields.length - 3} lainnya</span>
                )}
              </div>
            </button>
          ))}
          {templates.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Belum ada template yang tersedia. Silakan hubungi admin.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => setSelectedTemplate(null)}
        className="text-gray-500 hover:text-gray-800 flex items-center gap-2 group transition-colors"
      >
        <span className="group-hover:-translate-x-1 transition-transform">←</span> Kembali ke pilihan template
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-white">
          <h2 className="text-2xl font-bold mb-2">{selectedTemplate.name}</h2>
          <p className="opacity-80">Lengkapi formulir di bawah ini untuk menghasilkan dokumen.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {selectedTemplate.fields.map((field) => (
            <div key={field.placeholder} className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">{field.label}</label>
              <input
                type={field.type}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData[field.placeholder] || ''}
                onChange={e => handleInputChange(field.placeholder, e.target.value)}
              />
            </div>
          ))}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 items-start text-red-600 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {result && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 bg-green-50 border border-green-100 rounded-xl flex flex-col items-center text-center gap-4"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <div>
                <h3 className="text-lg font-bold text-green-800">Berhasil Dibuat!</h3>
                <p className="text-green-700 text-sm">Dokumen Anda telah siap dan tersimpan di Google Drive.</p>
              </div>
              <a
                href={result.link}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
              >
                <FileDown className="w-5 h-5" />
                Unduh / Lihat PDF
              </a>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 disabled:bg-blue-300 transition-all flex items-center justify-center gap-3 overflow-hidden"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{currentStep}</span>
              </>
            ) : (
              <>
                <span>Buat Dokumen</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
