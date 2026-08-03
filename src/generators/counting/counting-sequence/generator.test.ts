import {beforeEach, describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {setSeed} from '../../../lib/random.ts';
import {CountingSequenceGenerator} from './generator.ts';

describe('CountingSequenceGenerator', () => {
    let generator: CountingSequenceGenerator;

    beforeEach(() => {
        generator = new CountingSequenceGenerator();
        setSeed(42);
    });

    it('throws when required configuration is missing', () => {
        expect(() => generator.generate({})).toThrow();
    });

    it('generates a forward sequence from a visible start', () => {
        const stub = generator.generate({
            range: {min: 1, max: 20},
            countMode: Scope.AdditiveCount
        });

        expect(stub).not.toBeNull();
        expect(stub!.data.sequence).toHaveLength(6);
        expect(stub!.data.sequence[0]).toBeGreaterThan(1);
        expect(stub!.data.missingIndex).toBeGreaterThan(0);
        expect(stub!.data.answer).toBe(stub!.data.sequence[stub!.data.missingIndex]);
        stub!.data.sequence.slice(1).forEach((value, index) => {
            expect(value - stub!.data.sequence[index]).toBe(1);
        });
    });

    it('ends the within-100 additive sequence at 100', () => {
        const stub = generator.generate({
            range: {min: 1, max: 100},
            countMode: Scope.AdditiveCount
        });

        expect(stub!.data.sequence).toEqual([91, 92, 93, 94, 95, 96, 97, 98, 99, 100]);
        expect(stub!.data.sequence.at(-1)).toBe(100);
    });

    it('skip-counts by tens through 100', () => {
        const stub = generator.generate({
            range: {min: 1, max: 100},
            countMode: Scope.MultiplesOf10
        });

        expect(stub!.data.sequence).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
        expect(stub!.data.stepSize).toBe(10);
    });

    it('returns null when fewer than two sequence values fit', () => {
        expect(generator.generate({
            range: {min: 10, max: 10},
            countMode: Scope.MultiplesOf10
        })).toBeNull();
    });
});
