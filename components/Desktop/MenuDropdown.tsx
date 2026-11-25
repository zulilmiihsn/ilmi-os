import React, { useEffect, useRef } from 'react';

export interface MenuItem {
	label?: string;
	type?: 'separator' | 'item';
	action?: () => void;
	disabled?: boolean;
	shortcut?: string;
	checked?: boolean;
	submenu?: MenuItem[];
}

interface MenuDropdownProps {
	items: MenuItem[];
	isOpen: boolean;
	onClose: () => void;
	position?: { left: number; top: number };
}

export default function MenuDropdown({ items, isOpen, onClose }: MenuDropdownProps) {
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;

		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				onClose();
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				onClose();
				return;
			}
			if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
			const root = menuRef.current;
			if (!root) return;
			const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
			if (buttons.length === 0) return;
			event.preventDefault();
			const activeEl = document.activeElement;
			const currentIdx = buttons.findIndex(btn => btn === activeEl);
			let nextIdx: number;
			if (event.key === 'ArrowDown') {
				nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % buttons.length;
			} else {
				nextIdx =
					currentIdx < 0 ? buttons.length - 1 : (currentIdx - 1 + buttons.length) % buttons.length;
			}
			buttons[nextIdx]?.focus();
		}

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			ref={menuRef}
			role="menu"
			className="absolute top-full left-0 mt-1 min-w-[220px] py-1.5 z-50 rounded-xl bg-white/90 dark:bg-[#1e1e20]/92 text-gray-900 dark:text-gray-100 border border-black/10 dark:border-white/15 backdrop-blur-2xl shadow-2xl overflow-hidden transform animate-in fade-in zoom-in-95 duration-150"
		>
			{items.map((item, index) => {
				if (item.type === 'separator') {
					return (
						<div
							key={index}
							className="h-[1px] bg-black/10 dark:bg-white/15 my-1 rounded-full mx-3"
						/>
					);
				}

				return (
					<button
						key={index}
						type="button"
						className="w-full text-left flex items-center justify-between px-3 py-1 text-[13px] leading-none hover:bg-ios-blue hover:text-white focus:bg-ios-blue focus:text-white focus:outline-none transition-colors rounded-[5px] mx-1 mb-[1px] cursor-default disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-inherit"
						onClick={e => {
							e.stopPropagation();
							if (!item.disabled && item.action) {
								item.action();
								onClose();
							}
						}}
						disabled={item.disabled}
						style={{ width: 'calc(100% - 8px)' }}
					>
						<span className={`truncate ${item.checked ? 'font-medium' : ''}`}>{item.label}</span>
						{item.shortcut && (
							<span className="opacity-60 ml-4 text-[11px] tracking-wide pointer-events-none">
								{item.shortcut}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}
