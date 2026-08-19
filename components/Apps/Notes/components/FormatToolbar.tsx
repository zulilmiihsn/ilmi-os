'use client';

interface FormatToolbarProps {
	onClose: () => void;
}

export default function FormatToolbar({ onClose }: FormatToolbarProps) {
	return (
		<div className="bg-gray-100 dark:bg-[#2C2C2E] border-t border-gray-300 dark:border-white/10 px-4 py-2 z-20 absolute bottom-0 left-0 right-0 shadow-lg animate-in slide-in-from-bottom duration-300 transition-colors">
			<div className="flex items-center justify-between mb-3">
				<span className="text-sm font-bold text-gray-700 dark:text-white">Format</span>
				<button
					onClick={onClose}
					className="bg-gray-200 dark:bg-white/10 active:bg-gray-300 dark:active:bg-white/20 rounded-full p-1 transition-colors"
				>
					<svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
				{['Title', 'Heading', 'Subheading', 'Body'].map(style => (
					<button
						key={style}
						className={`px-4 py-1.5 rounded-[8px] whitespace-nowrap text-xs font-semibold ${
							style === 'Title'
								? 'bg-[#DCA326] text-white shadow-sm'
								: 'bg-gray-200 dark:bg-white/10 text-black dark:text-white'
						}`}
					>
						{style}
					</button>
				))}
			</div>

			<div className="flex justify-between items-center bg-gray-200 dark:bg-white/10 rounded-[10px] p-1.5 transition-colors">
				<button className="p-1.5 bg-[#DCA326] text-white rounded-[7px] w-8 h-8 flex items-center justify-center font-bold shadow-sm">
					B
				</button>
				<button className="p-1.5 text-black dark:text-white w-8 h-8 flex items-center justify-center italic font-serif">
					I
				</button>
				<button className="p-1.5 text-black dark:text-white w-8 h-8 flex items-center justify-center underline">
					U
				</button>
				<button className="p-1.5 text-black dark:text-white w-8 h-8 flex items-center justify-center line-through">
					S
				</button>
				<div className="w-px h-5 bg-gray-300 dark:bg-white/20 mx-1" />
				<button className="p-1.5 text-black dark:text-white w-8 h-8 flex items-center justify-center">
					<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
					</svg>
				</button>
				<button className="p-1.5 text-black dark:text-white w-8 h-8 flex items-center justify-center">
					<div className="w-3.5 h-3.5 bg-purple-500 rounded-full border border-black/10" />
				</button>
			</div>
		</div>
	);
}
