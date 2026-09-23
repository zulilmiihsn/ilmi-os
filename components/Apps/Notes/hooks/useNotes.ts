'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Note, NoteView } from '../types';
import { generateId } from '../../../../utils/id';
import { appStorage } from '../../../../utils/storage';

const STORAGE_KEY = 'ilmi:notes:v1';
const LEGACY_STORAGE_KEY = 'notes';

function toValidDate(value: unknown): Date | null {
	const date = value instanceof Date ? value : new Date(value as string);
	return isNaN(date.getTime()) ? null : date;
}

function normalizeNote(record: unknown): Note | null {
	if (typeof record !== 'object' || record === null) return null;
	const item = record as Record<string, unknown>;
	if (typeof item.id !== 'string') return null;
	const date = toValidDate(item.date);
	if (!date) return null;
	return {
		id: item.id,
		title: typeof item.title === 'string' ? item.title : '',
		content: typeof item.content === 'string' ? item.content : '',
		date,
		folder: typeof item.folder === 'string' ? item.folder : 'Notes',
		hasImage: typeof item.hasImage === 'boolean' ? item.hasImage : undefined,
		imageSrc: typeof item.imageSrc === 'string' ? item.imageSrc : undefined,
		tags: Array.isArray(item.tags)
			? item.tags.filter((t): t is string => typeof t === 'string')
			: undefined,
		selected: false,
	};
}

/** Decode any unknown payload into notes. Empty arrays are valid; anything else is null. */
export function decodeNotes(payload: unknown): Note[] | null {
	if (!Array.isArray(payload)) return null;
	const notes: Note[] = [];
	for (const record of payload) {
		const note = normalizeNote(record);
		if (!note) return null;
		notes.push(note);
	}
	return notes;
}

/** Read the pre-v1 raw-array format without touching the new destination key. */
export function readLegacyNotes(): Note[] | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
		if (!raw) return null;
		return decodeNotes(JSON.parse(raw));
	} catch {
		return null;
	}
}

const DEFAULT_NOTES: Note[] = [
	{
		id: 'welcome-note-1',
		title: 'Welcome to iLmi Notes 📝',
		content:
			'This is a full-featured macOS/iOS Notes simulator. You can create, edit, search, and delete notes.',
		date: new Date(),
		folder: 'Notes',
	},
	{
		id: 'welcome-note-2',
		title: 'Features List',
		content:
			'- Automatic localStorage synchronization\n- Search filtering by title and content\n- Selection mode for batch deletion\n- Format toolbar',
		date: new Date(),
		folder: 'Work',
	},
];

export interface NotesLoadInput {
	/** Raw destination payload (`appStorage.load` result, null when absent/unreadable). */
	stored: unknown;
	/** Whether the destination key exists, even if its content is invalid. */
	destinationPresent: boolean;
	/** Read the pre-v1 format; invoked lazily, only when migration is an option. */
	readLegacy: () => Note[] | null;
	/** Persist to the destination; result is verified by a re-read. */
	save: (notes: Note[]) => boolean;
	/** Re-read the destination after a migration write. May throw. */
	loadVerify: () => unknown;
}

export interface NotesLoadResult {
	/** Notes to render. Falls back to defaults without touching stored payloads. */
	notes: Note[];
	/** Skip the first autosave so fallback content never overwrites recoverable data. */
	skipInitialSave: boolean;
	/** The legacy source migrated cleanly and may be removed. */
	removeLegacy: boolean;
}

/**
 * Pure mount-load decision for Notes (Tahap 2 acceptance without React):
 * valid destination (including `[]`) wins; invalid-but-present destination is
 * preserved while defaults render; legacy migrates only after a verified
 * write, otherwise the source is kept and the first autosave skipped.
 */
export function resolveInitialNotes(input: NotesLoadInput): NotesLoadResult {
	const decoded = input.stored === null ? null : decodeNotes(input.stored);
	if (decoded) {
		return { notes: decoded, skipInitialSave: false, removeLegacy: false };
	}
	if (input.destinationPresent) {
		return { notes: DEFAULT_NOTES, skipInitialSave: true, removeLegacy: false };
	}
	const legacy = input.readLegacy();
	if (!legacy) {
		return { notes: DEFAULT_NOTES, skipInitialSave: false, removeLegacy: false };
	}
	input.save(legacy);
	let verified = false;
	try {
		verified = input.loadVerify() !== null;
	} catch {
		verified = false;
	}
	if (verified) {
		return { notes: legacy, skipInitialSave: false, removeLegacy: true };
	}
	return { notes: legacy, skipInitialSave: true, removeLegacy: false };
}

