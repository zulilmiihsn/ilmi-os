'use client';

import { triggerHaptic } from '../../../../utils/haptic';

export type BlockStyle = 'title' | 'heading' | 'subheading' | 'body';
export type InlineStyle = 'bold' | 'italic' | 'underline' | 'strike';
export type FormatAction = BlockStyle | InlineStyle;

interface FormatToolbarProps {
	activeStyle: BlockStyle;
	activeInline: InlineStyle | null;
	onClose: () => void;
	onFormat: (action: FormatAction) => void;
}

const STYLE_CHIPS: { label: string; action: BlockStyle }[] = [
	{ label: 'Title', action: 'title' },
	{ label: 'Heading', action: 'heading' },
	{ label: 'Subheading', action: 'subheading' },
	{ label: 'Body', action: 'body' },
];

const INLINE_BUTTONS: {
	action: InlineStyle;
	label: string;
	symbol: string;
	textClass: string;
}[] = [
	{ action: 'bold', label: 'Bold', symbol: 'B', textClass: 'font-bold' },
	{ action: 'italic', label: 'Italic', symbol: 'I', textClass: 'italic font-serif' },
	{ action: 'underline', label: 'Underline', symbol: 'U', textClass: 'underline' },
	{ action: 'strike', label: 'Strikethrough', symbol: 'S', textClass: 'line-through' },
];

export default function FormatToolbar({
	activeStyle,
	activeInline,
	onClose,
	onFormat,
}: FormatToolbarProps) {
	const activeChipClass = 'bg-[#c98a00] dark:bg-ios-yellow text-white dark:text-black shadow-xs';
	const inactiveChipClass = 'bg-black/5 dark:bg-white/10 text-black dark:text-white';

	return (
		<div className="z-30 absolute bottom-[max(env(safe-area-inset-bottom),1.5rem)] left-4 right-4">
			<div className="bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-black/10 dark:border-white/15 px-4 py-3 rounded-2xl shadow-[0_12px_30px_-5px_rgba(0,0,0,0.15)] transition-all">
				<div className="flex items-center justify-between mb-2.5">
					<span className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
						Format
					</span>
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							onClose();
						}}
						aria-label="Close formatting panel"
						className="relative bg-black/5 dark:bg-white/10 active:scale-95 rounded-full p-1 transition-transform after:absolute after:-inset-3 after:content-['']"
					>
						<svg
							aria-hidden="true"
							className="w-3.5 h-3.5 text-gray-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2.5}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<div className="flex gap-2 overflow-x-auto pb-2.5 scrollbar-hide">
					{STYLE_CHIPS.map(style => {
						const isActive = activeStyle === style.action;
						return (
							<button
								key={style.label}
								type="button"
								aria-pressed={isActive}
								onClick={() => {
									triggerHaptic('light');
									onFormat(style.action);
								}}
								className={`relative px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-semibold active:scale-95 transition-all after:absolute after:-inset-y-2 after:content-[''] ${
									isActive ? activeChipClass : inactiveChipClass
								}`}
							>
								{style.label}
							</button>
						);
					})}
				</div>

				<div className="flex justify-between items-center bg-black/5 dark:bg-white/5 rounded-xl p-1 border border-black/5 dark:border-white/5">
					{INLINE_BUTTONS.map(btn => {
						const isActive = activeInline === btn.action;
						return (
							<button
								key={btn.action}
								type="button"
								aria-label={btn.label}
								aria-pressed={isActive}
								onClick={() => {
									triggerHaptic('light');
									onFormat(btn.action);
								}}
								className={`relative p-1 rounded-lg w-7 h-7 flex items-center justify-center after:absolute after:-inset-2 after:content-[''] text-xs active:scale-90 transition-colors ${btn.textClass} ${
									isActive ? activeChipClass : 'text-black dark:text-white'
								}`}
							>
								{btn.symbol}
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
