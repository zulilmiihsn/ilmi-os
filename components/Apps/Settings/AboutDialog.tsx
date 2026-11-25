'use client';

import React from 'react';

interface AboutDialogProps {
	aboutRef: React.RefObject<HTMLDivElement>;
	onClose: () => void;
}

export function AboutDialog({ aboutRef, onClose }: AboutDialogProps) {
	return (
		<div
			className="absolute inset-0 z-50 flex items-center justify-center bg-black/30"
			onClick={onClose}
		>
			<div
				ref={aboutRef}
				onKeyDown={e => {
					if (e.key === 'Escape') onClose();
				}}
				onClick={e => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label="About iLmi"
				className="w-72 rounded-2xl bg-white dark:bg-[#1c1c1e] text-black dark:text-white border border-black/5 dark:border-white/10 shadow-2xl overflow-hidden"
			>
				<div className="px-4 py-5 text-center border-b border-black/5 dark:border-white/10">
					<h2 className="text-lg font-bold">iLmi</h2>
					<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Version 0.0.1</p>
					<p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
						An iOS &amp; macOS simulator portfolio.
					</p>
				</div>
				<button
					onClick={onClose}
					autoFocus
					className="w-full py-3 text-sm text-ios-blue font-semibold active:bg-black/5 dark:active:bg-white/10 transition-colors"
				>
					OK
				</button>
			</div>
		</div>
	);
}
