import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { NumbersIcon } from './Icons';
import MarkdownRenderer from './MarkdownRenderer';

interface SetupSheetCardProps {
  content: string;
}

interface ParsedSetup {
    track: string;
    analysis: string;
    recommendation: string;
    justification: string;
}

const parseSetupContent = (content: string): ParsedSetup => {
    const parsed: ParsedSetup = {
        track: 'N/A',
        analysis: 'N/A',
        recommendation: 'N/A',
        justification: 'N/A'
    };
    const lines = content.split('\n');
    let currentSection: keyof ParsedSetup | null = null;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('**Track:**')) {
            currentSection = 'track';
            parsed.track = trimmedLine.replace('**Track:**', '').trim();
        } else if (trimmedLine.startsWith('**Analysis:**')) {
            currentSection = 'analysis';
            // Clear default value and capture the first line of the section
            parsed.analysis = trimmedLine.replace('**Analysis:**', '').trim();
        } else if (trimmedLine.startsWith('**Recommendation:**')) {
            currentSection = 'recommendation';
            parsed.recommendation = trimmedLine.replace('**Recommendation:**', '').trim();
        } else if (trimmedLine.startsWith('**Justification:**')) {
            currentSection = 'justification';
            parsed.justification = trimmedLine.replace('**Justification:**', '').trim();
        } else if (currentSection && trimmedLine !== '' && !trimmedLine.startsWith('**')) {
            // Append subsequent lines to the current section
            if (parsed[currentSection] === 'N/A' || parsed[currentSection] === '') {
                parsed[currentSection] = trimmedLine;
            } else {
                parsed[currentSection] += `\n${trimmedLine}`;
            }
        }
    }
    
    // Clean up bullet points for recommendation
    parsed.recommendation = parsed.recommendation.replace(/-\s/g, '\n- ');

    return parsed;
};

const SetupSheetCard: React.FC<SetupSheetCardProps> = ({ content }) => {
    const setup = useMemo(() => parseSetupContent(content), [content]);

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-yellow-400/30 rounded-lg overflow-hidden text-f1-text-light dark:text-f1-text"
        >
            <div className="p-4">
                <h3 className="text-lg font-bold mb-2">Setup Sheet: <span className="text-yellow-400">{setup.track}</span></h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                    <div>
                        <h4 className="font-bold uppercase text-f1-text-darker-light dark:text-f1-text-darker tracking-wider mb-1">Track Analysis</h4>
                        <MarkdownRenderer content={setup.analysis} />
                    </div>
                     <div>
                        <h4 className="font-bold uppercase text-f1-text-darker-light dark:text-f1-text-darker tracking-wider mb-1">Justification</h4>
                        <MarkdownRenderer content={setup.justification} />
                    </div>
                </div>

                <div className="mt-4">
                    <h4 className="font-bold uppercase text-f1-text-darker-light dark:text-f1-text-darker tracking-wider mb-2">Recommended Setup</h4>
                    <div className="bg-gray-200 dark:bg-f1-dark/50 p-3 rounded-md">
                        <MarkdownRenderer content={setup.recommendation} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SetupSheetCard;
