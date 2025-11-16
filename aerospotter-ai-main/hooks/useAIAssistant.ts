import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { AnalysisResult, ChatMessage, DomainMode, ImageFile, DetectedChange, AppMode, ForesightResult, AIPersona, SimulationData, RivalGhostData, SimulationVizData } from '../types';
import { generateSpeechFromText, getGroundedResponse, generateRivalGhost, runRaceSimulation, editImageWithPrompt, getCostBenefitAnalysis, generateSuggestedQuestions, generateDebateAndAnswer, getSetupSheet, getAudioAnalysis } from '../services/geminiService';

const API_KEY = process.env.API_KEY;

const getSystemInstruction = (domain: DomainMode) => {
    let context = "F1 car development";
    if (domain === 'Manufacturing') context = "high-precision manufacturing";
    if (domain === 'Infrastructure') context = "structural engineering";

    return `You are an AI Race Engineering Crew for the ${context} domain. Your team consists of three personas:
- Aero Sameel: The user's primary contact and Lead Strategist. Provides summaries, delegates tasks, and gives high-level strategic direction. Call-sign "Aero Sameel:".
- Aero Shourya: The aerodynamics/visual specialist. He is a passionate, world-class engineer, not a digital artist. He interprets user requests through the lens of performance engineering. If a user request is vague, purely cosmetic, or aerodynamically questionable, he WILL use his expertise to refine the concept into a logical, high-performance design. His debrief MUST explain his engineering reasoning, including expected aerodynamic effects like changes to airflow, pressure zones, streamlines, and vortex generation. He handles all visual design, interpretation of physical changes, and generating visual prototypes. His non-negotiable duties include executing the /prototype command. Call-sign "Aero Shourya:".
- Aero Varun: The data and intelligence analyst. Deals with telemetry, performance metrics, financials (cost-benefit analysis), and grounded intelligence searches. Call-sign "Aero Varun:".

**CRITICAL DIRECTIVES (NON-NEGOTIABLE):**
1.  **ULTRA-STRICT PERSONA INTEGRITY:** Your primary directive is to maintain persona integrity.
    - The user message dictates who responds. If it contains an @mention (e.g., "@Shourya"), ONLY that specialist responds. No one else.
    - If no specialist is mentioned, or if the user addresses the group (e.g., "Hey team"), the Lead Strategist, Aero Sameel, MUST respond by default.
    - Specialists (Shourya, Varun) are ABSOLUTELY PROHIBITED from responding unless they are directly addressed by the user OR explicitly tasked by Aero Sameel. There are no exceptions. This is the most important rule.
2.  **LOGICAL REASONING FIRST:** Before providing a detailed answer, briefly state your reasoning or the logical steps you are taking. This is especially important for Shourya's design choices and Varun's data analysis. This demonstrates a clear thought process to the user.
3.  **COMMAND EXECUTION:** Commands starting with "/" are direct orders. They must be executed by the appropriate specialist without question. For example, /prototype is a command for Shourya. If Sameel receives it, he must delegate it to Shourya.
4.  **DELEGATION PROTOCOL:** Sameel MUST explicitly delegate tasks to specialists in his responses (e.g., "Good question. I'm tasking @Shourya with running a visual prototype...").
5.  **CONTINUITY:** Maintain a consistent, continuous conversation. Reference previous messages and analysis results where appropriate.
6.  **FORMATTING:** Use Markdown for clarity, especially for lists and bolding key terms.
7.  **AVOID REFUSALS:** Under no circumstances should a specialist refuse a task that falls within their documented duties. For example, Shourya cannot refuse to execute a /prototype request.`;
};

