'use client';

import { memo } from 'react';

interface HomeScreenPaginationProps {
    currentPage: number;
    totalPages?: number;
    visible: boolean;
}

function HomeScreenPagination({
    currentPage,
    totalPages = 2,
    visible
}: HomeScreenPaginationProps) {
    if (!visible) return null;

		return (
			<div className="absolute bottom-[112px] left-0 right-0 flex justify-center gap-2 z-10 pointer-events-none">
            {Array.from({ length: totalPages }).map((_, index) => (
                <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${currentPage === index ? 'bg-white opacity-100' : 'bg-white opacity-40'
                        }`}
                    aria-label={`Page ${index + 1}${currentPage === index ? ' (current)' : ''}`}
                />
            ))}
        </div>
    );
}

export default memo(HomeScreenPagination);
