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
	activeColor,
	unfocusedColor,
	focused,
	label,
	onClick,
	path,
}: {
	activeColor: string;
	unfocusedColor: string;
	focused: boolean;
	label: string;
	onClick: (e: React.MouseEvent) => void;
	path: React.ReactNode;
}) {
	return (
		<button
			type="button"
			className={`w-3 h-3 rounded-full ${focused ? activeColor : unfocusedColor} flex items-center justify-center text-transparent group-hover/controls:text-black/65 active:brightness-90 transition-colors font-bold p-0 border-none leading-none focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ios-blue`}
			onClick={onClick}
			onMouseDown={e => e.stopPropagation()}
			onDoubleClick={e => e.stopPropagation()}
			aria-label={label}
		>
			<svg
				className="w-1.5 h-1.5 opacity-0 group-hover/controls:opacity-100 block transition-opacity"
				viewBox="0 0 6 6"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.2"
				strokeLinecap="round"
				aria-hidden="true"
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
	const isActive = isDragging || isResizing || windowState.isFocused;

	return (
		<div
			className={`window-header h-9 flex items-center justify-between px-3 shrink-0 select-none backdrop-blur-md transition-colors duration-200 ${
				isActive
					? 'bg-[#ececec]/92 dark:bg-[#2a2a2c]/92 border-b border-black/10 dark:border-black/40'
					: 'bg-[#f4f4f4]/90 dark:bg-[#222224]/90 border-b border-black/5 dark:border-white/5'
			}`}
		>
			<div className="flex items-center gap-2 group/controls">
				<TrafficButton
					activeColor="bg-[#ff5f57] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]"
					unfocusedColor="bg-black/15 dark:bg-white/20 group-hover/controls:bg-[#ff5f57] group-hover/controls:shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]"
					focused={windowState.isFocused}
					label="Close"
					onClick={stop(onClose)}
					path={<path d="M1 1L5 5M5 1L1 5" />}
				/>
				<TrafficButton
					activeColor="bg-[#febc2e] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]"
					unfocusedColor="bg-black/15 dark:bg-white/20 group-hover/controls:bg-[#febc2e] group-hover/controls:shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]"
					focused={windowState.isFocused}
					label="Minimize"
					onClick={stop(onMinimize)}
					path={<path d="M1 3H5" />}
				/>
				<TrafficButton
					activeColor="bg-[#28c840] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]"
					unfocusedColor="bg-black/15 dark:bg-white/20 group-hover/controls:bg-[#28c840] group-hover/controls:shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.12)]"
					focused={windowState.isFocused}
					label="Maximize"
					onClick={stop(onMaximize)}
					path={
						<g fill="currentColor" stroke="none">
							<path d="M1 5V2.3L3.7 5H1Z" />
							<path d="M5 1V3.7L2.3 1H5Z" />
						</g>
					}
				/>
			</div>
			<div
				className={`text-[13px] font-semibold tracking-tight transition-colors ${
					windowState.isFocused
						? 'text-gray-800 dark:text-gray-100'
						: 'text-gray-500 dark:text-gray-400'
				}`}
			>
				{windowState.title}
			</div>
			<div className="w-14" />
		</div>
	);
}
