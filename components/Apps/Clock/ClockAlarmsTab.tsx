'use client';

import { memo, useState, useEffect } from 'react';
import { Minus, Trash2 } from 'lucide-react';

interface Alarm {
	id: string;
	time: string;
	enabled: boolean;
	label: string;
}

interface ClockAlarmsTabProps {
	alarms: Alarm[];
	isEditingAlarms: boolean;
	showAddAlarm: boolean;
	deletableAlarmId: string | null;
	deletingAlarmId: string | null;
	onToggleAlarm: (id: string) => void;
	onDeleteAlarm: (id: string) => void;
	onAddAlarm: (time: string, label: string) => void;
	onCloseAddAlarm: () => void;
	onPressStart: (id: string) => void;
	onPressEnd: () => void;
	onClearDeletable: () => void;
	theme: {
		text: string;
		textSecondary: string;
		border: string;
		activeItem: string;
		input: string;
	};
}

function getDefaultAlarmTime(): string {
	const now = new Date();
	return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function ClockAlarmsTab({
	alarms,
	isEditingAlarms,
	showAddAlarm,
	deletableAlarmId,
	deletingAlarmId,
	onToggleAlarm,
	onDeleteAlarm,
	onAddAlarm,
	onCloseAddAlarm,
	onPressStart,
	onPressEnd,
	onClearDeletable,
	theme,
}: ClockAlarmsTabProps) {
	const [draftTime, setDraftTime] = useState(getDefaultAlarmTime);
	const [draftLabel, setDraftLabel] = useState('Alarm');

	useEffect(() => {
		if (showAddAlarm) {
			setDraftTime(getDefaultAlarmTime());
			setDraftLabel('Alarm');
		}
	}, [showAddAlarm]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!draftTime) return;
		onAddAlarm(draftTime, draftLabel.trim() || 'Alarm');
		onCloseAddAlarm();
	};

	return (
		<div key="alarms" className="h-full" onClick={onClearDeletable}>
			{showAddAlarm && (
				<form
					onSubmit={handleSubmit}
					onKeyDown={e => {
						if (e.key === 'Escape') onCloseAddAlarm();
					}}
					onClick={e => e.stopPropagation()}
					className={`mx-4 my-3 p-4 rounded-2xl border ${theme.border} bg-black/[0.03] dark:bg-white/[0.06] space-y-3`}
				>
					<div className="flex items-center justify-between">
						<span className="text-sm font-semibold">New Alarm</span>
						<div className="flex items-center gap-3">
							<button
								type="button"
								onClick={onCloseAddAlarm}
								className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
							>
								Cancel
							</button>
							<button
								type="submit"
								className="text-xs font-semibold text-[#ff9f0a] hover:opacity-80"
							>
								Save
							</button>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<input
							type="time"
							value={draftTime}
							onChange={e => setDraftTime(e.target.value)}
							aria-label="Alarm time"
							autoFocus
							className={`px-3 py-2 rounded-xl border text-lg font-medium tabular-nums outline-none focus:border-[#ff9f0a] ${theme.input}`}
						/>
						<input
							type="text"
							value={draftLabel}
							onChange={e => setDraftLabel(e.target.value)}
							placeholder="Label"
							aria-label="Alarm label"
							className={`flex-1 min-w-0 px-3 py-2 rounded-xl border text-sm outline-none focus:border-[#ff9f0a] ${theme.input}`}
						/>
					</div>
				</form>
			)}

			{alarms.length === 0 && !showAddAlarm ? (
				<div className="flex items-center justify-center h-full min-h-[300px]">
					<div className="text-center">
						<div className={`${theme.textSecondary} text-lg mb-2`}>No Alarms</div>
						<div className="text-gray-500 text-sm">Tap + to add an alarm</div>
					</div>
				</div>
			) : (
				<div>
					{alarms.map(alarm => (
						<div
							key={alarm.id}
							className={`alarm-item px-6 py-4 border-b ${theme.border} flex items-center justify-between select-none transition-opacity ${theme.activeItem} ${
								deletingAlarmId === alarm.id ? 'opacity-40' : ''
							}`}
							onMouseDown={() => onPressStart(alarm.id)}
							onMouseUp={onPressEnd}
							onMouseLeave={onPressEnd}
							onTouchStart={() => onPressStart(alarm.id)}
							onTouchEnd={onPressEnd}
							onTouchMove={onPressEnd}
							onClick={e => e.stopPropagation()}
						>
							<div className="flex items-center flex-1 min-w-0">
								{isEditingAlarms && (
									<button
										type="button"
										onClick={() => onDeleteAlarm(alarm.id)}
										aria-label={`Delete alarm ${alarm.time}`}
										className="relative w-7 h-7 rounded-full bg-ios-red text-white flex items-center justify-center mr-3 shrink-0 active:scale-90 transition-transform after:absolute after:-inset-2 after:content-['']"
									>
										<Minus aria-hidden="true" size={14} />
									</button>
								)}
								<div className="flex-1 min-w-0">
									<div
										className={`text-5xl font-light tabular-nums mb-1 ${
											alarm.enabled ? theme.text : 'text-gray-400 dark:text-gray-500'
										}`}
									>
										{alarm.time}
									</div>
									<div
										className={`text-base truncate ${
											alarm.enabled ? theme.textSecondary : 'text-gray-400 dark:text-gray-500'
										}`}
									>
										{alarm.label}
									</div>
								</div>
							</div>
							<div className="flex items-center gap-4 shrink-0">
								<label className="relative inline-block w-12 h-7 cursor-pointer">
									<input
										type="checkbox"
										checked={alarm.enabled}
										onChange={() => onToggleAlarm(alarm.id)}
										aria-label={`Toggle alarm ${alarm.time}`}
										className="sr-only peer"
									/>
									<div className="w-12 h-7 bg-[#e9e9ea] dark:bg-[#39393d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-ios-green"></div>
								</label>

								{deletableAlarmId === alarm.id && !isEditingAlarms && (
									<button
										type="button"
										onClick={e => {
											e.stopPropagation();
											onDeleteAlarm(alarm.id);
											onClearDeletable();
										}}
										className="text-ios-red p-2 hover:bg-red-500/15 rounded-full transition-colors"
										aria-label="Delete alarm"
									>
										<Trash2 aria-hidden="true" size={18} />
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default memo(ClockAlarmsTab);
