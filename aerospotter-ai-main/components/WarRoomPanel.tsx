import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatMessage, AIPersona } from '../types';
// FIX: Corrected import to use VarunAvatar, as AyushriAvatar does not exist.
import { ShouryaAvatar, VarunAvatar, ChevronIcon, TerminalIcon } from './Icons';
import MarkdownRenderer from './MarkdownRenderer';

const personaConfig = {
    'Aero Shourya': { icon: ShouryaAvatar, color: 'text-f1-accent-magenta', name: 'Aero Shourya' },
    // FIX: Updated persona to 'Aero Varun' to be consistent with the rest of the application.
    'Aero Varun': { icon: VarunAvatar, color: 'text-yellow-400', name: 'Aero Varun' },
};

interface WarRoomPanelProps {
  warRoomData: {
    messages: ChatMessage[];
    isFinished: boolean;
  };
}

const WarRoomPanel: React.FC<WarRoomPanelProps> = ({ warRoomData }) => {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Keep it open while the debate is active, collapse when finished
    if (warRoomData.isFinished) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [warRoomData.isFinished]);

  return (
    <motion.div layout className="bg-gray-200/50 dark:bg-gray-900/50 rounded-lg my-2 border border-gray-300 dark:border-gray-700/50 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-3 hover:bg-gray-300/50 dark:hover:bg-gray-800/50 transition-colors flex justify-between items-center"
      >
        <div className="flex items-center gap-2">
            <TerminalIcon className="w-5 h-5 text-f1-accent-magenta" />
            <div className="flex flex-col text-left">
                 <p className="font-bold text-sm text-f1-text-light dark:text-white">
                    {warRoomData.isFinished ? 'Debate Transcript' : 'Crew is Debating...'}
                 </p>
                 {!warRoomData.isFinished && <p className="text-xs text-f1-text-darker-light dark:text-f1-text-darker animate-pulse">Deliberation in progress</p>}
            </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronIcon className="w-5 h-5 text-f1-text-darker-light dark:text-f1-text-darker" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 pt-2 border-t border-gray-300 dark:border-gray-700/50"
          >
            <div className="space-y-3">
              {warRoomData.messages.map((msg) => {
                if (!msg.persona) return null;
                const config = personaConfig[msg.persona as keyof typeof personaConfig];
                if (!config) return null;

                if (msg.isTyping) {
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 items-center">
                      <config.icon className="w-6 h-6 rounded-full flex-shrink-0" />
                      <div className="p-2 rounded-lg bg-f1-light dark:bg-f1-light-dark">
                        <p className="text-sm italic text-f1-text-darker-light dark:text-f1-text-darker loading-ellipsis">typing</p>
                      </div>
                    </motion.div>
                  );
                }
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 items-start">
                    <config.icon className="w-6 h-6 rounded-full flex-shrink-0" />
                    <div className="p-2 rounded-lg bg-gray-300/50 dark:bg-gray-800/50 max-w-sm">
                      <p className={`text-xs font-bold ${config.color}`}>{config.name}</p>
                      <MarkdownRenderer content={msg.text || ''} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WarRoomPanel;