import { describe, expect, test } from 'vitest';

import {
	DEFAULT_CATEGORY_MAP,
	parseCategoriesFromTitle,
	resolveCategoryMap,
} from '../helpers/category';

describe('category parsing', () => {
	test('resolves default map when none provided', () => {
		const m = resolveCategoryMap(undefined);
		expect(m['🌿'].color).toBe('#2e7d32');
		expect(m['🐟'].icon).toBe('🐟');
	});

	test('user overrides merge over defaults', () => {
		const m = resolveCategoryMap({ '🌿': { color: '#000000' } });
		expect(m['🌿'].color).toBe('#000000');
		expect(m['🌿'].icon).toBe('🌿');
		expect(m['🐟'].color).toBe('#1565c0');
	});

	test('single marker detected', () => {
		const cats = parseCategoriesFromTitle('🌿 Седмица 11-я', DEFAULT_CATEGORY_MAP);
		expect(cats).toHaveLength(1);
		expect(cats[0].key).toBe('🌿');
		expect(cats[0].color).toBe('#2e7d32');
	});

	test('multiple markers detected (feast + fish)', () => {
		const cats = parseCategoriesFromTitle('✝️ 🐟 Седмица 12-я', DEFAULT_CATEGORY_MAP);
		expect(cats).toHaveLength(2);
		expect(cats.map((c) => c.key)).toEqual(expect.arrayContaining(['🐟', '✝️']));
	});

	test('no markers -> empty', () => {
		expect(parseCategoriesFromTitle('Седмица 14-я по Пятидесятнице.', DEFAULT_CATEGORY_MAP)).toEqual([]);
	});

	test('label falls back to key', () => {
		const cats = parseCategoriesFromTitle('🕯️ Радоница', DEFAULT_CATEGORY_MAP);
		expect(cats[0].label).toBe('🕯️');
	});
});
