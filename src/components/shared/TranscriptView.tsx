
import React, { useEffect, useRef } from 'react';
import { TranscriptEntry } from '@/types';

interface TranscriptViewProps {
  entries: TranscriptEntry[];
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ entries }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries come in
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center transcript-container">
        <p className="text-muted-foreground">No transcript entries yet</p>
        <p className="text-muted-foreground text-sm mt-1">
          Transcript will appear here when the host starts speaking
        </p>
      </div>
    );
  }

  return (
    <div className="transcript-container" ref={containerRef}>
      {entries.map((entry, index) => (
        <div 
          key={entry.id} 
          className="transcript-bubble bg-secondary/50 ml-auto" 
        >
          <p>{entry.text}</p>
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {entry.timestamp.toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TranscriptView;
