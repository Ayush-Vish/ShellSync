'use client';

import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

interface PasswordPromptProps {
  onSubmit: (password: string, name: string) => void;
  error?: string;
  sessionId: string;
}

export default function PasswordPrompt({ onSubmit, error, sessionId }: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoJoining, setIsAutoJoining] = useState(true);

  // Load credentials from session-specific cookies and auto-join
  useEffect(() => {
    const nameCookieName = `shellsync_name_${sessionId}`;
    const passwordCookieName = `shellsync_password_${sessionId}`;
    
    const cookies = document.cookie.split(';');
    let savedName = '';
    let savedPassword = '';
    
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === nameCookieName) {
        savedName = decodeURIComponent(value);
      } else if (key === passwordCookieName) {
        savedPassword = decodeURIComponent(value);
      }
    }
    
    // If both credentials are found, auto-join
    if (savedName && savedPassword) {
      setName(savedName);
      setPassword(savedPassword);
      setIsAutoJoining(true);
      // Auto-submit after a brief delay to allow state to settle
      setTimeout(() => {
        onSubmit(savedPassword, savedName);
      }, 100);
    } else {
      // Only set the name if found, let user enter password
      if (savedName) {
        setName(savedName);
      }
      setIsAutoJoining(false);
    }
  }, [sessionId, onSubmit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() && name.trim()) {
      setIsSubmitting(true);
      
      const nameCookieName = `shellsync_name_${sessionId}`;
      const passwordCookieName = `shellsync_password_${sessionId}`;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getHours() + 1);
      
      // Save name to cookie
      document.cookie = `${nameCookieName}=${encodeURIComponent(name.trim())}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
      
      // Save password to cookie
      document.cookie = `${passwordCookieName}=${encodeURIComponent(password.trim())}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
      
      onSubmit(password.trim(), name.trim());
    }
  };

  // Show loading state during auto-join
  if (isAutoJoining) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 w-full max-w-md">
          <div className="flex flex-col items-center">
            <div className="bg-blue-500/10 p-4 rounded-full mb-4">
              <Lock className="w-8 h-8 text-blue-400 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Reconnecting...</h1>
            <p className="text-gray-400 text-center text-sm mb-4">
              Joining session automatically
            </p>
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-500/10 p-4 rounded-full mb-4">
            <Lock className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Session Locked</h1>
          <p className="text-gray-400 text-center text-sm">
            Enter the password to join session
          </p>
          <p className="text-gray-500 text-xs mt-1 font-mono">
            {sessionId}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              maxLength={30}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus={!name}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter 6-digit password"
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
              autoFocus={!!name}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={password.length !== 6 || name.trim().length === 0 || isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Join Session
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Don&apos;t have the password? Contact the session host.
          </p>
          <p className="text-xs text-gray-600 text-center mt-2">
            Your credentials will be saved for 30 days for this session.
          </p>
        </div>
      </div>
    </div>
  );
}
