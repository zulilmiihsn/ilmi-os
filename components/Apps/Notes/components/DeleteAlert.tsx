'use client';

interface DeleteAlertProps {
	count: number;
	onCancel: () => void;
	onDelete: () => void;
}

export default function DeleteAlert({ count, onCancel, onDelete }: DeleteAlertProps) {
	return (
		<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
			<div className="bg-gray-100/90 dark:bg-[#2C2C2E]/90 text-black dark:text-white w-[270px] rounded-[14px] overflow-hidden text-center backdrop-blur-xl shadow-2xl transition-colors">
				<div className="pt-5 pb-4 px-4 border-b border-gray-300/50 dark:border-white/10">
					<h3 className="font-semibold text-base leading-snug">Delete {count} Notes?</h3>
					<p className="text-xs mt-1 text-black/60 dark:text-white/60 leading-snug">
						This action cannot be undone.
					</p>
				</div>
				<div className="flex divide-x divide-gray-300/50 dark:divide-white/10">
					<button
						onClick={onCancel}
						className="flex-1 py-3 text-sm text-blue-500 font-semibold active:bg-gray-200 dark:active:bg-white/10 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={onDelete}
						className="flex-1 py-3 text-sm text-red-500 font-semibold active:bg-gray-200 dark:active:bg-white/10 transition-colors"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
}
