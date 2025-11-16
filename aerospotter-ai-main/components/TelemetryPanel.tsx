import React, { useMemo, memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DetectedChange, SimulationData, AnalysisResult, SimulationResult, LapData } from '../types';
import { NumbersIcon, WarningIcon, XCircleIcon } from './Icons';

interface TelemetryPanelProps {
    selectedChange: DetectedChange | null;
    simulationData: SimulationData | null;
    result: AnalysisResult | null;
    onSelectChange?: (id: string | null) => void;
}

const ImpactDonutChart: React.FC<{ high: number; medium: number; low: number; total: number }> = ({ high, medium, low, total }) => {
    const size = 90;
    const strokeWidth = 9;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const highPercent = total > 0 ? high / total : 0;
    const mediumPercent = total > 0 ? medium / total : 0;
    const lowPercent = total > 0 ? low / total : 0;

    const highAngle = highPercent * 360;
    const mediumAngle = mediumPercent * 360;
    
    const segments = [
        { percentage: lowPercent, color: "stroke-green-500", label: 'Low', value: low, rotation: 0 },
        { percentage: mediumPercent, color: "stroke-yellow-400", label: 'Medium', value: medium, rotation: highAngle + mediumAngle },
        { percentage: highPercent, color: "stroke-red-500", label: 'High', value: high, rotation: highAngle },
    ].filter(s => s.percentage > 0).sort((a, b) => b.rotation! - a.rotation!);

    const DonutSegment: React.FC<{ percentage: number; color: string; rotation: number; index: number }> = ({ percentage, color, rotation, index }) => (
        <motion.circle
            cx={size/2} cy={size/2} r={radius}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={color}
            fill="transparent"
            strokeDasharray={`${percentage * circumference} ${circumference}`}
            style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '50% 50%' }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + index * 0.1 }}
        />
    );

    return (
        <div className="flex items-center gap-4">
            <div className="relative" style={{ width: size, height: size }}>
                 <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                    <circle cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} className="stroke-gray-200 dark:stroke-gray-700/50" fill="transparent" />
                    {segments.map((seg, i) => <DonutSegment key={seg.label} {...seg} index={i} />)}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span initial={{y: 5, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.5}} className="text-2xl font-bold text-f1-text-light dark:text-white">{total}</motion.span>
                    <motion.span initial={{y: 5, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.6}} className="text-xs text-f1-text-darker-light dark:text-f1-text-darker -mt-1">Changes</motion.span>
                </div>
            </div>
            <div className="text-xs space-y-1">
                <p><span className="font-bold text-red-500">{high}</span> High Impact</p>
                <p><span className="font-bold text-yellow-400">{medium}</span> Medium Impact</p>
                <p><span className="font-bold text-green-500">{low}</span> Low Impact</p>
            </div>
        </div>
    );
};


const parsePerformanceGain = (gainString: string | undefined) => {
    if (!gainString || gainString === 'N/A') return { value: 0, label: 'N/A', unit: '', isPositive: true, rawValue: 0 };
    const match = gainString.match(/([+-]?)(\d*\.?\d+)/);
    if (!match) return { value: 0, label: gainString, unit: '', isPositive: true, rawValue: 0 };
    
    const sign = match[1]; 
    const value = parseFloat(match[2]);
    const rawValue = sign === '-' ? -value : value;

    return { value, label: gainString, isPositive: sign !== '-', rawValue };
};

const createPathData = (data: number[], width: number, height: number): string => {
    const maxVal = Math.max(...data, 0);
    const minVal = Math.min(...data, 0);
    let range = maxVal - minVal;
    if (range === 0) range = 1; // Avoid division by zero
    
    if (!data.length) return `M 0,${height / 2} L ${width},${height / 2}`;
    
    return data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - minVal) / range) * (height * 0.8) + (height * 0.1); // Scale and center
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(' ');
};

const TelemetryGraph: React.FC<{ data: number[]; color: string; width: number; height: number; }> = ({ data, color, width, height }) => {
    const pathData = useMemo(() => createPathData(data, width, height), [data, width, height]);
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            <motion.path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.5, ease: "circOut" }}
            />
        </svg>
    )
};

const PerformanceGauge: React.FC<{ value: number; label: string; isPositive: boolean }> = ({ value, label, isPositive }) => {
    const size = 120;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const maxVal = 10; // Assuming performance gain is out of 10 points
    
    const valuePercentage = Math.min(Math.abs(value) / maxVal, 1);
    const strokeDashoffset = circumference - valuePercentage * circumference;

    const color = isPositive ? 'var(--color-f1-accent-cyan)' : 'var(--color-red-500)';

    return (
        <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    strokeWidth={strokeWidth}
                    className="stroke-gray-200 dark:stroke-gray-700/50"
                    fill="transparent"
                />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={radius}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    style={{ stroke: color }}
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl sm:text-3xl font-bold"
                    style={{ color, textShadow: `0 0 10px ${color}60` }}
                >
                    {label}
                </motion.p>
            </div>
        </div>
    );
};


