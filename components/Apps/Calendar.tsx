'use client';

import React, { useState, useRef, useLayoutEffect, useMemo, memo } from 'react';
import { useSettingsStore } from '../../stores/settings';
import { triggerHaptic } from '../../utils/haptic';
import { ChevronLeft, Plus, Search, X } from 'lucide-react';
import { useRestoreFocus } from '../../utils/hooks/useRestoreFocus';
import { useFocusTrap } from '../../utils/hooks/useFocusTrap';

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
				data-date={formatDateStr(date)}
				className="flex flex-col items-center justify-center relative cursor-pointer py-1 select-none"
			onClick={() => {
				triggerHaptic('light');
				onClick(date);
			}}
			onKeyDown={e => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					triggerHaptic('light');
					onClick(date);
				}
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
						? 'bg-ios-red text-white font-bold shadow-[0_2px_8px_rgba(255,59,48,0.4)]'
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
							isToday
								? 'bg-white/80'
								: isSelected
								? darkMode
									? 'bg-black/80'
									: 'bg-white/80'
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
			prev.darkMode === next.darkMode &&
			prev.date?.getTime() === next.date?.getTime()
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
		return (
			<div className="flex border-b border-gray-100 dark:border-white/5 py-1">
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

			// Monday-first weeks (ID locale), like iOS Calendar.
			const leadingBlanks = (firstDay + 6) % 7;
			for (let i = 0; i < leadingBlanks; i++) {
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
				<h2 className="text-xl font-bold px-3 py-2 text-ios-red">
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
					// m is always 0-11 and monthNames has exactly 12 entries.
					name: monthNames[m] ?? '',
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

	const toISODate = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

	// Real recurring holidays, computed for the current year so the dots
	// never go stale (no hardcoded years).
	const [events, setEvents] = useState<CalendarEvent[]>(() => {
		const now = new Date();
		return [
			{ date: toISODate(new Date(now.getFullYear(), 11, 25)), title: 'Christmas' },
			{ date: toISODate(new Date(now.getFullYear() + 1, 0, 1)), title: 'New Year' },
		];
	});
	const [showSearch, setShowSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchMiss, setSearchMiss] = useState(false);
	const [showAddSheet, setShowAddSheet] = useState(false);
	const [newTitle, setNewTitle] = useState('');
	const sheetRef = useRef<HTMLDivElement>(null);
	useRestoreFocus(showAddSheet, sheetRef);
	useFocusTrap(showAddSheet, sheetRef);

	const scrollToDate = (iso: string) => {
		setSelectedDate(new Date(`${iso}T12:00:00`));
		requestAnimationFrame(() => {
			document
				.querySelector(`[data-date="${iso}"]`)
				?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		});
	};

	const jumpToEvent = (query: string) => {
		const q = query.trim().toLowerCase();
		if (!q) return;
		const hit = events.find(e => e.title.toLowerCase().includes(q));
		if (!hit) {
			setSearchMiss(true);
			return;
		}
		setSearchMiss(false);
		scrollToDate(hit.date);
	};

	const handleAddEvent = () => {
		const title = newTitle.trim();
		if (!title) return;
		const iso = formatDateStr(selectedDate);
		setEvents(prev =>
			prev.some(e => e.date === iso && e.title === title) ? prev : [...prev, { date: iso, title }]
		);
		setNewTitle('');
		setShowAddSheet(false);
		scrollToDate(iso);
	};

	return (
		<div className={`w-full h-full flex flex-col font-sans select-none ${darkMode ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'}`}>
			{/* Top Header */}
			<div className={`pt-10 px-4 pb-2 flex justify-between items-center z-20 shrink-0 ${darkMode ? 'bg-black' : 'bg-[#f2f2f7]'}`}>
				<button
					onClick={scrollToToday}
					className="relative flex items-center text-ios-red gap-1 active:opacity-50 transition-opacity after:absolute after:-inset-y-2.5 after:content-['']"
				>
					<ChevronLeft aria-hidden="true" size={18} />
					<span className="text-base font-semibold">{selectedDate.getFullYear()}</span>
				</button>

				<div className="flex items-center gap-4 text-ios-red">
					<button
						onClick={() => {
							triggerHaptic('light');
							setSearchMiss(false);
							setShowSearch(prev => !prev);
						}}
						className="relative p-1 active:scale-95 transition-transform after:absolute after:-inset-2.5 after:content-['']"
						aria-label="Search Events"
						aria-expanded={showSearch}
					>
						<Search aria-hidden="true" size={16} />
					</button>
					<button
						onClick={() => {
							triggerHaptic('light');
							setNewTitle('');
							setShowAddSheet(true);
						}}
						className="relative p-1 active:scale-95 transition-transform after:absolute after:-inset-2.5 after:content-['']"
						aria-label="Add Event"
					>
						<Plus aria-hidden="true" size={18} />
					</button>
				</div>
			</div>

			{showSearch && (
				<div className={`px-4 pb-2 shrink-0 ${darkMode ? 'bg-black' : 'bg-[#f2f2f7]'}`}>
					<div className="flex items-center rounded-xl px-3 py-2 border bg-[#e3e3e8]/70 dark:bg-[#1c1c1e] border-black/5 dark:border-white/10">
						<Search aria-hidden="true" size={12} className="text-gray-400 mr-2 shrink-0" />
						<input
							type="text"
							value={searchQuery}
							onChange={e => {
								setSearchQuery(e.target.value);
								setSearchMiss(false);
							}}
							onKeyDown={e => {
								if (e.key === 'Enter') jumpToEvent(searchQuery);
								if (e.key === 'Escape') setShowSearch(false);
							}}
							placeholder="Search events"
							aria-label="Search events"
							autoFocus
							className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
						/>
						{searchQuery && (
							<button
								onClick={() => {
									setSearchQuery('');
									setSearchMiss(false);
								}}
								aria-label="Clear search"
								className="text-gray-400"
							>
								<X aria-hidden="true" size={12} />
							</button>
						)}
					</div>
					{searchMiss && (
						<p className="text-xs text-gray-400 pt-1.5 px-1">No events found</p>
					)}
				</div>
			)}

			{/* Days Header */}
			<div className={`flex text-[11px] font-bold text-gray-400 py-1.5 px-3 select-none ${darkMode ? 'bg-black' : 'bg-[#f2f2f7]'}`}>
				<div className="flex-1 grid grid-cols-7 text-center">
					<div>M</div>
					<div>T</div>
					<div>W</div>
					<div>T</div>
					<div>F</div>
					<div>S</div>
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

			{/* Add-event sheet */}
			{showAddSheet && (
				<div
					className="absolute inset-0 z-50 flex items-center justify-center bg-black/30"
					onClick={() => setShowAddSheet(false)}
				>
					<div
						ref={sheetRef}
						onKeyDown={e => {
							if (e.key === 'Escape') setShowAddSheet(false);
						}}
						onClick={e => e.stopPropagation()}
						role="dialog"
						aria-label="Add event"
						className="w-72 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden"
					>
						<div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
							<h2 className="text-base font-semibold text-center">New Event</h2>
							<p className="text-xs text-center text-gray-400 mt-0.5">
								{selectedDate.toLocaleDateString(undefined, {
									weekday: 'long',
									month: 'long',
									day: 'numeric',
								})}
							</p>
						</div>
						<div className="p-4">
							<input
								type="text"
								value={newTitle}
								onChange={e => setNewTitle(e.target.value)}
								onKeyDown={e => {
									if (e.key === 'Enter') handleAddEvent();
								}}
								placeholder="Event title"
								aria-label="Event title"
								autoFocus
								className="w-full bg-black/5 dark:bg-white/10 rounded-lg px-3 py-2 text-sm outline-none placeholder-gray-400"
							/>
						</div>
						<div className="flex divide-x divide-black/5 dark:divide-white/10 border-t border-black/5 dark:border-white/10">
							<button
								onClick={() => setShowAddSheet(false)}
								className="flex-1 py-3 text-sm text-ios-blue font-medium active:bg-black/5 dark:active:bg-white/10 transition-colors"
							>
								Cancel
							</button>
							<button
								onClick={handleAddEvent}
								disabled={!newTitle.trim()}
								className="flex-1 py-3 text-sm text-ios-blue font-semibold active:bg-black/5 dark:active:bg-white/10 transition-colors disabled:opacity-40"
							>
								Add
							</button>
						</div>
					</div>
				</div>
			)}

			{/* iOS 26 Floating Liquid Glass Action Toolbar */}
			<div className="absolute bottom-[max(env(safe-area-inset-bottom),1.25rem)] left-4 right-4 z-20 flex justify-center pointer-events-none">
				<div className="w-full max-w-[340px] px-6 py-2.5 rounded-full backdrop-blur-2xl flex items-center justify-between border shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 text-ios-red pointer-events-auto">
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
