import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {AngleArithmeticProblem} from '../../../types/problems.ts';
import {AngleArithmeticGenerator} from './generator.ts';

const generator = new AngleArithmeticGenerator();

function expectNeutralRelation(data: AngleArithmeticProblem): void {
    expect(Number.isInteger(data.leftMeasure)).toBe(true);
    expect(Number.isInteger(data.rightMeasure)).toBe(true);
    expect(data.leftMeasure).toBeGreaterThan(0);
    expect(data.rightMeasure).toBeGreaterThan(0);
    expect(data.wholeMeasure).toBe(data.leftMeasure + data.rightMeasure);
    expect(data.wholeMeasure).toBeLessThan(180);
    expect(data.geometry).toEqual({
        vertexLabel: 'O',
        startPointLabel: 'A',
        dividerPointLabel: 'B',
        endPointLabel: 'C',
        leftAngleName: 'AOB',
        rightAngleName: 'BOC',
        wholeAngleName: 'AOC',
        startDegrees: 0,
        dividerDegrees: data.leftMeasure,
        endDegrees: data.wholeMeasure,
        leftSweepDegrees: data.leftMeasure,
        rightSweepDegrees: data.rightMeasure,
        wholeSweepDegrees: data.wholeMeasure,
        direction: 'counterclockwise'
    });
    expect(data.relationStatement).toBe('m∠AOB + m∠BOC = m∠AOC');
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
            totals.add(data.wholeMeasure);
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
