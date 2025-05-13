
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Progress } from '@/components/ui/progress';

const PollResultsView: React.FC = () => {
  const { pollResults } = useAppContext();

  const downloadAllResults = () => {
    // Format all results
    const resultsContent = Object.values(pollResults).map(result => {
      const lines = [
        `Poll Question: ${result.questionId}`,
        `Total Responses: ${result.totalResponses}`,
        '',
        'Results:',
        ...result.options.map((option, i) => {
          const count = result.responses[i]?.count || 0;
          const percentage = result.totalResponses > 0 
            ? Math.round((count / result.totalResponses) * 100) 
            : 0;
          return `Option ${i+1}: "${option}" - ${count} votes (${percentage}%)`;
        }),
        '\n-----------------------\n'
      ];
      return lines.join('\n');
    }).join('\n');
    
    // Generate and download file
    const blob = new Blob([resultsContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-poll-results-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('All results downloaded');
  };

  if (Object.keys(pollResults).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">No published results yet</p>
        <p className="text-muted-foreground text-sm mt-1">
          Publish results from the Active Polls tab
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Published Results</h3>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1"
          onClick={downloadAllResults}
        >
          <Download size={14} />
          Download All
        </Button>
      </div>
      
      <div className="space-y-4">
        {Object.values(pollResults).map((result) => (
          <Card key={result.questionId} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                <h4 className="font-medium">{result.questionId}</h4>
                
                {result.responses.map((response, index) => {
                  const percentage = result.totalResponses > 0 
                    ? Math.round((response.count / result.totalResponses) * 100) 
                    : 0;
                    
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{result.options[index]}</span>
                        <span className="font-medium">{response.count} ({percentage}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
                
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  {result.totalResponses} {result.totalResponses === 1 ? 'response' : 'responses'} total
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PollResultsView;
