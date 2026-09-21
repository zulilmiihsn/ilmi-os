'use client';

import React, { useState, useRef, useLayoutEffect, useMemo, memo } from 'react';
import { useSettingsStore } from '../../stores/settings';
import { triggerHaptic } from '../../utils/haptic';

interface CalendarEvent {
	date: string; // YYYY-MM-DD
	title: string;
	color?: string;
}

const getDaysInMonth = (year: number, month: number) => {
	return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
	return new Date(year, month, 1).getDay();
};

const getWeekNumber = (d: Date) => {
	const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
	target.setUTCDate(target.getUTCDate() + 4 - (target.getUTCDay() || 7));
	const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
	const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	return weekNo;
};

const isSameDay = (d1: Date, d2: Date) => {
	return (
		d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate()
	);
};

const formatDateStr = (date: Date) => {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Memoized Day Component
const Day = memo(
	({
		date,
		isToday,
		isSelected,
		hasEvent,
		onClick,
		setTodayRef,
		darkMode,
	}: {
		date: Date | null;
		isToday: boolean;
		isSelected: boolean;
		hasEvent: boolean;
		onClick: (date: Date) => void;
		setTodayRef?: (el: HTMLDivElement | null) => void;
		darkMode: boolean;
	}) => {
		if (!date) return <div className="flex-1"></div>;

		return (
			<div
				ref={isToday && setTodayRef ? setTodayRef : null}
				className="flex flex-col items-center justify-center relative cursor-pointer py-1 select-none"
				onClick={() => {
					triggerHaptic('light');
					onClick(date);
				}}
				role="gridcell"
				tabIndex={0}
				aria-label={`${date.toLocaleDateString(undefined, { dateStyle: 'full' })}${hasEvent ? ', has events' : ''}`}
				aria-selected={isSelected}
			>
				<div
					className={`w-8 h-8 flex items-center justify-center rounded-full text-base font-normal transition-all active:scale-90
                ${
					isToday
						? 'bg-[#ff3b30] text-white font-bold shadow-[0_2px_8px_rgba(255,59,48,0.4)]'
						: isSelected
						? darkMode
							? 'bg-white text-black font-semibold'
							: 'bg-black text-white font-semibold'
						: darkMode
						? 'text-white'
						: 'text-black'
				}`}
				>
					{date.getDate()}
				</div>
				{hasEvent && (
					<div
						className={`w-1 h-1 rounded-full mt-0.5 ${
							isToday || isSelected
								? darkMode
									? 'bg-black/50'
									: 'bg-white/50'
								: darkMode
								? 'bg-gray-500'
								: 'bg-gray-400'
						}`}
					></div>
				)}
			</div>
		);
	},
	(prev, next) => {
		return (
			prev.isToday === next.isToday &&
			prev.isSelected === next.isSelected &&
			prev.hasEvent === next.hasEvent &&
			prev.darkMode === next.darkMode
		);
	}
);
Day.displayName = 'Day';

// Memoized Week Component
const Week = memo(
	({
		weekDates,
		today,
		selectedDate,
		events,
		onDateClick,
		setTodayRef,
		darkMode,
	}: {
		weekDates: (Date | null)[];
		today: Date;
		selectedDate: Date;
		events: CalendarEvent[];
		onDateClick: (date: Date) => void;
		setTodayRef: (el: HTMLDivElement | null) => void;
		darkMode: boolean;
	}) => {
		const firstValidDate = weekDates.find(d => d !== null);
		const weekNo = firstValidDate ? getWeekNumber(firstValidDate) : '';

		return (
			<div className="flex border-b border-gray-100 dark:border-white/5 py-1">
				<div className="w-9 flex items-center justify-center text-[10px] text-gray-400 select-none">
					{weekNo}
				</div>
				<div className="flex-1 grid grid-cols-7">
					{weekDates.map((date, i) => {
						if (!date) return <div key={`empty-${i}`} className="flex-1"></div>;
						const dateStr = formatDateStr(date);
						const isToday = isSameDay(date, today);
						const isSelected = isSameDay(date, selectedDate);
						const hasEvent = events.some(e => e.date === dateStr);

						return (
							<Day
								key={date.toISOString()}
								date={date}
								isToday={isToday}
								isSelected={isSelected}
								hasEvent={hasEvent}
								onClick={onDateClick}
								setTodayRef={setTodayRef}
								darkMode={darkMode}
							/>
						);
					})}
				</div>
			</div>
		);
	}
);
Week.displayName = 'Week';

// Memoized Month Component
const Month = memo(
	({
		year,
		month,
		name,
		selectedDate,
		events,
		onDateClick,
		setTodayRef,
		darkMode,
	}: {
		year: number;
		month: number;
		name: string;
		selectedDate: Date;
		events: CalendarEvent[];
		onDateClick: (date: Date) => void;
		setTodayRef: (el: HTMLDivElement | null) => void;
		darkMode: boolean;
	}) => {
		const today = useMemo(() => new Date(), []);
		const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month]);
		const firstDay = useMemo(() => getFirstDayOfMonth(year, month), [year, month]);

		const weeks = useMemo(() => {
			const result: (Date | null)[][] = [];
			let currentWeek: (Date | null)[] = [];

			for (let i = 0; i < firstDay; i++) {
				currentWeek.push(null);
			}

			for (let day = 1; day <= daysInMonth; day++) {
				currentWeek.push(new Date(year, month, day));
				if (currentWeek.length === 7) {
					result.push(currentWeek);
					currentWeek = [];
				}
			}

			if (currentWeek.length > 0) {
				while (currentWeek.length < 7) {
					currentWeek.push(null);
				}
				result.push(currentWeek);
			}

			return result;
		}, [year, month, daysInMonth, firstDay]);

		return (
			<div className="mb-6 px-3">
				<h2 className="text-xl font-bold px-3 py-2 text-[#ff3b30]">
					{name} {year !== today.getFullYear() ? year : ''}
				</h2>
				<div className="rounded-2xl overflow-hidden bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 shadow-xs">
					{weeks.map((weekDates, idx) => (
						<Week
							key={idx}
							weekDates={weekDates}
							today={today}
							selectedDate={selectedDate}
							events={events}
							onDateClick={onDateClick}
							setTodayRef={setTodayRef}
							darkMode={darkMode}
						/>
					))}
				</div>
			</div>
		);
	}
);
Month.displayName = 'Month';

