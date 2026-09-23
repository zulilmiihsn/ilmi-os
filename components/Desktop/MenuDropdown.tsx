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

		function handleEscape(event: KeyboardEvent) {
			if (event.key === 'Escape') onClose();
		}

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleEscape);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			ref={menuRef}
			role="menu"
			className="absolute top-full left-0 mt-1 min-w-[220px] py-1.5 z-50 text-gray-900 overflow-hidden transform animate-in fade-in zoom-in-95 duration-100"
			style={{
				background: 'rgba(255, 255, 255, 0.15)',
				backdropFilter: 'blur(20px) saturate(180%)',
				borderRadius: '16px',
				border: '1px solid rgba(255, 255, 255, 0.2)',
				boxShadow:
					'0 4px 16px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05), inset 0 1px 2px rgba(255, 255, 255, 0.4), inset 0 -1px 2px rgba(0, 0, 0, 0.1)',
			}}
		>
			{items.map((item, index) => {
				if (item.type === 'separator') {
					return <div key={index} className="h-[1px] bg-gray-300/50 my-1 rounded-full mx-3" />;
				}

				return (
					<button
						key={index}
						className={`w-full text-left flex items-center justify-between px-3 py-[3px] text-[13px] leading-none hover:bg-blue-500 hover:text-white transition-colors rounded-[4px] mx-1 mb-[1px] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-black/90 ${
							item.disabled ? 'cursor-default' : 'cursor-default'
						}`}
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
