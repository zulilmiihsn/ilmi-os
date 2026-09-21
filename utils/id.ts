/**
 * Collision-safe ID generator.
 * Uses crypto.randomUUID when available, falls back to a
 * timestamp + random suffix (still prefixed to avoid pure Date.now collisions).
 */
export function generateId(prefix = 'id'): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return `${prefix}-${crypto.randomUUID()}`;
	}
	const rand =
		typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function'
			? Array.from(crypto.getRandomValues(new Uint8Array(8)))
					.map(b => b.toString(36))
					.join('')
			: Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
	return `${prefix}-${Date.now().toString(36)}-${rand}`;
}
