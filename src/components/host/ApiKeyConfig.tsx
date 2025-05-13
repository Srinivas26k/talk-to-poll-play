
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { AlertCircle, Key, Lock } from 'lucide-react';
import openRouter from '@/utils/openRouter';

interface ApiKeyConfigProps {
  onConfigured: () => void;
}

const ApiKeyConfig: React.FC<ApiKeyConfigProps> = ({ onConfigured }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  
  // Check if the API key is stored in localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('openrouter_api_key');
    if (storedKey) {
      const success = openRouter.initialize(storedKey);
      if (success) {
        setIsConfigured(true);
        setApiKey(storedKey);
        onConfigured();
      }
    }
  }, [onConfigured]);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    const success = openRouter.initialize(apiKey);
    
    if (success) {
      // Store the API key in localStorage
      localStorage.setItem('openrouter_api_key', apiKey);
      setIsConfigured(true);
      toast.success('API key configured successfully');
      onConfigured();
    } else {
      toast.error('Failed to configure API key');
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('openrouter_api_key');
    setApiKey('');
    setIsConfigured(false);
    toast.info('API key cleared');
  };

  if (isConfigured) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Key size={16} /> OpenRouter API
          </CardTitle>
          <CardDescription>API key is configured</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
            onClick={handleClearApiKey}
          >
            Change API Key
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key size={18} /> OpenRouter API Configuration
        </CardTitle>
        <CardDescription>
          Configure your OpenRouter API key to enable AI-powered polls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="text-sm font-medium block mb-1">API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pl-9"
                  placeholder="Enter your OpenRouter API key"
                />
              </div>
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded-md flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally in your browser and is not sent to our servers. 
              It's used directly from your browser to communicate with OpenRouter.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSaveApiKey}
          disabled={!apiKey.trim()}
        >
          Save API Key
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyConfig;
