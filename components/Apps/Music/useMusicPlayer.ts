import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { triggerHaptic } from '../../../utils/haptic';
import {
	DEMO_TRACKS,
	buildQueue,
	loadLiked,
	nextIndex,
	parseItunesResults,
	prevIndex,
	saveLiked,
	toggleLiked,
	type DemoTrack,
	type RepeatMode,
} from './library';
import { getEnginePosition, playTrack, setEngineVolume, stopPlayback } from './audioEngine';

export function useMusicPlayer() {
	const [libraryTracks, setLibraryTracks] = useState<DemoTrack[]>(() => DEMO_TRACKS);
	const [catalogTracks, setCatalogTracks] = useState<DemoTrack[]>([]);
	const [catalogLoading, setCatalogLoading] = useState(false);
	const [catalogError, setCatalogError] = useState<string | null>(null);
	const [queue, setQueue] = useState<string[]>([]);
	const [qi, setQi] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [shuffle, setShuffle] = useState(false);
	const [repeat, setRepeat] = useState<RepeatMode>('off');
	const [volume, setVolume] = useState(0.8);
	const [position, setPosition] = useState(0);
	const [duration, setDuration] = useState(0);
	const [liked, setLiked] = useState<string[]>([]);
	const [fullPlayer, setFullPlayer] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [persistError, setPersistError] = useState(false);

	const allTracks = useMemo(() => {
		const map = new Map<string, DemoTrack>();
		for (const t of libraryTracks) map.set(t.id, t);
		for (const t of catalogTracks) {
			if (!map.has(t.id)) map.set(t.id, t);
		}
		return Array.from(map.values());
	}, [libraryTracks, catalogTracks]);

	const allTracksRef = useRef(allTracks);
	allTracksRef.current = allTracks;
	const localUrlsRef = useRef<string[]>([]);
	const playToken = useRef(0);
	const searchSeq = useRef(0);
	const lastRepeatTap = useRef(0);
	const stateRef = useRef({ queue, qi, repeat });
	stateRef.current = { queue, qi, repeat };
	const advanceRef = useRef(() => {});
	advanceRef.current = () => {
		const s = stateRef.current;
		const next = nextIndex(s.queue, s.qi, s.repeat);
		if (next === null) {
			stopPlayback();
			setIsPlaying(false);
			setPosition(0);
		} else {
			void playAt(next);
		}
	};

	useEffect(() => {
		setLiked(loadLiked());
		const urls = localUrlsRef.current;
		return () => {
			stopPlayback();
			urls.forEach(u => URL.revokeObjectURL(u));
		};
	}, []);

	useEffect(() => {
		if (!isPlaying) return;
		const timer = setInterval(() => setPosition(getEnginePosition()), 500);
		return () => clearInterval(timer);
	}, [isPlaying]);

	const playAt = async (index: number, list?: string[], offset = 0) => {
		const q = list ?? stateRef.current.queue;
		const track = allTracksRef.current.find(t => t.id === q[index]);
		if (!track) return;
		const token = ++playToken.current;
		const realDuration = await playTrack(track, offset, () => advanceRef.current());
		if (token !== playToken.current) return;
		setQueue(q);
		setQi(index);
		setDuration(realDuration);
		setPosition(offset);
		setIsPlaying(true);
	};

	const togglePlay = () => {
		if (queue.length === 0) return;
		triggerHaptic('light');
		if (isPlaying) {
			setPosition(getEnginePosition());
			stopPlayback();
			playToken.current++;
			setIsPlaying(false);
		} else {
			void playAt(qi, queue, position);
		}
	};

	const playNext = () => {
		triggerHaptic('light');
		const next = nextIndex(queue, qi, repeat);
		if (next === null) {
			stopPlayback();
			setIsPlaying(false);
			setPosition(0);
		} else {
			void playAt(next);
		}
	};

	const playPrev = () => {
		triggerHaptic('light');
		const prev = prevIndex(queue, qi, position, repeat);
		if (prev === 'restart') void playAt(qi, queue, 0);
		else void playAt(prev);
	};

	const playTrackId = (id: string, pool?: DemoTrack[]) => {
		triggerHaptic('light');
		const sourcePool = pool ?? allTracksRef.current;
		const q = buildQueue(sourcePool, id, shuffle);
		void playAt(0, q, 0);
	};

	const toggleShuffle = () => {
		triggerHaptic('light');
		const on = !shuffle;
		setShuffle(on);
		if (queue.length > 0) {
			const currentId = queue[qi] ?? queue[0] ?? '';
			const q = buildQueue(allTracksRef.current, currentId, on);
			setQueue(q);
			setQi(0);
		}
	};

	const cycleRepeat = () => {
		triggerHaptic('light');
		const now = Date.now();
		if (now - lastRepeatTap.current < 350) {
			setRepeat('one');
		} else {
			setRepeat(prev => (prev === 'off' ? 'all' : 'off'));
		}
		lastRepeatTap.current = now;
	};

	const toggleLike = (id: string) => {
		triggerHaptic('light');
		const next = toggleLiked(liked, id);
		setLiked(next);
		if (!saveLiked(next)) setPersistError(true);
	};

	const seek = (value: number) => {
		setPosition(value);
		if (isPlaying) void playAt(qi, queue, value);
	};

	const changeVolume = (value: number) => {
		setVolume(value);
		setEngineVolume(value);
	};

	const importLocalFiles = useCallback((files: FileList | null) => {
		if (!files || files.length === 0) return;
		const added: DemoTrack[] = [];
		for (const file of Array.from(files)) {
			if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(file.name)) {
				continue;
			}
			const objectUrl = URL.createObjectURL(file);
			localUrlsRef.current.push(objectUrl);
			const cleanTitle =
				file.name
					.replace(/\.[^/.]+$/, '')
					.replace(/[_-]+/g, ' ')
					.trim() || 'Audio';
			added.push({
				id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
				title: cleanTitle,
				artist: 'Local File',
				album: 'My Device',
				durationSec: 180,
				seed: cleanTitle.length * 13,
				hue: ['#fa2d48', '#ff6482'],
				audioUrl: objectUrl,
				source: 'local',
			});
		}
		if (added.length > 0) {
			setLibraryTracks(prev => [...added, ...prev]);
		}
	}, []);

	const searchAppleMusic = useCallback(async (rawTerm: string) => {
		const term = rawTerm.trim();
		if (!term) {
			setCatalogTracks([]);
			setCatalogError(null);
			return;
		}
		const seq = ++searchSeq.current;
		setCatalogLoading(true);
		setCatalogError(null);
		try {
			const res = await fetch(
				`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=12`
			);
			if (!res.ok) throw new Error('Catalog unavailable');
			const json: unknown = await res.json();
			if (seq !== searchSeq.current) return;
			const parsed = parseItunesResults(json);
			setCatalogTracks(parsed);
			if (parsed.length === 0) setCatalogError(`No Apple Music songs found for "${term}".`);
		} catch {
			if (seq !== searchSeq.current) return;
			setCatalogError('Could not reach Apple Music catalog. Offline library is still available.');
		} finally {
			if (seq === searchSeq.current) setCatalogLoading(false);
		}
	}, []);

	const updateSearchQuery = useCallback((value: string) => {
		setSearchQuery(value);
		if (!value.trim()) {
			setCatalogTracks([]);
			setCatalogError(null);
		}
	}, []);

	const currentId = queue[qi] ?? null;
	const current = allTracks.find(t => t.id === currentId) ?? null;
	const results = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return libraryTracks;
		return libraryTracks.filter(
			t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
		);
	}, [searchQuery, libraryTracks]);

	return {
		libraryTracks,
		catalogTracks,
		catalogLoading,
		catalogError,
		isPlaying,
		shuffle,
		repeat,
		volume,
		position,
		duration,
		liked,
		fullPlayer,
		setFullPlayer,
		searchQuery,
		setSearchQuery: updateSearchQuery,
		persistError,
		current,
		results,
		togglePlay,
		playNext,
		playPrev,
		playTrackId,
		toggleShuffle,
		cycleRepeat,
		toggleLike,
		seek,
		changeVolume,
		importLocalFiles,
		searchAppleMusic,
	};
}