const parseGeminiError = (error: unknown): string => {
    if (error instanceof Error) {
        // Handle specific, non-JSON error messages first
        if (error.message.toLowerCase().includes('failed to fetch')) {
            return "Network connection failed. Please check your internet connection and try again.";
        }
        if (error.message.startsWith("API_KEY_ERROR:")) {
            return error.message.replace("API_KEY_ERROR:", "").trim();
        }
        if (error.message.includes("[GoogleGenerativeAI Error]")) {
            // Extract the user-friendly part of SDK-native errors
            const friendlyMessage = error.message.split(' with underlying error: ')[0];
            return friendlyMessage.replace('[GoogleGenerativeAI Error]: ', '');
        }

        // Attempt to parse JSON from the error message
        try {
            // Sometimes the message is just the JSON, sometimes it's prefixed.
            const jsonString = error.message.substring(error.message.indexOf('{'));
            const jsonError = JSON.parse(jsonString);
            const details = jsonError.error || jsonError;

            // Handle specific status codes/types
            if (details.status === 'UNAVAILABLE' || details.code === 503) {
                return "The model is currently overloaded. The request was retried automatically but failed. Please try again in a few moments.";
            }
             if (details.status === 'INVALID_ARGUMENT' || details.code === 400) {
                return `Invalid request: ${details.message}. Please check your inputs.`;
            }
            if (details.status === 'PERMISSION_DENIED' || details.code === 403) {
                 return `Permission Denied. Please check if your API key is valid and has the correct permissions.`;
            }

            // Generic message from the parsed JSON
            if (details.message) {
                return details.message;
            }
            
            return "An unknown API error occurred.";
        } catch (e) {
            // If parsing fails, it's a plain text error message
            return error.message;
        }
    }
    // Fallback for non-Error objects
    return "An unexpected error occurred. Please check the console for details.";
};


