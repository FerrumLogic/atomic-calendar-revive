import { describe, expect, test } from 'vitest';

import {
	DEFAULT_CATEGORY_MAP,
	parseCategoriesFromTitle,
	resolveCategoryMap,
	stripCategoryMarkers,
} from '../helpers/category';

describe('category parsing', () => {
	test('resolves default map when none provided', () => {
		const m = resolveCategoryMap(undefined);
		expect(m['🌿'].color).toBe('#2e7d32');
		expect(m['🐟'].icon).toBe('mdi:fish');
	});

	test('user overrides merge over defaults', () => {
		const m = resolveCategoryMap({ '🌿': { color: '#000000' } });
		expect(m['🌿'].color).toBe('#000000');
		expect(m['🌿'].icon).toBe('mdi:leaf');
		expect(m['🐟'].color).toBe('#1565c0');
	});

	test('single marker detected', () => {
		const cats = parseCategoriesFromTitle('🌿 Седмица 11-я', DEFAULT_CATEGORY_MAP);
		expect(cats).toHaveLength(1);
		expect(cats[0].key).toBe('🌿');
		expect(cats[0].icon).toBe('mdi:leaf');
		expect(cats[0].color).toBe('#2e7d32');
		expect(cats[0].label).toBe('Пост');
	});

	test('multiple markers detected (feast + fish)', () => {
		const cats = parseCategoriesFromTitle('✝️ 🐟 Седмица 12-я', DEFAULT_CATEGORY_MAP);
		expect(cats).toHaveLength(2);
		expect(cats.map((c) => c.key)).toEqual(expect.arrayContaining(['🐟', '✝️']));
	});

	test('no markers -> empty', () => {
		expect(parseCategoriesFromTitle('Седмица 14-я по Пятидесятнице.', DEFAULT_CATEGORY_MAP)).toEqual([]);
	});

	test('label falls back to key when not in map', () => {
		const cats = parseCategoriesFromTitle('🕯️ Радоница', resolveCategoryMap({ '🕯️': {} }));
		expect(cats[0].label).toBe('Поминовение');
	});

	test('stripCategoryMarkers removes emoji markers, keeps text', () => {
		expect(stripCategoryMarkers('✝️ 🐟 Седмица 12-я по Пятидесятнице.', DEFAULT_CATEGORY_MAP)).toBe(
			'Седмица 12-я по Пятидесятнице.',
		);
		expect(stripCategoryMarkers('🌿 Седмица 11-я', DEFAULT_CATEGORY_MAP)).toBe('Седмица 11-я');
		expect(stripCategoryMarkers('Седмица 14-я', DEFAULT_CATEGORY_MAP)).toBe('Седмица 14-я');
	});
});
