import type { Metadata, Viewport } from 'next';
import '../styles/ios.css';
import '../styles/macos.css';
import './globals.css';

export const metadata: Metadata = {
	title: 'iLmi',
	description: 'iLmi - A beautiful macOS and iOS simulator built with Next.js',
	icons: {
		icon: '/favicon.svg',
		apple: '/favicon.svg',
	},
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: '#000000',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="font-sans antialiased">{children}</body>
		</html>
	);
}
