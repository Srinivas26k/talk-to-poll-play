
import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Eye, BarChart, Download } from 'lucide-react';

const ActivePollsList: React.FC = () => {
  const { 
    activeSession,
    activePolls, 
    pollResponses, 
    generatePollResults,
    generatePoll,
    openAiApiKey
  } = useAppContext();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePoll = async () => {
    if (!activeSession) {
      toast({
        title: "No active session",
        description: "Cannot generate poll without an active session",
        variant: "destructive"
      });
      return;
    }

    if (!openAiApiKey) {
      toast({
        title: "API key not configured",
        description: "Please configure your OpenAI API key first",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const success = await generatePoll();
      
      if (success) {
        toast({
          title: "Poll Generated",
          description: "A new poll has been created"
        });
      }
    } catch (error) {
      console.error("Error generating poll:", error);
      toast({
        title: "Error",
        description: "Failed to generate poll",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const publishResults = (pollId: string) => {
    generatePollResults(pollId);
    toast({
      title: "Poll Results Published",
      description: "Results are now visible to participants"
    });
  };

  const downloadResults = (pollId: string) => {
    // Find the poll
    const poll = activePolls.find(p => p.id === pollId);
    if (!poll) return;
    
    // Count responses for this poll
    const responses = pollResponses.filter(r => r.questionId === pollId);
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
    a.download = `poll-results-${pollId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Results Downloaded",
      description: "Poll results have been downloaded"
    });
  };

  if (activePolls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground mb-4">No active polls yet</p>
        <Button 
          onClick={handleGeneratePoll} 
          disabled={isGenerating || !openAiApiKey}
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
          onClick={handleGeneratePoll} 
          disabled={isGenerating || !openAiApiKey}
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
                        onClick={() => publishResults(poll.id)}
                      >
                        <Eye size={14} />
                        Publish
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => downloadResults(poll.id)}
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
