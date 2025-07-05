import React, { useState, useEffect } from 'react';
import { useSwagForm } from '@/hooks/useSwagForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Users, BarChart, QrCode, Eye } from 'lucide-react';
import { FormData } from '@/hooks/useSwagForm';
import { useWallet } from '@/hooks/useWallet';

interface DashboardProps {
  onCreateForm: () => void;
  onViewForm: (formId: number) => void;
  onViewSubmissions: (formId: number) => void;
}

const Dashboard = ({ onCreateForm, onViewForm, onViewSubmissions }: DashboardProps) => {
  const { getAllForms, getStats, isFormCreator, contract } = useSwagForm();
  const { account } = useWallet();
  const [forms, setForms] = useState<FormData[]>([]);
  const [stats, setStats] = useState({ totalForms: 0, totalSubmissions: 0 });
  const [loading, setLoading] = useState(true);
  const [creatorStatuses, setCreatorStatuses] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    // Only load data when both contract and account are available
    if (contract && account) {
      console.log('Contract and account ready, loading data...');
      loadData();
    } else {
      console.log('Waiting for contract and account...', { 
        contract: !!contract, 
        account: !!account 
      });
    }
  }, [contract, account]); // Trigger when contract or account changes

  const loadData = async () => {
    console.log('Loading dashboard data...');
    
    // Double check that we have what we need
    if (!contract) {
      console.error('Contract not available in loadData');
      return;
    }
    
    if (!account) {
      console.error('Account not available in loadData');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Getting forms and stats...');
      console.log('Account:', account);
      console.log('Contract available:', !!contract);
      
      const [formsData, statsData] = await Promise.all([
        getAllForms(),
        getStats()
      ]);
      
      console.log('Forms data received:', formsData);
      console.log('Forms data length:', formsData.length);
      console.log('Stats data received:', statsData);
      
      setForms(formsData);
      setStats(statsData);

      // Check creator status for each form
      console.log('Checking creator statuses for account:', account);
      const creatorChecks: { [key: number]: boolean } = {};
      for (const form of formsData) {
        const isCreator = await isFormCreator(form.id);
        creatorChecks[form.id] = isCreator;
        console.log(`Form ${form.id} creator check:`, isCreator);
      }
      setCreatorStatuses(creatorChecks);
      
      console.log('=== FINAL DASHBOARD STATE ===');
      console.log('Total forms:', formsData.length);
      console.log('Total stats:', statsData);
      console.log('Creator statuses:', creatorChecks);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show waiting message if contract or account not ready
  if (!contract || !account) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center bg-blue-50 border-blue-200">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            {!account ? 'Connecting Wallet...' : 'Initializing Contract...'}
          </h3>
          <p className="text-blue-700 mb-4">
            {!account 
              ? 'Please connect your wallet to continue' 
              : 'Setting up contract connection...'
            }
          </p>
          <div className="text-sm text-blue-600">
            <p>Contract: {contract ? '✓ Ready' : '⏳ Loading...'}</p>
            <p>Account: {account ? '✓ Connected' : '⏳ Connecting...'}</p>
          </div>
        </Card>
      </div>
    );
  }

  const userCreatedForms = forms.filter(form => form.creator.toLowerCase() === account?.toLowerCase());

  console.log('Rendering dashboard with:', {
    totalForms: forms.length,
    userCreatedForms: userCreatedForms.length,
    account,
    forms
  });

  return (
    <div className="space-y-8">
      {/* Debug Panel - Remove this in production */}
      {/* <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-yellow-800">Debug Info</CardTitle>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => loadData()}
            disabled={!contract || !account}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
          >
            Refresh Data
          </Button>
        </CardHeader>
        <CardContent className="text-sm text-yellow-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Account:</strong> {account || 'Not connected'}
            </div>
            <div>
              <strong>Forms loaded:</strong> {forms.length}
            </div>
            <div>
              <strong>Contract address:</strong> 0xDD0a13b48dd11985Ca8d7562B9564232AB8719B8
            </div>
            <div>
              <strong>Stats:</strong> {stats.totalForms} forms, {stats.totalSubmissions} submissions
            </div>
            <div>
              <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Connected:</strong> {account ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Contract Ready:</strong> {contract ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Ready to Load:</strong> {(contract && account) ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="mt-2 text-xs">
            Check browser console for detailed logs. If forms are 0 but stats show forms, there's a contract call issue.
            <br />
            <strong>Expected behavior:</strong> If you created a form, stats should show totalForms &gt; 0 and forms.length should match.
          </div>
        </CardContent>
      </Card> */}

      {/* Header con pulsante Create Form */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SwagForm Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your Web3 forms and submissions
          </p>
        </div>
        
        <Button 
          onClick={onCreateForm}
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Form
        </Button>
      </div>

      {/* Pulsante Create Form prominente se non ci sono form */}
      {forms.length === 0 && (
        <Card className="p-12 text-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-200">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <Plus className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Your First Form</h3>
          <p className="text-gray-600 mb-4">
            {loading ? 'Loading forms...' : 'Get started by creating your first Web3 form. You can add custom questions and collect submissions on the blockchain.'}
          </p>
          <Button 
            onClick={onCreateForm}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-6 h-6 mr-3" />
            Create Your First Form
          </Button>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Forms
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalForms}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Total Submissions
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.totalSubmissions}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Your Forms
            </CardTitle>
            <BarChart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {userCreatedForms.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Active Forms
            </CardTitle>
            <BarChart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {forms.filter(f => f.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms List */}
      {forms.length > 0 && (
        <div>
          {/* <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">All Forms</h2>
            <Button 
              onClick={onCreateForm}
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Form
            </Button>
          </div> */}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => {
              const isCreator = creatorStatuses[form.id];
              return (
                <Card key={form.id} className="hover:shadow-lg transition-shadow bg-white border-0 shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {form.title}
                      </CardTitle>
                      <div className="flex flex-col gap-1">
                        <Badge 
                          variant={form.isActive ? "default" : "secondary"}
                          className={form.isActive 
                            ? "bg-green-100 text-green-800 hover:bg-green-200" 
                            : "bg-gray-100 text-gray-600"
                          }
                        >
                          {form.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {isCreator && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                            Your Form
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {form.description || "No description"}
                    </p>
                    
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{form.questions.length} questions</span>
                      <span>{form.totalSubmissions} submissions</span>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      Created: {formatDate(form.createdAt)}
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewForm(form.id)}
                        className="flex-1"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Share QR
                      </Button>
                      {isCreator && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewSubmissions(form.id)}
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Submissions ({form.totalSubmissions})
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Footer with Technology Stack */}
      <div className="mt-16 border-t border-gray-200 pt-8">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Built with Cutting-Edge Web3 Infrastructure
            </h3>
            
            <div className="flex flex-wrap justify-center gap-3">
              <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                World Chain
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-4 py-2">
                🔗 Flare Data Connector
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-4 py-2">
                ⚡ LayerZero Protocol
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
              <div className="text-center">
                <div className="font-medium text-green-800 mb-1">World Chain</div>
                <p className="text-gray-600 text-xs">
                  Decentralized form storage and secure on-chain submissions
                </p>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-800 mb-1">Flare Network</div>
                <p className="text-gray-600 text-xs">
                  Twitter verification and social media proof validation
                </p>
              </div>
              <div className="text-center">
                <div className="font-medium text-purple-800 mb-1">LayerZero</div>
                <p className="text-gray-600 text-xs">
                  Cross-chain messaging and multi-chain interoperability
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                SwagForm • Powered by Web3 • Built for the future of data collection
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
