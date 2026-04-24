/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FileText, Settings, LayoutDashboard, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAccessToken, logout } from './services/googleAuth';
import { cn } from './lib/utils';

import AdminDashboard from './components/AdminDashboard';
import UserForm from './components/UserForm';
import History from './components/History';

import { ensureAuth } from './services/firebase';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ensureAuth()
      .then(() => setIsAuthenticated(true))
      .catch(err => console.error("Auth failed:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-semibold tracking-tight">DocuFlow</span>
              </div>
              
              <div className="flex items-center gap-6">
                <Link to="/" className="text-sm font-medium hover:text-blue-600 transition-colors">Utama</Link>
                <Link to="/history" className="text-sm font-medium hover:text-blue-600 transition-colors flex items-center gap-1">
                  <LayoutDashboard className="w-4 h-4" />
                  Riwayat
                </Link>
                <Link to="/admin" className="text-sm font-medium hover:text-blue-600 transition-colors flex items-center gap-1">
                  <Settings className="w-4 h-4" />
                  Admin
                </Link>
                {isAuthenticated && (
                  <button 
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<UserForm />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}
