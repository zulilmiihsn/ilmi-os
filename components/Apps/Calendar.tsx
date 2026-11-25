'use client';

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, memo } from 'react';
import { useSettingsStore } from '../../stores/settings';
import { appStorage } from '../../utils/storage';
import { triggerHaptic } from '../../utils/haptic';
import { ChevronLeft, Plus, Search, Trash2, X } from 'lucide-react';
import { useRestoreFocus } from '../../utils/hooks/useRestoreFocus';
import { useFocusTrap } from '../../utils/hooks/useFocusTrap';
import {
	CALENDAR_STORAGE_KEY,
	type CalendarEvent,
	MONTH_NAMES,
	formatDateStr,
	getDefaultCalendarEvents,
	resolveInitialCalendarEvents,
} from './Calendar/calendarUtils';
import { Month } from './Calendar/CalendarGrid';
import { AddEventSheet } from './Calendar/AddEventSheet';
import { CalendarsSheet, InboxSheet } from './Calendar/CalendarBottomSheets';

function Calendar() {
	const { darkMode } = useSettingsStore();
	const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
	const scrollRef = useRef<HTMLDivElement>(null);
	const todayRef = useRef<HTMLDivElement | null>(null);

	const months = useMemo(() => {
		const result = [];
		const currentYear = new Date().getFullYear();

		for (let y = currentYear - 1; y <= currentYear + 1; y++) {
			for (let m = 0; m < 12; m++) {
				result.push({
					year: y,
					month: m,
					// m is always 0-11 and MONTH_NAMES has exactly 12 entries.
					name: MONTH_NAMES[m] ?? '',
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

	const [events, setEvents] = useState<CalendarEvent[]>(() => getDefaultCalendarEvents());
	const [mounted, setMounted] = useState(false);
	const [saveFailed, setSaveFailed] = useState(false);
	const skipInitialSave = useRef(false);

	useEffect(() => {
		const stored = appStorage.load<unknown>(CALENDAR_STORAGE_KEY, null);
		let destinationPresent = false;
		try {
			destinationPresent = window.localStorage.getItem(CALENDAR_STORAGE_KEY) !== null;
		} catch {
			destinationPresent = false;
		}
		const resolved = resolveInitialCalendarEvents(stored, destinationPresent);
		setEvents(resolved.events);
		skipInitialSave.current = resolved.skipInitialSave;
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;
		if (skipInitialSave.current) {
			skipInitialSave.current = false;
			return;
		}
		setSaveFailed(!appStorage.save(CALENDAR_STORAGE_KEY, events));
	}, [events, mounted]);

	const [showSearch, setShowSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchMiss, setSearchMiss] = useState(false);
	const [showAddSheet, setShowAddSheet] = useState(false);
	const [showCalendars, setShowCalendars] = useState(false);
	const [showInbox, setShowInbox] = useState(false);
	const [showHolidays, setShowHolidays] = useState(true);
	const [showPersonal, setShowPersonal] = useState(true);
	const [newTitle, setNewTitle] = useState('');
	const sheetRef = useRef<HTMLDivElement>(null);
	useRestoreFocus(showAddSheet, sheetRef);
	useFocusTrap(showAddSheet, sheetRef);

	const visibleEvents = useMemo(() => {
		return events.filter(ev => {
			const isHoliday = ev.title === 'Christmas' || ev.title === 'New Year';
			return isHoliday ? showHolidays : showPersonal;
		});
	}, [events, showHolidays, showPersonal]);

	const selectedDateIso = formatDateStr(selectedDate);
	const selectedDayEvents = useMemo(
		() => visibleEvents.filter(ev => ev.date === selectedDateIso),
		[visibleEvents, selectedDateIso]
	);

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

	const handleDeleteEvent = (target: CalendarEvent) => {
		triggerHaptic('light');
		setEvents(prev => prev.filter(e => !(e.date === target.date && e.title === target.title)));
	};

	return (
		<div
			className={`relative w-full h-full flex flex-col overflow-hidden font-sans select-none ${darkMode ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'}`}
		>
			{saveFailed && (
				<div
					role="alert"
					className="mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 shrink-0"
				>
					Could not save calendar events. Storage may be unavailable.
				</div>
			)}

			{/* Top Header */}
			<div
				className={`pt-3 px-4 pb-2 flex justify-between items-center z-20 shrink-0 ${darkMode ? 'bg-black' : 'bg-[#f2f2f7]'}`}
			>
				<button
					type="button"
					onClick={scrollToToday}
					className="relative flex items-center text-ios-red gap-1 active:opacity-50 transition-opacity after:absolute after:-inset-y-2.5 after:content-['']"
				>
					<ChevronLeft aria-hidden="true" size={18} />
					<span className="text-base font-semibold">{selectedDate.getFullYear()}</span>
				</button>

				<div className="flex items-center gap-4 text-ios-red">
					<button
						type="button"
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
						type="button"
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
								type="button"
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
						<p className="text-xs text-gray-500 dark:text-gray-400 pt-1.5 px-1">No events found</p>
					)}
				</div>
			)}

			{/* Days Header */}
			<div
				className={`flex text-[11px] font-bold text-gray-500 dark:text-gray-400 py-1.5 px-3 select-none ${darkMode ? 'bg-black' : 'bg-[#f2f2f7]'}`}
			>
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
			<div className="flex-1 overflow-y-auto pb-4" ref={scrollRef}>
				{months.map(m => (
					<Month
						key={`${m.year}-${m.month}`}
						year={m.year}
						month={m.month}
						name={m.name}
						selectedDate={selectedDate}
						events={visibleEvents}
						onDateClick={date => setSelectedDate(date)}
						setTodayRef={el => {
							todayRef.current = el;
						}}
						darkMode={darkMode}
					/>
				))}
			</div>

			{/* Selected Day Agenda Card */}
			<div
				className={`shrink-0 mx-3 mb-20 rounded-2xl border px-3.5 py-2.5 shadow-xs ${
					darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/5'
				}`}
			>
				<div className="flex items-center justify-between mb-1.5">
					<h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300">
						{selectedDate.toLocaleDateString(undefined, {
							weekday: 'short',
							month: 'short',
							day: 'numeric',
						})}
					</h3>
					<span className="text-[11px] text-gray-500 dark:text-gray-400">
						{selectedDayEvents.length === 0
							? 'No events'
							: `${selectedDayEvents.length} ${selectedDayEvents.length === 1 ? 'event' : 'events'}`}
					</span>
				</div>
				{selectedDayEvents.length > 0 && (
					<ul className="space-y-1 max-h-24 overflow-y-auto">
						{selectedDayEvents.map(ev => (
							<li
								key={`${ev.date}-${ev.title}`}
								className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-lg bg-[#f2f2f7] dark:bg-[#2c2c2e]"
							>
								<span className="flex items-center gap-2 min-w-0">
									<span className="w-1.5 h-1.5 rounded-full bg-ios-red shrink-0" />
									<span className="truncate font-medium">{ev.title}</span>
								</span>
								<button
									type="button"
									onClick={() => handleDeleteEvent(ev)}
									aria-label={`Delete ${ev.title}`}
									className="p-1 text-gray-400 hover:text-ios-red transition-colors shrink-0"
								>
									<Trash2 aria-hidden="true" size={12} />
								</button>
							</li>
						))}
					</ul>
				)}
			</div>

			{showAddSheet && (
				<AddEventSheet
					sheetRef={sheetRef}
					selectedDate={selectedDate}
					newTitle={newTitle}
					setNewTitle={setNewTitle}
					onClose={() => setShowAddSheet(false)}
					onAdd={handleAddEvent}
				/>
			)}

			{showCalendars && (
				<CalendarsSheet
					showHolidays={showHolidays}
					showPersonal={showPersonal}
					onToggleHolidays={() => setShowHolidays(v => !v)}
					onTogglePersonal={() => setShowPersonal(v => !v)}
					onClose={() => setShowCalendars(false)}
				/>
			)}

			{showInbox && (
				<InboxSheet
					events={visibleEvents}
					onSelectDate={scrollToDate}
					onClose={() => setShowInbox(false)}
				/>
			)}

			{/* iOS 26 Floating Liquid Glass Action Toolbar */}
			<div className="absolute bottom-[max(env(safe-area-inset-bottom),1.25rem)] left-4 right-4 z-20 flex justify-center pointer-events-none">
				<div className="w-full max-w-[340px] px-6 py-2.5 rounded-full backdrop-blur-2xl flex items-center justify-between border shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] bg-white/80 dark:bg-[#1c1c1e]/80 border-black/5 dark:border-white/15 text-ios-red pointer-events-auto">
					<button
						type="button"
						onClick={scrollToToday}
						className="font-semibold text-sm active:scale-95 transition-transform"
					>
						Today
					</button>
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							setShowInbox(false);
							setShowCalendars(prev => !prev);
						}}
						aria-expanded={showCalendars}
						className="font-normal text-sm active:scale-95 transition-transform"
					>
						Calendars
					</button>
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							setShowCalendars(false);
							setShowInbox(prev => !prev);
						}}
						aria-expanded={showInbox}
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
