'use client';

import React, { useMemo, memo } from 'react';
import { triggerHaptic } from '../../../utils/haptic';
import {
	type CalendarEvent,
	formatDateStr,
	getDaysInMonth,
	getFirstDayOfMonth,
	isSameDay,
} from './calendarUtils';

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
				<div className="h-1.5 mt-0.5 flex items-center justify-center">
					{hasEvent && (
						<div
							className={`w-1.5 h-1.5 rounded-full ${
								isToday || isSelected ? 'bg-ios-red' : 'bg-ios-red/75 dark:bg-ios-red/85'
							}`}
						/>
					)}
				</div>
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

export const Month = memo(
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
