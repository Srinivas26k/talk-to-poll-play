
import openRouter from './openRouter';

export const generatePollFromTranscript = async (transcript: string) => {
  if (!openRouter.isInitialized()) {
    console.error('OpenRouter is not initialized. Please configure API key');
    return null;
  }
  
  try {
    const poll = await openRouter.generatePollFromTranscript(transcript);
    return poll;
  } catch (error) {
    console.error('Error generating poll:', error);
    return null;
  }
};
