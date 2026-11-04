import {Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {setSeed} from '../../../lib/random.ts';
import {PlaceValueExpandedGenerator} from './generator.ts';
import * as rng from '../../../lib/random.ts';
import {expandedNumbers} from './domain.ts';

afterEach(() => vi.restoreAllMocks());

describe('PlaceValueExpandedGenerator', () => {
    const generator = new PlaceValueExpandedGenerator();

    it('strictly validates its configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it.each([
        [Scope.TwoOperands, 2],
        [Scope.ThreeOperands, 3]
    ] as const)('generates %s expanded forms', (operandCardinality, expectedLength) => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const data = generator.generate({
                range: createCanonicalNumericRange(1000),
                operandCardinality
            })!.data;
            expect(data.number).toBeGreaterThanOrEqual(100);
            expect(data.number).toBeLessThanOrEqual(999);
            expect(data.terms).toHaveLength(expectedLength);
            expect(data.terms.reduce((sum, term) => sum + term, 0)).toBe(data.number);
            expect(data.terms.every(term => term > 0)).toBe(true);
            expect('task' in data).toBe(false);
        }
    });

    it('expands every nonzero place through one million with supplied evidence', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({
                range: createCanonicalNumericRange(1000000),
                operandCardinality: Scope.TwoOperands
            })!.data;

            expect('task' in data && data.task).toBe('multi-digit-expanded-form');
            if (!('task' in data) || data.task !== 'multi-digit-expanded-form') continue;
            expect(data.number).toBeGreaterThanOrEqual(1000);
            expect(data.number).toBeLessThanOrEqual(1_000_000);
            expect(data.terms).toEqual(
                data.placeValues.map(place => place.value).filter(value => value !== 0)
            );
            expect(data.terms.reduce((sum, term) => sum + term, 0)).toBe(data.number);
        }
    });

    it('is deterministic for Grade 4 expansions', () => {
        const config = {
            range: createCanonicalNumericRange(1000000),
            operandCardinality: Scope.TwoOperands
        } as const;
        setSeed('place-value-expanded-grade-four');
        const first = generator.generate(config);
        setSeed('place-value-expanded-grade-four');
        expect(generator.generate(config)).toEqual(first);
    });

    it.each([
        [10000, 100, Scope.TwoOperands, 3100, [3000, 100]],
        [10000, 120, Scope.TwoOperands, 3200, [3000, 200]],
        [10000, 10, Scope.ThreeOperands, 3210, [3000, 200, 10]],
        [100000, 100, Scope.ThreeOperands, 32100, [30000, 2000, 100]],
        [1000000, 1000, Scope.ThreeOperands, 321000, [300000, 20000, 1000]],
        [1000000, 10000, Scope.TwoOperands, 320000, [300000, 20000]]
    ] as const)('retains %s/%s %s native number %s without using passive digits as quantities', (upper, lower, operandCardinality, number, terms) => {
        const range = createCanonicalNumericRange(upper, lower);
        const rows = expandedNumbers(range, terms.length), index = rows.indexOf(number);
        expect(index).toBeGreaterThanOrEqual(0);
        const draw = vi.spyOn(rng, 'random').mockReturnValue((index + 0.5) / rows.length);
        const data = generator.generate({range, operandCardinality}).data;
        expect(data.number).toBe(number);
        expect(data.terms).toEqual(terms);
        expect('task' in data && data.task).toBe('multi-digit-expanded-form');
        if ('task' in data) expect(data.placeValues.some(place => place.digit === 0)).toBe(true);
        expect(draw).toHaveBeenCalledTimes(1);
    });

    it('rejects an impossible three-term floor before drawing a native number', () => {
        const draw = vi.spyOn(rng, 'random');
        expect(() => generator.generate({range: createCanonicalNumericRange(10000, 100),
            operandCardinality: Scope.ThreeOperands})).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
