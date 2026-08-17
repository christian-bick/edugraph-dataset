import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {PlaceValueExpandedGenerator} from './generator.ts';

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
                range: {min: 100, max: 1000},
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
                range: {min: 1000, max: 1_000_000},
                operandCardinality: undefined
            })!.data;

            expect('task' in data && data.task).toBe('multi-digit-expanded-form');
            if (!('task' in data) || data.task !== 'multi-digit-expanded-form') continue;
            expect(data.number).toBeGreaterThanOrEqual(1000);
            expect(data.number).toBeLessThanOrEqual(1_000_000);
            expect(data.terms).toEqual(
                data.placeValues.map(place => place.value).filter(value => value !== 0)
            );
            expect(data.terms.reduce((sum, term) => sum + term, 0)).toBe(data.number);
            expect(data.expandedEquation).toContain(' = ');
            expect(data.prompt).toBe('Write the numeral as a sum of its nonzero place values.');
        }
    });

    it('includes the exact one-million boundary', () => {
        const data = generator.generate({
            range: {min: 1_000_000, max: 1_000_000},
            operandCardinality: undefined
        })!.data;

        expect(data).toMatchObject({
            task: 'multi-digit-expanded-form',
            number: 1_000_000,
            terms: [1_000_000],
            expandedEquation: '1,000,000 = 1,000,000'
        });
        expect(generator.generate({
            range: {min: 1_000_000, max: 1_000_000},
            operandCardinality: Scope.TwoOperands
        })).toBeNull();
    });

    it('is deterministic for Grade 4 expansions', () => {
        const config = {
            range: {min: 1000, max: 1_000_000},
            operandCardinality: undefined
        } as const;
        setSeed('place-value-expanded-grade-four');
        const first = generator.generate(config);
        setSeed('place-value-expanded-grade-four');
        expect(generator.generate(config)).toEqual(first);
    });
});
