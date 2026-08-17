import {describe, expect, it} from 'vitest';
import {MeasurementConversionGenerator} from '../../../../generators/measurement/measurement-conversion/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {
    LargerToSmallerConversionProblem,
    MeasurementConversionPairId,
    MeasurementConversionProblem,
    RelativeUnitSizeProblem
} from '../../../../types/problems.ts';
import {
    isSupportedMeasureConversionProblem,
    isValidMeasureConversionProblem
} from './helpers.ts';

const pairIds: MeasurementConversionPairId[] = [
    'kilometer-meter',
    'meter-centimeter',
    'kilogram-gram',
    'pound-ounce',
    'liter-milliliter',
    'hour-minute',
    'minute-second'
];

const generator = new MeasurementConversionGenerator();

function problemFor(
    task: 'relative-unit-size',
    unitPair: MeasurementConversionPairId
): RelativeUnitSizeProblem;
function problemFor(
    task: 'convert-larger-to-smaller',
    unitPair: MeasurementConversionPairId
): LargerToSmallerConversionProblem;
function problemFor(
    task: 'relative-unit-size' | 'convert-larger-to-smaller',
    unitPair: MeasurementConversionPairId
) {
    setSeed(`${task}-${unitPair}`);
    const data = generator.generate({task, unitPair}).data;
    if (data.task !== task) throw new Error(`Expected ${task}, received ${data.task}.`);
    return data;
}

describe('measure-conversion validation', () => {
    it('accepts the complete abstract equal-length partition range', () => {
        const combinations = new Set<string>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(`generic-${seed}`);
            const problem = generator.generate({
                task: 'relative-unit-size',
                unitPair: 'generic-unit-scale'
            }).data;
            if (problem.task !== 'generic-unit-scale') throw new Error('Expected generic unit scale.');
            combinations.add(`${problem.largeUnitCount}:${problem.unitsPerLarge}`);
            expect(isValidMeasureConversionProblem(problem)).toBe(true);
        }
        expect(combinations).toEqual(new Set([
            '3:2', '3:3', '4:2', '4:3', '5:2', '5:3', '6:2', '6:3'
        ]));
    });

    it.each(pairIds)('accepts both authored task kinds for %s', pairId => {
        expect(isValidMeasureConversionProblem(problemFor('relative-unit-size', pairId))).toBe(true);
        expect(isValidMeasureConversionProblem(problemFor('convert-larger-to-smaller', pairId))).toBe(true);
    });

    it('rejects the table-only payload branch', () => {
        setSeed('table-branch');
        const table = generator.generate({task: 'conversion-table', unitPair: 'meter-centimeter'}).data;
        expect(isSupportedMeasureConversionProblem(table)).toBe(false);
    });

    it.each([
        ['wrong factor', () => {
            const problem = problemFor('relative-unit-size', 'kilometer-meter');
            return {...problem, pair: {...problem.pair, factor: 100}};
        }],
        ['broken generic partition count', () => {
            setSeed('broken-generic');
            const problem = generator.generate({
                task: 'relative-unit-size',
                unitPair: 'generic-unit-scale'
            }).data;
            return {...problem, smallUnitCount: 1};
        }],
        ['wrong unit identity', () => {
            const problem = problemFor('relative-unit-size', 'liter-milliliter');
            return {
                ...problem,
                pair: {...problem.pair, smallerUnit: {...problem.pair.smallerUnit, symbol: 'ml'}}
            };
        }],
        ['missing nested unit', () => {
            const problem = problemFor('relative-unit-size', 'kilometer-meter');
            return {...problem, pair: {...problem.pair, smallerUnit: undefined}};
        }],
        ['wrong scaling family', () => {
            const problem = problemFor('relative-unit-size', 'pound-ounce');
            return {...problem, pair: {...problem.pair, scalingKind: 'magnitude'}};
        }],
        ['broken common-quantity evidence', () => ({
            ...problemFor('relative-unit-size', 'meter-centimeter'),
            exampleSmallerValue: 99
        })],
        ['direct answer in derivation question', () => {
            const problem = problemFor('relative-unit-size', 'kilogram-gram');
            return {...problem, questionEquation: problem.solutionEquation};
        }],
        ['wrong conversion product', () => ({
            ...problemFor('convert-larger-to-smaller', 'hour-minute'),
            convertedValue: 61
        })],
        ['direct answer in conversion question', () => {
            const problem = problemFor('convert-larger-to-smaller', 'minute-second');
            return {...problem, questionEquation: problem.solutionEquation};
        }],
        ['wrong conversion conclusion', () => ({
            ...problemFor('convert-larger-to-smaller', 'pound-ounce'),
            answerStatement: 'The measures are equivalent.'
        })],
        ['wrong derivation explanation', () => ({
            ...problemFor('relative-unit-size', 'liter-milliliter'),
            explanation: 'The factor is 1,000.'
        })]
    ])('rejects %s', (_description, build) => {
        const problem = build() as MeasurementConversionProblem;
        expect(isSupportedMeasureConversionProblem(problem)).toBe(true);
        if (isSupportedMeasureConversionProblem(problem)) {
            expect(isValidMeasureConversionProblem(problem)).toBe(false);
        }
    });
});