export const useAIAssistant = (
    analysisResult: AnalysisResult | null,
    domain: DomainMode,
    images: ImageFile[],
    appMode: AppMode,
    foresightResult: ForesightResult | null,
    onPlayAudio: (messageId: string, base64Audio: string) => void,
    onGenerateRivalGhost: (ghost: RivalGhostData | null) => void,
    onSimulationUpdate: (data: SimulationData | null) => void,
    onShowSimulationViz: (data: SimulationVizData | null) => void,
    onImageEdited: (newImage: { url: string; prompt: string }) => void,
    onUpdateSuggestedQuestions: (questions: string[]) => void,
) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [thinkingMessage, setThinkingMessage] = useState('Analyzing...');
    const [error, setError] = useState<string | null>(null);
    const chatRef = useRef<Chat | null>(null);

    useEffect(() => {
        if (analysisResult) {
            const sameelSummaryMessage: ChatMessage = {
                id: `msg-${Date.now()}-summary`,
                role: 'assistant',
                persona: 'Aero Sameel',
                text: analysisResult.summary,
                audioStatus: 'generating',
            };
            
            const initialBriefingMessage: ChatMessage = {
                 id: `msg-${Date.now()}-briefing`,
                 role: 'system',
                 type: 'briefing',
                 changes: analysisResult.changes
            };
            
            setMessages([initialBriefingMessage, sameelSummaryMessage]);
            
            if (analysisResult.changes.length > 0 && analysisResult.changes[0].suggestedQuestions) {
                onUpdateSuggestedQuestions(analysisResult.changes[0].suggestedQuestions);
            }

            // Generate audio for Sameel's summary
            generateSpeechFromText(analysisResult.summary, 'Aero Sameel')
                .then(audioBase64 => {
                    setMessages(prev => prev.map(m => m.id === sameelSummaryMessage.id ? { ...m, audioStatus: 'done', audioBase64 } : m));
                })
                .catch(err => {
                    console.error("Audio generation failed:", err);
                    setMessages(prev => prev.map(m => m.id === sameelSummaryMessage.id ? { ...m, audioStatus: 'error' } : m));
                });
        } else {
            setMessages([]); // Reset chat if analysis is reset
        }
    }, [analysisResult]);

    const initializeChat = useCallback(() => {
        if (!API_KEY) {
            setError("API_KEY environment variable not set.");
            return;
        }
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction: getSystemInstruction(domain) },
        });
    }, [domain]);

    useEffect(() => {
        initializeChat();
    }, [initializeChat]);
    
    const parseAndExecuteCommand = async (command: string, fullMessage: string) => {
        const parts = command.split(' ');
        const baseCommand = parts[0].toLowerCase();
        const args = parts.slice(1).join(' ');

        try {
            switch (baseCommand) {
                case '/prototype':
                    if (images.length > 0) {
                        setThinkingMessage('Engaging Aero Shourya for visual prototyping...');
                        const baseImage = images[images.length - 1];
                        const editedImageBase64 = await editImageWithPrompt(baseImage.file, args);
                        const newImage = { url: `data:image/png;base64,${editedImageBase64}`, prompt: args };
                        onImageEdited(newImage);

                         const responseMessage: ChatMessage = {
                            id: `msg-${Date.now()}`, role: 'assistant', persona: 'Aero Shourya',
                            text: `Aero Shourya: Understood. I've actioned the prototype request based on your directive: "${args}". Reviewing the new design now.`,
                            generatedImage: newImage,
                         };
                         setMessages(prev => [...prev, responseMessage]);

                    } else {
                        throw new Error("No base image available for prototyping.");
                    }
                    break;

                case '/rival':
                    if (images.length > 0 && args) {
                        setThinkingMessage(`Generating rival ghost for ${args}...`);
                        const ghostData = await generateRivalGhost(args, images[0].file);
                        onGenerateRivalGhost({ 
                            url: `data:image/png;base64,${ghostData.ghostImageBase64}`, 
                            rationale: ghostData.rationale,
                            teamName: ghostData.teamName
                        });
                         const responseMessage: ChatMessage = {
                            id: `msg-${Date.now()}`, role: 'assistant', persona: 'Aero Shourya',
                            text: `Aero Shourya: Ghost overlay generated for ${ghostData.teamName}, based on their design philosophy: "${ghostData.rationale}". The overlay is now active on the main display for comparison.`,
                         };
                         setMessages(prev => [...prev, responseMessage]);

                    } else {
                        throw new Error("Missing team name or base image for rival ghost generation.");
                    }
                    break;
                
                case '/simulate':
                    if (appMode === AppMode.DELTA_ANALYSIS && args) {
                        setThinkingMessage('Running race simulation...');
                        onSimulationUpdate({ realityTrace: [], prophecyTrace: [], finalResult: null });
                        const simResult = await runRaceSimulation(args);
                        onSimulationUpdate({
                            realityTrace: simResult.laps[0].telemetry,
                            prophecyTrace: simResult.laps[1].telemetry,
                            finalResult: simResult
                        });
                        const responseMessage: ChatMessage = {
                            id: `msg-${Date.now()}`, role: 'assistant', persona: 'Aero Varun',
                            text: `Aero Varun: Simulation complete. ${simResult.commentary}`
                        };
                        setMessages(prev => [...prev, responseMessage]);
                        
                        // Proactive "in-race" event
                        setTimeout(() => {
                            const alertMessage: ChatMessage = {
                                id: `msg-${Date.now()}-alert`,
                                role: 'assistant',
                                persona: 'Aero Varun',
                                isAutonomous: true,
                                text: `Aero Varun: **ALERT!** A safety car has been deployed in the simulation. The pit delta is now 12 seconds faster than normal. Our main rival (P2) is on 15-lap-old soft tires. This is a free pit stop. I recommend we box now for hard tires and go to the end.`
                            };
                            setMessages(prev => [...prev, alertMessage]);
                            
                            setTimeout(() => {
                                 const commandMessage: ChatMessage = {
                                    id: `msg-${Date.now()}-command`,
                                    role: 'assistant',
                                    persona: 'Aero Sameel',
                                    isAutonomous: true,
                                    text: `Aero Sameel: Confirming Varun's call. This is the optimal strategy. **BOX, BOX, BOX.**`
                                };
                                 setMessages(prev => [...prev, commandMessage]);
                            }, 1500); // Sameel responds shortly after

                        }, 5000); // 5 seconds after simulation finishes

                    } else {
                        throw new Error("Simulation requires a completed Delta Analysis and a track name.");
                    }
                    break;

                case '/flowviz':
                     if (images.length > 0) {
                        setThinkingMessage('Generating FlowViz...');
                        const baseImage = images[images.length - 1];
                        const vizData: SimulationVizData = { imageUrl: baseImage.previewUrl, description: args || "Running baseline aerodynamic flow simulation on the current design." };
                        onShowSimulationViz(vizData);
                        const responseMessage: ChatMessage = {
                             id: `msg-${Date.now()}`, role: 'assistant', persona: 'Aero Shourya',
                             text: `Aero Shourya: Activating FlowViz simulation for prompt: "${args}". The visualization is now live on the main display.`
                         };
                         setMessages(prev => [...prev, responseMessage]);
                     } else {
                         throw new Error("No image available for FlowViz.");
                     }
                    break;
                
                case '/cost_benefit':
                     const changeIdCost = args;
                     const change = analysisResult?.changes.find(c => c.id === changeIdCost);
                     if (change) {
                         setThinkingMessage('Running cost-benefit analysis...');
                         const analysisText = await getCostBenefitAnalysis(change);
                         const responseMessage: ChatMessage = {
                            id: `msg-${Date.now()}`, role: 'assistant', persona: 'Aero Varun',
                            text: `Aero Varun:\n\n${analysisText}`
                         };
                         setMessages(prev => [...prev, responseMessage]);
                     } else {
                         throw new Error(`Change ID "${changeIdCost}" not found for analysis.`);
                     }
                    break;
                 
                case '/setup':
                    setThinkingMessage('Accessing setup database...');
                    const [track, ...conditionsParts] = args.split(' ');
                    const conditions = conditionsParts.join(' ');
                    if (!track) throw new Error("A track name is required for the /setup command.");
                    const setupSheetText = await getSetupSheet(track, conditions);
                    const setupResponseMessage: ChatMessage = {
                        id: `msg-${Date.now()}`, role: 'assistant', persona: 'Aero Varun',
                        text: `Aero Varun: ${setupSheetText}`,
                    };
                    setMessages(prev => [...prev, setupResponseMessage]);
                    break;

                case '/analyze_audio':
                    setThinkingMessage('Analyzing audio intelligence...');
                    if (!args) throw new Error("A description of the audio is required.");
                    const audioAnalysisText = await getAudioAnalysis(args);
                    const audioResponseMessage: ChatMessage = {
                        id: `msg-${Date.now()}`, role: 'assistant', persona: 'Aero Varun',
                        text: `Aero Varun: Here's the intelligence report on the rival audio:\n\n${audioAnalysisText}`,
                    };
                    setMessages(prev => [...prev, audioResponseMessage]);
                    break;

                default:
                    // If it's not a recognized command, treat as a normal message
                    return false;
            }
            return true; // Command was executed
        } catch (e) {
            const parsedError = parseGeminiError(e);
            setError(parsedError);
            const errorMessage: ChatMessage = {
                id: `msg-${Date.now()}-error`, role: 'assistant', persona: 'Aero Sameel',
                text: `Aero Sameel: Command execution failed. Reason: ${parsedError}`
            };
            setMessages(prev => [...prev, errorMessage]);
            return true;
        }
    };


    const sendMessage = async (message: string) => {
        const userMessage: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', text: message };
        
        setMessages(prev => [...prev, userMessage]);
        setIsThinking(true);
        setError(null);
        onUpdateSuggestedQuestions([]);

        // This try-finally block ensures isThinking is always reset
        try {
            if (message.startsWith('/') || message.toLowerCase().includes('@varun intel')) {
                setThinkingMessage('Executing direct command...');
                const executed = await parseAndExecuteCommand(message, message);
                if(executed) {
                     setMessages(latestMessages => {
                        generateSuggestedQuestions(latestMessages).then(onUpdateSuggestedQuestions);
                        return latestMessages;
                    });
                    return; // Early return as command was handled
                }
            }
            
            if (message.toLowerCase().includes('@varun intel')) {
                setThinkingMessage('Engaging Aero Varun for intelligence gathering...');
                const query = message.replace(/@varun intel/i, '').trim();
                const groundedResponse = await getGroundedResponse(`As an F1 intelligence analyst, find information on: ${query}`);
                const responseMessage: ChatMessage = {
                    id: `msg-${Date.now()}`,
                    role: 'assistant',
                    persona: 'Aero Varun',
                    text: `Aero Varun: Here is the intelligence report on "${query}":\n\n${groundedResponse.text}`,
                    sources: groundedResponse.sources,
                };
                setMessages(prev => [...prev, responseMessage]);
                return; // Early return
            }

            // --- Main Debate Logic ---
            setThinkingMessage('Crew is assembling for a debate...');

            const warRoomSessionId = `war-room-session-${Date.now()}`;
            const warRoomPlaceholder: ChatMessage = {
              id: warRoomSessionId,
              role: 'system',
              warRoom: {
                messages: [],
                isFinished: false,
              }
            };
            setMessages(prev => [...prev, warRoomPlaceholder]);

            const { debate, finalAnswer } = await generateDebateAndAnswer(message, messages);

            // Animate the debate
            for (const msg of debate) {
                const typingMessageId = `typing-${msg.id}`;
                setMessages(prev => prev.map(m => 
                    m.id === warRoomSessionId 
                    ? { ...m, warRoom: { ...m.warRoom!, messages: [...m.warRoom!.messages, {
                        id: typingMessageId, role: 'assistant', persona: msg.persona, isTyping: true, isWarRoomMessage: true
                    }] } } 
                    : m
                ));

                await new Promise(res => setTimeout(res, 1500 + Math.random() * 1000));

                setMessages(prev => prev.map(m => 
                    m.id === warRoomSessionId 
                    ? { ...m, warRoom: { ...m.warRoom!, messages: [
                        ...m.warRoom!.messages.filter(wm => wm.id !== typingMessageId),
                        msg
                    ] } }
                    : m
                ));
                await new Promise(res => setTimeout(res, 500));
            }
            
            // Finalize debate and present answer
            setMessages(prev => prev.map(m => 
                m.id === warRoomSessionId
                ? { ...m, warRoom: { ...m.warRoom!, isFinished: true } }
                : m
            ));

            const assistantMessage: ChatMessage = {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                persona: 'Aero Sameel',
                text: finalAnswer.text,
                audioStatus: 'generating'
            };
            setMessages(prev => [...prev, assistantMessage]);
            
            // Generate follow-up suggestions and audio
            setMessages(latestMessages => {
                generateSuggestedQuestions(latestMessages).then(onUpdateSuggestedQuestions);
                return latestMessages;
            });

            generateSpeechFromText(finalAnswer.text, 'Aero Sameel')
                .then(audioBase64 => {
                     setMessages(prev => prev.map(m => m.id === assistantMessage.id ? {...m, audioStatus: 'done', audioBase64} : m));
                })
                .catch(err => {
                    console.error("Audio generation failed:", err);
                     setMessages(prev => prev.map(m => m.id === assistantMessage.id ? {...m, audioStatus: 'error'} : m));
                });
        } catch (e) {
            const parsedError = parseGeminiError(e);
            console.error("Failed to get assistant response:", e);
            setError(parsedError);
            
            // Add a user-facing error message in the chat
            const errorMessage: ChatMessage = {
                id: `msg-${Date.now()}-error`,
                role: 'assistant',
                persona: 'Aero Sameel',
                text: `Aero Sameel: We've encountered a communication error with the crew. Please try rephrasing your question. (Error: ${parsedError})`
            };
            // Remove any pending placeholders before showing the error
            setMessages(prev => [...prev.filter(m => !m.warRoom), errorMessage]);
        } finally {
            setIsThinking(false);
        }
    };

    return { messages, sendMessage, isThinking, thinkingMessage, error };
};