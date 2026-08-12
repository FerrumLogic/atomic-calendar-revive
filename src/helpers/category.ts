export interface CategoryConfig {
	icon?: string;
	color?: string;
	label?: string;
}

export interface Category {
	key: string;
	icon: string;
	color: string;
	label?: string;
}

export const DEFAULT_CATEGORY_MAP: Record<string, CategoryConfig> = {
	'🌿': { icon: '🌿', color: '#2e7d32' }, // строгий пост
	'🐟': { icon: '🐟', color: '#1565c0' }, // рыба
	'🧀': { icon: '🧀', color: '#f9a825' }, // без мяса
	'✝️': { icon: '✝️', color: '#c62828' }, // праздник
	'🕯️': { icon: '🕯️', color: '#5d4037' }, // поминовение
	'✨': { icon: '✨', color: '#6a1b9a' }, // сплошная седмица
};

export function resolveCategoryMap(map?: Record<string, CategoryConfig>): Record<string, CategoryConfig> {
	const merged: Record<string, CategoryConfig> = { ...DEFAULT_CATEGORY_MAP };
	for (const [marker, cfg] of Object.entries(map ?? {})) {
		merged[marker] = { ...merged[marker], ...cfg, icon: cfg.icon ?? marker };
	}
	return merged;
}

export function parseCategoriesFromTitle(
	title: string,
	map: Record<string, CategoryConfig>,
): Category[] {
	const out: Category[] = [];
	for (const [marker, cfg] of Object.entries(map)) {
		if (title.includes(marker)) {
			out.push({
				key: marker,
				icon: cfg.icon ?? marker,
				color: cfg.color ?? '#888888',
				label: cfg.label ?? marker,
			});
		}
	}
	return out;
}
