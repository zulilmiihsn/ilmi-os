import Link from 'next/link';

export default function NotFound() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4 font-sans">
			<h2 className="text-4xl font-bold mb-2">404</h2>
			<p className="text-gray-400 mb-6 text-sm">This page could not be found.</p>
			<Link
				href="/"
				className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-colors"
			>
				Return Home
			</Link>
		</div>
	);
}
