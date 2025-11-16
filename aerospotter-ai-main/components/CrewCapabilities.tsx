import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChiefIcon, AeroIcon, NumbersIcon, XCircleIcon, TerminalIcon } from './Icons';

const CommandChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center gap-2">
        <TerminalIcon className="w-4 h-4 text-f1-accent-cyan flex-shrink-0" />
        <code className="text-xs bg-gray-200 dark:bg-gray-900 text-f1-text-light dark:text-f1-text px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700">{children}</code>
    </div>
);

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
  color: string;
  children: React.ReactNode;
}

const Feature: React.FC<FeatureProps> = ({
  title,
  description,
  icon,
  index,
  color,
  children
}) => {
  const borderClasses = [
    "flex flex-col lg:border-r py-10 relative group/feature border-gray-200 dark:border-gray-800",
    index === 0 && "lg:border-l",
    "border-b lg:border-b-0", // Border on bottom for mobile, not for desktop row
    index === 2 && "lg:border-r-0", // No right border on last item on desktop
  ].filter(Boolean).join(' ');

  const hoverColorClass = {
    'bg-f1-accent-cyan': 'group-hover/feature:bg-f1-accent-cyan',
    'bg-f1-accent-magenta': 'group-hover/feature:bg-f1-accent-magenta',
    'bg-yellow-400': 'group-hover/feature:bg-yellow-400'
  }[color] || 'group-hover/feature:bg-gray-500';

  const iconHoverColorClass = {
    'bg-f1-accent-cyan': 'group-hover/feature:text-f1-accent-cyan',
    'bg-f1-accent-magenta': 'group-hover/feature:text-f1-accent-magenta',
    'bg-yellow-400': 'group-hover/feature:text-yellow-400'
  }[color] || 'group-hover/feature:text-gray-500';

  return (
    <div className={borderClasses}>
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-300 absolute inset-0 h-full w-full bg-gradient-to-t from-f1-light-dark to-transparent pointer-events-none" />
      
      <div className={`mb-4 relative z-10 px-10 ${iconHoverColorClass} transition-colors`}>
        {icon}
      </div>
      <div className="text-lg font-bold mb-3 relative z-10 px-10">
        <div className={`absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-gray-300 dark:bg-gray-700 ${hoverColorClass} transition-all duration-300 origin-center`} />
        <span className="group-hover/feature:translate-x-2 transition duration-300 inline-block text-f1-text-light dark:text-white">
          {title}
        </span>
      </div>
      <p className="text-sm text-f1-text-darker-light dark:text-f1-text-darker max-w-xs relative z-10 px-10 mb-6">
        {description}
      </p>
      <div className="relative z-10 px-10 space-y-3">
        {children}
      </div>
    </div>
  );
};


interface CrewCapabilitiesProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface FeatureData {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    content: (string | React.ReactNode)[];
}

const CrewCapabilities: React.FC<CrewCapabilitiesProps> = ({ isOpen, onToggle }) => {
    const features: FeatureData[] = [
    {
        title: "Aero Sameel",
        description: "Lead Strategist. Your default contact. Provides summaries, delegates tasks, and gives high-level direction.",
        icon: <ChiefIcon className="w-10 h-10" />,
        color: 'bg-f1-accent-cyan',
        content: [
            "• Provides executive summaries & final decisions.",
            "• Your default contact for general queries.",
            "• Engage in a live voice debrief via the mic icon."
        ]
    },
    {
        title: "Aero Shourya",
        description: "Aerodynamics Expert. Interprets all physical changes and generates visual prototypes.",
        icon: <AeroIcon className="w-10 h-10" />,
        color: 'bg-f1-accent-magenta',
        content: [
            <CommandChip>/prototype [idea]</CommandChip>,
          <CommandChip>/rival [team name]</CommandChip>
        ]
    },
    {
        title: "Aero Varun",
        description: "Data & Intelligence Analyst. Analyzes cost, performance data, telemetry, and competitive intel.",
        icon: <NumbersIcon className="w-10 h-10" />,
        color: 'bg-yellow-400',
        content: [
            <CommandChip>@Varun intel [query]</CommandChip>,
            <CommandChip>/simulate [track]</CommandChip>,
            <CommandChip>/setup [track] [conditions]</CommandChip>,
            <CommandChip>/analyze_audio [desc]</CommandChip>,
            <CommandChip>/cost_benefit [id]</CommandChip>
        ]
    }
];
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-f1-dark/80 backdrop-blur-lg z-50 flex items-center justify-center p-4"
          onClick={onToggle}
        >
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-f1-light dark:bg-f1-light-dark w-full max-w-6xl rounded-lg shadow-2xl relative border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onToggle}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              aria-label="Close"
            >
              <XCircleIcon className="w-8 h-8" />
            </button>

            <div className="p-10 text-center">
              <h2 className="text-3xl font-bold mb-2 text-gradient-cyan">AI Crew Capabilities</h2>
              <p className="text-f1-text-darker-light dark:text-f1-text-darker max-w-2xl mx-auto">
                Engage your multi-persona AI Race Engineering Crew. Address them by name (`@Shourya`) or use commands to leverage their unique specializations.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3">
              {features.map((feature, index) => {
                  const { content, title, description, icon, color } = feature;
                  const children = content.map((item, i) =>
                    typeof item === 'string'
                      ? <p key={i} className="text-sm text-f1-text-darker-light dark:text-f1-text-darker">{item}</p>
                      : <div key={i}>{item}</div>
                  );
                  return (
                    <Feature 
                      key={title} 
                      title={title}
                      description={description}
                      icon={icon}
                      color={color}
                      index={index}>
                      {children}
                    </Feature>
                  );
              })}
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CrewCapabilities;