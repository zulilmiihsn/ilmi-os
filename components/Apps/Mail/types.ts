export interface Email {
	id: string;
	from: string;
	to?: string;
	subject: string;
	preview: string;
	date: string;
	read: boolean;
	mailbox: string;
	isVip?: boolean;
	isFlagged?: boolean;
}

export interface Mailbox {
	id: string;
	name: string;
	icon: string;
	type: 'smart' | 'folder' | 'account';
	count?: number;
}
