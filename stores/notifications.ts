import { create } from 'zustand';
import { generateId } from '../utils/id';

export interface NotificationItem {
	id: string;
	appId: string;
	appName: string;
	appIcon: string;
	title: string;
	message: string;
	time: string;
	unread?: boolean;
}

interface NotificationsState {
	notifications: NotificationItem[];
	dismissNotification: (id: string) => void;
	clearAllNotifications: () => void;
	addNotification: (notification: Omit<NotificationItem, 'id'>) => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
	{
		id: 'notif-1',
		appId: 'mail',
		appName: 'Mail',
		appIcon: '/media/Mail.webp',
		title: 'GitHub Notifications',
		message: '[zulilmiihsn/iLmi] Build #482 completed successfully on main branch.',
		time: '5m ago',
		unread: true,
	},
	{
		id: 'notif-2',
		appId: 'calendar',
		appName: 'Calendar',
		appIcon: '/media/Calendar.webp',
		title: 'Project Review & Architecture Sync',
		message: 'Meeting with Dev Team starts in 15 minutes via Google Meet.',
		time: '20m ago',
		unread: true,
	},
	{
		id: 'notif-3',
		appId: 'notes',
		appName: 'Notes',
		appIcon: '/media/Note.webp',
		title: 'Recent Note',
		message: 'iOS Design System checklist & fluid spring physics parameters updated.',
		time: '1h ago',
		unread: false,
	},
	{
		id: 'notif-4',
		appId: 'photos',
		appName: 'Photos',
		appIcon: '/media/Gallery.webp',
		title: 'Memories',
		message: 'Rediscover your favorite moments from this day last year.',
		time: '3h ago',
		unread: false,
	},
];

export const useNotificationsStore = create<NotificationsState>((set) => ({
	notifications: INITIAL_NOTIFICATIONS,
	dismissNotification: (id) =>
		set((state) => ({
			notifications: state.notifications.filter((n) => n.id !== id),
		})),
	clearAllNotifications: () =>
		set({
			notifications: [],
		}),
	addNotification: (notif) =>
		set((state) => ({
			notifications: [
				{
					...notif,
					id: generateId('notif'),
				},
				...state.notifications,
			],
		})),
}));
