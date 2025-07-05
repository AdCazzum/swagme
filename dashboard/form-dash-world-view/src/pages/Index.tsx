import React, { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import WalletConnect from '@/components/WalletConnect';
import Dashboard from '@/components/Dashboard';
import CreateForm from '@/components/CreateForm';
import ViewSubmissions from '@/components/ViewSubmissions';
import ViewFormQR from '@/components/ViewFormQR';
import PublicFormView from '@/components/PublicFormView';
import LandingPage from '@/pages/LandingPage';

type ViewType = 'landing' | 'dashboard' | 'create-form' | 'view-submissions' | 'view-form' | 'public-form';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [selectedFormId, setSelectedFormId] = useState<number>(0);
  
  // Hook useWallet senza callback
  const { isConnected, account } = useWallet();

  // Callback per il redirect quando si disconnette
  const handleDisconnect = () => {
    console.log('User disconnected, redirecting to landing page');
    setCurrentView('landing');
  };

  // Check URL parameters on component mount
  useEffect(() => {
    const path = window.location.pathname;
    
    // Handle different routes
    if (path === '/' || path === '') {
      setCurrentView('landing');
    } else if (path === '/dashboard') {
      setCurrentView('dashboard');
    } else {
      const formMatch = path.match(/^\/form\/(\d+)$/);
      if (formMatch) {
        const formId = parseInt(formMatch[1], 10);
        setSelectedFormId(formId);
        setCurrentView('public-form');
      }
    }
  }, []);

  // Update URL when view changes
  useEffect(() => {
    if (currentView === 'landing') {
      window.history.pushState(null, '', '/');
    } else if (currentView === 'dashboard') {
      window.history.pushState(null, '', '/dashboard');
    } else if (currentView === 'public-form') {
      window.history.pushState(null, '', `/form/${selectedFormId}`);
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

  // Show landing page for root path
  if (currentView === 'landing') {
    return <LandingPage onNavigateToDashboard={() => setCurrentView('dashboard')} />;
  }

  // If viewing a public form, show it without auth requirements
  if (currentView === 'public-form') {
    return <PublicFormView formId={selectedFormId} />;
  }

  // For dashboard and admin views, require wallet connection
  if (!isConnected || !account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        {/* Simplified Header for Connection */}
        <header className="relative bg-white/90 backdrop-blur-md border-b border-gray-200/50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/30 to-blue-50/30"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-center">
              {/* Centered Branding */}
              <div className="flex items-center space-x-3">
                {/* Logo */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">S</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                
                {/* Brand Text */}
                <div className="flex flex-col items-center">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent leading-tight">
                    SwagForm
                  </h1>
                  <p className="text-gray-600 text-lg text-center">
                    Web3 Form Builder on World Chain
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Subtle shadow enhancement */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
        </header>

        {/* Connection Content */}
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-120px)]">
          <div className="w-full max-w-md">
            <WalletConnect onDisconnect={handleDisconnect} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Full Header - Only when connected */}
      <header className="relative bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/30 to-blue-50/30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Branding */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {/* Logo */}
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                
                {/* Brand Text */}
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent leading-tight">
                    SwagForm
                  </h1>
                  <div className="flex items-center space-x-2 -mt-1">
                    <span className="text-xs text-gray-500 font-medium">Web3 Form Builder</span>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <span className="text-xs text-green-600 font-medium">Live</span>
                  </div>
                </div>
              </div>

              {/* Network Badge */}
              <div className="hidden sm:flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-full px-3 py-1.5 shadow-sm">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                    World Chain
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side - Wallet Connection */}
            <div className="flex items-center space-x-4">
              {/* Mobile Network Badge */}
              <div className="sm:hidden bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-full px-2 py-1">
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                    WC
                  </span>
                </div>
              </div>

              {/* Enhanced Wallet Connect */}
              <div className="relative">
                <WalletConnect onDisconnect={handleDisconnect} />
              </div>
            </div>
          </div>

          {/* Optional: Breadcrumb/Navigation hints */}
          {currentView !== 'dashboard' && (
            <div className="mt-3 pt-3 border-t border-gray-200/50">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">Dashboard</span>
                <span className="text-gray-300">→</span>
                <span className="text-gray-700 font-medium">
                  {currentView === 'create-form' && 'Create New Form'}
                  {currentView === 'view-form' && 'Share Form'}
                  {currentView === 'view-submissions' && 'View Submissions'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Subtle shadow enhancement */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
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
