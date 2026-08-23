import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {AngleArithmeticProblem} from '../../../types/problems.ts';
import {AngleArithmeticGenerator} from './generator.ts';

const generator = new AngleArithmeticGenerator();

function expectNeutralRelation(data: AngleArithmeticProblem): void {
    const [leftMeasure, rightMeasure] = data.adjacentAngleMeasures;
    expect(Number.isInteger(leftMeasure)).toBe(true);
    expect(Number.isInteger(rightMeasure)).toBe(true);
    expect(leftMeasure).toBeGreaterThan(0);
    expect(rightMeasure).toBeGreaterThan(0);
    expect(data.wholeAngleMeasure).toBe(leftMeasure + rightMeasure);
    expect(data.wholeAngleMeasure).toBeLessThan(180);
    expect(data).not.toHaveProperty('task');
    expect(data).not.toHaveProperty('unknownRole');
    expect(data).not.toHaveProperty('prompt');
    expect(data).not.toHaveProperty('questionEquation');
}

describe('AngleArithmeticGenerator', () => {
    it('strictly requires an operation', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
    });

    it.each([
        [Area.Addition, 'addition'],
        [Area.Subtraction, 'subtraction']
    ] as const)('emits one complete neutral relation for %s', (operation, expected) => {
        const totals = new Set<number>();
        for (let seed = 0; seed < 160; seed++) {
            setSeed(`angle-arithmetic-${operation}-${seed}`);
            const data = generator.generate({operation})!.data;
            expectNeutralRelation(data);
            expect(data.operation).toBe(expected);
            totals.add(data.wholeAngleMeasure);
        }
        expect(totals).toEqual(new Set([60, 90, 115, 130, 150, 155]));
    });

    it('rejects an unsupported operation', () => {
        expect(generator.generate({operation: 'unsupported'} as never)).toBeNull();
    });

    it.each([Area.Addition, Area.Subtraction])('is deterministic for %s', operation => {
        setSeed(`angle-arithmetic-determinism-${operation}`);
        const first = generator.generate({operation});
        setSeed(`angle-arithmetic-determinism-${operation}`);
        expect(generator.generate({operation})).toEqual(first);
    });
});
