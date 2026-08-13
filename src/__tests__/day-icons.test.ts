import { describe, expect, test } from 'vitest';

import { selectDayIcons, DayIconSource } from '../helpers/day-icons';

const ev = (p: Partial<DayIconSource>): DayIconSource => ({
	showCategoryIcon: false,
	categories: [],
	...p,
});

describe('selectDayIcons', () => {
	test('calendar without categories shows its own icon', () => {
		const icons = selectDayIcons([ev({ icon: 'mdi:balloon' })], () => 'mdi:calendar');
		expect(icons.map((i) => i.icon)).toEqual(['mdi:balloon']);
	});

	test('icon falls back to entity icon', () => {
		const icons = selectDayIcons([ev({ icon: '' })], () => 'mdi:calendar');
		expect(icons.map((i) => i.icon)).toEqual(['mdi:calendar']);
	});

	test('entityConfig icon takes priority over fallback', () => {
		const icons = selectDayIcons([ev({ icon: 'mdi:balloon' })], () => 'mdi:circle');
		expect(icons.map((i) => i.icon)).toEqual(['mdi:balloon']);
	});

	test('categories calendar shows only category icons', () => {
		const icons = selectDayIcons(
			[ev({ showCategoryIcon: true, categories: [{ icon: 'mdi:fish', color: '#1565c0' }] })],
			() => 'mdi:calendar',
		);
		expect(icons.map((i) => i.icon)).toEqual(['mdi:fish']);
	});

	test('categories calendar on ordinary day shows nothing', () => {
		const icons = selectDayIcons([ev({ showCategoryIcon: true, categories: [] })], () => 'mdi:calendar');
		expect(icons).toEqual([]);
	});

	test('mixed day: categories calendar + calendar without categories keep both', () => {
		const icons = selectDayIcons(
			[
				ev({
					showCategoryIcon: true,
					categories: [{ icon: 'mdi:leaf', color: '#2e7d32' }],
				}),
				ev({ icon: 'mdi:balloon' }),
			],
			() => 'mdi:calendar',
		);
		expect(icons.map((i) => i.icon)).toEqual(expect.arrayContaining(['mdi:leaf', 'mdi:balloon']));
		expect(icons).toHaveLength(2);
	});

	test('deduplicates identical icons', () => {
		const icons = selectDayIcons(
			[
				ev({ icon: 'mdi:balloon' }),
				ev({ icon: 'mdi:balloon' }),
				ev({ showCategoryIcon: true, categories: [{ icon: 'mdi:leaf', color: '#2e7d32' }] }),
			],
			() => 'mdi:calendar',
		);
		expect(icons).toHaveLength(2);
	});

	test('sorts icons alphabetically', () => {
		const icons = selectDayIcons(
			[
				ev({ icon: 'mdi:zulu' }),
				ev({ icon: 'mdi:alpha' }),
				ev({ showCategoryIcon: true, categories: [{ icon: 'mdi:beta', color: '#000' }] }),
			],
			() => 'mdi:calendar',
		);
		expect(icons.map((i) => i.icon)).toEqual(['mdi:alpha', 'mdi:beta', 'mdi:zulu']);
	});
});
