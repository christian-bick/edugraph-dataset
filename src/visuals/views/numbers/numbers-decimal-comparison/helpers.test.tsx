import {Area, Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {DecimalComparisonGenerator} from '../../../../generators/number/decimal-comparison/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {DecimalComparisonProblem} from '../../../../types/problems.ts';
import {
    decimalComparisonNotation,
    decimalComparisonPresentation,
    isValidDecimalComparisonProblem,
    normalizedDecimalNotation
} from './helpers.ts';
import {NumbersDecimalComparisonCore} from './view.tsx';

const generator = new DecimalComparisonGenerator();

const generate = (
    seed: string,
    relation: DecimalComparisonProblem['relation']
): DecimalComparisonProblem => {
    setSeed(seed);
    return generator.generate({
        comparisonKind: relation === 'equal' ? Area.NumericEquality : Area.NumericInequality,
        relation: relation === 'greater' ? Scope.Greater : relation === 'less' ? Scope.Less : Scope.Equal
    }).data;
};

const findPair = (
    left: string,
    right: string,
    relation: DecimalComparisonProblem['relation']
): DecimalComparisonProblem => {
    for (let index = 0; index < 20000; index++) {
        const data = generate(`decimal-comparison-${left}-${right}-${index}`, relation);
        if (decimalComparisonNotation(data.left) === left
            && decimalComparisonNotation(data.right) === right) return data;
    }
    throw new Error(`Could not generate ${left} ${relation} ${right}.`);
};

const changed = (
    source: DecimalComparisonProblem,
    update: (data: DecimalComparisonProblem) => void
): DecimalComparisonProblem => {
    const data = structuredClone(source);
    update(data);
    return data;
};

const payload = (
    data: DecimalComparisonProblem,
    isSolutionView: boolean
): ViewRenderPayload<'numbers-decimal-comparison'> => ({
    problem: {type: 'comparison', data},
    viewId: 'numbers-decimal-comparison',
    labels: [],
    isSolutionView,
    seed: 29
});

describe('decimal comparison view contract', () => {
    it('accepts all relations, both operand orders, and precision-edge stress cases', () => {
        const stress = [
            findPair('0.09', '0.1', 'less'),
            findPair('0.9', '0.91', 'less'),
            findPair('0.99', '0.9', 'greater'),
            findPair('0.5', '0.50', 'equal'),
            findPair('0.50', '0.5', 'equal')
        ];
        for (const data of stress) {
            expect(isValidDecimalComparisonProblem(data), data.relation).toBe(true);
        }
    });

    it('rejects contradictory relation, place, numeric digit, precision, and model evidence', () => {
        const source = findPair('0.9', '0.91', 'less');
        const mutations: Array<(data: DecimalComparisonProblem) => void> = [
            data => { data.relation = 'greater'; },
            data => { data.firstDecidingPlace = 'tenths'; },
            data => { data.left.tenthsDigit = 8; },
            data => { data.right.hundredthsDigit = 9; },
            data => { data.left.precision = 'hundredths'; },
            data => { data.right.normalizedHundredths = 19; },
            data => { data.left.model.cells[0]!.shaded = false; },
            data => { data.right.model.cells[0]!.source = 'first-addend'; }
        ];
        for (const mutate of mutations) {
            expect(isValidDecimalComparisonProblem(changed(source, mutate))).toBe(false);
        }
    });

    it('rejects same-precision operands and malformed nested payloads without throwing', () => {
        const source = findPair('0.5', '0.50', 'equal');
        const samePrecision = changed(source, data => {
            data.right = structuredClone(data.left) as unknown as typeof data.right;
        });
        expect(isValidDecimalComparisonProblem(samePrecision)).toBe(false);

        for (const key of ['left', 'right'] as const) {
            const malformed = structuredClone(source) as unknown as Record<string, unknown>;
            malformed[key] = null;
            expect(() => isValidDecimalComparisonProblem(
                malformed as unknown as DecimalComparisonProblem
            )).not.toThrow();
            expect(isValidDecimalComparisonProblem(
                malformed as unknown as DecimalComparisonProblem
            )).toBe(false);
        }
        const missingModel = structuredClone(source);
        missingModel.left.model = null as never;
        expect(() => isValidDecimalComparisonProblem(missingModel)).not.toThrow();
        expect(isValidDecimalComparisonProblem(missingModel)).toBe(false);

        const missingCells = structuredClone(source);
        missingCells.right.model.cells = null as never;
        expect(() => isValidDecimalComparisonProblem(missingCells)).not.toThrow();
        expect(isValidDecimalComparisonProblem(missingCells)).toBe(false);
    });

    it('withholds the relation and deciding evidence in Question Mode', () => {
        const data = findPair('0.9', '0.91', 'less');
        const presentation = decimalComparisonPresentation(data);
        const question = renderToStaticMarkup(<NumbersDecimalComparisonCore
            config={{}}
            payload={payload(data, false)}
        />);
        const solution = renderToStaticMarkup(<NumbersDecimalComparisonCore
            config={{}}
            payload={payload(data, true)}
        />).replaceAll('&lt;', '<').replaceAll('&gt;', '>');

        expect(question).toContain(presentation.questionEquation);
        expect(question).not.toContain(presentation.solutionEquation);
        expect(question).not.toContain(presentation.answerStatement);
        expect(question).not.toContain(presentation.explanation);
        expect(question).not.toContain('First deciding place');
        expect(question).not.toContain('less than');
        expect(solution).toContain(presentation.solutionEquation);
        expect(solution).toContain(presentation.answerStatement);
        expect(solution).toContain(presentation.explanation);
        expect(solution).toContain('First deciding place: hundredths');
    });

    it('reveals normalized equality evidence only in Solution Mode', () => {
        const data = findPair('0.5', '0.50', 'equal');
        const presentation = decimalComparisonPresentation(data);
        const question = renderToStaticMarkup(<NumbersDecimalComparisonCore
            config={{}}
            payload={payload(data, false)}
        />);
        const solution = renderToStaticMarkup(<NumbersDecimalComparisonCore
            config={{}}
            payload={payload(data, true)}
        />).replaceAll('&lt;', '<').replaceAll('&gt;', '>');
        const leftNormalizedNotation = normalizedDecimalNotation(data.left.normalizedHundredths);
        const rightNormalizedNotation = normalizedDecimalNotation(data.right.normalizedHundredths);

        expect(question).not.toContain(`${leftNormalizedNotation} = ${rightNormalizedNotation}`);
        expect(question).not.toContain(presentation.explanation);
        expect(solution).toContain(`${leftNormalizedNotation} = ${rightNormalizedNotation}`);
        expect(solution).toContain(presentation.explanation);
    });
});
