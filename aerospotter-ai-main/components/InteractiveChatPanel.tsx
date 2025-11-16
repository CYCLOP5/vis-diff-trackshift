import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessingState, AnalysisResult, DomainMode, ChatMessage, ImageFile, AIPersona, DetectedChange, AppMode, ForesightResult, SimulationData, LiveStatus, SimulationVizData, RivalGhostData } from '../types';
import { useAIAssistant } from '../hooks/useAIAssistant';
import { useLiveConversation } from '../hooks/useLiveConversation';
import { ChatBubbleIcon, SendIcon, UserIcon, SameelAvatar, ShouryaAvatar, VarunAvatar, WarningIcon, LinkIcon, MicrophoneIcon, MicrophoneOffIcon, XCircleIcon, ChevronIcon, InfoIcon, AudioIcon, PauseIcon } from './Icons';
import SetupSheetCard from './SetupSheetCard';
import MarkdownRenderer from './MarkdownRenderer';
import CrewCapabilities from './CrewCapabilities';
import WarRoomPanel from './WarRoomPanel';

interface InteractiveChatPanelProps {
  analysisState: ProcessingState;
  analysisResult: AnalysisResult | null;
  analysisError: string | null;
  domain: DomainMode;
  images: ImageFile[];
  appMode: AppMode;
  foresightResult: ForesightResult | null;
  playingMessageId: string | null;
  isAudioPaused: boolean;
  suggestedQuestions: string[];
  selectedChangeId: string | null;
  onSelectChange: (id: string | null) => void;
  onPlayAudio: (messageId: string, base64Audio: string) => void;
  onPauseResumeAudio: () => void;
    onGenerateRivalGhost: (ghost: RivalGhostData | null) => void;
  onSimulationUpdate: (data: SimulationData | null) => void;
  onShowSimulationViz: (data: SimulationVizData | null) => void;
    onImageEdited: (newImage: { url: string, prompt: string}) => void;
  onUpdateSuggestedQuestions: (questions: string[]) => void;
}

const personaConfig = {
    'Aero Sameel': { icon: SameelAvatar, color: 'text-f1-accent-cyan', name: 'Aero Sameel (Lead)' },
    'Aero Shourya': { icon: ShouryaAvatar, color: 'text-f1-accent-magenta', name: 'Aero Shourya (Aero)' },
    'Aero Varun': { icon: VarunAvatar, color: 'text-yellow-400', name: 'Aero Varun (Data)' },
    'User': { icon: UserIcon, color: 'text-white', name: 'Racer' }
};

const PersonaDisplay: React.FC<{ persona: AIPersona | 'User'; isAutonomous?: boolean }> = memo(({ persona, isAutonomous = false }) => {
    const config = personaConfig[persona];
    const Icon = config.icon;
    return (
        <div className={`flex items-center gap-2`}>
            <Icon className={`w-5 h-5 ${isAutonomous ? 'opacity-70' : ''}`} />
            <span className={`text-xs font-bold ${config.color} ${isAutonomous ? 'opacity-70' : ''}`}>{config.name}{isAutonomous ? ' (Auto)' : ''}</span>
        </div>
    );
});

