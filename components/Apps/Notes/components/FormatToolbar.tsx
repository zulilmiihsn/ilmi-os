'use client';

import { triggerHaptic } from '../../../../utils/haptic';

interface FormatToolbarProps {
	onClose: () => void;
}

export default function FormatToolbar({ onClose }: FormatToolbarProps) {
	return (
		<div className="z-30 absolute bottom-6 left-4 right-4 animate-in slide-in-from-bottom-4 duration-200">
			<div className="bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-2xl border border-black/10 dark:border-white/15 px-4 py-3 rounded-2xl shadow-[0_12px_30px_-5px_rgba(0,0,0,0.15)] transition-all">
				<div className="flex items-center justify-between mb-2.5">
					<span className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Format</span>
					<button
						onClick={() => {
							triggerHaptic('light');
							onClose();
						}}
						className="bg-black/5 dark:bg-white/10 active:scale-95 rounded-full p-1 transition-transform"
					>
						<svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div className="flex gap-2 overflow-x-auto pb-2.5 scrollbar-hide">
					{['Title', 'Heading', 'Subheading', 'Body'].map(style => (
						<button
							key={style}
							onClick={() => triggerHaptic('light')}
							className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-xs font-semibold active:scale-95 transition-all ${
								style === 'Title'
									? 'bg-[#e3a824] text-white shadow-xs'
									: 'bg-black/5 dark:bg-white/10 text-black dark:text-white'
							}`}
						>
							{style}
						</button>
					))}
				</div>

				<div className="flex justify-between items-center bg-black/5 dark:bg-white/5 rounded-xl p-1 border border-black/5 dark:border-white/5">
					<button onClick={() => triggerHaptic('light')} className="p-1 bg-[#e3a824] text-white rounded-lg w-7 h-7 flex items-center justify-center font-bold text-xs shadow-xs active:scale-90">
						B
					</button>
					<button onClick={() => triggerHaptic('light')} className="p-1 text-black dark:text-white w-7 h-7 flex items-center justify-center italic font-serif text-xs active:scale-90">
						I
					</button>
					<button onClick={() => triggerHaptic('light')} className="p-1 text-black dark:text-white w-7 h-7 flex items-center justify-center underline text-xs active:scale-90">
						U
					</button>
					<button onClick={() => triggerHaptic('light')} className="p-1 text-black dark:text-white w-7 h-7 flex items-center justify-center line-through text-xs active:scale-90">
						S
					</button>
					<div className="w-px h-4 bg-gray-300 dark:bg-white/20 mx-1" />
					<button onClick={() => triggerHaptic('light')} className="p-1 text-black dark:text-white w-7 h-7 flex items-center justify-center active:scale-90">
						<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
						</svg>
					</button>
					<button onClick={() => triggerHaptic('light')} className="p-1 text-black dark:text-white w-7 h-7 flex items-center justify-center active:scale-90">
						<div className="w-3.5 h-3.5 bg-purple-500 rounded-full shadow-xs" />
					</button>
				</div>
			</div>
		</div>
	);
}
