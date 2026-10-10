import { mulberry32, type DemoTrack } from './library';

/**
 * Thin WebAudio wrapper. Browser-only: never imported by unit tests.
 * Each demo track is a deterministically rendered loop, so playback,
 * pause, seek, and volume are real — only the catalogue is demo data.
 */

let ctx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
let startedAtCtxTime = 0;
let startOffsetSec = 0;
let currentDuration = 0;
let volumeLevel = 0.8;
let playSeq = 0;
const bufferCache = new Map<string, Promise<AudioBuffer>>();

function ensureCtx(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!ctx) {
		const AC =
			window.AudioContext ??
			(window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
		if (!AC) return null;
		ctx = new AC();
		gainNode = ctx.createGain();
		gainNode.gain.value = volumeLevel;
		gainNode.connect(ctx.destination);
	}
	if (ctx.state === 'suspended') void ctx.resume();
	return ctx;
}

function renderTrack(track: DemoTrack): Promise<AudioBuffer> {
	const hit = bufferCache.get(track.id);
	if (hit) return hit;
	const job = (async () => {
		const sr = 22050;
		const off = new OfflineAudioContext(2, Math.ceil(sr * track.durationSec), sr);
		const out = off.createGain();
		out.gain.value = 0.5;
		out.connect(off.destination);
		const rand = mulberry32(track.seed);
		const scale = [0, 2, 4, 7, 9]; // major pentatonic
		const base = 220 * Math.pow(2, (track.seed % 5) / 12);
		const beat = 0.42;
		const steps = Math.floor(track.durationSec / beat);
		for (let i = 0; i < steps; i++) {
			const degree = Math.floor(rand() * 10) - 2;
			if (degree < 0 && rand() < 0.5) continue; // rests breathe
			const semis = (scale[((degree % 5) + 5) % 5] ?? 0) + 12 * Math.floor(degree / 5);
			const freq = base * Math.pow(2, semis / 12);
			const t = i * beat;
			const osc = off.createOscillator();
			osc.type = i % 4 === 3 ? 'sine' : 'triangle';
			osc.frequency.value = freq;
			const g = off.createGain();
			g.gain.setValueAtTime(0, t);
			g.gain.linearRampToValueAtTime(0.6, t + 0.02);
			g.gain.exponentialRampToValueAtTime(0.001, t + beat * 1.8);
			osc.connect(g);
			g.connect(out);
			osc.start(t);
			osc.stop(t + beat * 2);
			if (i % 4 === 0) {
				const bass = off.createOscillator();
				bass.type = 'sine';
				bass.frequency.value = base / 2;
				const bg = off.createGain();
				bg.gain.setValueAtTime(0, t);
				bg.gain.linearRampToValueAtTime(0.35, t + 0.03);
				bg.gain.exponentialRampToValueAtTime(0.001, t + beat * 3);
				bass.connect(bg);
				bg.connect(out);
				bass.start(t);
				bass.stop(t + beat * 3.2);
			}
		}
		return await off.startRendering();
	})();
	bufferCache.set(track.id, job);
	return job;
}

/** Starts playback, resolving with the real buffer duration. */
export async function playTrack(
	track: DemoTrack,
	offsetSec: number,
	onEnded: () => void
): Promise<number> {
	const ac = ensureCtx();
	const out = gainNode;
	if (!ac || !out) return track.durationSec;
	const seq = ++playSeq;
	stopSource();
	const buffer = await renderTrack(track);
	if (seq !== playSeq) return buffer.duration; // superseded while rendering
	source = ac.createBufferSource();
	source.buffer = buffer;
	source.connect(out);
	startOffsetSec = Math.min(Math.max(0, offsetSec), buffer.duration);
	startedAtCtxTime = ac.currentTime;
	currentDuration = buffer.duration;
	const node = source;
	node.onended = () => {
		if (source === node) {
			source = null;
			onEnded();
		}
	};
	node.start(0, startOffsetSec % buffer.duration);
	return buffer.duration;
}

function stopSource(): void {
	try {
		if (source) {
			source.onended = null;
			source.stop();
		}
	} catch {
		// Already stopped: harmless.
	}
	source = null;
}

export function stopPlayback(): void {
	stopSource();
}

export function setEngineVolume(v: number): void {
	volumeLevel = Math.min(1, Math.max(0, v));
	if (ctx && gainNode) {
		gainNode.gain.setTargetAtTime(volumeLevel, ctx.currentTime, 0.02);
	}
}

export function getEnginePosition(): number {
	if (!ctx || !source) return startOffsetSec;
	return Math.min(startOffsetSec + Math.max(0, ctx.currentTime - startedAtCtxTime), currentDuration);
}

export function getEngineDuration(): number {
	return currentDuration;
}
