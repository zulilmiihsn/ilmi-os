'use client';

import { memo } from 'react';
import { triggerHaptic } from '../../../utils/haptic';

interface HomeScreenPaginationProps {
	currentPage: number;
	totalPages?: number;
	visible: boolean;
	onPageChange?: (page: number) => void;
}

function HomeScreenPagination({
	currentPage,
	totalPages = 2,
	visible,
	onPageChange,
}: HomeScreenPaginationProps) {
	if (!visible) return null;

	return (
		<div className="absolute bottom-[calc(max(env(safe-area-inset-bottom),0.5rem)+108px)] left-0 right-0 flex justify-center z-20 pointer-events-none">
			<div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 dark:bg-black/35 backdrop-blur-xl border border-white/20 shadow-sm">
				{Array.from({ length: totalPages }).map((_, index) => {
					const isCurrent = currentPage === index;
					return (
						<button
							key={index}
							type="button"
							onClick={() => {
								if (!isCurrent) {
									triggerHaptic('light');
									onPageChange?.(index);
								}
							}}
							aria-label={`Page ${index + 1}${isCurrent ? ' (current)' : ''}`}
							aria-current={isCurrent ? 'page' : undefined}
							className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer border-0 p-0 active:scale-90 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ios-blue ${
								isCurrent ? 'bg-white scale-110' : 'bg-white/45 hover:bg-white/70'
							}`}
						/>
					);
				})}
			</div>
		</div>
	);
}

export default memo(HomeScreenPagination);
