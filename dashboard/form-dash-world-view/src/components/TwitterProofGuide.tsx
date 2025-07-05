import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Twitter, ExternalLink, CheckCircle, Clock } from 'lucide-react';

interface TwitterProofGuideProps {
  isVerified: boolean;
  onVerifyClick: () => void;
  tweetUrl?: string;
}

const TwitterProofGuide = ({ isVerified, onVerifyClick, tweetUrl }: TwitterProofGuideProps) => {
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <Twitter className="w-5 h-5" />
          <span>Twitter Proof Required</span>
          {isVerified ? (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isVerified ? (
          <>
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-2">📋 How to verify your tweet:</h3>
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">1</span>
                  <span>Create a public tweet with the required content</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">2</span>
                  <span>Copy the tweet URL (e.g., twitter.com/username/status/123456)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">3</span>
                  <span>Paste the URL below and click "Verify Tweet"</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">4</span>
                  <span>Wait for Flare Network to verify the tweet exists</span>
                </li>
              </ol>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Tweet URL
              </label>
              <input
                type="url"
                placeholder="https://twitter.com/username/status/123456789"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue={tweetUrl}
              />
              
              <Button 
                onClick={onVerifyClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                Verify Tweet with Flare
              </Button>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-1">🔒 Privacy & Security</h4>
              <p className="text-xs text-blue-700">
                We only verify that your tweet exists and is publicly accessible. 
                The verification is done through Flare Network's decentralized oracle system.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center space-y-3">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900">Tweet Verified! ✅</h3>
              <p className="text-sm text-green-700 mt-1">
                Your tweet has been successfully verified by Flare Network
              </p>
            </div>

            {tweetUrl && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(tweetUrl, '_blank')}
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Tweet
              </Button>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">⚡ Powered by Flare Network</p>
          <p>
            Decentralized verification ensures your tweet data is authentic and tamper-proof.
            The verification process typically takes 1-2 minutes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TwitterProofGuide; 