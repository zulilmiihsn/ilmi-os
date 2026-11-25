'use client';

import { memo } from 'react';
import { Bell, X } from 'lucide-react';

interface ClockTimerTabProps {
	timerHours: number;
	timerMinutes: number;
	timerSeconds: number;
	timerRunning: boolean;
	timerRemaining: number;
	timerTotalMs: number;
	timerCompleted: boolean;
	resetKey: number;
	formatTimerTime: (ms: number) => string;
	onHoursChange: (value: number) => void;
	onMinutesChange: (value: number) => void;
	onSecondsChange: (value: number) => void;
	onStart: () => void;
	onReset: () => void;
	onDismissCompleted: () => void;
	theme: {
		text: string;
		input: string;
		resetBtn: string;
		disabledBtn: string;
	};
}

const RING_RADIUS = 104;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ClockTimerTab({
	timerHours,
	timerMinutes,
	timerSeconds,
	timerRunning,
	timerRemaining,
	timerTotalMs,
	timerCompleted,
	resetKey,
	formatTimerTime,
	onHoursChange,
	onMinutesChange,
	onSecondsChange,
	onStart,
	onReset,
	onDismissCompleted,
	theme,
}: ClockTimerTabProps) {
	const handleNumberChange =
		(max: number, setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
			const val = parseInt(e.target.value, 10);
			if (!Number.isNaN(val)) setter(Math.min(max, Math.max(0, val)));
			else if (e.target.value === '') setter(0);
		};

	const hasConfiguredTime = timerHours > 0 || timerMinutes > 0 || timerSeconds > 0;
	const isStartDisabled = !timerRunning && timerRemaining === 0 && !hasConfiguredTime;
	const progress = timerTotalMs > 0 ? Math.max(0, Math.min(1, timerRemaining / timerTotalMs)) : 0;
	const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

	return (
		<div key="timers" className="flex flex-col h-full items-center justify-center px-4 py-6">
			{timerCompleted && (
				<div
					role="alert"
					className="mb-5 w-full max-w-[300px] flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-[#ff9f0a]/15 border border-[#ff9f0a]/40 text-[#ff9f0a]"
				>
					<span className="flex items-center gap-2 text-sm font-semibold">
						<Bell aria-hidden="true" size={16} />
						Timer Done
					</span>
					<button
						type="button"
						onClick={onDismissCompleted}
						aria-label="Dismiss timer notification"
						className="p-1 rounded-full hover:bg-[#ff9f0a]/20 transition-colors"
					>
						<X aria-hidden="true" size={14} />
					</button>
				</div>
			)}

			<div className="text-center w-full max-w-[320px]">
				{timerRemaining > 0 ? (
					<div
						key="timer-display"
						className="relative w-60 h-60 mx-auto mb-8 flex items-center justify-center"
					>
						<svg
							aria-hidden="true"
							className="absolute inset-0 w-full h-full -rotate-90"
							viewBox="0 0 240 240"
						>
							<circle
								cx="120"
								cy="120"
								r={RING_RADIUS}
								fill="none"
								stroke="currentColor"
								strokeWidth="6"
								className="text-black/10 dark:text-white/15"
							/>
							<circle
								cx="120"
								cy="120"
								r={RING_RADIUS}
								fill="none"
								stroke="#ff9f0a"
								strokeWidth="6"
								strokeLinecap="round"
								strokeDasharray={RING_CIRCUMFERENCE}
								strokeDashoffset={strokeDashoffset}
								className="transition-[stroke-dashoffset] duration-150"
							/>
						</svg>
						<div className={`${theme.text} text-5xl font-light tabular-nums relative z-10`}>
							{formatTimerTime(timerRemaining)}
						</div>
					</div>
				) : (
					<div className="mb-8" key={`timer-input-${resetKey}`}>
						<div className="flex gap-2 items-start justify-center">
							<div className="flex flex-col items-center">
								<input
									type="number"
									min="0"
									max="23"
									value={timerHours}
									onChange={handleNumberChange(23, onHoursChange)}
									className={`w-20 h-20 text-3xl font-light text-center tabular-nums rounded-xl border focus:border-[#ff9f0a] focus:outline-none transition-colors ${theme.input} disabled:opacity-50`}
									disabled={timerRunning}
									aria-label="Hours"
								/>
								<div className="text-gray-500 text-xs font-medium mt-2 uppercase tracking-wide">
									hours
								</div>
							</div>
							<div className={`${theme.text} h-20 flex items-center text-3xl font-light`}>:</div>
							<div className="flex flex-col items-center">
								<input
									type="number"
									min="0"
									max="59"
									value={timerMinutes}
									onChange={handleNumberChange(59, onMinutesChange)}
									className={`w-20 h-20 text-3xl font-light text-center tabular-nums rounded-xl border focus:border-[#ff9f0a] focus:outline-none transition-colors ${theme.input} disabled:opacity-50`}
									disabled={timerRunning}
									aria-label="Minutes"
								/>
								<div className="text-gray-500 text-xs font-medium mt-2 uppercase tracking-wide">
									min
								</div>
							</div>
							<div className={`${theme.text} h-20 flex items-center text-3xl font-light`}>:</div>
							<div className="flex flex-col items-center">
								<input
									type="number"
									min="0"
									max="59"
									value={timerSeconds}
									onChange={handleNumberChange(59, onSecondsChange)}
									className={`w-20 h-20 text-3xl font-light text-center tabular-nums rounded-xl border focus:border-[#ff9f0a] focus:outline-none transition-colors ${theme.input} disabled:opacity-50`}
									disabled={timerRunning}
									aria-label="Seconds"
								/>
								<div className="text-gray-500 text-xs font-medium mt-2 uppercase tracking-wide">
									sec
								</div>
							</div>
						</div>
					</div>
				)}
				<div className="flex items-center justify-between w-full max-w-[300px] mx-auto">
					<button
						type="button"
						onClick={onReset}
						disabled={timerRemaining === 0}
						className={`p-1 rounded-full border-2 transition-transform active:scale-95 ${
							timerRemaining > 0
								? 'border-gray-400/50 dark:border-white/25'
								: 'border-gray-300/40 dark:border-white/10'
						}`}
						aria-label="Cancel timer"
					>
						<span
							className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-base font-medium ${
								timerRemaining > 0 ? theme.resetBtn : theme.disabledBtn
							}`}
						>
							Cancel
						</span>
					</button>
					<button
						type="button"
						onClick={onStart}
						disabled={isStartDisabled}
						className={`p-1 rounded-full border-2 transition-transform active:scale-95 ${
							timerRunning
								? 'border-[#ff9f0a]/50'
								: hasConfiguredTime || timerRemaining > 0
									? 'border-ios-green/50'
									: 'border-gray-300/40 dark:border-white/10'
						}`}
						aria-label={timerRunning ? 'Pause timer' : 'Start timer'}
					>
						<span
							className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-base font-medium ${
								timerRunning
									? 'bg-[#ff9f0a]/20 text-[#ff9f0a] dark:bg-[#ff9f0a]/25 dark:text-[#ff9f0a]'
									: hasConfiguredTime || timerRemaining > 0
										? 'bg-green-500/20 text-ios-green dark:bg-green-900/50 dark:text-ios-green'
										: theme.disabledBtn
							}`}
						>
							{timerRunning ? 'Pause' : timerRemaining > 0 ? 'Resume' : 'Start'}
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}

export default memo(ClockTimerTab);
