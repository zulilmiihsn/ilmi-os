'use client';

import { useRef } from 'react';
import { PhoneOff } from 'lucide-react';
import { useFocusTrap } from '../../../utils/hooks/useFocusTrap';
import { useRestoreFocus } from '../../../utils/hooks/useRestoreFocus';
import { formatCallDuration } from './recents';

interface ActiveCallOverlayProps {
	activeCall: { number: string; startedAt: number } | null;
	elapsed: number;
	onEndCall: () => void;
}

export default function ActiveCallOverlay({
	activeCall,
	elapsed,
	onEndCall,
}: ActiveCallOverlayProps) {
	const callRef = useRef<HTMLDivElement>(null);
	useRestoreFocus(!!activeCall, callRef);
	useFocusTrap(!!activeCall, callRef);

	if (!activeCall) return null;

	return (
		<div className="absolute inset-0 z-50 bg-black/95 text-white flex flex-col items-center">
			<div
				ref={callRef}
				onKeyDown={e => {
					if (e.key === 'Escape') onEndCall();
				}}
				role="dialog"
				aria-label={`Calling ${activeCall.number}`}
				className="w-full h-full flex flex-col items-center pt-20 pb-[max(env(safe-area-inset-bottom),2rem)] outline-none"
			>
				<p className="text-xs text-gray-400 font-medium">iLmi Mobile</p>
				<p className="text-4xl font-light tracking-tight mt-2 tabular-nums">{activeCall.number}</p>
				<p className="text-sm text-gray-400 mt-2 tabular-nums" aria-live="polite">
					{formatCallDuration(elapsed)}
				</p>
				<div className="flex-1" />
				<div className="w-full flex justify-end px-8">
					<button
						onClick={onEndCall}
						autoFocus
						aria-label="End call"
						className="w-[72px] h-[72px] rounded-full bg-ios-red text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
					>
						<PhoneOff aria-hidden="true" size={30} />
					</button>
				</div>
			</div>
		</div>
	);
}