function Calendar() {
	const { darkMode } = useSettingsStore();
	const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
	const scrollRef = useRef<HTMLDivElement>(null);
	const todayRef = useRef<HTMLDivElement | null>(null);

	const months = useMemo(() => {
		const result = [];
		const currentYear = new Date().getFullYear();
		const monthNames = [
			'January', 'February', 'March', 'April', 'May', 'June',
			'July', 'August', 'September', 'October', 'November', 'December',
		];

		for (let y = currentYear - 1; y <= currentYear + 1; y++) {
			for (let m = 0; m < 12; m++) {
				result.push({
					year: y,
					month: m,
					name: monthNames[m],
				});
			}
		}
		return result;
	}, []);

	const scrollToToday = () => {
		triggerHaptic('medium');
		setSelectedDate(new Date());
		if (todayRef.current) {
			todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	};

	useLayoutEffect(() => {
		if (todayRef.current) {
			todayRef.current.scrollIntoView({ behavior: 'auto', block: 'center' });
		}
	}, []);

	const [events] = useState<CalendarEvent[]>([
		{ date: '2026-08-25', title: 'iOS 26 Liquid Glass Launch' },
		{ date: '2026-09-15', title: 'Apple Keynote' },
		{ date: '2026-12-25', title: 'Christmas' },
		{ date: '2027-01-01', title: 'New Year' },
	]);

	return (
		<div className={`w-full h-full flex flex-col font-sans select-none ${darkMode ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'}`}>
			{/* Top Header */}
			<div className={`pt-10 px-4 pb-2 flex justify-between items-center z-20 shrink-0 ${darkMode ? 'bg-black' : 'bg-[#f2f2f7]'}`}>
				<button
					onClick={scrollToToday}
					className="flex items-center text-[#ff3b30] gap-1 active:opacity-50 transition-opacity"
				>
					<i className="fas fa-chevron-left text-lg"></i>
					<span className="text-base font-semibold">{selectedDate.getFullYear()}</span>
				</button>

				<div className="flex items-center gap-4 text-[#ff3b30]">
					<button onClick={() => triggerHaptic('light')} className="p-1 active:scale-95 transition-transform" aria-label="Search Events">
						<i className="fas fa-search text-base"></i>
					</button>
					<button onClick={() => triggerHaptic('light')} className="p-1 active:scale-95 transition-transform" aria-label="Add Event">
						<i className="fas fa-plus text-lg"></i>
					</button>
				</div>
			</div>

			{/* Days Header */}
			<div className={`flex text-[11px] font-bold text-gray-400 py-1.5 px-3 select-none ${darkMode ? 'bg-black' : 'bg-[#f2f2f7]'}`}>
				<div className="w-9 text-center">Wk</div>
				<div className="flex-1 grid grid-cols-7 text-center">
					<div>S</div>
					<div>M</div>
					<div>T</div>
					<div>W</div>
					<div>T</div>
					<div>F</div>
					<div>S</div>
				</div>
			</div>

			{/* Scrollable Month List */}
			<div className="flex-1 overflow-y-auto pb-24" ref={scrollRef}>
				{months.map(m => (
					<Month
						key={`${m.year}-${m.month}`}
						year={m.year}
						month={m.month}
						name={m.name}
						selectedDate={selectedDate}
						events={events}
						onDateClick={date => setSelectedDate(date)}
						setTodayRef={el => {
							todayRef.current = el;
						}}
						darkMode={darkMode}
					/>
				))}
			</div>

			{/* iOS 26 Floating Liquid Glass Action Toolbar */}
			<div className="absolute bottom-5 left-4 right-4 z-20 flex justify-center pointer-events-none">
				<div className="w-full max-w-[340px] px-6 py-2.5 rounded-full backdrop-blur-2xl flex items-center justify-between border shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 text-[#ff3b30] pointer-events-auto">
					<button
						onClick={scrollToToday}
						className="font-semibold text-sm active:scale-95 transition-transform"
					>
						Today
					</button>
					<button
						onClick={() => triggerHaptic('light')}
						className="font-normal text-sm active:scale-95 transition-transform"
					>
						Calendars
					</button>
					<button
						onClick={() => triggerHaptic('light')}
						className="font-normal text-sm active:scale-95 transition-transform"
					>
						Inbox
					</button>
				</div>
			</div>
		</div>
	);
}

export default memo(Calendar);
