
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { MessageSquare, Users } from 'lucide-react';
import CreateSessionForm from '@/components/host/CreateSessionForm';
import JoinSessionForm from '@/components/participant/JoinSessionForm';
import HostDashboard from '@/components/host/HostDashboard';
import ParticipantView from '@/components/participant/ParticipantView';

const Index = () => {
  const { currentUser, activeSession } = useAppContext();
  const [searchParams] = useSearchParams();
  const [initialCode, setInitialCode] = useState('');
  
  // Check if we have a code parameter for direct session joining
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInitialCode(code);
    }
  }, [searchParams]);

  // Redirect based on user role if they're in an active session
  if (currentUser && activeSession) {
    if (currentUser.role === 'host') {
      return <HostDashboard />;
    } else {
      return <ParticipantView />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-secondary/20 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Interactive Learning</h1>
        <p className="text-xl text-muted-foreground">
          Real-time transcription with dynamic polls and quizzes
        </p>
      </div>
      
      <div className="w-full max-w-2xl">
        <Tabs defaultValue={initialCode ? "join" : "host"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="host" className="flex items-center gap-2">
              <MessageSquare size={16} />
              Host a Session
            </TabsTrigger>
            <TabsTrigger value="join" className="flex items-center gap-2">
              <Users size={16} />
              Join a Session
            </TabsTrigger>
          </TabsList>
          
          <Card className="mt-4 border-t-0 rounded-t-none">
            <TabsContent value="host" className="m-0">
              <CardHeader>
                <CardTitle>Create a New Session</CardTitle>
                <CardDescription>
                  Set up a new interactive session for your audience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateSessionForm />
              </CardContent>
            </TabsContent>
            
            <TabsContent value="join" className="m-0">
              <CardHeader>
                <CardTitle>Join a Session</CardTitle>
                <CardDescription>
                  Enter the access code provided by your session host
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JoinSessionForm initialCode={initialCode} />
              </CardContent>
            </TabsContent>
            
            <CardFooter className="border-t pt-6 pb-4">
              <div className="w-full text-center text-sm text-muted-foreground">
                Features: Live transcription, automatic poll generation, real-time responses
              </div>
            </CardFooter>
          </Card>
        </Tabs>
      </div>
      
      <div className="mt-10 text-center">
        <h3 className="text-lg font-medium mb-3">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="font-medium mb-2">1. Create a Session</div>
            <p className="text-sm text-muted-foreground">
              As a host, create a session and configure settings for polls
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="font-medium mb-2">2. Real-time Transcription</div>
            <p className="text-sm text-muted-foreground">
              Your speech is transcribed and shown to participants in real-time
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="font-medium mb-2">3. Interactive Engagement</div>
            <p className="text-sm text-muted-foreground">
              Automatic polls are generated from your content for real-time feedback
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
