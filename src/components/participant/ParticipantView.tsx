
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import TranscriptView from '../shared/TranscriptView';
import PollWidget from './PollWidget';

const ParticipantView: React.FC = () => {
  const { activeSession, transcriptEntries, activePolls } = useAppContext();

  if (!activeSession) {
    return <div>No active session</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-6">
        {/* Session header */}
        <div>
          <h1 className="text-2xl font-bold">{activeSession.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{activeSession.accessCode}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main transcript area */}
          <div className="md:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare size={18} />
                  Live Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TranscriptView entries={transcriptEntries} />
              </CardContent>
            </Card>
          </div>

          {/* Polls and quizzes */}
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Polls & Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                {activePolls.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <p className="text-muted-foreground">No active polls yet</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Polls will appear here as they are created
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activePolls.map(poll => (
                      <PollWidget key={poll.id} poll={poll} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantView;
