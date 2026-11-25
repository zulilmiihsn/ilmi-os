'use client';

import { useRef } from 'react';
import { useFocusTrap } from '../../../utils/hooks/useFocusTrap';
import { useRestoreFocus } from '../../../utils/hooks/useRestoreFocus';
import { zoneOffsetHours } from './clockUtils';

interface CityPickerModalProps {
	isOpen: boolean;
	availableChoices: { city: string; timezone: string }[];
	onClose: () => void;
	onAddCity: (timezone: string) => void;
}

export default function CityPickerModal({
	isOpen,
	availableChoices,
	onClose,
	onAddCity,
}: CityPickerModalProps) {
	const cityPickerRef = useRef<HTMLDivElement>(null);
	useRestoreFocus(isOpen, cityPickerRef);
	useFocusTrap(isOpen, cityPickerRef);

	if (!isOpen) return null;

	return (
		<div
			className="absolute inset-0 z-50 flex items-center justify-center bg-black/30"
			onClick={onClose}
		>
			<div
				ref={cityPickerRef}
				onKeyDown={e => {
					if (e.key === 'Escape') onClose();
				}}
				onClick={e => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label="Add city"
				className="w-72 max-h-[70%] overflow-y-auto rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 shadow-2xl"
			>
				<div className="px-4 py-3 border-b border-black/5 dark:border-white/10">
					<h2 className="text-base font-semibold text-center">Add City</h2>
				</div>
				{availableChoices.length === 0 ? (
					<p className="px-4 py-6 text-sm text-center text-gray-500">All cities already added</p>
				) : (
					availableChoices.map(choice => {
						const offset = zoneOffsetHours(choice.timezone);
						return (
							<button
								key={choice.timezone}
								type="button"
								onClick={() => onAddCity(choice.timezone)}
								className="w-full px-4 py-3 flex items-center justify-between active:bg-black/5 dark:active:bg-white/10 transition-colors border-b last:border-b-0 border-black/5 dark:border-white/10"
							>
								<span className="text-[15px]">{choice.city}</span>
								<span className="text-xs text-gray-500 dark:text-gray-400">
									GMT{offset >= 0 ? `+${offset}` : offset}
								</span>
							</button>
						);
					})
				)}
				<button
					type="button"
					onClick={onClose}
					className="w-full py-3 text-sm text-[#ff9f0a] font-semibold active:bg-black/5 dark:active:bg-white/10 transition-colors"
				>
					Cancel
				</button>
			</div>
		</div>
	);
}
