'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSettingsStore } from '../../../stores/settings';
import { triggerHaptic } from '../../../utils/haptic';
import {
	addMessage,
	createConversation,
	filterConversations,
	loadConversations,
	markRead,
	saveConversations,
	type Conversation,
} from './conversations';
import { ConversationListView } from './ConversationListView';
import { ChatView } from './ChatView';

type View = { name: 'list' } | { name: 'chat'; id: string } | { name: 'new' };

export default function Messages() {
	const { darkMode } = useSettingsStore();
	const [convos, setConvos] = useState<Conversation[]>([]);
	const [view, setView] = useState<View>({ name: 'list' });
	const [query, setQuery] = useState('');
	const [draft, setDraft] = useState('');
	const [draftTo, setDraftTo] = useState('');
	const [persistError, setPersistError] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setConvos(loadConversations());
	}, []);

	const persist = (next: Conversation[]) => {
		setConvos(next);
		if (!saveConversations(next)) setPersistError(true);
	};

	const openConvo = (id: string) => {
		triggerHaptic('light');
		persist(markRead(convos, id));
		setDraft('');
		setView({ name: 'chat', id });
	};

	const goBack = () => {
		triggerHaptic('light');
		setDraft('');
		setDraftTo('');
		setView({ name: 'list' });
	};

	const send = () => {
		const body = draft.trim();
		if (!body) return;
		triggerHaptic('medium');
		if (view.name === 'new') {
			const next = createConversation(convos, draftTo, body);
			if (next.length === convos.length) return;
			persist(next);
			const created = next[0];
			if (created) setView({ name: 'chat', id: created.id });
		} else if (view.name === 'chat') {
			persist(addMessage(convos, view.id, body));
		}
		setDraft('');
		setDraftTo('');
	};

	const callContact = () => {
		triggerHaptic('medium');
		window.dispatchEvent(new CustomEvent<string>('ilmi:open-app', { detail: 'phone' }));
	};

	const active = view.name === 'chat' ? (convos.find(c => c.id === view.id) ?? null) : null;
	const visible = useMemo(() => filterConversations(convos, query), [convos, query]);

	useEffect(() => {
		const el = scrollRef.current;
		if (el && view.name !== 'list') el.scrollTop = el.scrollHeight;
	}, [view, convos]);

	return (
		<div
			className={`messages-app w-full h-full flex flex-col overflow-hidden font-sans select-none transition-colors duration-300 ${
				darkMode ? 'bg-black text-white' : 'bg-white text-black'
			}`}
			onKeyDown={e => {
				if (e.key === 'Escape' && view.name !== 'list') goBack();
			}}
		>
			{persistError && (
				<div
					role="alert"
					className="shrink-0 mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400"
				>
					Could not save messages. Storage may be unavailable — changes will be lost on reload.
				</div>
			)}

			{view.name === 'list' && (
				<ConversationListView
					scrollRef={scrollRef}
					visible={visible}
					query={query}
					setQuery={setQuery}
					onOpenConvo={openConvo}
					onNewMessage={() => {
						triggerHaptic('light');
						setDraft('');
						setDraftTo('');
						setView({ name: 'new' });
					}}
				/>
			)}

			{(view.name === 'chat' || view.name === 'new') && (
				<ChatView
					scrollRef={scrollRef}
					mode={view.name}
					active={active}
					draft={draft}
					setDraft={setDraft}
					draftTo={draftTo}
					setDraftTo={setDraftTo}
					onBack={goBack}
					onSend={send}
					onCallContact={callContact}
				/>
			)}
		</div>
	);
}
