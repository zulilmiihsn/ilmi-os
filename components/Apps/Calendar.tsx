'use client';

import React, { useState, useRef, useLayoutEffect, useMemo, memo } from 'react';
import { useSettingsStore } from '../../stores/settings';
import { triggerHaptic } from '../../utils/haptic';
import { ChevronLeft, Plus, Search, X } from 'lucide-react';
import { useRestoreFocus } from '../../utils/hooks/useRestoreFocus';
import { useFocusTrap } from '../../utils/hooks/useFocusTrap';
import { type CalendarEvent, MONTH_NAMES, formatDateStr } from './calendar/calendarUtils';
import { Month } from './calendar/CalendarGrid';
import { AddEventSheet } from './calendar/AddEventSheet';

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

	// Real recurring holidays, computed for the current year so the dots
	// never go stale (no hardcoded years).
	const [events, setEvents] = useState<CalendarEvent[]>(() => {
		const now = new Date();
		return [
			{ date: formatDateStr(new Date(now.getFullYear(), 11, 25)), title: 'Christmas' },
			{ date: formatDateStr(new Date(now.getFullYear() + 1, 0, 1)), title: 'New Year' },
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
