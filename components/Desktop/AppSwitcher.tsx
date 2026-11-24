'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { AppWindow } from 'lucide-react';
import { useAppsStore } from '../../stores/apps';
import { useFocusTrap } from '../../utils/hooks/useFocusTrap';
import type { WindowState } from '../../types';

interface AppSwitcherProps {
	windows: WindowState[];
	selectedIndex: number;
	onSelect: (id: string) => void;
	onCancel: () => void;
}

export default function AppSwitcher({
	windows,
	selectedIndex,
	onSelect,
	onCancel,
}: AppSwitcherProps) {
	const apps = useAppsStore(state => state.apps);
	const dialogRef = useRef<HTMLDivElement>(null);
	const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);

	useFocusTrap(true, dialogRef);

	useEffect(() => {
		tileRefs.current = tileRefs.current.slice(0, windows.length);
	}, [windows.length]);

	useEffect(() => {
		const target = tileRefs.current[selectedIndex];
		if (target) {
			target.focus({ preventScroll: true });
		}
	}, [selectedIndex, windows.length]);

	return (
		<div
			className="app-switcher fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto"
			onClick={e => {
				if (e.target === e.currentTarget) onCancel();
			}}
		>
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-label="App Switcher"
				className="bg-black/65 backdrop-blur-2xl border border-white/20 rounded-3xl px-5 py-4 shadow-2xl flex items-center gap-3 max-w-[90vw] overflow-x-auto"
			>
				{windows.map((w, idx) => {
					const app = apps.find(a => a.id === w.appId);
					const isSelected = idx === selectedIndex;
					const hasImageIcon = Boolean(app?.icon && app.icon.startsWith('/'));

					return (
						<button
							key={w.id}
							ref={el => {
								tileRefs.current[idx] = el;
							}}
							type="button"
							aria-label={w.title}
							aria-current={isSelected ? 'true' : undefined}
							data-switcher-id={w.id}
							onClick={() => onSelect(w.id)}
							className={`flex flex-col items-center justify-center gap-2 w-24 px-2 py-2.5 rounded-2xl transition-all duration-150 focus:outline-none active:scale-[0.98] ${
								isSelected
									? 'bg-white/20 ring-2 ring-white/70 text-white'
									: 'bg-transparent text-white/80 hover:bg-white/10'
							}`}
						>
							<div className="w-14 h-14 flex items-center justify-center rounded-xl shrink-0">
								{hasImageIcon && app ? (
									<Image
										src={app.icon}
										alt=""
										width={56}
										height={56}
										className="object-contain"
										unoptimized
									/>
								) : (
									<div className="w-14 h-14 flex items-center justify-center rounded-xl bg-white/10 text-white">
										<AppWindow aria-hidden="true" size={28} />
									</div>
								)}
							</div>
							<span className="text-xs font-medium truncate w-full text-center leading-tight">
								{w.title}
							</span>
							{w.isMinimized && (
								<span className="text-[10px] leading-none px-1.5 py-0.5 rounded-full bg-white/15 text-white/75">
									Minimized
								</span>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
}
