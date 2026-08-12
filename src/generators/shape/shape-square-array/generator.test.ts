import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {ShapeSquareArrayGenerator} from './generator.ts';

const generator = new ShapeSquareArrayGenerator();

describe('ShapeSquareArrayGenerator', () => {
    it('strictly requires the task ability', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
    });

    it.each([
        [Ability.VisualArticulation, 'partition'],
        [Ability.ProcedureExecution, 'count']
    ] as const)('maps %s to the %s task', (taskAbility, expectedTask) => {
        const stub = generator.generate({taskAbility})!;

        expect(stub.data.task).toBe(expectedTask);
        expect(stub.data.squareCount).toBe(stub.data.rows * stub.data.columns);
    });

    it('rejects unsupported abilities', () => {
        expect(generator.generate({
            taskAbility: 'unsupported' as typeof Ability.VisualArticulation
        })).toBeNull();
    });

    it('produces non-square rectangles with no more than twenty cells', () => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const data = generator.generate({
                taskAbility: Ability.ProcedureExecution
            })!.data;

            expect(data.rows).not.toBe(data.columns);
            expect(data.rows).toBeGreaterThanOrEqual(2);
            expect(data.rows).toBeLessThanOrEqual(5);
            expect(data.columns).toBeGreaterThanOrEqual(2);
            expect(data.columns).toBeLessThanOrEqual(5);
            expect(data.squareCount).toBeLessThanOrEqual(20);
        }
    });

    it('is deterministic for a fixed seed', () => {
        setSeed(18);
        const first = generator.generate({taskAbility: Ability.VisualArticulation});
        setSeed(18);
        const second = generator.generate({taskAbility: Ability.VisualArticulation});

        expect(second).toEqual(first);
    });
});