export function useNotes() {
	const [notes, setNotes] = useState<Note[]>([]);
	const [view, setView] = useState<NoteView>('list');
	const [currentNote, setCurrentNote] = useState<Note | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectionMode, setSelectionMode] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [showFormatToolbar, setShowFormatToolbar] = useState(false);
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);
	const [saveFailed, setSaveFailed] = useState(false);
	// When the destination holds invalid data, the first autosave is skipped
	// so fallback content never overwrites the only recoverable copy.
	const skipInitialSave = useRef(false);

	// Load notes on mount
	useEffect(() => {
		const stored = appStorage.load<unknown>(STORAGE_KEY, null);
		let destinationPresent = false;
		try {
			destinationPresent = window.localStorage.getItem(STORAGE_KEY) !== null;
		} catch {
			destinationPresent = false;
		}
		const result = resolveInitialNotes({
			stored,
			destinationPresent,
			readLegacy: readLegacyNotes,
			save: notes => appStorage.save(STORAGE_KEY, notes),
			loadVerify: () => appStorage.load<unknown>(STORAGE_KEY, null),
		});
		setNotes(result.notes);
		skipInitialSave.current = result.skipInitialSave;
		if (result.removeLegacy) {
			try {
				window.localStorage.removeItem(LEGACY_STORAGE_KEY);
			} catch {
				// Keep the legacy source when it cannot be removed; skip the
				// first autosave like a failed verification.
				skipInitialSave.current = true;
			}
		}
		setMounted(true);
	}, []);

	// Auto-save to localStorage (empty collections are valid and must persist)
	useEffect(() => {
		if (!mounted) return;
		if (skipInitialSave.current) {
			skipInitialSave.current = false;
			return;
		}
		setSaveFailed(!appStorage.save(STORAGE_KEY, notes));
	}, [notes, mounted]);

	// Actions
	const handleNoteClick = useCallback(
		(note: Note) => {
			if (selectionMode) {
				setNotes(prev => prev.map(n => (n.id === note.id ? { ...n, selected: !n.selected } : n)));
			} else {
				setCurrentNote(note);
				setView('detail');
				setShowFormatToolbar(false);
			}
		},
		[selectionMode]
	);

	const handleBack = useCallback(() => {
		setView('list');
		setCurrentNote(null);
		setShowFormatToolbar(false);
	}, []);

	const createNewNote = useCallback(() => {
		const newNote: Note = {
			id: generateId('note'),
			title: '',
			content: '',
			date: new Date(),
			folder: 'Notes',
			selected: false,
		};
		setNotes(prev => [newNote, ...prev]);
		setCurrentNote(newNote);
		setView('detail');
		setShowFormatToolbar(false);
	}, []);

	const updateCurrentNote = useCallback(
		(updates: Partial<Note>) => {
			if (!currentNote) return;
			const updated = { ...currentNote, ...updates, date: new Date() };
			setCurrentNote(updated);
			setNotes(prev => prev.map(n => (n.id === currentNote.id ? updated : n)));
		},
		[currentNote]
	);

	const toggleSelectionMode = useCallback(() => {
		setSelectionMode(prev => {
			if (prev) {
				// Clear selections when exiting
				setNotes(curr => curr.map(n => ({ ...n, selected: false })));
			}
			return !prev;
		});
	}, []);

	const confirmDelete = useCallback(() => {
		setNotes(prev => prev.filter(n => !n.selected));
		setSelectionMode(false);
		setShowDeleteAlert(false);
	}, []);

	// Filtered notes
	const filteredNotes = useMemo(() => {
		if (!searchQuery.trim()) return notes;
		const query = searchQuery.toLowerCase().trim();
		return notes.filter(
			n =>
				(n.title?.toLowerCase() || '').includes(query) ||
				(n.content?.toLowerCase() || '').includes(query)
		);
	}, [notes, searchQuery]);

	// Grouping
	const todayNotes = useMemo(() => {
		const today = new Date();
		return filteredNotes.filter(n => {
			if (!n.date) return false;
			try {
				return (
					n.date.getDate() === today.getDate() &&
					n.date.getMonth() === today.getMonth() &&
					n.date.getFullYear() === today.getFullYear()
				);
			} catch {
				return false;
			}
		});
	}, [filteredNotes]);

	const previousNotes = useMemo(() => {
		return filteredNotes.filter(n => !todayNotes.includes(n));
	}, [filteredNotes, todayNotes]);

	const selectedCount = useMemo(() => {
		return notes.filter(n => n.selected).length;
	}, [notes]);

	return {
		mounted,
		saveFailed,
		notes,
		view,
		currentNote,
		searchQuery,
		setSearchQuery,
		selectionMode,
		showFormatToolbar,
		setShowFormatToolbar,
		showDeleteAlert,
		setShowDeleteAlert,
		selectedCount,
		todayNotes,
		previousNotes,
		handleNoteClick,
		handleBack,
		createNewNote,
		updateCurrentNote,
		toggleSelectionMode,
		confirmDelete,
	};
}
