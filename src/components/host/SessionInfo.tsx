
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Session } from '@/types';
import { Clock, Link, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

interface SessionInfoProps {
  session: Session;
}

const SessionInfo: React.FC<SessionInfoProps> = ({ session }) => {
  const copyAccessCode = () => {
    navigator.clipboard.writeText(session.accessCode);
    toast.success('Access code copied to clipboard');
  };

  const copySessionLink = () => {
    const url = `${window.location.origin}?code=${session.accessCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Session link copied to clipboard');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Session Info</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground">Access Code</h3>
            <div className="flex items-center justify-between mt-1">
              <div className="text-2xl font-mono tracking-wider">
                {session.accessCode}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyAccessCode}
              >
                Copy
              </Button>
            </div>
          </div>
          
          <div>
            <Button 
              variant="outline" 
              className="w-full flex items-center gap-2 justify-center"
              onClick={copySessionLink}
            >
              <Link size={16} />
              Copy Session Link
            </Button>
          </div>

          <div className="pt-2">
            <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-1">
              <Settings size={14} />
              Session Settings
            </h3>
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Poll Generation</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock size={14} />
                  Every {session.settings.pollFrequency} minutes
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Save Transcript</span>
                <span className="font-medium">{session.settings.saveTranscript ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Require Participant Names</span>
                <span className="font-medium">{session.settings.participantNames ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Auto-Publish Results</span>
                <span className="font-medium">{session.settings.autoPublishResults ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionInfo;
