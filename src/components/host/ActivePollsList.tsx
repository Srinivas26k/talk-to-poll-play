
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { PollQuestion } from '@/types';
import { Eye, BarChart, Download } from 'lucide-react';
import { generatePollFromTranscript } from '@/utils/pollGenerator';

const ActivePollsList: React.FC = () => {
  const { 
    transcriptEntries, 
    activeSession, 
    addPoll, 
    activePolls, 
    pollResponses, 
    generatePollResults
  } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto generate polls based on session settings
  useEffect(() => {
    if (!activeSession) return;
    
    const pollFrequencyMs = activeSession.settings.pollFrequency * 60 * 1000;
    const pollInterval = setInterval(async () => {
      await generatePoll();
    }, pollFrequencyMs);
    
    return () => clearInterval(pollInterval);
  }, [activeSession, transcriptEntries]);

  const generatePoll = async () => {
    if (transcriptEntries.length === 0) {
      toast.error("Not enough transcript content to generate a poll");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Get the last 5 minutes of transcript (or whatever the setting is)
      const recentTranscripts = transcriptEntries
        .filter(entry => {
          const entryTime = entry.timestamp.getTime();
          const cutoffTime = Date.now() - (activeSession?.settings.pollFrequency || 5) * 60 * 1000;
          return entryTime >= cutoffTime;
        })
        .map(entry => entry.text)
        .join(' ');

      if (recentTranscripts.length < 50) {
        toast.error("Not enough recent transcript content to generate a poll");
        setIsGenerating(false);
        return;
      }

      const pollQuestion = await generatePollFromTranscript(recentTranscripts);
      
      if (pollQuestion) {
        addPoll(pollQuestion);
        toast.success("New poll generated");
      } else {
        toast.error("Failed to generate a poll");
      }
    } catch (error) {
      console.error("Error generating poll:", error);
      toast.error("Error generating poll");
    } finally {
      setIsGenerating(false);
    }
  };

  const publishResults = (poll: PollQuestion) => {
    generatePollResults(poll.id);
    toast.success("Poll results published");
  };

  const downloadResults = (poll: PollQuestion) => {
    // Count responses for this poll
    const responses = pollResponses.filter(r => r.questionId === poll.id);
    const optionCounts = poll.options.map((option, index) => {
      const count = responses.filter(r => r.selectedOption === index).length;
      const percentage = responses.length > 0 ? Math.round((count / responses.length) * 100) : 0;
      return { option, count, percentage };
    });
    
    // Format the data
    const content = [
      `Poll Question: ${poll.question}`,
      `Total Responses: ${responses.length}`,
      '',
      'Results:',
      ...optionCounts.map((o, i) => `Option ${i+1}: "${o.option}" - ${o.count} votes (${o.percentage}%)`)
    ].join('\n');
    
    // Generate and download the file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poll-results-${poll.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Results downloaded');
  };

  if (activePolls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground mb-4">No active polls yet</p>
        <Button 
          onClick={generatePoll} 
          disabled={isGenerating || transcriptEntries.length === 0}
        >
          {isGenerating ? 'Generating...' : 'Generate Poll Now'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Active Polls ({activePolls.length})</h3>
        <Button 
          onClick={generatePoll} 
          disabled={isGenerating}
          size="sm"
        >
          {isGenerating ? 'Generating...' : 'Generate New Poll'}
        </Button>
      </div>
      
      <div className="space-y-3">
        {activePolls.map((poll) => {
          const responseCount = pollResponses.filter(r => r.questionId === poll.id).length;
          
          return (
            <Card key={poll.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">{poll.question}</h4>
                  
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    {poll.options.map((option, index) => (
                      <div key={index} className="flex items-center p-2 bg-muted/50 rounded-md">
                        {option}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-2 mt-2">
                    <div className="text-sm text-muted-foreground">
                      {responseCount} {responseCount === 1 ? 'response' : 'responses'}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => publishResults(poll)}
                      >
                        <Eye size={14} />
                        Publish
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => downloadResults(poll)}
                      >
                        <Download size={14} />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ActivePollsList;
