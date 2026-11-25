'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Globe, LoaderCircle, Search } from 'lucide-react';
import { parseWikiSearchResults, type WikiSearchResult } from './browsing';

interface SafariSearchViewProps {
	query: string;
	darkMode: boolean;
	onNavigate: (url: string) => void;
	onLoaded: () => void;
}

export function SafariSearchView({ query, darkMode, onNavigate, onLoaded }: SafariSearchViewProps) {
	const [results, setResults] = useState<WikiSearchResult[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);

		const run = async () => {
			try {
				const res = await fetch(
					`https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=10&srsearch=${encodeURIComponent(query)}`
				);
				if (!res.ok) throw new Error('Search unavailable');
				const json: unknown = await res.json();
				if (cancelled) return;
				setResults(parseWikiSearchResults(json));
			} catch {
				if (cancelled) return;
				setError('Offline or unable to fetch web results. You can open this search externally.');
				setResults([]);
			} finally {
				if (!cancelled) {
					setLoading(false);
					onLoaded();
				}
			}
		};

		void run();
		return () => {
			cancelled = true;
		};
	}, [query, onLoaded]);

	return (
		<div
			className={`absolute inset-0 overflow-y-auto px-5 md:px-10 py-6 ${
				darkMode ? 'bg-[#1c1c1e] text-white' : 'bg-[#f9f9fb] text-black'
			}`}
		>
			<div className="max-w-2xl mx-auto space-y-5">
				<div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/10 dark:border-white/10">
					<div className="flex items-center gap-2 min-w-0">
						<Search aria-hidden="true" size={16} className="text-ios-blue shrink-0" />
						<h1 className="text-base font-semibold truncate">Results for &ldquo;{query}&rdquo;</h1>
					</div>
					<div className="flex items-center gap-2">
						<a
							href={`https://duckduckgo.com/?q=${encodeURIComponent(query)}`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 text-xs font-medium text-ios-blue hover:underline"
						>
							DuckDuckGo <ExternalLink aria-hidden="true" size={11} />
						</a>
						<a
							href={`https://www.google.com/search?q=${encodeURIComponent(query)}`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1 text-xs font-medium text-ios-blue hover:underline"
						>
							Google <ExternalLink aria-hidden="true" size={11} />
						</a>
					</div>
				</div>

				{loading ? (
					<div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400">
						<LoaderCircle aria-hidden="true" size={24} className="animate-spin text-ios-blue" />
						<p className="text-xs">Searching the web…</p>
					</div>
				) : error ? (
					<div className="p-4 rounded-2xl bg-black/5 dark:bg-white/10 text-sm text-gray-500 dark:text-gray-300">
						{error}
					</div>
				) : results.length === 0 ? (
					<div className="py-12 text-center text-gray-400">
						<p className="text-base font-medium mb-1">No direct articles found</p>
						<p className="text-xs">Try DuckDuckGo or Google links above.</p>
					</div>
				) : (
					<div className="space-y-3">
						{results.map(item => (
							<button
								key={item.pageId}
								type="button"
								onClick={() => onNavigate(item.url)}
								className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.99] ${
									darkMode
										? 'bg-[#2c2c2e]/70 border-white/10 hover:bg-[#2c2c2e]'
										: 'bg-white border-black/5 hover:border-black/15 shadow-xs'
								}`}
							>
								<div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-1">
									<Globe aria-hidden="true" size={11} />
									<span className="truncate">en.wikipedia.org</span>
								</div>
								<div className="text-sm font-semibold text-ios-blue mb-1">{item.title}</div>
								<p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
									{item.snippet}…
								</p>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
