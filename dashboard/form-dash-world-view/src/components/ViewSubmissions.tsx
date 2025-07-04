
import React, { useState, useEffect } from 'react';
import { useSwagForm, Submission, FormData } from '@/hooks/useSwagForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Download, Users, Clock } from 'lucide-react';

interface ViewSubmissionsProps {
  formId: number;
  onBack: () => void;
}

const ViewSubmissions = ({ formId, onBack }: ViewSubmissionsProps) => {
  const { getFormSubmissions, getAllForms } = useSwagForm();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [formId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [submissionsData, formsData] = await Promise.all([
        getFormSubmissions(formId),
        getAllForms()
      ]);
      
      setSubmissions(submissionsData);
      const currentForm = formsData.find(f => f.id === formId);
      setForm(currentForm || null);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(submission =>
    submission.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    submission.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const exportSubmissions = () => {
    if (!form || submissions.length === 0) return;

    const headers = ['Username', 'Email', 'Wallet Address', 'Submission Date', ...form.questions.map(q => q.questionText)];
    const csvContent = [
      headers.join(','),
      ...submissions.map(sub => [
        sub.username,
        sub.email,
        sub.submitter,
        formatDate(sub.timestamp),
        ...sub.answers
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.title}_submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <Users className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Form not found</h3>
          <p className="text-gray-600 mb-4">The requested form could not be loaded.</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
            <p className="text-gray-600">Form Submissions</p>
          </div>
        </div>

        {submissions.length > 0 && (
          <Button
            onClick={exportSubmissions}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Submissions
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{submissions.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Questions
            </CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{form.questions.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              variant={form.isActive ? "default" : "secondary"}
              className={form.isActive 
                ? "bg-green-100 text-green-800" 
                : "bg-gray-100 text-gray-600"
              }
            >
              {form.isActive ? "Active" : "Inactive"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      {submissions.length > 0 && (
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredSubmissions.length} of {submissions.length} submissions
          </div>
        </div>
      )}

      {/* Submissions */}
      {submissions.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-slate-50">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions yet</h3>
          <p className="text-gray-600">
            When users submit this form, their responses will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission, index) => (
            <Card key={`${submission.submitter}-${submission.timestamp}`} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {submission.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {submission.username}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{submission.email}</p>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    <div>{formatDate(submission.timestamp)}</div>
                    <div className="font-mono text-xs">{formatAddress(submission.submitter)}</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {form.questions.map((question, qIndex) => (
                    <div key={qIndex} className="border-l-4 border-blue-200 pl-4">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        {question.questionText}
                        {question.isRequired && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </div>
                      <div className="text-gray-900">
                        {submission.answers[qIndex] || <span className="text-gray-400 italic">No answer</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewSubmissions;
