export interface DayIconSource {
	icon?: string;
	color?: string;
	showCategoryIcon: boolean;
	categories: { icon: string; color: string }[];
	entity_id?: string;
}

/**
 * Выбор иконок для дня календарной сетки.
 *
 * Календарь с включёнными категориями (per-entity showCategoryIcon) показывает
 * ТОЛЬКО иконки категорий (обычные дни без категории → пусто, без иконки календаря).
 * Календари без категорий всегда показывают свою иконку календаря.
 */
export function selectDayIcons(
	events: DayIconSource[],
	resolveIcon: (event: DayIconSource) => string,
): DayIconSource[] {
	const icons: DayIconSource[] = [];
	events.forEach((event) => {
		if (event.showCategoryIcon) {
			event.categories.forEach((cat) => {
				if (!icons.find((c) => c.icon === cat.icon && c.color === cat.color)) {
					icons.push({ ...cat });
				}
			});
			return;
		}
		const icon = event.icon || resolveIcon(event);
		const color = event.color;
		if (!icons.find((c) => c.icon === icon && c.color === color)) {
			icons.push({ icon, color, showCategoryIcon: false, categories: [] });
		}
	});
	return icons.sort((a, b) => a.icon.localeCompare(b.icon));
}
