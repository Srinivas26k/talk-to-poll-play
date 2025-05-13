import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { PollQuestion, PollResult } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { Progress } from '@/components/ui/progress';

interface PollWidgetProps {
  poll: PollQuestion;
}

const PollWidget: React.FC<PollWidgetProps> = ({ poll }) => {
  const { currentUser, addPollResponse, pollResults } = useAppContext();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  // Check if results are published for this poll
  const isResultPublished = poll.id in pollResults;
  const result: PollResult | undefined = pollResults[poll.id];
  
  const handleSubmit = () => {
    if (selectedOption === null) {
      toast.error("Please select an option");
      return;
    }
    
    if (!currentUser) {
      toast.error("Not logged in");
      return;
    }
    
    addPollResponse({
      questionId: poll.id,
      participantId: currentUser.id,
      selectedOption,
      timestamp: new Date()
    });
    
    setHasSubmitted(true);
    toast.success("Response submitted");
  };
  
  // If results are published, show them
  if (isResultPublished && result) {
    return (
      <Card className="poll-appear">
        <CardContent className="p-4">
          <div className="space-y-3">
            <h4 className="font-medium">{poll.question}</h4>
            
            {result.responses.map((response, index) => {
              const percentage = result.totalResponses > 0 
                ? Math.round((response.count / result.totalResponses) * 100) 
                : 0;
              
              const isSelected = selectedOption === index;
                
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={isSelected ? "font-medium" : ""}>
                      {result.options[index]}
                      {isSelected && " (your choice)"}
                    </span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${isSelected ? "bg-primary/20" : ""}`}
                  />
                </div>
              );
            })}
            
            <div className="text-sm text-muted-foreground pt-2">
              {result.totalResponses} {result.totalResponses === 1 ? 'response' : 'responses'} total
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Otherwise show the poll form
  return (
    <Card className="poll-appear">
      <CardContent className="p-4">
        <div className="space-y-3">
          <h4 className="font-medium">{poll.question}</h4>
          
          {!hasSubmitted ? (
            <>
              <RadioGroup value={selectedOption?.toString()} onValueChange={(value) => setSelectedOption(parseInt(value))}>
                {poll.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
                    <RadioGroupItem value={index.toString()} id={`option-${poll.id}-${index}`} />
                    <Label htmlFor={`option-${poll.id}-${index}`} className="w-full cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              
              <Button 
                onClick={handleSubmit} 
                className="w-full mt-2"
                disabled={selectedOption === null}
              >
                Submit
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="text-green-600 font-medium">Response submitted</p>
              <p className="text-muted-foreground text-sm mt-1">
                Results will be shown when published
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PollWidget;