const AudioControls: React.FC<{
  message: ChatMessage;
  playingMessageId: string | null;
  isAudioPaused: boolean;
  onPlay: (messageId: string, audioBase64: string) => void;
  onPauseResume: () => void;
}> = memo(({ message, playingMessageId, isAudioPaused, onPlay, onPauseResume }) => {
    const status = message.audioStatus;
    const isPlayingThisMessage = message.id === playingMessageId;

    if (status === 'generating') {
        return (
            <div className="p-1" title="Generating audio...">
                <svg className="animate-spin h-4 w-4 text-gray-500 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }
    
    if (status === 'error') {
        return <div className="p-1"><XCircleIcon className="w-4 h-4 text-red-500" title="Audio generation failed" /></div>;
    }

    if (status === 'done' && message.audioBase64) {
        if (isPlayingThisMessage) {
            return (
                <button onClick={onPauseResume} className="p-1 bg-gray-300 dark:bg-gray-700/80 rounded-full text-gray-600 dark:text-f1-text-darker hover:text-gray-900 dark:hover:text-white transition-colors" title={isAudioPaused ? "Resume" : "Pause"}>
                    {isAudioPaused ? <AudioIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                </button>
            );
        } else {
            return (
                <button onClick={() => onPlay(message.id, message.audioBase64!)} className="p-1 bg-gray-300 dark:bg-gray-700/80 rounded-full text-gray-600 dark:text-f1-text-darker hover:text-gray-900 dark:hover:text-white transition-colors" title="Play Debrief">
                    <AudioIcon className="w-4 h-4" />
                </button>
            );
        }
    }
    return null;
});


const ChangeBriefingCard: React.FC<{ change: DetectedChange; isSelected: boolean; onSelectChange: (id: string | null) => void; onAskQuestion: (q: string) => void }> = memo(({ change, isSelected, onSelectChange, onAskQuestion }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    // Sync isOpen with external selection state
    useEffect(() => {
        setIsOpen(isSelected);
    }, [isSelected]);

    const handleAskQuestion = (q: string) => {
        onAskQuestion(q);
    };

    const handleHeaderClick = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        // If we are opening it, select it. If we are closing it, deselect it.
        onSelectChange(nextState ? change.id : null);
    };

    return (
        <motion.div layout className={`bg-gray-200/50 dark:bg-gray-900/50 rounded-lg mb-2 border overflow-hidden transition-all ${isSelected ? 'ring-2 ring-f1-accent-cyan border-transparent' : 'border-gray-300 dark:border-gray-700'}`}>
            <button onClick={handleHeaderClick} className="w-full text-left p-2 hover:bg-gray-300/50 dark:hover:bg-gray-800/50 transition-colors flex justify-between items-center">
                <div className="pr-2">
                    <p className="font-semibold text-f1-text-light dark:text-white text-xs flex items-center gap-2">
                        <span className="font-mono bg-gray-300 dark:bg-gray-700/80 px-1.5 py-0.5 rounded text-f1-text-darker-light dark:text-f1-text-darker">{getChangeSourceLabel(change.id)}</span>
                        <span>{change.description}</span>
                    </p>
                    <p className="text-xs text-f1-text-darker-light dark:text-f1-text-darker mt-1">Impact: {change.impact} | Crit: {change.criticality}/10</p>
                </div>
                {change.redFlags && change.redFlags.length > 0 && <WarningIcon className="text-yellow-400 flex-shrink-0 mx-2" title={`${change.redFlags.length} Red Flag(s)`} />}
            </button>
            <AnimatePresence>
            {isOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-3 pb-3 pt-1 text-xs border-t border-gray-300 dark:border-gray-700">
                    {change.specialistInsights?.aero && <p className="mt-2"><strong className="text-f1-accent-magenta">Aero:</strong> {change.specialistInsights.aero}</p>}
                    {change.specialistInsights?.data && <p className="mt-1"><strong className="text-yellow-400">Data:</strong> {change.specialistInsights.data}</p>}
                    {change.suggestedActions && change.suggestedActions.length > 0 && (
                        <div className="mt-2">
                            <p className="font-bold text-f1-accent-cyan">Suggested Actions:</p>
                            <ul className="list-disc list-inside pl-2 text-f1-text-darker-light dark:text-f1-text-darker">
                                {change.suggestedActions.map((action, i) => <li key={i}>{action}</li>)}
                            </ul>
                        </div>
                    )}
                     {change.redFlags && change.redFlags.length > 0 && (
                        <div className="mt-2">
                            <p className="font-bold text-yellow-400">Red Flags:</p>
                            <ul className="list-disc list-inside pl-2 text-f1-text-darker-light dark:text-f1-text-darker">
                                {change.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                            </ul>
                        </div>
                    )}
                    {change.suggestedQuestions && change.suggestedQuestions.length > 0 && (
                        <div className="mt-2">
                             <p className="font-bold">Follow-up Questions:</p>
                             <div className="flex flex-wrap gap-1 mt-1">
                                {change.suggestedQuestions.map((q, i) => (
                                    <button key={i} onClick={() => handleAskQuestion(q)} className="text-xs bg-gray-300/50 dark:bg-gray-800/80 hover:bg-f1-accent-cyan/20 dark:hover:bg-f1-accent-cyan/20 px-2 py-1 rounded-md transition-colors border border-transparent hover:border-f1-accent-cyan/50">{q}</button>
                                ))}
                             </div>
                        </div>
                    )}
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
    );
});


const getChangeSourceLabel = (changeId: string): string => {
    if (!changeId) return 'Change';
    const mappings: Array<{ prefix: string; label: string }> = [
        { prefix: 'RF-DETR-Seg', label: 'RF-DETR-Seg' },
        { prefix: 'component', label: 'RF-DETR-Seg' },
        { prefix: 'delta', label: 'RF-DETR-Seg' },
        { prefix: 'mask', label: 'Mask R-CNN' },
        { prefix: 'pcb', label: 'RF-DETR-Seg' },
        { prefix: 'changeformer', label: 'ChangeFormer' },
    ];
    const match = mappings.find(({ prefix }) => changeId.startsWith(prefix));
    if (match) return match.label;
    const fallback = changeId.split('-')[0];
    return fallback ? fallback.toUpperCase() : 'Change';
};


const InteractiveChatPanel: React.FC<InteractiveChatPanelProps> = (props) => {
    const { analysisState, analysisResult, domain, images, appMode, foresightResult, selectedChangeId, onSelectChange, onPlayAudio, onPauseResumeAudio, playingMessageId, isAudioPaused, onGenerateRivalGhost, onSimulationUpdate, onShowSimulationViz, onImageEdited, suggestedQuestions, onUpdateSuggestedQuestions } = props;
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const changeCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isCrewCapabilitiesOpen, setIsCrewCapabilitiesOpen] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<{ messageId: string; words: string[]; currentIndex: number } | null>(null);
  const transcriptIntervalRef = useRef<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

    const { messages, sendMessage, isThinking, thinkingMessage, error } = useAIAssistant(analysisResult, domain, images, appMode, foresightResult, onPlayAudio, onGenerateRivalGhost, onSimulationUpdate, onShowSimulationViz, onImageEdited, onUpdateSuggestedQuestions);
  const { liveStatus, transcript, error: liveError, startConversation, stopConversation } = useLiveConversation(analysisResult);
      const lowImpactHighlights = useMemo(() => {
          if (!analysisResult?.llmChanges?.length) return [] as DetectedChange[];
          const highImpactDescriptors = new Set((analysisResult.changes || []).map((change) => change.description?.toLowerCase()));
          return analysisResult.llmChanges.filter((change) => {
              const impactTier = (change.impact || 'Low').toLowerCase();
              if (impactTier !== 'low') return false;
              const descriptor = change.description?.toLowerCase() || '';
              if (highImpactDescriptors.has(descriptor)) return false;
              return true;
          });
      }, [analysisResult]);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const wasMobile = useRef(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  const placeholder = '';

  useEffect(() => {
      if (selectedChangeId) {
          const element = changeCardRefs.current[selectedChangeId];
          if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [selectedChangeId]);

  useEffect(() => {
    if (suggestedQuestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestedQuestions]);


  const clearTranscriptInterval = useCallback(() => {
    if (transcriptIntervalRef.current) {
        clearInterval(transcriptIntervalRef.current);
        transcriptIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (playingMessageId === null) {
        clearTranscriptInterval();
        setLiveTranscript(null);
    } else {
        const message = messages.find(m => m.id === playingMessageId);
        if (message && (!liveTranscript || liveTranscript.messageId !== playingMessageId)) {
             clearTranscriptInterval();
             const words = message.text?.split(/(\s+)/) || [];
             setLiveTranscript({ messageId: playingMessageId, words, currentIndex: 0 });
        }
    }
  }, [playingMessageId, messages, liveTranscript, clearTranscriptInterval]);

  useEffect(() => {
    if (liveTranscript && !isAudioPaused) {
        if (!transcriptIntervalRef.current) {
            transcriptIntervalRef.current = window.setInterval(() => {
                setLiveTranscript(prev => {
                    if (prev && prev.currentIndex < prev.words.length -1) {
                        return { ...prev, currentIndex: prev.currentIndex + 1 };
                    } else {
                        clearTranscriptInterval();
                        return prev ? { ...prev, currentIndex: prev.words.length } : null;
                    }
                });
            }, 120); // Avg word speed
        }
    } else if (isAudioPaused) {
        clearTranscriptInterval();
    }

    return () => clearTranscriptInterval();
  }, [liveTranscript, isAudioPaused, clearTranscriptInterval]);


  const openCapabilities = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCrewCapabilitiesOpen(true);
  }, []);

  const closeCapabilities = useCallback(() => {
    setIsCrewCapabilitiesOpen(false);
  }, []);

  useEffect(() => {
    const handleResize = () => {
        const isMobile = window.innerWidth < 768;
        if (isMobile && !wasMobile.current) {
            setIsCollapsed(true);
        } else if (!isMobile && wasMobile.current) {
            setIsCollapsed(false);
        }
        wasMobile.current = isMobile;
    };
    
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setIsCollapsed(true);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

    const handleToggleCollapse = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setIsCollapsed(prev => !prev);
        }
    };

    const handleHeaderKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleToggleCollapse();
        }
    };


  const isLiveActive = liveStatus !== LiveStatus.IDLE && liveStatus !== LiveStatus.ERROR;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue.trim());
      setInputValue('');
    }
  };
  
  const handleAskQuestion = useCallback((question: string) => {
    sendMessage(question);
    setInputValue('');
  }, [sendMessage]);
  
  const handleToggleLive = () => {
    if (isLiveActive) {
        stopConversation();
    } else {
        startConversation();
    }
  }
  
  return (
    <>
      <CrewCapabilities isOpen={isCrewCapabilitiesOpen} onToggle={closeCapabilities} />
      <div className={`glassmorphism flex flex-col rounded-lg shadow-lg transition-all duration-300 ${ isCollapsed ? 'h-auto' : 'h-[80vh] md:h-full' }`}>
                <div
                    role="button"
                    tabIndex={0}
                    onClick={handleToggleCollapse}
                    onKeyDown={handleHeaderKeyDown}
                    className="flex-shrink-0 flex justify-between items-center p-3 border-b border-gray-300/20 dark:border-gray-700/50 w-full text-left md:cursor-default"
                    aria-expanded={!isCollapsed}
                    aria-controls="chat-content"
                >
          <div className="flex items-center gap-2">
            <ChatBubbleIcon className="text-f1-text-light dark:text-f1-text" />
            <h2 className="text-sm font-bold text-f1-text-light dark:text-f1-text">AI Engineering Crew</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openCapabilities} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors" title="View Crew Capabilities">
                <InfoIcon className="w-4 h-4 text-f1-text-darker-light dark:text-f1-text-darker" />
                <span className="text-xs font-semibold text-f1-text-darker-light dark:text-f1-text-darker">Crew Info</span>
            </button>
            <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} className="md:hidden">
              <ChevronIcon className="w-5 h-5 text-f1-text-darker-light dark:text-f1-text-darker"/>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
            {!isCollapsed && (
                 <motion.div
                    id="chat-content"
                    key="chat-content"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto', flexGrow: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="flex flex-col overflow-hidden"
                >
                    <div className="relative flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {messages.map((message) => {
                            if (message.role === 'system' && message.type === 'briefing' && message.changes) {
                                return (
                                    <motion.div key={message.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <div className="p-3 bg-gray-200/50 dark:bg-gray-900/50 rounded-lg">
                                            <h3 className="font-bold text-sm mb-2 text-f1-text-light dark:text-f1-text-darker">Initial Briefing: Detected Changes</h3>
                                            {message.changes.map(change => (
                                                <div key={change.id} ref={el => { changeCardRefs.current[change.id] = el; }}>
                                                    <ChangeBriefingCard 
                                                        change={change} 
                                                        isSelected={change.id === selectedChangeId}
                                                        onSelectChange={onSelectChange} 
                                                        onAskQuestion={handleAskQuestion} 
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                );
                            }
                            
                            if (message.role === 'system' && message.warRoom) {
                                return <WarRoomPanel key={message.id} warRoomData={message.warRoom} />;
                            }

                            const isUser = message.role === 'user';
                            const persona = isUser ? 'User' : message.persona!;
                            const config = personaConfig[persona];
                            const isThisMessageTranscribing = liveTranscript && liveTranscript.messageId === message.id;
                            const displayedText = isThisMessageTranscribing
                                ? liveTranscript.words.slice(0, liveTranscript.currentIndex).join('')
                                : message.text;


                            return (
                                <motion.div
                                    key={message.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 10, x: isUser ? 10 : -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                    className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!isUser && <config.icon className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />}
                                    <div className={`w-full max-w-lg rounded-lg shadow-md ${ isUser ? 'user-bubble-gradient text-f1-dark' : 'bg-gray-100 dark:bg-zinc-800 text-f1-text-light dark:text-f1-text'}`}>
                                        <div className="px-3 pt-2 pb-1 flex justify-between items-center">
                                            {isUser ? <span className="text-xs font-bold text-f1-dark">Racer</span> : <PersonaDisplay persona={persona} isAutonomous={message.isAutonomous}/>}
                                            {!isUser && <AudioControls message={message} onPlay={onPlayAudio} onPauseResume={onPauseResumeAudio} playingMessageId={playingMessageId} isAudioPaused={isAudioPaused} />}
                                        </div>
                                        <div className="px-3 pb-3">
                                            {message.text && (message.text.includes('**Setup Sheet:**') ? <SetupSheetCard content={message.text} /> : <MarkdownRenderer content={displayedText || ''} />)}
                                            {message.generatedImage && (
                                                <div className="mt-2">
                                                    <img src={message.generatedImage.url} alt={message.generatedImage.prompt} className="rounded-lg border-2 border-f1-accent-magenta" />
                                                </div>
                                            )}
                                            {message.sources && message.sources.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700">
                                                    <p className="text-xs font-bold mb-1">Sources:</p>
                                                    <div className="flex flex-col gap-1">
                                                        {message.sources.map((source, i) => (
                                                            <a href={source.uri} key={i} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                                                <LinkIcon /> <span>{source.title || source.uri}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {isUser && <UserIcon className="w-8 h-8 rounded-full flex-shrink-0 mt-1 bg-gray-500 text-white p-1" />}
                                </motion.div>
                            );
                        })}
                        <AnimatePresence>
                            {isThinking && (
                                <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex justify-start gap-3">
                                    <SameelAvatar className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
                                    <div className="w-full max-w-md p-3 rounded-lg bg-gray-100 dark:bg-zinc-800">
                                        <p className="text-sm italic text-f1-text-darker-light dark:text-f1-text-darker loading-ellipsis">{thinkingMessage}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="flex-shrink-0 p-2 border-t border-gray-300/20 dark:border-gray-700/50 bg-f1-light-brighter/95 dark:bg-f1-dark/95 backdrop-blur-sm">
                        <AnimatePresence>
                        {suggestedQuestions.length > 0 && !isThinking && (
                            <motion.div
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="pb-2"
                            >
                                <div className="flex justify-between items-center px-2 pb-2">
                                    <h4 className="text-xs font-bold text-f1-text-darker-light dark:text-f1-text-darker uppercase">Suggestions</h4>
                                    <button onClick={() => setShowSuggestions(s => !s)} className="text-f1-text-darker-light dark:text-f1-text-darker hover:text-f1-text-light dark:hover:text-f1-text">
                                      <motion.div animate={{ rotate: showSuggestions ? 0 : -90 }}>
                                        <ChevronIcon className="w-4 h-4" />
                                      </motion.div>
                                    </button>
                                </div>
                                {showSuggestions && (
                                    <motion.div 
                                        key="suggestions-content"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {suggestedQuestions.map((q, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleAskQuestion(q)}
                                                    className="shimmer-button px-3 py-1.5 text-xs font-semibold bg-gray-200/80 dark:bg-gray-800/80 rounded-full hover:bg-f1-accent-cyan/30 dark:hover:bg-f1-accent-cyan/30 border border-gray-300 dark:border-gray-700 transition-all hover:border-f1-accent-cyan"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                        </AnimatePresence>
                        <form onSubmit={handleSubmit} className="relative z-20">
                            <div className="flex items-center gap-2 p-1 rounded-full border border-gray-300 dark:border-gray-700/50 input-glow-wrapper">
                                <button type="button" onClick={handleToggleLive} className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isLiveActive ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`} title={isLiveActive ? 'End Live Debrief' : 'Start Live Debrief'}>
                                    {isLiveActive ? <MicrophoneOffIcon /> : <MicrophoneIcon />}
                                </button>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={isThinking ? '...' : ''}
                                    disabled={isThinking || isLiveActive}
                                    className="w-full h-10 px-4 bg-transparent border-none focus:ring-0 text-sm placeholder:text-f1-text-darker-light dark:placeholder:text-f1-text-darker disabled:opacity-50"
                                    aria-label="Chat input"
                                />
                                <button type="submit" disabled={!inputValue.trim() || isThinking || isLiveActive} className="w-10 h-10 flex-shrink-0 bg-f1-accent-cyan text-f1-dark rounded-full flex items-center justify-center disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 transition-colors">
                                    <SendIcon />
                                </button>
                            </div>
                             <div className="absolute bottom-full left-0 right-0 p-2 text-center pointer-events-none">
                                <AnimatePresence>
                                    {liveError && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                            <p className="text-xs bg-red-900/80 text-red-200 p-1 rounded-md">{liveError}</p>
                                        </motion.div>
                                    )}
                                    {isLiveActive && (
                                        <motion.div
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="mt-1"
                                        >
                                            <p className="text-xs bg-f1-dark text-f1-text-darker p-1 rounded-md loading-ellipsis">
                                                {liveStatus === LiveStatus.CONNECTING ? 'Connecting' : liveStatus === LiveStatus.LISTENING ? 'Listening' : 'Speaking'}
                                            </p>
                                            <p className="text-xs text-f1-text-darker truncate">{transcript}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {lowImpactHighlights.length > 0 && (
            <motion.div
                key="low-impact-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mt-4 glassmorphism rounded-lg border border-gray-300/40 dark:border-gray-700/60 p-4 text-xs shadow-lg"
            >
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <p className="text-[11px] uppercase tracking-wider text-f1-accent-cyan font-semibold">Low-impact visuals</p>
                    {lowImpactHighlights.length > 3 && (
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                            +{lowImpactHighlights.length - 3} more Gemini observations
                        </span>
                    )}
                </div>
                <ul className="mt-3 space-y-2">
                    {lowImpactHighlights.slice(0, 3).map((change) => (
                        <li key={change.id} className="flex items-start gap-2">
                            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-f1-accent-cyan flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-[13px] leading-tight text-f1-text-light dark:text-f1-text">
                                    {change.description}
                                </p>
                                {change.interpretation && (
                                    <p className="text-[11px] text-f1-text-darker-light dark:text-f1-text-darker leading-tight">
                                        {change.interpretation}
                                    </p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default memo(InteractiveChatPanel);