import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { generateId } from '../../../utils/id';
import { TIMING } from '../../../constants';
import { useTheme } from '../../../utils/hooks';
import {
	Alarm,
	CITY_CHOICES,
	CityTime,
	INITIAL_CITIES,
	LapTime,
	computeCityTimes,
	zoneOffsetHours,
} from './clockUtils';

export function useClockState() {
	const baseTheme = useTheme();
	const darkMode = baseTheme.isDarkMode;

	const [currentTime, setCurrentTime] = useState(new Date());
	const [activeTab, setActiveTab] = useState<'world' | 'alarms' | 'stopwatch' | 'timers'>('world');
	const [cities, setCities] = useState<CityTime[]>(INITIAL_CITIES);
	const [isEditingCities, setIsEditingCities] = useState(false);
	const [showCityPicker, setShowCityPicker] = useState(false);

	const [alarms, setAlarms] = useState<Alarm[]>([]);
	const [stopwatchTime, setStopwatchTime] = useState(0);
	const [stopwatchRunning, setStopwatchRunning] = useState(false);
	const [lapTimes, setLapTimes] = useState<LapTime[]>([]);

	const [timerMinutes, setTimerMinutes] = useState(0);
	const [timerSeconds, setTimerSeconds] = useState(0);
	const [timerRunning, setTimerRunning] = useState(false);
	const [timerRemaining, setTimerRemaining] = useState(0);

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

	const cityTimes = useMemo(() => computeCityTimes(cities, currentTime), [currentTime, cities]);

	const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
	const [deletingAlarmId, setDeletingAlarmId] = useState<string | null>(null);
	const [resetKey, setResetKey] = useState(0);

	const handleTabChange = (newTab: typeof activeTab) => {
		const tabOrder = { world: 0, alarms: 1, stopwatch: 2, timers: 3 };
		if (activeTab === newTab) return;
		setDirection(tabOrder[newTab] > tabOrder[activeTab] ? 'forward' : 'backward');
		setActiveTab(newTab);
	};

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
		setResetKey(prev => prev + 1);
	}, []);

	const handleLap = useCallback(() => {
		const firstLap = lapTimes[0];
		const lapDiff = firstLap ? stopwatchTime - firstLap.time : stopwatchTime;
		setLapTimes(prev => [{ id: generateId('lap'), time: stopwatchTime, lapDiff }, ...prev]);
	}, [stopwatchTime, lapTimes]);

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
		setResetKey(prev => prev + 1);
	}, []);

	const handleAddCity = useCallback((timezone: string) => {
		const choice = CITY_CHOICES.find(c => c.timezone === timezone);
		if (!choice) return;
		setCities(prev =>
			prev.some(c => c.timezone === timezone)
				? prev
				: [...prev, { city: choice.city, timezone, offset: zoneOffsetHours(timezone) }]
		);
		setShowCityPicker(false);
	}, []);

	const handleRemoveCity = useCallback((city: string) => {
		setCities(prev => prev.filter(c => c.city !== city));
	}, []);

	const availableChoices = CITY_CHOICES.filter(
		c => !cities.some(existing => existing.timezone === c.timezone)
	);

	const handleAddAlarm = useCallback(() => {
		const now = new Date();
		const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
		setAlarms(prev => [
			...prev,
			{ id: generateId('alarm'), time: timeString, enabled: true, label: 'Alarm' },
		]);
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

	const theme = useMemo(
		() => ({
			bg: baseTheme.bg,
			text: baseTheme.text,
			textSecondary: baseTheme.textSecondary,
			border: baseTheme.border,
			activeItem: baseTheme.activeItem,
			header: darkMode
				? 'bg-black/80 border-ios-dark-separator'
				: 'bg-white/95 border-ios-separator',
			resetBtn: darkMode ? 'bg-ios-dark-gray5 text-white' : 'bg-ios-gray5 text-black',
			disabledBtn: darkMode ? 'bg-ios-dark-gray6 text-gray-600' : 'bg-ios-gray6 text-gray-400',
			input: darkMode
				? 'bg-ios-dark-gray6 border-ios-dark-separator text-white'
				: 'bg-ios-gray6 border-ios-gray4 text-black',
		}),
		[baseTheme, darkMode]
	);

	return {
		activeTab,
		isEditingCities,
		setIsEditingCities,
		showCityPicker,
		setShowCityPicker,
		alarms,
		setAlarms,
		stopwatchTime,
		stopwatchRunning,
		lapTimes,
		timerMinutes,
		setTimerMinutes,
		timerSeconds,
		setTimerSeconds,
		timerRunning,
		timerRemaining,
		cityTimes,
		direction,
		deletingAlarmId,
		resetKey,
		deletableAlarmId,
		setDeletableAlarmId,
		availableChoices,
		theme,
		handleTabChange,
		formatStopwatchTime,
		handleStopwatchStartStop,
		handleStopwatchReset,
		handleLap,
		formatTimerTime,
		handleTimerStart,
		handleTimerReset,
		handleAddCity,
		handleRemoveCity,
		handleAddAlarm,
		handleDeleteAlarm,
		handleToggleAlarm,
		handlePressStart,
		handlePressEnd,
	};
}
