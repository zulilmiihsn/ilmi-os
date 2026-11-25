'use client';

import { useState } from 'react';
import { Phone as PhoneIcon, PhoneOutgoing, Search, Star, Voicemail, X } from 'lucide-react';
import {
	formatCallDuration,
	formatCallTime,
	type CallLogEntry,
	type FavoriteEntry,
} from './recents';

interface FavoritesTabProps {
	favorites: FavoriteEntry[];
	darkMode: boolean;
	onCall: (number: string) => void;
	onRemoveFavorite: (number: string) => void;
}

export function FavoritesTab({ favorites, darkMode, onCall, onRemoveFavorite }: FavoritesTabProps) {
	return (
		<>
			<div className="pt-3 px-4 pb-2 shrink-0">
				<h1 className="text-ios-large-title">Favorites</h1>
			</div>
			<div className="flex-1 overflow-y-auto pb-4">
				{favorites.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 px-8 text-center">
						<p className="text-lg font-semibold mb-1">No Favorites</p>
						<p className="text-sm">Type a number on the keypad, then tap Add Number.</p>
					</div>
				) : (
					<div
						className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${
							darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/5'
						}`}
					>
						{favorites.map((fav, i) => (
							<div
								key={fav.number}
								className={`flex items-center justify-between pl-4 pr-2 py-2 ${
									i < favorites.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
								}`}
							>
								<button
									onClick={() => onCall(fav.number)}
									aria-label={`Call ${fav.number}`}
									className="flex-1 flex items-center gap-3 text-left active:opacity-60 transition-opacity py-1"
								>
									<Star aria-hidden="true" size={16} className="text-ios-yellow shrink-0" />
									<span>
										<span className="block text-base font-normal">{fav.number}</span>
										<span className="block text-xs text-gray-500 dark:text-gray-400">
											Added {formatCallTime(fav.addedAt)}
										</span>
									</span>
								</button>
								<button
									onClick={() => onRemoveFavorite(fav.number)}
									aria-label={`Remove ${fav.number} from favorites`}
									className="w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity"
								>
									<X aria-hidden="true" size={16} className="text-gray-500 dark:text-gray-400" />
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</>
	);
}

interface RecentsTabProps {
	recents: CallLogEntry[];
	darkMode: boolean;
	onCall: (number: string) => void;
	onClearRecents: () => void;
}

export function RecentsTab({ recents, darkMode, onCall, onClearRecents }: RecentsTabProps) {
	const [filter, setFilter] = useState<'all' | 'missed'>('all');
	const displayed = filter === 'all' ? recents : [];

	return (
		<>
			<div className="pt-3 px-4 pb-2 shrink-0">
				<div className="flex items-center justify-between mb-2">
					<span className="w-12" aria-hidden="true" />
					<div
						role="group"
						aria-label="Filter recent calls"
						className="inline-flex rounded-lg p-0.5 bg-black/5 dark:bg-white/10"
					>
						{(['all', 'missed'] as const).map(mode => (
							<button
								key={mode}
								type="button"
								onClick={() => setFilter(mode)}
								aria-pressed={filter === mode}
								className={`px-3.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
									filter === mode
										? darkMode
											? 'bg-[#2c2c2e] text-white shadow-xs'
											: 'bg-white text-black shadow-xs'
										: 'text-gray-500 dark:text-gray-400'
								}`}
							>
								{mode}
							</button>
						))}
					</div>
					<div className="w-12 flex justify-end">
						{recents.length > 0 && (
							<button
								type="button"
								onClick={onClearRecents}
								aria-label="Clear recents"
								className="text-xs font-medium text-ios-blue active:opacity-50 transition-opacity"
							>
								Clear
							</button>
						)}
					</div>
				</div>
				<h1 className="text-ios-large-title">Recents</h1>
			</div>
			<div className="flex-1 overflow-y-auto pb-4">
				{displayed.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 px-8 text-center">
						<p className="text-lg font-semibold mb-1">
							{filter === 'missed' ? 'No Missed Calls' : 'No Recents'}
						</p>
						<p className="text-sm">
							{filter === 'missed'
								? 'You have no missed calls.'
								: 'Calls you make will appear here.'}
						</p>
					</div>
				) : (
					<div
						className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${
							darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/5'
						}`}
					>
						{displayed.map((entry, i) => (
							<button
								key={entry.id}
								onClick={() => onCall(entry.number)}
								aria-label={`Call back ${entry.number}`}
								className={`w-full flex items-center justify-between px-4 py-3 text-left active:bg-black/5 dark:active:bg-white/10 transition-colors ${
									i < displayed.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
								}`}
							>
								<span>
									<span className="block text-base font-normal">{entry.number}</span>
									<span className="block text-xs text-gray-500 dark:text-gray-400">
										{formatCallTime(entry.startedAt)} · {formatCallDuration(entry.durationSec)}
									</span>
								</span>
								<PhoneOutgoing
									aria-hidden="true"
									size={16}
									className="text-gray-500 dark:text-gray-400 shrink-0"
								/>
							</button>
						))}
					</div>
				)}
			</div>
		</>
	);
}

