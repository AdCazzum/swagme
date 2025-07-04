
import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import WalletConnect from '@/components/WalletConnect';
import Dashboard from '@/components/Dashboard';
import CreateForm from '@/components/CreateForm';
import ViewSubmissions from '@/components/ViewSubmissions';

type ViewType = 'dashboard' | 'create-form' | 'view-submissions';

const Index = () => {
  const { isConnected, account } = useWallet();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedFormId, setSelectedFormId] = useState<number>(0);

  const handleCreateForm = () => {
    setCurrentView('create-form');
  };

  const handleViewForm = (formId: number) => {
    // For now, just log - could implement form preview
    console.log('View form:', formId);
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
      </main>

      {/* Footer */}
      <footer className="bg-white/50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>Built on World Chain • Powered by Web3</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
