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
	'🌿': { icon: 'mdi:leaf', color: '#2e7d32', label: 'Пост' }, // строгий пост
	'🐟': { icon: 'mdi:fish', color: '#1565c0', label: 'Рыба' }, // рыба
	'🧀': { icon: 'mdi:cheese', color: '#f9a825', label: 'Без мяса' }, // без мяса
	'✝️': { icon: 'mdi:cross', color: '#c62828', label: 'Праздник' }, // праздник
	'🕯️': { icon: 'mdi:candle', color: '#5d4037', label: 'Поминовение' }, // поминовение
	'✨': { icon: 'mdi:star', color: '#6a1b9a', label: 'Седмица' }, // сплошная седмица
};

export function resolveCategoryMap(map?: Record<string, CategoryConfig>): Record<string, CategoryConfig> {
	const merged: Record<string, CategoryConfig> = { ...DEFAULT_CATEGORY_MAP };
	for (const [marker, cfg] of Object.entries(map ?? {})) {
		merged[marker] = {
			...merged[marker],
			...cfg,
			icon: cfg.icon ?? merged[marker]?.icon ?? marker,
		};
	}
	return merged;
}

export function parseCategoriesFromTitle(title: string, map: Record<string, CategoryConfig>): Category[] {
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
	// первый маркер в заголовке — главная категория (цвет/иконка полосы)
	return out.sort((a, b) => title.indexOf(a.key) - title.indexOf(b.key));
}

export function stripCategoryMarkers(title: string, map: Record<string, CategoryConfig>): string {
	let out = title;
	for (const marker of Object.keys(map)) {
		out = out.split(marker).join('').trim();
	}
	// убрать лишние пробелы после удаления маркеров
	return out.replace(/\s{2,}/g, ' ').trim();
}
