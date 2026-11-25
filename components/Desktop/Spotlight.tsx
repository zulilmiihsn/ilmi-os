'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { FileText, Folder, Search } from 'lucide-react';
import { useAppsStore } from '../../stores/apps';
import { isMacosApp } from '../../types';
import { searchItems } from '../../utils/fileSystem';
import { useRestoreFocus } from '../../utils/hooks/useRestoreFocus';

interface SpotlightProps {
	isOpen: boolean;
	onClose: () => void;
}

interface SpotlightResult {
	id: string;
	title: string;
	subtitle: string;
	kind: 'app' | 'folder' | 'file';
	icon?: string;
	onSelect: () => void;
}

export default function Spotlight({ isOpen, onClose }: SpotlightProps) {
	const [query, setQuery] = useState('');
	const [activeIndex, setActiveIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const allApps = useAppsStore(state => state.apps);
	useRestoreFocus(isOpen, containerRef);

	const openDesktopApp = useCallback(
		(appId: string) => {
			window.dispatchEvent(new CustomEvent<string>('ilmi:open-app', { detail: appId }));
			onClose();
		},
		[onClose]
	);

	const results = useMemo<SpotlightResult[]>(() => {
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return [];

		const appMatches: SpotlightResult[] = allApps
			.filter(
				app =>
					isMacosApp(app) &&
					(app.name.toLowerCase().includes(trimmed) || app.id.toLowerCase().includes(trimmed))
			)
			.slice(0, 6)
			.map(app => ({
				id: `app-${app.id}`,
				title: app.name,
				subtitle: 'Application',
				kind: 'app',
				icon: app.icon,
				onSelect: () => openDesktopApp(app.id),
			}));

		const fileMatches: SpotlightResult[] = searchItems(trimmed)
			.slice(0, 6)
			.map(item => ({
				id: `fs-${item.id}`,
				title: item.name,
				subtitle: item.type === 'folder' ? 'Folder — Open in Finder' : 'File — Open in Finder',
				kind: item.type,
				onSelect: () => openDesktopApp('finder'),
			}));

		return [...appMatches, ...fileMatches];
	}, [query, allApps, openDesktopApp]);

	useEffect(() => {
		setActiveIndex(0);
	}, [query]);

	useEffect(() => {
		if (!isOpen) return;
		setQuery('');
		setActiveIndex(0);
		// Focus input when opened; clear the timer if closed quickly.
		const timer = setTimeout(() => {
			inputRef.current?.focus();
		}, 10);
		return () => clearTimeout(timer);
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault();
				onClose();
			} else if (e.key === 'ArrowDown' && results.length > 0) {
				e.preventDefault();
				setActiveIndex(prev => (prev + 1) % results.length);
			} else if (e.key === 'ArrowUp' && results.length > 0) {
				e.preventDefault();
				setActiveIndex(prev => (prev - 1 + results.length) % results.length);
			} else if (e.key === 'Enter' && results.length > 0) {
				e.preventDefault();
				const picked = results[activeIndex] ?? results[0];
				picked?.onSelect();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onClose, results, activeIndex]);

	return (
		<>
			{/* Backdrop - click to close. Always rendered but pointer-events managed. */}
			<div
				className={`fixed inset-0 z-[10000] bg-transparent transition-opacity duration-200 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
				onClick={onClose}
			/>

			{/* Spotlight Bar */}
			<div
				ref={containerRef}
				role={isOpen ? 'dialog' : undefined}
				aria-label={isOpen ? 'Spotlight Search' : undefined}
				aria-hidden={!isOpen}
				className={`spotlight-container fixed top-[20%] left-1/2 -translate-x-1/2 w-[min(600px,calc(100vw-2rem))] z-[10001]
                ${
									isOpen
										? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
										: 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
								}
                `}
				// Visibility (not just opacity) keeps the closed bar out of
				// keyboard focus. The delayed hide preserves the exit
				// animation, while showing flips immediately so that
				// programmatic focus is not swallowed by a hidden element.
				style={{
					visibility: isOpen ? 'visible' : 'hidden',
					transition:
						'opacity 0.3s cubic-bezier(0.32,0.72,0,1), transform 0.3s cubic-bezier(0.32,0.72,0,1), visibility 0s linear ' +
						(isOpen ? '0s' : '0.3s'),
				}}
			>
				<div className="bg-white/80 dark:bg-[#1E1E1E]/85 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col">
					<div className="flex items-center px-4 h-16 gap-3">
						<Search
							aria-hidden="true"
							size={20}
							className="text-gray-600 dark:text-gray-300 opacity-80 shrink-0"
						/>
						<input
							ref={inputRef}
							id="spotlight-search"
							name="spotlight-search"
							type="text"
							value={query}
							onChange={e => setQuery(e.target.value)}
							placeholder="Spotlight Search"
							aria-label="Spotlight Search"
							className="flex-1 bg-transparent border-none outline-none text-[22px] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-light h-full tracking-tight"
						/>
					</div>

					{/* Results Area */}
					{query.trim().length > 0 && (
						<div className="border-t border-gray-400/20 max-h-[360px] overflow-y-auto p-2">
							{results.length === 0 ? (
								<div className="px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
									No results for &quot;{query.trim()}&quot;
								</div>
							) : (
								<div role="listbox" aria-label="Spotlight results" className="space-y-0.5">
									{results.map((item, idx) => {
										const isSelected = idx === activeIndex;
										return (
											<button
												key={item.id}
												type="button"
												role="option"
												aria-selected={isSelected}
												onMouseEnter={() => setActiveIndex(idx)}
												onClick={item.onSelect}
												className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${
													isSelected
														? 'bg-ios-blue text-white'
														: 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-900 dark:text-white'
												}`}
											>
												{item.kind === 'app' && item.icon?.startsWith('/') ? (
													<div className="relative w-7 h-7 shrink-0">
														<Image
															src={item.icon}
															alt=""
															width={28}
															height={28}
															className="object-contain rounded-[6px]"
															unoptimized
														/>
													</div>
												) : (
													<div
														className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 ${
															isSelected ? 'bg-white/20 text-white' : 'bg-ios-blue/15 text-ios-blue'
														}`}
													>
														{item.kind === 'folder' ? (
															<Folder aria-hidden="true" size={15} />
														) : (
															<FileText aria-hidden="true" size={15} />
														)}
													</div>
												)}
												<div className="min-w-0 flex-1">
													<div className="text-[13px] font-medium leading-tight truncate">
														{item.title}
													</div>
													<div
														className={`text-[11px] leading-tight mt-0.5 truncate ${
															isSelected ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
														}`}
													>
														{item.subtitle}
													</div>
												</div>
											</button>
										);
									})}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</>
	);
}
