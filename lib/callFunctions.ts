'use client';
import { UltravoxSession, UltravoxSessionStatus, Transcript, UltravoxExperimentalMessageEvent, Role } from 'ultravox-client';
import { JoinUrlResponse, CallConfig, CallTranscript } from '@/lib/types';
import { updateOrderTool } from './clientTools';
import { db } from './firebase';
import { collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

let uvSession: UltravoxSession | null = null;
const debugMessages: Set<string> = new Set(["debug"]);

// Store event listener references
let statusListener: ((event: any) => void) | null = null;
let transcriptListener: ((event: any) => void) | null = null;
let experimentalMessageListener: ((event: any) => void) | null = null;

interface CallCallbacks {
  onStatusChange: (status: UltravoxSessionStatus | string | undefined) => void;
  onTranscriptChange: (transcripts: Transcript[] | undefined) => void;
  onDebugMessage?: (message: UltravoxExperimentalMessageEvent) => void;
}

export function toggleMute(role: Role): void {
  if (uvSession) {
    if (role == Role.USER) {
      uvSession.isMicMuted ? uvSession.unmuteMic() : uvSession.muteMic();
    } else {
      uvSession.isSpeakerMuted ? uvSession.unmuteSpeaker() : uvSession.muteSpeaker();
    }
  } else {
    console.error('uvSession is not initialized.');
  }
}

async function createCall(callConfig: CallConfig, showDebugMessages?: boolean): Promise<JoinUrlResponse> {
  try {
    if(showDebugMessages) {
      console.log(`Using model ${callConfig.model}`);
    }

    const response = await fetch(`/api/ultravox`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...callConfig }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data: JoinUrlResponse = await response.json();

    if(showDebugMessages) {
      console.log(`Call created. Join URL: ${data.joinUrl}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error creating call:', error);
    throw error;
  }
}

export async function startCall(callbacks: CallCallbacks, callConfig: CallConfig, showDebugMessages?: boolean): Promise<void> {
  try {
    const callData = await createCall(callConfig, showDebugMessages);
    const joinUrl = callData.joinUrl;

    if (!joinUrl) {
      throw new Error('Join URL is required');
    }

    console.log('Joining call:', joinUrl);

    uvSession = new UltravoxSession({ experimentalMessages: debugMessages });
    uvSession.registerToolImplementation("updateOrder", updateOrderTool);

    if(showDebugMessages) {
      console.log('uvSession created:', uvSession);
    }

    // Create and store event listeners
    statusListener = (event: any) => {
      console.log('Status event:', event);
      callbacks.onStatusChange(uvSession?.status);
    };

    transcriptListener = (event: any) => {
      console.log('Transcript event:', event);
      if (uvSession?.transcripts) {
        const transcripts = [...uvSession.transcripts];
        console.log('Sending transcripts to callback:', transcripts);
        callbacks.onTranscriptChange(transcripts);
      }
    };

    experimentalMessageListener = (msg: any) => {
      callbacks?.onDebugMessage?.(msg);
    };

    // Add event listeners
    uvSession.addEventListener('status', statusListener);
    uvSession.addEventListener('transcript', transcriptListener);
    uvSession.addEventListener('experimental_message', experimentalMessageListener);

    await uvSession.joinCall(joinUrl);
    console.log('Call joined successfully');

  } catch (error) {
    console.error('Error in startCall:', error);
    throw error;
  }
}

async function saveTranscriptToFirebase(userId: string, transcripts: Transcript[], emotionalInsights: any[] = []): Promise<void> {
  try {
    if (!userId) {
      console.error('No userId provided');
      return;
    }

    if (!transcripts || transcripts.length === 0) {
      console.warn('No transcripts to save');
      return;
    }

    console.log('Preparing to save transcript:', { userId, transcriptCount: transcripts.length });

    const startTime = new Date();
    const endTime = new Date();

    const callTranscript = {
      userId,
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(endTime),
      transcripts: transcripts.map(t => ({
        speaker: t.speaker,
        text: t.text,
        timestamp: Timestamp.fromDate(new Date())
      })),
      emotionalInsights: emotionalInsights.map(insight => ({
        category: insight.category || 'neutral',
        keyword: insight.name,
        context: insight.specialInstructions
      })),
      createdAt: serverTimestamp()
    };

    console.log('Attempting to save transcript to Firestore:', callTranscript);

    const transcriptsRef = collection(db, 'transcripts');
    const docRef = await addDoc(transcriptsRef, callTranscript);
      
    console.log('Transcript saved successfully with ID:', docRef.id);
    toast.success('Conversation saved to your history');
  } catch (error) {
    console.error('Error in saveTranscriptToFirebase:', error);
    console.error('Error details:', error);
    toast.error('Failed to save conversation history');
    throw error;
  }
}

export async function endCall(userId?: string, transcripts?: Transcript[], emotionalInsights?: any[]): Promise<void> {
  console.log('Ending call...', { userId, hasTranscripts: transcripts?.length });

  if (!uvSession) {
    console.log('No active session to end');
    return;
  }

  try {
    // First save the transcript if we have a user and transcripts
    if (userId && transcripts && transcripts.length > 0) {
      console.log('Saving transcript to Firebase...');
      await saveTranscriptToFirebase(userId, transcripts, emotionalInsights);
    }

    // Then leave the call
    console.log('Leaving call...');
    await uvSession.leaveCall();
    
    // Remove event listeners if they exist
    if (statusListener) {
      uvSession.removeEventListener('status', statusListener);
      statusListener = null;
    }
    if (transcriptListener) {
      uvSession.removeEventListener('transcript', transcriptListener);
      transcriptListener = null;
    }
    if (experimentalMessageListener) {
      uvSession.removeEventListener('experimental_message', experimentalMessageListener);
      experimentalMessageListener = null;
    }
    
    // Clean up the session
    uvSession = null;

    // Dispatch call ended event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('callEnded'));
    }

    console.log('Call ended successfully');
  } catch (error) {
    console.error('Error ending call:', error);
    // Even if there's an error, make sure we clean up
    if (uvSession) {
      try {
        // Remove event listeners if they exist
        if (statusListener) {
          uvSession.removeEventListener('status', statusListener);
          statusListener = null;
        }
        if (transcriptListener) {
          uvSession.removeEventListener('transcript', transcriptListener);
          transcriptListener = null;
        }
        if (experimentalMessageListener) {
          uvSession.removeEventListener('experimental_message', experimentalMessageListener);
          experimentalMessageListener = null;
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
      uvSession = null;
    }
    throw error;
  }
}
