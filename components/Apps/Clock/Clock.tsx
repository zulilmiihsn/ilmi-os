'use client';

import { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { generateId } from '../../../utils/id';
import { TIMING } from '../../../constants';
import { useTheme } from '../../../utils/hooks';
import ClockWorldTab from './ClockWorldTab';
import ClockAlarmsTab from './ClockAlarmsTab';
import ClockStopwatchTab from './ClockStopwatchTab';
import ClockTimerTab from './ClockTimerTab';
import ClockTabBar from './ClockTabBar';

interface CityTime {
	city: string;
	timezone: string;
	offset: number; // Hours offset from UTC
}

interface Alarm {
	id: string;
	time: string;
	enabled: boolean;
	label: string;
}

interface LapTime {
	id: number;
	time: number;
	lapDiff: number;
}

const cities: CityTime[] = [
	{ city: 'Samarinda', timezone: 'Asia/Makassar', offset: 8 }, // WITA
	{ city: 'Malang', timezone: 'Asia/Jakarta', offset: 7 }, // WIB
];

function Clock() {
	const baseTheme = useTheme();
	const darkMode = baseTheme.isDarkMode;

	const [currentTime, setCurrentTime] = useState(new Date());
	const [activeTab, setActiveTab] = useState<'world' | 'alarms' | 'stopwatch' | 'timers'>('world');

	// Alarms state
	const [alarms, setAlarms] = useState<Alarm[]>([]);

	// Stopwatch state
	const [stopwatchTime, setStopwatchTime] = useState(0);
	const [stopwatchRunning, setStopwatchRunning] = useState(false);
	const [lapTimes, setLapTimes] = useState<LapTime[]>([]);

	// Timer state
	const [timerMinutes, setTimerMinutes] = useState(0);
	const [timerSeconds, setTimerSeconds] = useState(0);
	const [timerRunning, setTimerRunning] = useState(false);
	const [timerRemaining, setTimerRemaining] = useState(0);

	// Update time every second
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(new Date());
		}, TIMING.CLOCK_UPDATE_INTERVAL);

		return () => clearInterval(interval);
	}, []);

	// Elapsed-time sources: intervals only refresh the display, so background
	// throttling cannot silently lose time.
	const stopwatchAnchorRef = useRef(0);
	const timerDeadlineRef = useRef(0);

	// Stopwatch effect
	useEffect(() => {
		let interval: ReturnType<typeof setInterval> | undefined;
		if (stopwatchRunning) {
			stopwatchAnchorRef.current = Date.now() - stopwatchTime;
			interval = setInterval(() => {
				setStopwatchTime(Date.now() - stopwatchAnchorRef.current);
			}, TIMING.STOPWATCH_INTERVAL);
		}
		return () => clearInterval(interval);
		// stopwatchTime is intentionally read once per run to anchor elapsed time.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [stopwatchRunning]);

	// Timer effect
	useEffect(() => {
		let interval: ReturnType<typeof setInterval> | undefined;
		if (timerRunning && timerRemaining > 0) {
			timerDeadlineRef.current = Date.now() + timerRemaining;
			interval = setInterval(() => {
				const remaining = timerDeadlineRef.current - Date.now();
				if (remaining <= 0) {
					setTimerRemaining(0);
					setTimerRunning(false);
				} else {
					setTimerRemaining(remaining);
				}
			}, TIMING.TIMER_INTERVAL);
		}
		return () => clearInterval(interval);
	}, [timerRunning, timerRemaining]);

	// Calculate time for each city
	const cityTimes = useMemo(() => {
		const localTime = new Date();
		const localOffset = -localTime.getTimezoneOffset() / 60; // Local timezone offset in hours from UTC

		return cities.map(cityData => {
			// Get city time using timezone
			const cityTime = new Date(
				currentTime.toLocaleString('en-US', { timeZone: cityData.timezone })
			);

			// Format time
			const hours = cityTime.getHours();
			const minutes = cityTime.getMinutes();
			const ampm = hours >= 12 ? 'PM' : 'AM';
			const displayHours = hours % 12 || 12;
			const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

			// Calculate day difference
			const localDate = new Date(
				localTime.getFullYear(),
				localTime.getMonth(),
				localTime.getDate()
			);
			const cityDate = new Date(cityTime.getFullYear(), cityTime.getMonth(), cityTime.getDate());
			const dayDiff = Math.floor(
				(cityDate.getTime() - localDate.getTime()) / (1000 * 60 * 60 * 24)
			);

			let dayLabel = 'Today';
			if (dayDiff === 1) dayLabel = 'Tomorrow';
			else if (dayDiff === -1) dayLabel = 'Yesterday';

			// Calculate hour difference using known offsets
			const cityOffset = cityData.offset;
			const hourDiff = cityOffset - localOffset;

			// Format hour difference
			let hourDiffString = '';
			if (hourDiff === 0) {
				hourDiffString = '+0HRS';
			} else if (hourDiff > 0) {
				hourDiffString = `+${hourDiff}HRS`;
			} else {
				hourDiffString = `${hourDiff}HRS`;
			}

			return {
				...cityData,
				time: timeString,
				dayLabel,
				hourDiffString,
			};
		});
	}, [currentTime]);

	// Animation states
	const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
	const [deletingAlarmId, setDeletingAlarmId] = useState<string | null>(null);
	const [resetKey, setResetKey] = useState(0); // For triggering reset animations

	const tabOrder = { world: 0, alarms: 1, stopwatch: 2, timers: 3 };

	const handleTabChange = (newTab: typeof activeTab) => {
		if (activeTab === newTab) return;
		const isForward = tabOrder[newTab] > tabOrder[activeTab];
		setDirection(isForward ? 'forward' : 'backward');
		setActiveTab(newTab);
	};

	// Stopwatch functions
	const formatStopwatchTime = useCallback((ms: number) => {
		const minutes = Math.floor(ms / 60000);
		const seconds = Math.floor((ms % 60000) / 1000);
		const centiseconds = Math.floor((ms % 1000) / 10);
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
	}, []);

	const handleStopwatchStartStop = useCallback(() => {
		setStopwatchRunning(prev => !prev);
	}, []);

	const handleStopwatchReset = useCallback(() => {
		setStopwatchTime(0);
		setStopwatchRunning(false);
		setLapTimes([]);
		setResetKey(prev => prev + 1); // Trigger animation
	}, []);

	const handleLap = useCallback(() => {
		const firstLap = lapTimes[0];
		const lapDiff = firstLap ? stopwatchTime - firstLap.time : stopwatchTime;

		setLapTimes(prev => [{ id: prev.length + 1, time: stopwatchTime, lapDiff }, ...prev]);
	}, [stopwatchTime, lapTimes]);

	// Timer functions
	const formatTimerTime = useCallback((ms: number) => {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}, []);

	const handleTimerStart = useCallback(() => {
		if (!timerRunning && timerRemaining === 0) {
			const totalMs = (timerMinutes * 60 + timerSeconds) * 1000;
			if (totalMs > 0) {
				setTimerRemaining(totalMs);
				setTimerRunning(true);
			}
		} else {
			setTimerRunning(prev => !prev);
		}
	}, [timerRunning, timerRemaining, timerMinutes, timerSeconds]);

	const handleTimerReset = useCallback(() => {
		setTimerRemaining(0);
		setTimerRunning(false);
		setResetKey(prev => prev + 1); // Trigger animation
	}, []);

	// Alarm functions
	const handleAddAlarm = useCallback(() => {
		const now = new Date();
		const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
		const newAlarm: Alarm = {
			id: generateId('alarm'),
			time: timeString,
			enabled: true,
			label: 'Alarm',
		};
		setAlarms(prev => [...prev, newAlarm]);
	}, []);

	const handleDeleteAlarm = useCallback((id: string) => {
		setDeletingAlarmId(id);
		setTimeout(() => {
			setAlarms(prev => prev.filter(alarm => alarm.id !== id));
			setDeletingAlarmId(null);
		}, TIMING.ALARM_DELETE_DURATION);
	}, []);

	const handleToggleAlarm = useCallback((id: string) => {
		setAlarms(prev =>
			prev.map(alarm => (alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm))
		);
	}, []);

	// Delete interaction state
	const [deletableAlarmId, setDeletableAlarmId] = useState<string | null>(null);
	const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (longPressTimer.current) {
				clearTimeout(longPressTimer.current);
				longPressTimer.current = null;
			}
		};
	}, []);

	const handlePressStart = useCallback((id: string) => {
		longPressTimer.current = setTimeout(() => {
			setDeletableAlarmId(id);
			// Optional: Vibrate to indicate long press success if supported
			if (typeof navigator !== 'undefined' && navigator.vibrate) {
				navigator.vibrate(50);
			}
		}, TIMING.LONG_PRESS_DELETE_SHOW);
	}, []);

	const handlePressEnd = useCallback(() => {
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
			longPressTimer.current = null;
		}
	}, []);

	// Clear delete mode when clicking elsewhere
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (!target.closest('.alarm-item')) {
				setDeletableAlarmId(null);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	// Clock-specific theme (extends baseTheme with Clock-specific properties)
	const theme = useMemo(
		() => ({
			// Base theme properties
			bg: baseTheme.bg,
			text: baseTheme.text,
			textSecondary: baseTheme.textSecondary,
			border: baseTheme.border,
			activeItem: baseTheme.activeItem,
			// Clock-specific extensions
			header: darkMode
				? 'bg-black/80 border-ios-dark-separator'
				: 'bg-white/95 border-ios-separator',
			tabBar: `${baseTheme.tabBarBg} ${baseTheme.border}`,
			input: darkMode
				? 'bg-ios-dark-gray6 border-ios-dark-separator text-white'
				: 'bg-ios-gray6 border-ios-gray4 text-black',
			resetBtn: darkMode ? 'bg-ios-dark-gray5 text-white' : 'bg-ios-gray5 text-black',
			disabledBtn: darkMode ? 'bg-ios-dark-gray6 text-gray-600' : 'bg-ios-gray6 text-gray-400',
			tabText: baseTheme.tabActive,
			tabTextInactive: baseTheme.tabInactive,
		}),
		[baseTheme, darkMode]
	);

	return (
		<div
			className={`clock-app w-full h-full flex flex-col overflow-hidden transition-colors duration-300 ${theme.bg} ${theme.text}`}
			style={{
				fontFamily:
					'-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
				paddingTop: 'env(safe-area-inset-top, 0px)',
			}}
		>
			{/* Navigation Bar */}
			<div
				className={`flex items-center justify-between px-6 py-3 border-b z-10 backdrop-blur-md sticky top-0 transition-colors ${theme.header}`}
			>
				{activeTab === 'world' && (
					<>
						<button className={`${theme.tabText} text-base font-medium`} aria-label="Edit cities">
							Edit
						</button>
						<h1 className={`${theme.text} text-2xl font-semibold animate-slide-bottom`}>
							World Clock
						</h1>
						<button
							className={`${theme.tabText} text-2xl font-light leading-none`}
							aria-label="Add city"
						>
							+
						</button>
					</>
				)}
				{activeTab === 'alarms' && (
					<>
						<button
							onClick={() => {
								if (alarms.length > 0) {
									setAlarms([]);
									setDeletableAlarmId(null);
								}
							}}
							className={`${theme.tabText} text-base font-medium`}
							aria-label="Clear all alarms"
						>
							{alarms.length > 0 ? 'Clear' : ''}
						</button>
						<h1 className={`${theme.text} text-2xl font-semibold animate-slide-bottom`}>Alarms</h1>
						<button
							onClick={handleAddAlarm}
							className={`${theme.tabText} text-2xl font-light leading-none`}
							aria-label="Add alarm"
						>
							+
						</button>
					</>
				)}
				{activeTab === 'stopwatch' && (
					<>
						<div className="w-12"></div>
						<h1 className={`${theme.text} text-2xl font-semibold animate-slide-bottom`}>
							Stopwatch
						</h1>
						<div className="w-12"></div>
					</>
				)}
				{activeTab === 'timers' && (
					<>
						<div className="w-12"></div>
						<h1 className={`${theme.text} text-2xl font-semibold animate-slide-bottom`}>Timer</h1>
						<div className="w-12"></div>
					</>
				)}
			</div>

			{/* Main Content */}
			<div
				className="flex-1 overflow-y-auto overflow-x-hidden"
				onScroll={() => setDeletableAlarmId(null)}
			>
				{activeTab === 'world' && (
					<ClockWorldTab cityTimes={cityTimes} direction={direction} theme={theme} />
				)}

				{activeTab === 'alarms' && (
					<ClockAlarmsTab
						alarms={alarms}
						direction={direction}
						deletableAlarmId={deletableAlarmId}
						deletingAlarmId={deletingAlarmId}
						onToggleAlarm={handleToggleAlarm}
						onDeleteAlarm={handleDeleteAlarm}
						onPressStart={handlePressStart}
						onPressEnd={handlePressEnd}
						onClearDeletable={() => setDeletableAlarmId(null)}
						theme={theme}
					/>
				)}

				{activeTab === 'stopwatch' && (
					<ClockStopwatchTab
						stopwatchTime={stopwatchTime}
						stopwatchRunning={stopwatchRunning}
						lapTimes={lapTimes}
						resetKey={resetKey}
						direction={direction}
						formatStopwatchTime={formatStopwatchTime}
						onStartStop={handleStopwatchStartStop}
						onReset={handleStopwatchReset}
						onLap={handleLap}
						theme={theme}
					/>
				)}

				{activeTab === 'timers' && (
					<ClockTimerTab
						timerMinutes={timerMinutes}
						timerSeconds={timerSeconds}
						timerRunning={timerRunning}
						timerRemaining={timerRemaining}
						resetKey={resetKey}
						direction={direction}
						formatTimerTime={formatTimerTime}
						onMinutesChange={setTimerMinutes}
						onSecondsChange={setTimerSeconds}
						onStart={handleTimerStart}
						onReset={handleTimerReset}
						theme={theme}
					/>
				)}
			</div>

			{/* Bottom Tab Bar */}
			<ClockTabBar activeTab={activeTab} onTabChange={handleTabChange} theme={theme} />
		</div>
	);
}

export default memo(Clock);
