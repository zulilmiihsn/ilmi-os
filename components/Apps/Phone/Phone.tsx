'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, Grid3x3, Star, User, Voicemail } from 'lucide-react';
import { useSettingsStore } from '../../../stores/settings';
import { triggerHaptic } from '../../../utils/haptic';
import {
	addCallLog,
	addFavorite,
	formatCallDuration,
	formatCallTime,
	loadFavorites,
	loadRecents,
	removeFavorite,
	saveFavorites,
	saveRecents,
	type CallLogEntry,
	type FavoriteEntry,
} from './recents';
import { ContactsTab, FavoritesTab, RecentsTab, VoicemailTab } from './PhoneTabs';
import KeypadView from './KeypadView';
import ActiveCallOverlay from './ActiveCallOverlay';

const MAX_DIGITS = 20;

type Tab = 'favorites' | 'recents' | 'contacts' | 'keypad' | 'voicemail';

export default function Phone() {
	const { darkMode } = useSettingsStore();
	const [tab, setTab] = useState<Tab>('keypad');
	const [number, setNumber] = useState('');
	const [recents, setRecents] = useState<CallLogEntry[]>([]);
	const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
	const [contactQuery, setContactQuery] = useState('');
	const [persistError, setPersistError] = useState(false);
	const [activeCall, setActiveCall] = useState<{ number: string; startedAt: number } | null>(null);
	const [elapsed, setElapsed] = useState(0);

	useEffect(() => {
		setRecents(loadRecents());
		setFavorites(loadFavorites());
	}, []);

	useEffect(() => {
		if (!activeCall) return;
		setElapsed(0);
		const timer = setInterval(() => {
			setElapsed(Math.floor((Date.now() - activeCall.startedAt) / 1000));
		}, 1000);
		return () => clearInterval(timer);
	}, [activeCall]);

	const inputDigit = (digit: string) => {
		triggerHaptic('light');
		setNumber(prev => (prev.length >= MAX_DIGITS ? prev : prev + digit));
	};

	const backspace = () => {
		triggerHaptic('light');
		setNumber(prev => prev.slice(0, -1));
	};

	const startCall = (to: string) => {
		const target = to.trim();
		if (!target) return;
		triggerHaptic('medium');
		setActiveCall({ number: target, startedAt: Date.now() });
	};

	const endCall = () => {
		if (!activeCall) return;
		triggerHaptic('medium');
		const durationSec = Math.floor((Date.now() - activeCall.startedAt) / 1000);
		const next = addCallLog(recents, {
			number: activeCall.number,
			startedAt: new Date(activeCall.startedAt).toISOString(),
			durationSec,
		});
		setRecents(next);
		if (!saveRecents(next)) setPersistError(true);
		setActiveCall(null);
		setNumber('');
	};

	const handleAddNumber = () => {
		const target = number.trim();
		if (!target) return;
		triggerHaptic('medium');
		const next = addFavorite(favorites, target);
		setFavorites(next);
		if (!saveFavorites(next)) setPersistError(true);
		setNumber('');
	};

	const handleRemoveFavorite = (target: string) => {
		triggerHaptic('medium');
		const next = removeFavorite(favorites, target);
		setFavorites(next);
		if (!saveFavorites(next)) setPersistError(true);
	};

	const handleClearRecents = () => {
		triggerHaptic('medium');
		setRecents([]);
		if (!saveRecents([])) setPersistError(true);
	};

	const handleRedialLast = () => {
		const latest = recents[0];
		if (!latest) return;
		triggerHaptic('light');
		setNumber(latest.number);
	};

	// Contacts are derived from real activity: favorited and dialed numbers.
	const contacts = useMemo(() => {
		const seen = new Set<string>();
		const list: { number: string; sub: string }[] = [];
		for (const f of favorites) {
			if (!seen.has(f.number)) {
				seen.add(f.number);
				list.push({ number: f.number, sub: `Added ${formatCallTime(f.addedAt)}` });
			}
		}
		for (const r of recents) {
			if (!seen.has(r.number)) {
				seen.add(r.number);
				list.push({
					number: r.number,
					sub: `${formatCallTime(r.startedAt)} · ${formatCallDuration(r.durationSec)}`,
				});
			}
		}
		const q = contactQuery.trim().toLowerCase();
		return q ? list.filter(c => c.number.toLowerCase().includes(q)) : list;
	}, [favorites, recents, contactQuery]);

	return (
		<div
			className={`phone-app w-full h-full flex flex-col overflow-hidden font-sans select-none transition-colors duration-300 ${
				darkMode ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'
			}`}
		>
			{persistError && (
				<div
					role="alert"
					className="shrink-0 mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400"
				>
					Could not save call history. Storage may be unavailable — changes will be lost on reload.
				</div>
			)}

			{tab === 'favorites' && (
				<FavoritesTab
					favorites={favorites}
					darkMode={darkMode}
					onCall={startCall}
					onRemoveFavorite={handleRemoveFavorite}
				/>
			)}

			{tab === 'keypad' && (
				<KeypadView
					number={number}
					lastRecentNumber={recents[0]?.number ?? null}
					onAddNumber={handleAddNumber}
					onInputDigit={inputDigit}
					onCall={startCall}
					onRedialLast={handleRedialLast}
					onBackspace={backspace}
				/>
			)}

			{tab === 'recents' && (
				<RecentsTab
					recents={recents}
					darkMode={darkMode}
					onCall={startCall}
					onClearRecents={handleClearRecents}
				/>
			)}

			{tab === 'contacts' && (
				<ContactsTab
					contacts={contacts}
					contactQuery={contactQuery}
					darkMode={darkMode}
					onContactQueryChange={setContactQuery}
					onCall={startCall}
				/>
			)}

			{tab === 'voicemail' && <VoicemailTab />}

			{/* Bottom tab bar: full-width like iOS with safe home-indicator clearance */}
			<div
				role="tablist"
				aria-label="Phone sections"
				className="shrink-0 border-t backdrop-blur-xl bg-white/85 dark:bg-black/85 border-black/5 dark:border-white/15 pt-2 pb-[max(env(safe-area-inset-bottom),1.75rem)]"
			>
				<div className="flex items-start justify-around">
					{(
						[
							{ id: 'favorites', label: 'Favorites', Icon: Star },
							{ id: 'recents', label: 'Recents', Icon: Clock },
							{ id: 'contacts', label: 'Contacts', Icon: User },
							{ id: 'keypad', label: 'Keypad', Icon: Grid3x3 },
							{ id: 'voicemail', label: 'Voicemail', Icon: Voicemail },
						] as const
					).map(({ id, label, Icon }) => (
						<button
							key={id}
							role="tab"
							aria-selected={tab === id}
							aria-label={label}
							onClick={() => {
								triggerHaptic('light');
								setTab(id);
							}}
							className={`relative flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-90 after:absolute after:-inset-2 after:content-[''] ${
								tab === id ? 'text-ios-blue' : 'text-ios-gray'
							}`}
						>
							<Icon aria-hidden="true" size={24} className="mb-0.5" />
							<span className="text-[10px] font-medium tracking-tight">{label}</span>
						</button>
					))}
				</div>
			</div>

			<ActiveCallOverlay activeCall={activeCall} elapsed={elapsed} onEndCall={endCall} />
		</div>
	);
}
