import { useState, useEffect, useMemo, useRef } from 'react';
import { triggerHaptic } from '../../../utils/haptic';
import {
	DEMO_TRACKS,
	buildQueue,
	loadLiked,
	nextIndex,
	prevIndex,
	saveLiked,
	toggleLiked,
	type RepeatMode,
} from './library';
import { getEnginePosition, playTrack, setEngineVolume, stopPlayback } from './audioEngine';

export function useMusicPlayer() {
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

	const playToken = useRef(0);
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
		return () => stopPlayback();
	}, []);

	useEffect(() => {
		if (!isPlaying) return;
		const timer = setInterval(() => setPosition(getEnginePosition()), 500);
		return () => clearInterval(timer);
	}, [isPlaying]);

	const playAt = async (index: number, list?: string[], offset = 0) => {
		const q = list ?? stateRef.current.queue;
		const track = DEMO_TRACKS.find(t => t.id === q[index]);
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

	const playTrackId = (id: string) => {
		triggerHaptic('light');
		const q = buildQueue(DEMO_TRACKS, id, shuffle);
		void playAt(0, q, 0);
	};

	const toggleShuffle = () => {
		triggerHaptic('light');
		const on = !shuffle;
		setShuffle(on);
		if (queue.length > 0) {
			const currentId = queue[qi] ?? queue[0] ?? '';
			const q = buildQueue(DEMO_TRACKS, currentId, on);
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

	const currentId = queue[qi] ?? null;
	const current = DEMO_TRACKS.find(t => t.id === currentId) ?? null;
	const results = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return DEMO_TRACKS;
		return DEMO_TRACKS.filter(
			t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
		);
	}, [searchQuery]);

	return {
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
		setSearchQuery,
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
	};
}