const parseTimeToMs = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(/[:.]/);
    if (parts.length === 3) { // M:SS.mmm
        const minutes = parseInt(parts[0], 10) || 0;
        const seconds = parseInt(parts[1], 10) || 0;
        const milliseconds = parseInt(parts[2], 10) || 0;
        return (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
    } else if (parts.length === 2) { // SS.mmm
        const seconds = parseInt(parts[0], 10) || 0;
        const milliseconds = parseInt(parts[1], 10) || 0;
        return (seconds * 1000) + milliseconds;
    }
    return 0;
};

const formatDelta = (deltaMs: number): { text: string; isPositive: boolean } => {
    const isPositive = deltaMs <= 0; // A negative or zero delta is a positive outcome for Prophecy
    const sign = deltaMs > 0 ? '+' : ''; // Show + for slower, nothing for faster (minus is inherent)
    const absDelta = Math.abs(deltaMs);
    const seconds = Math.floor(absDelta / 1000);
    const milliseconds = absDelta % 1000;
    return {
        text: `${sign}${(deltaMs/1000).toFixed(3)}s`,
        isPositive,
    };
};

const LapDataModal: React.FC<{ result: SimulationResult, onClose: () => void }> = ({ result, onClose }) => {
    const lapData = useMemo(() => {
        const reality = result.laps.find(l => l.name === 'Reality');
        const prophecy = result.laps.find(l => l.name === 'Prophecy');

        if (!reality || !prophecy) return null;

        const createRow = (label: string, realityTime: string, prophecyTime: string) => {
            const deltaMs = parseTimeToMs(prophecyTime) - parseTimeToMs(realityTime);
            return { label, realityTime, prophecyTime, delta: formatDelta(deltaMs) };
        };

        return {
            rows: [
                createRow('Lap Time', reality.lapTime, prophecy.lapTime),
                createRow('Sector 1', reality.sector1, prophecy.sector1),
                createRow('Sector 2', reality.sector2, prophecy.sector2),
                createRow('Sector 3', reality.sector3, prophecy.sector3),
            ],
            realityTelemetry: reality.telemetry,
            prophecyTelemetry: prophecy.telemetry,
        }

    }, [result]);

    if (!lapData) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-f1-dark/80 backdrop-blur-md z-40 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                className="bg-f1-light dark:bg-f1-light-dark w-full max-w-4xl rounded-lg shadow-2xl relative border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 dark:text-gray-500 hover:text-f1-text-light dark:hover:text-white transition-colors z-10">
                    <XCircleIcon className="w-7 h-7" />
                </button>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-gradient-cyan mb-1">Simulation Debrief</h3>
                    <p className="text-sm text-f1-text-darker-light dark:text-f1-text-darker mb-4">{result.commentary}</p>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-200 dark:bg-gray-900/50 text-xs uppercase">
                                <tr>
                                    <th className="p-3">Metric</th>
                                    <th className="p-3 text-center">Reality</th>
                                    <th className="p-3 text-center">Prophecy</th>
                                    <th className="p-3 text-center">Delta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lapData.rows.map(row => (
                                    <tr key={row.label} className="border-b border-gray-200 dark:border-gray-800">
                                        <td className="p-3 font-semibold">{row.label}</td>
                                        <td className="p-3 text-center font-mono">{row.realityTime}</td>
                                        <td className="p-3 text-center font-mono">{row.prophecyTime}</td>
                                        <td className={`p-3 text-center font-mono font-bold ${row.delta.isPositive ? 'text-green-500' : 'text-red-500'}`}>{row.delta.text}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-bold text-center mb-2 text-f1-accent-cyan">Reality Telemetry</h4>
                            <div className="h-40 bg-gray-200 dark:bg-gray-900/50 rounded-md p-2">
                                <TelemetryGraph data={lapData.realityTelemetry} color="var(--color-f1-accent-cyan)" width={400} height={150} />
                            </div>
                        </div>
                         <div>
                            <h4 className="font-bold text-center mb-2 text-f1-accent-magenta">Prophecy Telemetry</h4>
                            <div className="h-40 bg-gray-200 dark:bg-gray-900/50 rounded-md p-2">
                                <TelemetryGraph data={lapData.prophecyTelemetry} color="var(--color-f1-accent-magenta)" width={400} height={150} />
                            </div>
                        </div>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
};


const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ selectedChange, simulationData, result, onSelectChange }) => {
    const { label, isPositive, rawValue } = parsePerformanceGain(selectedChange?.performanceGain);
    const [isLapDataVisible, setIsLapDataVisible] = useState(false);

    const summaryData = useMemo(() => {
        if (!result) return null;
        const changes = result.llmChanges?.length ? result.llmChanges : result.changes || [];
        if (!changes.length) return null;
        const impactCounts = changes.reduce((acc, change) => {
            acc[change.impact] = (acc[change.impact] || 0) + 1;
            return acc;
        }, {} as Record<'High' | 'Medium' | 'Low', number>);
        
        const mostCriticalChange = [...changes].sort((a, b) => (b.criticality || 0) - (a.criticality || 0))[0];

        return {
            total: changes.length,
            high: impactCounts.High || 0,
            medium: impactCounts.Medium || 0,
            low: impactCounts.Low || 0,
            mostCritical: mostCriticalChange,
        };
    }, [result]);


    const renderContent = () => {
        if (simulationData) {
            return (
                <div className="flex flex-col sm:flex-row gap-4 h-full">
                    <div className="w-full sm:w-1/3 flex flex-col justify-center">
                        <p className="text-xs text-f1-text-darker-light dark:text-f1-text-darker uppercase tracking-wider">Live Simulation</p>
                        {simulationData.finalResult ? (
                            <div>
                                <p className="text-xl font-bold text-f1-text-light dark:text-white">{simulationData.finalResult.winner} Wins</p>
                                <p className="text-lg font-bold text-gradient-cyan">{simulationData.finalResult.timeDelta}</p>
                                <button onClick={() => setIsLapDataVisible(true)} className="mt-2 text-xs bg-gray-200 dark:bg-gray-700/80 px-2 py-1 rounded-md hover:bg-f1-accent-cyan/20 dark:hover:bg-f1-accent-cyan/20 transition-colors">
                                    View Lap Details
                                </button>
                            </div>
                        ) : (
                            <p className="text-xl font-bold text-f1-text-light dark:text-white animate-pulse">In Progress...</p>
                        )}
                        <div className="mt-4 text-xs space-y-1">
                           <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-f1-accent-cyan"/> Reality</div>
                           <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-f1-accent-magenta"/> Prophecy</div>
                        </div>
                    </div>
                    <div className="w-full sm:w-2/3 relative h-full min-h-[80px] sm:min-h-0">
                         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-f1-light-dark/50 to-transparent"></div>
                         <TelemetryGraph data={simulationData.realityTrace} color="var(--color-f1-accent-cyan)" width={300} height={100} />
                         <div className="absolute inset-0">
                           <TelemetryGraph data={simulationData.prophecyTrace} color="var(--color-f1-accent-magenta)" width={300} height={100} />
                         </div>
                    </div>
                </div>
            );
        }

        if (selectedChange) {
            return (
                 <div className="flex flex-col sm:flex-row items-center justify-around h-full gap-4">
                     <div className="flex-1 text-center sm:text-left">
                        <p className="text-xs text-f1-text-darker-light dark:text-f1-text-darker uppercase tracking-wider">Selected Change</p>
                        <p className="text-lg font-bold text-f1-text-light dark:text-white">{selectedChange.description}</p>
                        <p className="text-xs text-f1-text-darker-light dark:text-f1-text-darker mt-1">Cost Est: ${selectedChange.estimatedCost.toLocaleString()}</p>
                     </div>
                     <PerformanceGauge value={rawValue} label={label} isPositive={isPositive} />
                </div>
            );
        }

        if (summaryData) {
             return (
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <p className="text-xs text-f1-text-darker-light dark:text-f1-text-darker uppercase tracking-wider">Mission Debrief</p>
                        <ImpactDonutChart total={summaryData.total} high={summaryData.high} medium={summaryData.medium} low={summaryData.low} />
                    </div>
                     <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700/50 text-xs">
                        <p className="font-bold">Priority Target (Crit: {summaryData.mostCritical.criticality}/10):</p>
                        <button
                            onClick={() => onSelectChange?.(summaryData.mostCritical.id)}
                            className="w-full text-left p-2 -mx-2 rounded-md hover:bg-f1-accent-cyan/10 transition-colors group"
                            title={`Click to focus on ${summaryData.mostCritical.description}`}
                        >
                            <p className="truncate text-f1-text-light dark:text-f1-text group-hover:text-f1-accent-cyan">{summaryData.mostCritical.description}</p>
                        </button>
                     </div>
                </div>
             );
        }
        
        return (
            <div className="flex items-center justify-center h-full text-f1-text-darker-light dark:text-f1-text-darker text-sm p-4 text-center">
                Select a change from the analysis to view its data telemetry, or run an analysis to see the mission debrief.
            </div>
        );
    };

    return (
        <div 
         style={{'--color-f1-accent-cyan': '#00f5d4', '--color-f1-accent-magenta': '#ff00ff', '--color-red-500': '#EF4444'} as React.CSSProperties}
         className="glassmorphism p-4 rounded-lg min-h-[160px]"
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedChange?.id || (simulationData ? 'sim' : (summaryData ? 'summary' : 'empty'))}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {isLapDataVisible && simulationData?.finalResult && (
                    <LapDataModal 
                        result={simulationData.finalResult} 
                        onClose={() => setIsLapDataVisible(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default memo(TelemetryPanel);