interface ContactsTabProps {
	contacts: { number: string; sub: string }[];
	contactQuery: string;
	darkMode: boolean;
	onContactQueryChange: (value: string) => void;
	onCall: (number: string) => void;
}

export function ContactsTab({
	contacts,
	contactQuery,
	darkMode,
	onContactQueryChange,
	onCall,
}: ContactsTabProps) {
	return (
		<>
			<div className="pt-3 px-4 pb-2 shrink-0">
				<h1 className="text-ios-large-title">Contacts</h1>
			</div>
			<div className="px-4 pb-3 shrink-0">
				<div className="flex items-center rounded-xl px-3 py-2 border bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/10">
					<Search
						aria-hidden="true"
						size={14}
						className="text-gray-500 dark:text-gray-400 mr-2 shrink-0"
					/>
					<input
						type="text"
						value={contactQuery}
						onChange={e => onContactQueryChange(e.target.value)}
						placeholder="Search"
						aria-label="Search contacts"
						className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500 dark:placeholder-gray-400 min-w-0"
					/>
					{contactQuery && (
						<button
							type="button"
							onClick={() => onContactQueryChange('')}
							aria-label="Clear search"
							className="text-gray-500 dark:text-gray-400 ml-2 shrink-0"
						>
							<X aria-hidden="true" size={14} />
						</button>
					)}
				</div>
			</div>
			<div className="flex-1 overflow-y-auto pb-4">
				{contacts.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 px-8 text-center">
						<p className="text-lg font-semibold mb-1">No Contacts</p>
						<p className="text-sm">Numbers you call or favorite will appear here.</p>
					</div>
				) : (
					<div
						className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${
							darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/5'
						}`}
					>
						{contacts.map((c, i) => (
							<button
								key={c.number}
								onClick={() => onCall(c.number)}
								aria-label={`Call ${c.number}`}
								className={`w-full flex items-center justify-between px-4 py-3 text-left active:bg-black/5 dark:active:bg-white/10 transition-colors ${
									i < contacts.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
								}`}
							>
								<span>
									<span className="block text-base font-normal">{c.number}</span>
									<span className="block text-xs text-gray-500 dark:text-gray-400">{c.sub}</span>
								</span>
								<PhoneIcon aria-hidden="true" size={16} className="text-ios-blue shrink-0" />
							</button>
						))}
					</div>
				)}
			</div>
		</>
	);
}

export function VoicemailTab() {
	return (
		<>
			<div className="pt-3 px-4 pb-2 shrink-0">
				<h1 className="text-ios-large-title">Voicemail</h1>
			</div>
			<div className="flex-1 overflow-y-auto pb-4">
				<div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 px-8 text-center">
					<Voicemail aria-hidden="true" size={36} className="mb-3 opacity-40" />
					<p className="text-lg font-semibold mb-1">No Voicemails</p>
					<p className="text-sm">Visual Voicemail is not configured.</p>
				</div>
			</div>
		</>
	);
}
