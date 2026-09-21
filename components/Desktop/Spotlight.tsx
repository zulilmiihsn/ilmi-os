'use client';

import { useState, useEffect, useRef } from 'react';

interface SpotlightProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function Spotlight({ isOpen, onClose }: SpotlightProps) {
	const [query, setQuery] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!isOpen) return;
		setQuery('');
		// Focus input when opened; clear the timer if closed quickly.
		const timer = setTimeout(() => {
			inputRef.current?.focus();
		}, 10);
		return () => clearTimeout(timer);
	}, [isOpen]);

	useEffect(() => {
		// Close on Escape
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onClose]);

	// if (!isOpen) return null; // Removed to allow exit animations

	return (
		<>
			{/* Backdrop - click to close. Always rendered but pointer-events managed. */}
			<div
				className={`fixed inset-0 z-[10000] bg-transparent transition-opacity duration-200 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
				onClick={onClose}
			/>

			{/* Spotlight Bar */}
			<div
				className={`spotlight-container fixed top-[20%] left-1/2 -translate-x-1/2 w-[600px] z-[10001]
                transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                ${
									isOpen
										? 'opacity-100 scale-100 translate-y-0 pointer-events-auto visible'
										: 'opacity-0 scale-95 -translate-y-2 pointer-events-none invisible'
								}
                `}
			>
				<div className="bg-white/70 dark:bg-[#1E1E1E]/80 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col">
					<div className="flex items-center px-4 h-16 gap-3">
						<svg
							className="w-5 h-5 text-gray-600 opactiy-80"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2.5}
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							/>
						</svg>
						<input
							ref={inputRef}
							type="text"
							value={query}
							onChange={e => setQuery(e.target.value)}
							placeholder="Spotlight Search"
							className="flex-1 bg-transparent border-none outline-none text-[22px] text-gray-900 placeholder-gray-500 font-light h-full tracking-tight"
							autoFocus
						/>
					</div>

					{/* Results Area */}
					{query.length > 0 && (
						<div className="border-t border-gray-400/20 max-h-[400px] overflow-y-auto p-2">
							<div className="text-[11px] font-semibold text-gray-500 uppercase px-3 py-1.5 tracking-wider">
								Top Hit
							</div>
							<div className="group mx-1 px-3 py-2 bg-[#007AFF]/10 rounded-lg flex items-center gap-3 cursor-default transition-colors">
								<div className="w-7 h-7 bg-[#007AFF] rounded-[6px] flex items-center justify-center text-white shadow-sm">
									<i className="fas fa-search text-xs"></i>
								</div>
								<div>
									<div className="text-[13px] font-medium text-gray-900 dark:text-white leading-tight">
										Search for &quot;{query}&quot;
									</div>
									<div className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
										Search in Files
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</>
	);
}
