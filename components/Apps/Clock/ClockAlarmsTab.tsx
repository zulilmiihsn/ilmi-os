'use client';

import { memo } from 'react';

interface Alarm {
    id: string;
    time: string;
    enabled: boolean;
    label: string;
}

interface ClockAlarmsTabProps {
    alarms: Alarm[];
    direction: 'forward' | 'backward';
    deletableAlarmId: string | null;
    deletingAlarmId: string | null;
    onToggleAlarm: (id: string) => void;
    onDeleteAlarm: (id: string) => void;
    onPressStart: (id: string) => void;
    onPressEnd: () => void;
    onClearDeletable: () => void;
    theme: {
        text: string;
        textSecondary: string;
        border: string;
        activeItem: string;
    };
}

function ClockAlarmsTab({
    alarms,
    direction,
    deletableAlarmId,
    deletingAlarmId,
    onToggleAlarm,
    onDeleteAlarm,
    onPressStart,
    onPressEnd,
    onClearDeletable,
    theme,
}: ClockAlarmsTabProps) {
    return (
        <div
            key="alarms"
            className={`h-full ${direction === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}`}
            onClick={onClearDeletable}
        >
            {alarms.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[300px]">
                    <div className="text-center animate-zoom-in">
                        <div className={`${theme.textSecondary} text-lg mb-2`}>No Alarms</div>
                        <div className="text-gray-500 text-sm">Tap + to add an alarm</div>
                    </div>
                </div>
            ) : (
                <div>
                    {alarms.map(alarm => (
                        <div
                            key={alarm.id}
                            className={`alarm-item px-6 py-4 border-b ${theme.border} flex items-center justify-between select-none transition-all ${theme.activeItem} ${deletingAlarmId === alarm.id ? 'deleting-alarm' : ''
                                }`}
                            onMouseDown={() => onPressStart(alarm.id)}
                            onMouseUp={onPressEnd}
                            onMouseLeave={onPressEnd}
                            onTouchStart={() => onPressStart(alarm.id)}
                            onTouchEnd={onPressEnd}
                            onTouchMove={onPressEnd}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex-1">
                                <div
                                    className={`text-5xl font-light mb-1 ${alarm.enabled ? theme.text : 'text-gray-600'}`}
                                >
                                    {alarm.time}
                                </div>
                                <div
                                    className={`text-base ${alarm.enabled ? theme.textSecondary : 'text-gray-600'}`}
                                >
                                    {alarm.label}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="relative inline-block w-12 h-7">
                                    <input
                                        type="checkbox"
                                        checked={alarm.enabled}
                                        onChange={() => onToggleAlarm(alarm.id)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-7 bg-[#e9e9ea] dark:bg-[#39393d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-ios-green"></div>
                                </label>

                                {deletableAlarmId === alarm.id && (
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            onDeleteAlarm(alarm.id);
                                            onClearDeletable();
                                        }}
                                        className="text-ios-red p-2 delete-btn-enter hover:bg-red-900/20 rounded-full transition-colors"
                                        aria-label="Delete alarm"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
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
