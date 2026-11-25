'use client';

import React from 'react';
import { CalendarDays, Check, X } from 'lucide-react';
import type { CalendarEvent } from './calendarUtils';

interface CalendarsSheetProps {
	showHolidays: boolean;
	showPersonal: boolean;
	onToggleHolidays: () => void;
	onTogglePersonal: () => void;
	onClose: () => void;
}

export function CalendarsSheet({
	showHolidays,
	showPersonal,
	onToggleHolidays,
	onTogglePersonal,
	onClose,
}: CalendarsSheetProps) {
	return (
		<div
			className="absolute inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-[2px] p-4 pb-20"
			onClick={onClose}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Calendars"
				className="w-full max-w-sm rounded-2xl p-4 bg-white dark:bg-[#1c1c1e] text-black dark:text-white shadow-2xl border border-black/5 dark:border-white/10"
				onClick={e => e.stopPropagation()}
			>
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-base font-semibold">Calendars</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close calendars"
						className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
					>
						<X aria-hidden="true" size={16} />
					</button>
				</div>
				<div className="space-y-2">
					<button
						type="button"
						onClick={onToggleHolidays}
						aria-pressed={showHolidays}
						className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-sm font-medium"
					>
						<span className="flex items-center gap-2.5">
							<span className="w-3 h-3 rounded-full bg-ios-red" />
							Holidays
						</span>
						{showHolidays && <Check aria-hidden="true" size={16} className="text-ios-red" />}
					</button>
					<button
						type="button"
						onClick={onTogglePersonal}
						aria-pressed={showPersonal}
						className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-sm font-medium"
					>
						<span className="flex items-center gap-2.5">
							<span className="w-3 h-3 rounded-full bg-ios-blue" />
							Personal
						</span>
						{showPersonal && <Check aria-hidden="true" size={16} className="text-ios-red" />}
					</button>
				</div>
			</div>
		</div>
	);
}

interface InboxSheetProps {
	events: CalendarEvent[];
	onSelectDate: (iso: string) => void;
	onClose: () => void;
}

export function InboxSheet({ events, onSelectDate, onClose }: InboxSheetProps) {
	return (
		<div
			className="absolute inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-[2px] p-4 pb-20"
			onClick={onClose}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label="Event Inbox"
				className="w-full max-w-sm rounded-2xl p-4 bg-white dark:bg-[#1c1c1e] text-black dark:text-white shadow-2xl border border-black/5 dark:border-white/10 max-h-[60%] flex flex-col"
				onClick={e => e.stopPropagation()}
			>
				<div className="flex items-center justify-between mb-3 shrink-0">
					<h2 className="text-base font-semibold">Upcoming Events</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close inbox"
						className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
					>
						<X aria-hidden="true" size={16} />
					</button>
				</div>
				<div className="flex-1 overflow-y-auto space-y-2">
					{events.length === 0 ? (
						<p className="text-sm text-gray-400 py-4 text-center">No events scheduled</p>
					) : (
						events.map(ev => (
							<button
								key={`${ev.date}-${ev.title}`}
								type="button"
								onClick={() => {
									onSelectDate(ev.date);
									onClose();
								}}
								className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-left hover:opacity-90 transition-opacity"
							>
								<CalendarDays aria-hidden="true" size={16} className="text-ios-red shrink-0" />
								<div className="min-w-0 flex-1">
									<div className="text-sm font-medium truncate">{ev.title}</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">{ev.date}</div>
								</div>
							</button>
						))
					)}
				</div>
			</div>
		</div>
	);
}
