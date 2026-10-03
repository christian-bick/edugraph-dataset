import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {CoordinatePatternPairsGenerator} from './generator.ts';

const generator = new CoordinatePatternPairsGenerator();

describe('CoordinatePatternPairsGenerator', () => {
    it('requires a configuration object', () => {
        expect(() => generator.generate(null as never)).toThrow();
    });

    it('keeps both recurrence rules, aligned integer points, and an axis point', () => {
        const axisCases = new Set<string>();
        const problems = new Set<string>();

        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({})!.data;
            expect(data.kind).toBe('coordinate-pattern-pairs');
            expect(data.first.terms).toHaveLength(4);
            expect(data.second.terms).toHaveLength(4);
            expect(data.points).toHaveLength(4);

            for (const sequence of [data.first, data.second]) {
                expect(sequence.rule.kind).toBe('add-constant');
                expect(sequence.rule.increment).toBeGreaterThanOrEqual(1);
                expect(sequence.rule.increment).toBeLessThanOrEqual(3);
                expect(sequence.terms[0]).toBe(sequence.start);
                sequence.terms.forEach((term, index) => {
                    expect(term).toBe(sequence.start + index * sequence.rule.increment);
                    expect(Number.isSafeInteger(term)).toBe(true);
                    expect(term).toBeGreaterThanOrEqual(0);
                    expect(term).toBeLessThanOrEqual(12);
                });
            }

            data.points.forEach((point, index) => {
                expect(point).toEqual({x: data.first.terms[index], y: data.second.terms[index]});
                expect(Number.isSafeInteger(point.x)).toBe(true);
                expect(Number.isSafeInteger(point.y)).toBe(true);
                expect(point.x).toBeGreaterThanOrEqual(0);
                expect(point.y).toBeGreaterThanOrEqual(0);
                expect(point.x).toBeLessThanOrEqual(12);
                expect(point.y).toBeLessThanOrEqual(12);
            });
            expect(data.points.some(point => point.x === 0 || point.y === 0)).toBe(true);

            const firstPoint = data.points[0]!;
            axisCases.add(firstPoint.x === 0 && firstPoint.y === 0 ? 'origin'
                : firstPoint.y === 0 ? 'x-axis' : 'y-axis');
            problems.add(JSON.stringify(data));
            expect(data).not.toHaveProperty('prompt');
            expect(data).not.toHaveProperty('blankPosition');
        }

        expect(axisCases).toEqual(new Set(['origin', 'x-axis', 'y-axis']));
        expect(problems.size).toBeGreaterThan(25);
    });

    it('replays the same points for the same seed', () => {
        setSeed(74);
        const first = generator.generate({})!.data;
        setSeed(74);
        expect(generator.generate({})!.data).toEqual(first);
    });
});
