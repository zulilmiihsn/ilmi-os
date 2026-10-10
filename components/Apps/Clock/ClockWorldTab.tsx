'use client';

import { memo } from 'react';
import { Minus } from 'lucide-react';

interface CityTimeData {
    city: string;
    timezone: string;
    offset: number;
    time: string;
    dayLabel: string;
    hourDiffString: string;
}

interface ClockWorldTabProps {
    cityTimes: CityTimeData[];
    direction: 'forward' | 'backward';
    theme: {
        text: string;
        textSecondary: string;
        border: string;
        activeItem: string;
    };
    isEditingCities?: boolean;
    onRemoveCity?: (city: string) => void;
}

function ClockWorldTab({ cityTimes, direction, theme, isEditingCities, onRemoveCity }: ClockWorldTabProps) {
    if (cityTimes.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-1 px-6 text-center">
                <p className="text-lg font-medium">No Cities</p>
                <p className="text-sm text-gray-500">Tap + to add a city</p>
            </div>
        );
    }
    return (
        <div
            key="world"
            className={`h-full ${direction === 'forward' ? 'animate-slide-right' : 'animate-slide-left'}`}
        >
            {cityTimes.map(city => (
                <div
                    key={city.city}
                    className={`px-6 py-4 border-b ${theme.border} ${theme.activeItem} transition-colors`}
                >
                    <div className="flex items-center justify-between">
                        {isEditingCities && (
                            <button
                                onClick={() => onRemoveCity?.(city.city)}
                                aria-label={`Remove ${city.city}`}
                                className="relative w-7 h-7 rounded-full bg-ios-red text-white flex items-center justify-center mr-3 shrink-0 active:scale-90 transition-transform after:absolute after:-inset-2 after:content-['']"
                            >
                                <Minus aria-hidden="true" size={14} />
                            </button>
                        )}
                        <div className="flex-1">
                            <div className={`${theme.text} text-xl font-medium mb-1`}>{city.city}</div>
                            <div className={`${theme.textSecondary} text-sm font-normal`}>
                                {city.dayLabel}, {city.hourDiffString}
                            </div>
                        </div>
                        <div className={`${theme.text} text-xl font-light ml-4`}>{city.time}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default memo(ClockWorldTab);
