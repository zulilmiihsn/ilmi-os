'use client';

import type { WindowState } from '../../../types';

interface WindowHeaderProps {
	windowState: WindowState;
	isDragging: boolean;
	isResizing: boolean;
	onClose: () => void;
	onMinimize: () => void;
	onMaximize: () => void;
}

function TrafficButton({
	color,
	label,
	onClick,
	path,
}: {
	color: string;
	label: string;
	onClick: (e: React.MouseEvent) => void;
	path: React.ReactNode;
}) {
	return (
		<button
			className={`w-3 h-3 rounded-full ${color} flex items-center justify-center text-transparent hover:text-black/60 active:brightness-90 transition-all font-bold p-0 border-none leading-none focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#007AFF]`}
			onClick={onClick}
			onMouseDown={e => e.stopPropagation()}
			onDoubleClick={e => e.stopPropagation()}
			aria-label={label}
		>
			<svg
				className="w-1.5 h-1.5 opacity-0 group-hover:opacity-100 block"
				viewBox="0 0 6 6"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.2"
				strokeLinecap="round"
			>
				{path}
			</svg>
		</button>
	);
}

export default function WindowHeader({
	windowState,
	isDragging,
	isResizing,
	onClose,
	onMinimize,
	onMaximize,
}: WindowHeaderProps) {
	const stop = (fn: () => void) => (e: React.MouseEvent) => {
		e.stopPropagation();
		fn();
	};

	return (
		<div
			className={`window-header h-9 flex items-center justify-between px-3 shrink-0 select-none transition-colors duration-200
			${
				isDragging || isResizing || windowState.isFocused
					? 'bg-[#EDECEC] dark:bg-[#282828] border-b border-gray-300/50 dark:border-black/40'
					: 'bg-[#F6F6F6] dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-white/5'
			}`}
		>
			<div className="flex items-center gap-2 group">
				<TrafficButton
					color="bg-[#ff5f57] shadow-[inset_0_0_0_1px_#e0443e]"
					label="Close"
					onClick={stop(onClose)}
					path={<path d="M1 1L5 5M5 1L1 5" />}
				/>
				<TrafficButton
					color="bg-[#febc2e] shadow-[inset_0_0_0_1px_#d3a125]"
					label="Minimize"
					onClick={stop(onMinimize)}
					path={<path d="M1 1H5" />}
				/>
				<TrafficButton
					color="bg-[#28c840] shadow-[inset_0_0_0_1px_#00a91d]"
					label="Maximize"
					onClick={stop(onMaximize)}
					path={<path d="M1 5L5 1M5 1H2M5 1V4" />}
				/>
			</div>
			<div className="text-[13px] font-semibold text-gray-700/80 dark:text-gray-200/90 tracking-tight">
				{windowState.title}
			</div>
			<div className="w-14" />
		</div>
	);
}
