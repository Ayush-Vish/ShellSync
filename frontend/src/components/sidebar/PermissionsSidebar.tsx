'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, X, Eye, Edit } from 'lucide-react';

export interface Client {
  clientId: string;
  name?: string;
  permission: 'host' | 'read-write' | 'read-only';
}

interface PermissionsSidebarProps {
  isHost: boolean;
  currentClientId: string;
  clients: Client[];
  sendMessage: (type: string, content?: string, terminalId?: string) => void;
}

export default function PermissionsSidebar({ isHost, currentClientId, clients, sendMessage }: PermissionsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && isHost) {
      // Request client list when sidebar opens
      sendMessage('get_clients');
    }
  }, [isOpen, isHost, sendMessage]);

  const handlePermissionChange = (targetClientId: string, newPermission: 'read-write' | 'read-only') => {
    sendMessage('update_permission', JSON.stringify({
      targetClientId,
      permission: newPermission,
    }));
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'host':
        return <Shield className="w-4 h-4 text-yellow-400" />;
      case 'read-write':
        return <Edit className="w-4 h-4 text-green-400" />;
      case 'read-only':
        return <Eye className="w-4 h-4 text-blue-400" />;
      default:
        return null;
    }
  };

  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'host':
        return 'Host';
      case 'read-write':
        return 'Read & Write';
      case 'read-only':
        return 'Read Only';
      default:
        return permission;
    }
  };

  if (!isHost) {
    return null; // Only show sidebar for host
  }
  
  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
        title="Manage Permissions"
      >
        <Users className="w-5 h-5" />
        {clients.length > 0 && (
          <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {clients.length}
          </span>
        )}
      </button>

      {/* Sidebar */}
      {isOpen && (
        <div className="fixed top-0 right-0 h-screen w-80 bg-gray-900 border-l border-gray-700 shadow-2xl z-40 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Clients</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Client List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {clients.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No clients connected</p>
              </div>
            ) : (
              clients.map((client) => (
                <div
                  key={client.clientId}
                  className={`bg-gray-800 rounded-lg p-3 border ${
                    client.clientId === currentClientId
                      ? 'border-blue-500'
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {client.name || 'Anonymous'}
                        </span>
                        {client.clientId === currentClientId && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        {client.clientId.substring(0, 12)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {getPermissionIcon(client.permission)}
                    </div>
                  </div>

                  {/* Permission Controls */}
                  {client.permission !== 'host' && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-400 mb-2">Permission:</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePermissionChange(client.clientId, 'read-write')}
                          className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                            client.permission === 'read-write'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <Edit className="w-3 h-3 inline mr-1" />
                          Read & Write
                        </button>
                        <button
                          onClick={() => handlePermissionChange(client.clientId, 'read-only')}
                          className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
                            client.permission === 'read-only'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          <Eye className="w-3 h-3 inline mr-1" />
                          Read Only
                        </button>
                      </div>
                    </div>
                  )}

                  {client.permission === 'host' && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400">
                      <Shield className="w-3 h-3" />
                      <span>Session Host</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Info */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <p className="text-xs text-gray-400 text-center">
              As the host, you can manage permissions for all clients
            </p>
          </div>
        </div>
      )}
    </>
  );
}
