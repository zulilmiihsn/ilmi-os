'use client';

import { useEffect, useRef, useState } from 'react';
import { Grid3x3, Mic, MicOff, PhoneOff, Plus, User, Video, Volume2 } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptic';
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
	const [muted, setMuted] = useState(false);
	const [speaker, setSpeaker] = useState(false);

	useRestoreFocus(!!activeCall, callRef);
	useFocusTrap(!!activeCall, callRef);

	useEffect(() => {
		if (!activeCall) {
			setMuted(false);
			setSpeaker(false);
		}
	}, [activeCall]);

	if (!activeCall) return null;

	return (
		<div className="absolute inset-0 z-50 bg-gradient-to-b from-[#1e2536] via-[#131722] to-[#0a0c12] text-white flex flex-col items-center">
			<div
				ref={callRef}
				onKeyDown={e => {
					if (e.key === 'Escape') onEndCall();
				}}
				role="dialog"
				aria-modal="true"
				aria-label={`Calling ${activeCall.number}`}
				className="w-full h-full max-w-sm flex flex-col items-center pt-16 px-8 pb-[max(env(safe-area-inset-bottom),2.25rem)] outline-none"
			>
				<p className="text-xs text-white/65 font-medium tracking-wide">iLmi Mobile</p>
				<p className="text-4xl font-light tracking-tight mt-2 tabular-nums text-center break-all">
					{activeCall.number}
				</p>
				<p className="text-sm text-white/65 mt-2 tabular-nums" aria-live="polite">
					{muted ? 'Muted · ' : ''}
					{formatCallDuration(elapsed)}
				</p>

				<div className="flex-1" />

				{/* Authentic 6-button iOS circular call controls grid */}
				<div className="grid grid-cols-3 gap-x-6 gap-y-5 mb-10 w-full max-w-[272px] justify-items-center">
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							setMuted(prev => !prev);
						}}
						aria-label={muted ? 'Unmute call' : 'Mute call'}
						aria-pressed={muted}
						className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
					>
						<span
							className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors backdrop-blur-md ${
								muted ? 'bg-white text-[#121622]' : 'bg-white/15 text-white hover:bg-white/20'
							}`}
						>
							{muted ? (
								<MicOff aria-hidden="true" size={24} />
							) : (
								<Mic aria-hidden="true" size={24} />
							)}
						</span>
						<span className="text-[11px] font-medium text-white/85">Mute</span>
					</button>

					<button
						type="button"
						disabled
						aria-label="Keypad unavailable during demo call"
						className="flex flex-col items-center gap-1.5 opacity-45 cursor-not-allowed"
					>
						<span className="w-16 h-16 rounded-full bg-white/15 text-white flex items-center justify-center backdrop-blur-md">
							<Grid3x3 aria-hidden="true" size={24} />
						</span>
						<span className="text-[11px] font-medium text-white/85">Keypad</span>
					</button>

					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							setSpeaker(prev => !prev);
						}}
						aria-label={speaker ? 'Turn speaker off' : 'Turn speaker on'}
						aria-pressed={speaker}
						className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
					>
						<span
							className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors backdrop-blur-md ${
								speaker ? 'bg-white text-[#121622]' : 'bg-white/15 text-white hover:bg-white/20'
							}`}
						>
							<Volume2 aria-hidden="true" size={24} />
						</span>
						<span className="text-[11px] font-medium text-white/85">Speaker</span>
					</button>

					<button
						type="button"
						disabled
						aria-label="Add call unavailable"
						className="flex flex-col items-center gap-1.5 opacity-45 cursor-not-allowed"
					>
						<span className="w-16 h-16 rounded-full bg-white/15 text-white flex items-center justify-center backdrop-blur-md">
							<Plus aria-hidden="true" size={24} />
						</span>
						<span className="text-[11px] font-medium text-white/85">Add</span>
					</button>

					<button
						type="button"
						disabled
						aria-label="FaceTime unavailable"
						className="flex flex-col items-center gap-1.5 opacity-45 cursor-not-allowed"
					>
						<span className="w-16 h-16 rounded-full bg-white/15 text-white flex items-center justify-center backdrop-blur-md">
							<Video aria-hidden="true" size={24} />
						</span>
						<span className="text-[11px] font-medium text-white/85">FaceTime</span>
					</button>

					<button
						type="button"
						disabled
						aria-label="Contacts unavailable"
						className="flex flex-col items-center gap-1.5 opacity-45 cursor-not-allowed"
					>
						<span className="w-16 h-16 rounded-full bg-white/15 text-white flex items-center justify-center backdrop-blur-md">
							<User aria-hidden="true" size={24} />
						</span>
						<span className="text-[11px] font-medium text-white/85">Contacts</span>
					</button>
				</div>

				{/* Centered red End Call button */}
				<div className="w-full flex justify-center">
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
