import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import WalletConnect from '@/components/WalletConnect';
import Dashboard from '@/components/Dashboard';
import CreateForm from '@/components/CreateForm';
import ViewSubmissions from '@/components/ViewSubmissions';
import ViewFormQR from '@/components/ViewFormQR';
import PublicFormView from '@/components/PublicFormView';

type ViewType = 'dashboard' | 'create-form' | 'view-submissions' | 'view-form' | 'public-form';

const Index = () => {
  const { isConnected, account } = useWallet();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedFormId, setSelectedFormId] = useState<number>(0);

  // Check URL parameters on component mount
  useEffect(() => {
    const path = window.location.pathname;
    const formMatch = path.match(/^\/form\/(\d+)$/);
    
    if (formMatch) {
      const formId = parseInt(formMatch[1], 10);
      setSelectedFormId(formId);
      setCurrentView('public-form');
    }
  }, []);

  // Update URL when view changes
  useEffect(() => {
    if (currentView === 'public-form') {
      window.history.pushState(null, '', `/form/${selectedFormId}`);
    } else if (currentView === 'dashboard') {
      window.history.pushState(null, '', '/');
    }
  }, [currentView, selectedFormId]);

  const handleCreateForm = () => {
    setCurrentView('create-form');
  };

  const handleViewForm = (formId: number) => {
    setSelectedFormId(formId);
    setCurrentView('view-form');
  };

  const handleViewSubmissions = (formId: number) => {
    setSelectedFormId(formId);
    setCurrentView('view-submissions');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleFormCreated = () => {
    setCurrentView('dashboard');
  };

  // If viewing a public form, show it without auth requirements
  if (currentView === 'public-form') {
    return <PublicFormView formId={selectedFormId} />;
  }

  // For dashboard and admin views, require wallet connection
  if (!isConnected || !account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              SwagForm
            </h1>
            <p className="text-gray-600 text-lg">
              Web3 Form Builder on World Chain
            </p>
          </div>
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SwagForm
              </h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                World Chain
              </span>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <Dashboard
            onCreateForm={handleCreateForm}
            onViewForm={handleViewForm}
            onViewSubmissions={handleViewSubmissions}
          />
        )}
        
        {currentView === 'create-form' && (
          <CreateForm
            onBack={handleBackToDashboard}
            onFormCreated={handleFormCreated}
          />
        )}
        
        {currentView === 'view-submissions' && (
          <ViewSubmissions
            formId={selectedFormId}
            onBack={handleBackToDashboard}
          />
        )}
        
        {currentView === 'view-form' && (
          <ViewFormQR
            formId={selectedFormId}
            onBack={handleBackToDashboard}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative mt-16 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">S</span>
                </div>
                <h3 className="text-xl font-bold text-white">SwagForm</h3>
              </div>
              <p className="text-blue-100 text-sm leading-relaxed">
                The future of form building on Web3. Create, share, and collect responses 
                securely on the blockchain with beautiful, user-friendly forms.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2 text-blue-100 text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live on World Chain</span>
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Features</h4>
              <ul className="space-y-2 text-blue-100 text-sm">
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-blue-300 rounded-full"></span>
                  <span>Blockchain-secured responses</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-blue-300 rounded-full"></span>
                  <span>QR code sharing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-blue-300 rounded-full"></span>
                  <span>Real-time analytics</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-blue-300 rounded-full"></span>
                  <span>Decentralized storage</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 bg-blue-300 rounded-full"></span>
                  <span>Web3 wallet integration</span>
                </li>
              </ul>
            </div>

            {/* Tech Stack Section */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Built With</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-white font-semibold text-sm">World Chain</div>
                  <div className="text-blue-200 text-xs">Blockchain</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-white font-semibold text-sm">React</div>
                  <div className="text-blue-200 text-xs">Frontend</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-white font-semibold text-sm">Solidity</div>
                  <div className="text-blue-200 text-xs">Smart Contracts</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-white font-semibold text-sm">ethers.js</div>
                  <div className="text-blue-200 text-xs">Web3 Library</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-6 text-blue-100 text-sm">
                <span>© 2024 SwagForm</span>
                <span className="hidden md:inline">•</span>
                <span>Decentralized Forms for Everyone</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-xs font-medium">Network Status: Online</span>
                </div>
                
                <div className="text-blue-100 text-xs">
                  <div>Contract: 0xDD0a...B8</div>
                  <div className="text-blue-300">Chain ID: 4801</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
