'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Note, NoteView } from '../types';

const STORAGE_KEY = 'notes';

const DEFAULT_NOTES: Note[] = [
	{
		id: 'welcome-note-1',
		title: 'Welcome to iLmi Notes 📝',
		content: 'This is a full-featured macOS/iOS Notes simulator. You can create, edit, search, and delete notes.',
		date: new Date(),
		folder: 'Notes',
	},
	{
		id: 'welcome-note-2',
		title: 'Features List',
		content: '- Automatic localStorage synchronization\n- Search filtering by title and content\n- Selection mode for batch deletion\n- Format toolbar',
		date: new Date(),
		folder: 'Work',
	},
];

export function useNotes() {
	const [notes, setNotes] = useState<Note[]>([]);
	const [view, setView] = useState<NoteView>('list');
	const [currentNote, setCurrentNote] = useState<Note | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectionMode, setSelectionMode] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [showFormatToolbar, setShowFormatToolbar] = useState(false);
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);

	// Load notes on mount
	useEffect(() => {
		setMounted(true);
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			try {
				const parsed = JSON.parse(saved, (key, value) => {
					if (key === 'date') return new Date(value);
					return value;
				});

				if (Array.isArray(parsed) && parsed.length > 0) {
					const validNotes = parsed.map((n: Note) => ({
						...n,
						date: n.date instanceof Date && !isNaN(n.date.getTime()) ? n.date : new Date(),
					}));
					setNotes(validNotes);
					return;
				}
			} catch {
				// Silent fail
			}
		}
		// Fallback to initial notes
		setNotes(DEFAULT_NOTES);
	}, []);

	// Auto-save to localStorage
	useEffect(() => {
		if (mounted && notes.length > 0) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
		}
	}, [notes, mounted]);

	// Actions
	const handleNoteClick = useCallback(
		(note: Note) => {
			if (selectionMode) {
				setNotes(prev =>
					prev.map(n => (n.id === note.id ? { ...n, selected: !n.selected } : n))
				);
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
			id: Date.now().toString(),
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
