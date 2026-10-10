'use client';

import { memo } from 'react';

interface ClockTimerTabProps {
    timerMinutes: number;
    timerSeconds: number;
    timerRunning: boolean;
    timerRemaining: number;
    resetKey: number;
    direction: 'forward' | 'backward';
    formatTimerTime: (ms: number) => string;
    onMinutesChange: (value: number) => void;
    onSecondsChange: (value: number) => void;
    onStart: () => void;
    onReset: () => void;
    theme: {
        text: string;
        input: string;
        resetBtn: string;
        disabledBtn: string;
    };
}

function ClockTimerTab({
    timerMinutes,
    timerSeconds,
    timerRunning,
    timerRemaining,
    resetKey,
    direction,
    formatTimerTime,
    onMinutesChange,
    onSecondsChange,
    onStart,
    onReset,
    theme,
}: ClockTimerTabProps) {
    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) onMinutesChange(Math.min(59, Math.max(0, val)));
        else if (e.target.value === '') onMinutesChange(0);
    };

    const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) onSecondsChange(Math.min(59, Math.max(0, val)));
        else if (e.target.value === '') onSecondsChange(0);
    };

    const isStartDisabled =
        !timerRunning && timerRemaining === 0 && timerMinutes === 0 && timerSeconds === 0;

    return (
        <div
            key="timers"
            className={`flex flex-col h-full items-center justify-center ${direction === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}`}
        >
            <div className="text-center">
                {timerRemaining > 0 ? (
                    <div
                        key="timer-display"
                        className={`${theme.text} text-7xl font-light mb-8 tabular-nums animate-zoom-in`}
                    >
                        {formatTimerTime(timerRemaining)}
                    </div>
                ) : (
                    <div className="mb-8 animate-zoom-in" key={`timer-input-${resetKey}`}>
                        <div className="flex gap-4 items-center justify-center mb-4">
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={timerMinutes}
                                    onChange={handleMinutesChange}
                                    className={`w-24 h-24 text-4xl font-light text-center rounded-xl border focus:border-ios-orange focus:outline-none transition-colors ${theme.input} disabled:opacity-50`}
                                    disabled={timerRunning}
                                    aria-label="Minutes"
                                />
                                <div className="text-gray-500 text-xs font-medium mt-2 uppercase tracking-wide">
                                    minutes
                                </div>
                            </div>
                            <div className={`${theme.text} text-4xl font-light pt-6`}>:</div>
                            <div className="flex flex-col items-center">
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={timerSeconds}
                                    onChange={handleSecondsChange}
                                    className={`w-24 h-24 text-4xl font-light text-center rounded-xl border focus:border-ios-orange focus:outline-none transition-colors ${theme.input} disabled:opacity-50`}
                                    disabled={timerRunning}
                                    aria-label="Seconds"
                                />
                                <div className="text-gray-500 text-xs font-medium mt-2 uppercase tracking-wide">
                                    seconds
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex gap-4 justify-center">
                    {timerRemaining > 0 && (
                        <button
                            onClick={onReset}
                            className={`w-20 h-20 rounded-full text-lg font-medium ${theme.resetBtn} transition-all active:scale-95`}
                            aria-label="Cancel timer"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={onStart}
                        disabled={isStartDisabled}
                        className={`w-20 h-20 rounded-full text-lg font-medium transition-all active:scale-95 ${timerRunning
                            ? 'bg-red-500/15 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                            : timerMinutes > 0 || timerSeconds > 0 || timerRemaining > 0
                                ? 'bg-green-500/15 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                                : theme.disabledBtn
                            }`}
                        aria-label={timerRunning ? 'Pause timer' : 'Start timer'}
                    >
                        {timerRunning ? 'Pause' : 'Start'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default memo(ClockTimerTab);
