import React, { useState, useEffect } from 'react';
import { AutomationRecord } from '../types';
import { FileText, CheckCircle2, XCircle, ExternalLink, Clock, Loader2 } from 'lucide-react';
import { formatDate } from '../lib/utils';

export default function History() {
  const [records, setRecords] = useState<AutomationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await fetch('/api/records');
        const data = await res.json();
        setRecords(data);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Riwayat Dokumen</h1>
        <p className="text-gray-500">Daftar dokumen yang telah diotomatisasi oleh Anda.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Template</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Waktu</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-gray-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map(record => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">{record.templateName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {record.status === 'success' ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Berhasil
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600 text-sm font-medium">
                      <XCircle className="w-4 h-4" />
                      Gagal
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1 text-gray-500 text-sm">
                    <Clock className="w-4 h-4" />
                    {formatDate(record.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {record.pdfLink ? (
                    <a
                      href={record.pdfLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
                    >
                      Buka PDF
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="text-gray-300 text-sm">—</span>
                  )}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-gray-500">
                  Belum ada riwayat dokumen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
