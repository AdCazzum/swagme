import React, { useState, useEffect } from 'react';
import { useSwagForm, FormData } from '@/hooks/useSwagForm';
import { useWallet } from '@/hooks/useWallet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, Wallet, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import WalletConnect from '@/components/WalletConnect';

interface PublicFormViewProps {
  formId: number;
}

const PublicFormView = ({ formId }: PublicFormViewProps) => {
  const { contract, submitForm } = useSwagForm();
  const { account, isConnected } = useWallet();
  const { toast } = useToast();
  
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<{
    username: string;
    email: string;
    answers: string[];
  }>({
    username: '',
    email: '',
    answers: []
  });

  useEffect(() => {
    loadFormData();
  }, [formId]);

  const loadFormData = async () => {
    setLoading(true);
    try {
      // Create a read-only connection to get form data
      const { ethers } = await import('ethers');
      const provider = new ethers.JsonRpcProvider('https://worldchain-sepolia.g.alchemy.com/public');
      const contractAddress = '0xDD0a13b48dd11985Ca8d7562B9564232AB8719B8';
      
      // Import the ABI (simplified version for read-only operations)
      const readOnlyABI = [
        {
          "inputs": [{"internalType": "uint256", "name": "_formId", "type": "uint256"}],
          "name": "getForm",
          "outputs": [
            {"internalType": "string", "name": "title", "type": "string"},
            {"internalType": "string", "name": "description", "type": "string"},
            {"internalType": "uint256", "name": "questionsCount", "type": "uint256"},
            {"internalType": "bool", "name": "isActive", "type": "bool"},
            {"internalType": "uint256", "name": "totalSubmissions", "type": "uint256"},
            {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
            {"internalType": "address", "name": "creator", "type": "address"}
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{"internalType": "uint256", "name": "_formId", "type": "uint256"}],
          "name": "getFormQuestions",
          "outputs": [
            {
              "components": [
                {"internalType": "string", "name": "questionText", "type": "string"},
                {"internalType": "bool", "name": "isRequired", "type": "bool"}
              ],
              "internalType": "struct SwagForm.Question[]",
              "name": "",
              "type": "tuple[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ];
      
      const readOnlyContract = new ethers.Contract(contractAddress, readOnlyABI, provider);
      
      console.log('Loading public form data for ID:', formId);
      
      const formDetails = await readOnlyContract.getForm(formId);
      const questions = await readOnlyContract.getFormQuestions(formId);
      
      const formData: FormData = {
        id: formId,
        title: formDetails.title,
        description: formDetails.description,
        questions: questions,
        isActive: formDetails.isActive,
        totalSubmissions: formDetails.totalSubmissions ? Number(formDetails.totalSubmissions.toString()) : 0,
        createdAt: Number(formDetails.createdAt.toString()),
        creator: formDetails.creator,
      };
      
      setForm(formData);
      
      // Initialize answers array
      setFormData(prev => ({
        ...prev,
        answers: new Array(questions.length).fill('')
      }));
      
      console.log('Public form loaded:', formData);
    } catch (error) {
      console.error('Error loading public form:', error);
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAnswerChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      answers: prev.answers.map((answer, i) => i === index ? value : answer)
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      toast({
        title: "Validation Error",
        description: "Username is required",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email is required",
        variant: "destructive",
      });
      return false;
    }

    if (!form) return false;

    for (let i = 0; i < form.questions.length; i++) {
      const question = form.questions[i];
      const answer = formData.answers[i];
      
      if (question.isRequired && !answer.trim()) {
        toast({
          title: "Validation Error",
          description: `Please answer the required question: "${question.questionText}"`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!form) return;

    setSubmitting(true);
    try {
      await submitForm(
        form.id,
        formData.username,
        formData.email,
        formData.answers
      );
      
      setSubmitted(true);
      toast({
        title: "Success!",
        description: "Your form submission has been recorded on the blockchain",
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit form",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h2>
            <p className="text-gray-600">The requested form could not be found or is no longer available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-orange-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Inactive</h2>
            <p className="text-gray-600">This form is currently inactive and not accepting submissions.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-4">Your response has been successfully submitted to the blockchain.</p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                Your submission is now permanently recorded and cannot be altered.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {form.title}
          </h1>
          <p className="text-gray-600">
            {form.description || "Please fill out this form"}
          </p>
          <div className="flex justify-center items-center space-x-4 mt-4">
            <Badge variant="outline">
              {form.questions.length} questions
            </Badge>
            <Badge variant="outline">
              Created {formatDate(form.createdAt)}
            </Badge>
            <Badge variant="outline">
              {form.totalSubmissions} submissions
            </Badge>
          </div>
        </div>

        {/* Wallet Connection */}
        {!isConnected && (
          <Alert className="mb-6">
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              You need to connect your Web3 wallet to submit this form. Your responses will be stored on the blockchain.
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Form Submission</CardTitle>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="text-center py-8">
                <WalletConnect />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <Separator />

                {/* Form Questions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Questions</h3>
                  {form.questions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <Label htmlFor={`question-${index}`}>
                        {index + 1}. {question.questionText}
                        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Textarea
                        id={`question-${index}`}
                        value={formData.answers[index] || ''}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        placeholder="Enter your answer..."
                        required={question.isRequired}
                        rows={3}
                      />
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Submit Button */}
                <div className="space-y-4">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                    size="lg"
                  >
                    {submitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting to Blockchain...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Send className="w-5 h-5" />
                        <span>Submit to Blockchain</span>
                      </div>
                    )}
                  </Button>
                  
                  <div className="text-xs text-gray-500 text-center">
                    <p>By submitting this form, your response will be permanently recorded on the blockchain.</p>
                    <p>Make sure all information is correct before submitting.</p>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicFormView; 