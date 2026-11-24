'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Note, NoteView } from '../types';
import { generateId } from '../../../../utils/id';
import { appStorage } from '../../../../utils/storage';
import {
	LEGACY_NOTES_STORAGE_KEY,
	NOTES_STORAGE_KEY,
	decodeNotes,
	readLegacyNotes,
	resolveInitialNotes,
	type NotesLoadInput,
	type NotesLoadResult,
} from './notesStorage';

export {
	decodeNotes,
	readLegacyNotes,
	resolveInitialNotes,
	type NotesLoadInput,
	type NotesLoadResult,
};

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
		const stored = appStorage.load<unknown>(NOTES_STORAGE_KEY, null);
		let destinationPresent = false;
		try {
			destinationPresent = window.localStorage.getItem(NOTES_STORAGE_KEY) !== null;
		} catch {
			destinationPresent = false;
		}
		const result = resolveInitialNotes({
			stored,
			destinationPresent,
			readLegacy: readLegacyNotes,
			save: nextNotes => appStorage.save(NOTES_STORAGE_KEY, nextNotes),
			loadVerify: () => appStorage.load<unknown>(NOTES_STORAGE_KEY, null),
		});
		setNotes(result.notes);
		skipInitialSave.current = result.skipInitialSave;
		if (result.removeLegacy) {
			try {
				window.localStorage.removeItem(LEGACY_NOTES_STORAGE_KEY);
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
		setSaveFailed(!appStorage.save(NOTES_STORAGE_KEY, notes));
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
