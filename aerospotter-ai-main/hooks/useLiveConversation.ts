import { useState, useRef, useCallback } from 'react';
// FIX: Removed `CloseEvent` and `ErrorEvent` as they are global types in a browser environment.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { LiveStatus, AnalysisResult } from '../types';
import { encode, decode, decodeAudioData, createBlob } from '../utils/audio';

// Per guidelines, must be obtained from environment variable
const API_KEY = process.env.API_KEY;

const parseLiveError = (error: unknown): string => {
    if (error instanceof Error) {
        if (error.message.toLowerCase().includes('permission') || error.name === 'NotAllowedError') {
            return "Camera/microphone permission denied. Please allow access in your browser settings.";
        }
        return `Setup failed: ${error.message}`;
    }
    return "An unknown error occurred during setup.";
};


const getLiveSystemInstruction = (analysisResult: AnalysisResult | null): string => {
    const baseInstruction = `You are Aero Sameel, the Lead Strategist of an F1 team, speaking live to your lead Racer. Your voice should be clear, professional, and authoritative. Your job is to provide a high-level briefing, not a deep technical dive.

**Your Core Directives:**
1.  **Be the Lead, Not the Expert:** You provide the summary and strategic overview. You are not the aerodynamics or data expert.
2.  **Delegate Explicitly:** If the user asks for deep technical details (like airflow specifics, cost breakdowns, or data analysis), you MUST delegate. Guide them to use the text chat to speak with the specialists.
    - For visual/aero questions, say: "That's a question for our aerodynamics lead. Ask @Shourya in the text chat for the full details."
    // FIX: Corrected inconsistent persona name to ensure consistency across the application.
    - For data/cost questions, say: "Our data analyst can run those numbers. Please ask @Varun in the text chat."
3.  **Stay High-Level:** Keep your answers concise and focused on the big picture and strategic implications.
4.  **Use the Provided Context:** Base your initial summary on the data provided below.
`;

    if (!analysisResult) {
        return `${baseInstruction}
**Current Status:** The analysis has not been run yet. Inform the user you are standing by and ready for their command to begin analysis. Do not answer questions until data is available.`;
    }

    const analysisContext = `
**Analysis Context:**
You have the executive summary of the latest analysis. Your first task is to greet the racer and provide this summary.

**Executive Summary:**
${analysisResult.summary}

After delivering the summary, field their questions according to your core directives. Be ready to delegate.
`;

    return `${baseInstruction}\n\n${analysisContext}`;
};



export const useLiveConversation = (analysisResult: AnalysisResult | null) => {
    const [liveStatus, setLiveStatus] = useState<LiveStatus>(LiveStatus.IDLE);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    const sessionRef = useRef<any>(null); // Using 'any' to avoid type issues with the promise-wrapped session
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const outputGainNodeRef = useRef<GainNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const turnTranscriptRef = useRef({ input: '', output: '' });


    const stopConversation = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.then((session: any) => session.close());
            sessionRef.current = null;
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        
        if (sourceNodeRef.current) {
            sourceNodeRef.current.disconnect();
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if(outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }

        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        
        setLiveStatus(LiveStatus.IDLE);
        setTranscript('');
        setError(null);

    }, []);

    const startConversation = useCallback(async () => {
        if (liveStatus !== LiveStatus.IDLE) return;
        
        setError(null);
        setLiveStatus(LiveStatus.CONNECTING);
        setTranscript('');
        turnTranscriptRef.current = { input: '', output: '' };
        
        try {
            const ai = new GoogleGenAI({ apiKey: API_KEY });

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // Setup input audio processing
            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = inputAudioContext;

            // Setup output audio processing
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            outputGainNodeRef.current = outputAudioContextRef.current.createGain();
            outputGainNodeRef.current.connect(outputAudioContextRef.current.destination);
            nextStartTimeRef.current = 0;
            

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setLiveStatus(LiveStatus.LISTENING);
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        sourceNodeRef.current = source;
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            turnTranscriptRef.current.input += message.serverContent.inputTranscription.text;
                            setTranscript(`You: ${turnTranscriptRef.current.input}`);
                        } else if (message.serverContent?.outputTranscription) {
                            turnTranscriptRef.current.output += message.serverContent.outputTranscription.text;
                            setTranscript(`Aero Sameel: ${turnTranscriptRef.current.output}`);
                        }
                        
                        if (message.serverContent?.turnComplete) {
                            turnTranscriptRef.current = { input: '', output: '' };
                            setTranscript(''); // Clear after turn for fresh transcript
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current && outputGainNodeRef.current) {
                            nextStartTimeRef.current = Math.max(
                                nextStartTimeRef.current,
                                outputAudioContextRef.current.currentTime,
                            );
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputGainNodeRef.current);
                            source.addEventListener('ended', () => { sourcesRef.current.delete(source); });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error("Live session error:", e);
                        setError("A connection error occurred during the live session. Please try again.");
                        setLiveStatus(LiveStatus.ERROR);
                        stopConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: getLiveSystemInstruction(analysisResult),
                }
            });
            sessionRef.current = sessionPromise;

        } catch (err) {
            console.error("Failed to start conversation", err);
            setError(parseLiveError(err));
            setLiveStatus(LiveStatus.ERROR);
            stopConversation();
        }
    }, [liveStatus, stopConversation, analysisResult]);

    return { liveStatus, transcript, error, startConversation, stopConversation };
};