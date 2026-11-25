'use client';

import { memo, useMemo } from 'react';

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
	formatStopwatchTime,
	onStartStop,
	onReset,
	onLap,
	theme,
}: ClockStopwatchTabProps) {
	const { fastestId, slowestId } = useMemo(() => {
		if (lapTimes.length < 2) return { fastestId: null, slowestId: null };
		let fastest = lapTimes[0];
		let slowest = lapTimes[0];
		for (const lap of lapTimes) {
			if (fastest && lap.lapDiff < fastest.lapDiff) fastest = lap;
			if (slowest && lap.lapDiff > slowest.lapDiff) slowest = lap;
		}
		return {
			fastestId: fastest?.id ?? null,
			slowestId: slowest?.id ?? null,
		};
	}, [lapTimes]);

	const formatted = formatStopwatchTime(stopwatchTime);
	const [whole = '00:00', centis = '00'] = formatted.split('.');
	const canLapOrReset = stopwatchRunning || stopwatchTime > 0;

	return (
		<div key="stopwatch" className="flex flex-col h-full">
			<div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
				<div
					key={resetKey}
					className={`${theme.text} text-7xl font-light mb-10 tabular-nums flex items-baseline justify-center`}
				>
					<span>{whole}</span>
					<span className={`text-4xl ${theme.textSecondary}`}>.{centis}</span>
				</div>
				<div className="flex items-center justify-between w-full max-w-[300px]">
					<button
						type="button"
						onClick={stopwatchRunning ? onLap : onReset}
						disabled={!canLapOrReset}
						className={`p-1 rounded-full border-2 transition-transform active:scale-95 ${
							canLapOrReset
								? 'border-gray-400/50 dark:border-white/25'
								: 'border-gray-300/40 dark:border-white/10'
						}`}
						aria-label={stopwatchRunning ? 'Record lap' : 'Reset stopwatch'}
					>
						<span
							className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-base font-medium ${
								canLapOrReset ? theme.resetBtn : theme.disabledBtn
							}`}
						>
							{stopwatchRunning ? 'Lap' : 'Reset'}
						</span>
					</button>
					<button
						type="button"
						onClick={onStartStop}
						className={`p-1 rounded-full border-2 transition-transform active:scale-95 ${
							stopwatchRunning ? 'border-ios-red/50' : 'border-ios-green/50'
						}`}
						aria-label={stopwatchRunning ? 'Stop stopwatch' : 'Start stopwatch'}
					>
						<span
							className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-base font-medium ${
								stopwatchRunning
									? 'bg-red-500/20 text-ios-red dark:bg-red-900/50 dark:text-ios-red'
									: 'bg-green-500/20 text-ios-green dark:bg-green-900/50 dark:text-ios-green'
							}`}
						>
							{stopwatchRunning ? 'Stop' : 'Start'}
						</span>
					</button>
				</div>
			</div>
			{lapTimes.length > 0 && (
				<div className={`border-t ${theme.border} max-h-48 overflow-y-auto`}>
					{lapTimes.map((lap, index) => {
						const rowColor =
							lap.id === fastestId
								? 'text-ios-green'
								: lap.id === slowestId
									? 'text-ios-red'
									: theme.text;
						return (
							<div
								key={lap.id}
								className={`px-6 py-3 border-b ${theme.border} flex items-center justify-between ${rowColor}`}
							>
								<div
									className={
										lap.id === fastestId || lap.id === slowestId ? '' : theme.textSecondary
									}
								>
									Lap {lapTimes.length - index}
								</div>
								<div className="flex gap-8 tabular-nums">
									<div
										className={
											lap.id === fastestId || lap.id === slowestId ? '' : theme.textSecondary
										}
									>
										{formatStopwatchTime(lap.lapDiff)}
									</div>
									<div className="min-w-[100px] text-right">{formatStopwatchTime(lap.time)}</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

export default memo(ClockStopwatchTab);
