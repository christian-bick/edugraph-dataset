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
            stepMagnitude: Scope.StepsOf1,
            requireMultipleOf10: false
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

    it('randomizes valid starts throughout a range ending at 120', () => {
        const starts = new Set<number>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const stub = generator.generate({
                range: {min: 1, max: 120},
                stepMagnitude: Scope.StepsOf1,
                requireMultipleOf10: false
            });

            expect(stub).not.toBeNull();
            expect(stub!.data.sequence[0]).toBeGreaterThanOrEqual(1);
            expect(stub!.data.sequence.at(-1)).toBeLessThanOrEqual(120);
            starts.add(stub!.data.sequence[0]);
        }

        expect(starts.size).toBeGreaterThan(50);
        expect([...starts].some(start => start > 100)).toBe(true);
    });

    it('steps by tens from an arbitrary randomized start', () => {
        const stub = generator.generate({
            range: {min: 3, max: 100},
            stepMagnitude: Scope.StepsOf10,
            requireMultipleOf10: false
        });

        expect(stub!.data.sequence.length).toBeGreaterThanOrEqual(2);
        stub!.data.sequence.slice(1).forEach((value, index) => {
            expect(value - stub!.data.sequence[index]).toBe(10);
        });
        expect(stub!.data.stepSize).toBe(10);
    });

    it.each([
        [Scope.StepsOf5, 5],
        [Scope.StepsOf100, 100]
    ] as const)('supports %s through 1000', (stepMagnitude, expectedStep) => {
        const stub = generator.generate({
            range: {min: 1, max: 1000},
            stepMagnitude,
            requireMultipleOf10: false
        });
        expect(stub).not.toBeNull();
        expect(stub!.data.stepSize).toBe(expectedStep);
        expect(stub!.data.sequence.at(-1)).toBeLessThanOrEqual(1000);
        stub!.data.sequence.slice(1).forEach((value, index) => {
            expect(value - stub!.data.sequence[index]).toBe(expectedStep);
        });
    });

    it('aligns steps of ten when multiples of ten are required', () => {
        const stub = generator.generate({
            range: {min: 3, max: 100},
            stepMagnitude: Scope.StepsOf10,
            requireMultipleOf10: true
        });

        expect(stub!.data.sequence.every(value => value % 10 === 0)).toBe(true);
    });

    it('returns null when multiples of ten conflict with steps of one', () => {
        expect(generator.generate({
            range: {min: 1, max: 20},
            stepMagnitude: Scope.StepsOf1,
            requireMultipleOf10: true
        })).toBeNull();
    });

    it('returns null when fewer than two sequence values fit', () => {
        expect(generator.generate({
            range: {min: 10, max: 10},
            stepMagnitude: Scope.StepsOf10,
            requireMultipleOf10: true
        })).toBeNull();
    });

    it('rejects unsupported step magnitudes', () => {
        expect(() => generator.generate({
            range: {min: 1, max: 20},
            stepMagnitude: Scope.StepMagnitude,
            requireMultipleOf10: false
        } as never)).toThrow('Unsupported step magnitude');
    });
});
