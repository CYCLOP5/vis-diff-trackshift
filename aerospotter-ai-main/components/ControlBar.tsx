import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DomainMode, AppMode, ComparisonMode } from '../types';
import { ResetIcon, SunIcon, MoonIcon, InfoIcon } from './Icons';

interface ControlBarProps {
  onAnalyzeClick: () => void;
  analyzeButtonText: string;
  isAnalyzeDisabled: boolean;
  isLoading: boolean;
  showHeatmap: boolean;
  onShowHeatmapChange: (show: boolean) => void;
  isHeatmapDisabled: boolean;
  useRoboflowOverlay: boolean;
  onUseRoboflowOverlayChange: (show: boolean) => void;
  isRoboflowDisabled: boolean;
  domainMode: DomainMode;
  onDomainModeChange: (mode: DomainMode) => void;
  comparisonMode: ComparisonMode;
  onComparisonModeChange: (mode: ComparisonMode) => void;
  onReset: () => void;
  showReset: boolean;
  appMode: AppMode;
  theme: 'dark' | 'light';
  onThemeChange: () => void;
}

const ControlBar: React.FC<ControlBarProps> = ({
  onAnalyzeClick,
  analyzeButtonText,
  isAnalyzeDisabled,
  isLoading,
  showHeatmap,
  onShowHeatmapChange,
  isHeatmapDisabled,
  useRoboflowOverlay,
  onUseRoboflowOverlayChange,
  isRoboflowDisabled,
  domainMode,
  onDomainModeChange,
  comparisonMode,
  onComparisonModeChange,
  onReset,
  showReset,
  appMode,
  theme,
  onThemeChange,
}) => {
  const domainOptions: DomainMode[] = ['F1', 'Manufacturing', 'Infrastructure', 'QA'];
  const comparisonOptions: { value: ComparisonMode; label: string; help: string }[] = [
    {
      value: 'baseline',
      label: 'Baseline',
      help: 'Every frame is diffed against the first frame. Reorder the timeline to choose a new baseline before running analysis.',
    },
    {
      value: 'consecutive',
      label: 'Consecutive',
      help: 'Diff each frame against the immediately previous frame. Ideal for visualizing gradual shifts in a sequence or pit-stop workflow.',
    },
  ];
  const [showComparisonHelp, setShowComparisonHelp] = useState(false);

  return (
    <div className="glassmorphism p-3 rounded-lg flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 w-full">
        {/* Domain Mode Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="domain-select" className="text-xs font-semibold text-f1-text-darker-light dark:text-f1-text-darker hidden sm:inline">Mode:</label>
          <div className="relative">
            <select
              id="domain-select"
              value={domainMode}
              onChange={(e) => onDomainModeChange(e.target.value as DomainMode)}
              disabled={isLoading}
              className="appearance-none bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-f1-text-light dark:text-f1-text text-sm rounded-md focus:ring-f1-accent-cyan focus:border-f1-accent-cyan h-9 pl-3 pr-8"
            >
              {domainOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* Comparison Mode Selector */}
        <div className="flex flex-col min-w-[190px]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-f1-text-darker-light dark:text-f1-text-darker">Comparison</span>
            <button
              type="button"
              aria-label="Explain comparison modes"
              aria-expanded={showComparisonHelp}
              onClick={() => setShowComparisonHelp((prev) => !prev)}
              className="p-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <motion.div animate={{ rotate: showComparisonHelp ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <InfoIcon className="w-4 h-4" />
              </motion.div>
            </button>
          </div>
          <div className="mt-1 bg-gray-200/70 dark:bg-gray-700/70 rounded-md p-0.5 flex">
            {comparisonOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={isLoading}
                onClick={() => onComparisonModeChange(option.value)}
                className={`flex-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors disabled:opacity-60 ${
                  comparisonMode === option.value
                    ? 'bg-f1-accent-cyan text-f1-dark shadow-sm'
                    : 'text-f1-text-darker-light dark:text-f1-text-darker'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visualization Toggles */}
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <button
              onClick={() => onShowHeatmapChange(!showHeatmap)}
              disabled={isHeatmapDisabled || isLoading}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                showHeatmap ? 'bg-f1-accent-cyan' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                  showHeatmap ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="ml-2 text-sm text-f1-text-darker-light dark:text-f1-text-darker">Heatmap</span>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => onUseRoboflowOverlayChange(!useRoboflowOverlay)}
              disabled={isRoboflowDisabled || isLoading}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                useRoboflowOverlay ? 'bg-f1-accent-magenta' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              title={
                isRoboflowDisabled
                  ? 'Run an analysis with Roboflow artifacts to enable'
                  : 'Show RF-DETR-Seg/Roboflow overlay instead of raw imagery'
              }
            >
              <span
                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                  useRoboflowOverlay ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="ml-2 text-sm text-f1-text-darker-light dark:text-f1-text-darker">Roboflow</span>
          </div>
        </div>

         {/* Theme Toggle */}
         <button
          onClick={onThemeChange}
          className="h-9 w-9 flex items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <motion.div
            key={theme}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5" />}
          </motion.div>
        </button>

      </div>

      <AnimatePresence>
        {showComparisonHelp && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-f1-text-darker-light dark:text-f1-text-darker bg-gray-100/80 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/50 rounded-md p-3"
          >
            {comparisonOptions.map((option) => (
              <p key={option.value} className="mb-1 last:mb-0">
                <span className="font-semibold text-f1-text-light dark:text-white">{option.label}:</span> {option.help}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
        {/* Reset Button */}
        {showReset && (
          <motion.button
            onClick={onReset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="h-10 px-4 flex items-center justify-center gap-2 bg-red-900/70 hover:bg-red-800/80 border border-red-500/30 text-red-100 font-semibold rounded-md transition-colors"
          >
            <ResetIcon className="w-4 h-4" />
            Reset
          </motion.button>
        )}

        {/* Analyze Button */}
        <motion.button
          onClick={onAnalyzeClick}
          disabled={isAnalyzeDisabled}
          className={`relative overflow-hidden h-10 px-6 font-bold text-sm rounded-md transition-colors flex items-center justify-center border ${
            isAnalyzeDisabled
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed border-transparent'
              : appMode === AppMode.FORESIGHT_INPUT
              ? `bg-f1-accent-magenta text-white scanline-button ${!isAnalyzeDisabled && 'analyze-button-pulse'}`
              : `bg-f1-accent-cyan text-f1-dark scanline-button ${!isAnalyzeDisabled && 'analyze-button-pulse'}`
          }`}
          style={{ '--pulse-color': appMode === AppMode.FORESIGHT_INPUT ? 'var(--glow-color-magenta)' : 'var(--glow-color-cyan)' } as React.CSSProperties}

        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{analyzeButtonText}</span>
            </div>
          ) : (
            analyzeButtonText
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default ControlBar;