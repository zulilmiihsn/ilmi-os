'use client';

import { triggerHaptic } from '../../../../utils/haptic';

export type FormatAction =
	| 'bold'
	| 'italic'
	| 'underline'
	| 'strike'
	| 'title'
	| 'heading'
	| 'subheading'
	| 'body';

interface FormatToolbarProps {
	onClose: () => void;
	onFormat: (action: FormatAction) => void;
}

const STYLE_CHIPS: { label: string; action: FormatAction }[] = [
	{ label: 'Title', action: 'title' },
	{ label: 'Heading', action: 'heading' },
	{ label: 'Subheading', action: 'subheading' },
	{ label: 'Body', action: 'body' },
];

export default function FormatToolbar({ onClose, onFormat }: FormatToolbarProps) {
	return (
		<div className="z-30 absolute bottom-[max(env(safe-area-inset-bottom),1.5rem)] left-4 right-4 animate-in slide-in-from-bottom-4 duration-200">
			<div className="bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border border-black/10 dark:border-white/15 px-4 py-3 rounded-2xl shadow-[0_12px_30px_-5px_rgba(0,0,0,0.15)] transition-all">
				<div className="flex items-center justify-between mb-2.5">
					<span className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Format</span>
					<button
						onClick={() => {
							triggerHaptic('light');
							onClose();
						}}
						aria-label="Close formatting panel"
						className="relative bg-black/5 dark:bg-white/10 active:scale-95 rounded-full p-1 transition-transform after:absolute after:-inset-3 after:content-['']"
					>
						<svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div className="flex gap-2 overflow-x-auto pb-2.5 scrollbar-hide">
					{STYLE_CHIPS.map(style => (
						<button
							key={style.label}
							onClick={() => {
								triggerHaptic('light');
								onFormat(style.action);
							}}
							className={`relative px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-semibold active:scale-95 transition-all after:absolute after:-inset-y-2 after:content-[''] ${
								style.action === 'body'
									? 'bg-ios-yellow text-white shadow-xs'
									: 'bg-black/5 dark:bg-white/10 text-black dark:text-white'
							}`}
						>
							{style.label}
						</button>
					))}
				</div>

				<div className="flex justify-between items-center bg-black/5 dark:bg-white/5 rounded-xl p-1 border border-black/5 dark:border-white/5">
					<button onClick={() => { triggerHaptic('light'); onFormat('bold'); }} aria-label="Bold" className="relative p-1 bg-ios-yellow text-white rounded-lg w-7 h-7 flex items-center justify-center after:absolute after:-inset-2 after:content-[''] font-bold text-xs shadow-xs active:scale-90">
						B
					</button>
					<button onClick={() => { triggerHaptic('light'); onFormat('italic'); }} aria-label="Italic" className="relative p-1 text-black dark:text-white w-7 h-7 flex items-center justify-center after:absolute after:-inset-2 after:content-[''] italic font-serif text-xs active:scale-90">
						I
					</button>
					<button onClick={() => { triggerHaptic('light'); onFormat('underline'); }} aria-label="Underline" className="relative p-1 text-black dark:text-white w-7 h-7 flex items-center justify-center after:absolute after:-inset-2 after:content-[''] underline text-xs active:scale-90">
						U
					</button>
					<button onClick={() => { triggerHaptic('light'); onFormat('strike'); }} aria-label="Strikethrough" className="relative p-1 text-black dark:text-white w-7 h-7 flex items-center justify-center after:absolute after:-inset-2 after:content-[''] line-through text-xs active:scale-90">
						S
					</button>
				</div>
			</div>
		</div>
	);
}
