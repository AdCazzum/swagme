import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { useSwagForm, FormData } from '@/hooks/useSwagForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Share2, Copy, ExternalLink, Maximize, Minimize, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ViewFormQRProps {
  formId: number;
  onBack: () => void;
}

const ViewFormQR = ({ formId, onBack }: ViewFormQRProps) => {
  const { contract } = useSwagForm();
  const { toast } = useToast();
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [kioskMode, setKioskMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Generate the form URL for sharing
  const formUrl = `${window.location.origin}/form/${formId}`;
  
  useEffect(() => {
    if (contract) {
      loadFormData();
    }
  }, [contract, formId]);

  // Check for kiosk mode parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('kiosk') === 'true') {
      setKioskMode(true);
      enterFullscreen();
    }
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const loadFormData = async () => {
    if (!contract) return;
    
    setLoading(true);
    try {
      console.log('Loading form data for ID:', formId);
      
      // Get form details
      const formDetails = await contract.getForm(formId);
      const questions = await contract.getFormQuestions(formId);
      
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
      console.log('Form loaded:', formData);
    } catch (error) {
      console.error('Error loading form:', error);
      toast({
        title: "Error",
        description: "Failed to load form data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.log('Fullscreen not supported:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      await document.exitFullscreen();
    } catch (error) {
      console.log('Exit fullscreen error:', error);
    }
  };

  const toggleKioskMode = () => {
    const newKioskMode = !kioskMode;
    setKioskMode(newKioskMode);
    
    if (newKioskMode) {
      enterFullscreen();
      // Update URL to include kiosk parameter
      const url = new URL(window.location.href);
      url.searchParams.set('kiosk', 'true');
      window.history.pushState(null, '', url.toString());
    } else {
      exitFullscreen();
      // Remove kiosk parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('kiosk');
      window.history.pushState(null, '', url.toString());
    }
  };

  const copyKioskUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('kiosk', 'true');
    copyToClipboard(url.toString());
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "URL copied to clipboard",
      });
    } catch (err) {
      console.error('Failed to copy: ', err);
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive",
      });
    }
  };

  const openFormInNewTab = () => {
    window.open(formUrl, '_blank');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Kiosk Mode Render
  if (kioskMode && form) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 flex flex-col items-center justify-center p-8 relative">
        {/* Exit Controls - Hidden by default, show on hover */}
        <div className="absolute top-4 left-4 opacity-0 hover:opacity-100 transition-opacity duration-300 z-10">
          <Button
            variant="outline"
            onClick={toggleKioskMode}
            className="bg-white/90 backdrop-blur-sm"
          >
            <Minimize className="w-4 h-4 mr-2" />
            Exit Kiosk
          </Button>
        </div>

        {/* Main Content */}
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight">
              {form.title}
            </h1>
            {form.description && (
              <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {form.description}
              </p>
            )}
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border-4 border-blue-200">
              <QRCode
                size={window.innerWidth < 768 ? 280 : 400}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={formId.toString()}
                viewBox={`0 0 400 400`}
                title={`QR Code for ${form.title}`}
              />
            </div>
            
            {/* Instructions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border-2 border-blue-200">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                📱 Scan to Join
              </h2>
              <div className="text-lg md:text-xl text-gray-700 space-y-2">
                <p>1. Open your phone camera</p>
                <p>2. Point at the QR code above</p>
                <p>3. Tap the notification to open</p>
                <p className="text-blue-700 font-semibold">4. Fill out the form!</p>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 text-gray-600">
            <div className="flex items-center space-x-2">
              <Badge className="bg-green-100 text-green-800 border-green-200 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                Live on World Chain
              </Badge>
            </div>
            <div className="text-sm">
              {form.totalSubmissions} responses collected
            </div>
            <div className="text-sm">
              Form ID: {form.id}
            </div>
          </div>
        </div>

        {/* Watermark */}
        <div className="absolute bottom-4 right-4 text-gray-400 text-sm opacity-50">
          Powered by SwagForm
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Loading Form...</h1>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-red-600">Form Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">The requested form could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{form.title}</h1>
          <p className="text-gray-600">Form ID: {form.id}</p>
        </div>
        <Badge variant={form.isActive ? "default" : "secondary"}>
          {form.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Details */}
        <Card>
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700">
                {form.description || "No description provided"}
              </p>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-semibold mb-2">Questions ({form.questions.length})</h3>
              <div className="space-y-2">
                {form.questions.map((question, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-sm text-gray-500 mt-1">{index + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm">{question.questionText}</p>
                      {question.isRequired && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <p className="font-medium">{formatDate(form.createdAt)}</p>
              </div>
              <div>
                <span className="text-gray-500">Submissions:</span>
                <p className="font-medium">{form.totalSubmissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code and Sharing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share2 className="w-5 h-5" />
              <span>Share Form</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-gray-100 inline-block">
                <QRCode
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={formId.toString()}
                  viewBox={`0 0 200 200`}
                  title={`QR Code for ${form.title}`}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Scan to access the form
              </p>
            </div>

            <Separator />

            {/* Kiosk Mode Button */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-2 border-purple-200">
              <h3 className="font-semibold mb-2 flex items-center space-x-2">
                <Monitor className="w-4 h-4" />
                <span>Stand/Kiosk Display</span>
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Perfect for events and booths - shows QR code in fullscreen. Forms with Twitter proof requirements will guide users through verification.
              </p>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={toggleKioskMode}
                  variant="default"
                >
                  <Maximize className="w-4 h-4 mr-2" />
                  Enter Kiosk Mode
                </Button>
                <Button
                  className="w-full"
                  onClick={copyKioskUrl}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Kiosk URL
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Share URL</h3>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-50 p-2 rounded border text-sm font-mono break-all">
                  {formUrl}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(formUrl)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={openFormInNewTab}
                variant="outline"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Form in New Tab
              </Button>
              
              <Button
                className="w-full"
                onClick={() => copyToClipboard(formUrl)}
                variant="secondary"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Share Link
              </Button>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <p className="font-medium mb-1">ℹ️ How to use:</p>
              <ul className="space-y-1">
                <li>• Share the QR code or URL with others</li>
                <li>• Users can scan/click to access the form</li>
                <li>• They'll need a Web3 wallet to submit responses</li>
                <li>• All submissions are stored on the blockchain</li>
                <li>• Use Kiosk Mode for events and stands</li>
                <li>• Twitter Proof verifies tweet existence via Flare</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewFormQR; 