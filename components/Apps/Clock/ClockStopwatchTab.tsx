'use client';

import { memo } from 'react';

interface LapTime {
    id: string;
    time: number;
    lapDiff: number;
}

interface ClockStopwatchTabProps {
    stopwatchTime: number;
    stopwatchRunning: boolean;
    lapTimes: LapTime[];
    resetKey: number;
    direction: 'forward' | 'backward';
    formatStopwatchTime: (ms: number) => string;
    onStartStop: () => void;
    onReset: () => void;
    onLap: () => void;
    theme: {
        text: string;
        textSecondary: string;
        border: string;
        resetBtn: string;
        disabledBtn: string;
    };
}

function ClockStopwatchTab({
    stopwatchTime,
    stopwatchRunning,
    lapTimes,
    resetKey,
    direction,
    formatStopwatchTime,
    onStartStop,
    onReset,
    onLap,
    theme,
}: ClockStopwatchTabProps) {
    return (
        <div
            key="stopwatch"
            className={`flex flex-col h-full ${direction === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}`}
        >
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div
                        key={resetKey}
                        className={`${theme.text} text-7xl font-light mb-8 tabular-nums flex items-baseline justify-center animate-zoom-in`}
                    >
                        <span>{formatStopwatchTime(stopwatchTime).split('.')[0]}</span>
                        <span className={`text-4xl ${theme.textSecondary}`}>
                            .{formatStopwatchTime(stopwatchTime).split('.')[1]}
                        </span>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={stopwatchRunning ? onLap : onReset}
                            disabled={!stopwatchRunning && stopwatchTime === 0}
                            className={`w-20 h-20 rounded-full text-lg font-medium transition-all active:scale-95 ${stopwatchRunning || stopwatchTime > 0 ? theme.resetBtn : theme.disabledBtn
                                }`}
                            aria-label={stopwatchRunning ? 'Record lap' : 'Reset stopwatch'}
                        >
                            {stopwatchRunning ? 'Lap' : 'Reset'}
                        </button>
                        <button
                            onClick={onStartStop}
                            className={`w-20 h-20 rounded-full text-lg font-medium transition-all active:scale-95 ${stopwatchRunning
                                ? 'bg-red-500/15 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                                : 'bg-green-500/15 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                                }`}
                            aria-label={stopwatchRunning ? 'Stop stopwatch' : 'Start stopwatch'}
                        >
                            {stopwatchRunning ? 'Stop' : 'Start'}
                        </button>
                    </div>
                </div>
            </div>
            {lapTimes.length > 0 && (
                <div
                    className={`border-t ${theme.border} max-h-48 overflow-y-auto animate-slide-bottom`}
                >
                    {lapTimes.map((lap, index) => (
                        <div
                            key={lap.id}
                            className={`px-6 py-3 border-b ${theme.border} flex items-center justify-between animate-fade-in`}
                        >
                            <div className={theme.textSecondary}>Lap {lapTimes.length - index}</div>
                            <div className="flex gap-8 tabular-nums">
                                <div className={theme.textSecondary}>{formatStopwatchTime(lap.lapDiff)}</div>
                                <div className={`${theme.text} min-w-[100px] text-right`}>
                                    {formatStopwatchTime(lap.time)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default memo(ClockStopwatchTab);
