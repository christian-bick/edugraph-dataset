import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {PlaceValueArithmeticGenerator} from '../../../../generators/place-value/place-value-arithmetic/generator.ts';
import {setSeed} from '../../../../lib/random.ts';
import {PlaceValueArithmeticProblem} from '../../../../types/problems.ts';
import {isValidPlaceValueArithmeticProblem} from '../helpers.ts';
import {
    regroupingPresentation,
    strategyStepPresentation,
    usesWholeTensPresentation
} from './presentation.ts';

const generator = new PlaceValueArithmeticGenerator();

const generate = (
    operation: typeof Area.Addition | typeof Area.Subtraction,
    options: {
        regrouping?: boolean;
        singleDigit?: boolean;
        twoDigit?: boolean;
        multipleOf10?: boolean;
        zero?: boolean;
    } = {}
): PlaceValueArithmeticProblem => {
    setSeed(JSON.stringify([operation, options]));
    const stub = generator.generate({
        operation,
        requireRegrouping: options.regrouping ?? false,
        requireSingleDigitSmallest: options.singleDigit ?? false,
        requireTwoDigitLargest: options.twoDigit ?? false,
        requireMultipleOf10: options.multipleOf10 ?? false,
        requireZero: options.zero ?? false,
        range: {min: 1, max: options.twoDigit || options.multipleOf10 ? 100 : 1000}
    });
    expect(stub).not.toBeNull();
    return stub!.data;
};

describe('place-value arithmetic explanation payload validation', () => {
    it.each([
        [Area.Addition, {singleDigit: true, twoDigit: true}],
        [Area.Addition, {singleDigit: true, twoDigit: true, regrouping: true}],
        [Area.Addition, {twoDigit: true, multipleOf10: true}],
        [Area.Subtraction, {multipleOf10: true}],
        [Area.Subtraction, {multipleOf10: true, zero: true}],
        [Area.Addition, {regrouping: true}],
        [Area.Subtraction, {regrouping: true}]
    ] as const)('accepts the authored %s profile %#', (operation, options) => {
        expect(isValidPlaceValueArithmeticProblem(generate(operation, options))).toBe(true);
    });

    it('rejects inconsistent arithmetic, place digits, profile, and regrouping evidence', () => {
        const problem = generate(Area.Addition, {singleDigit: true, twoDigit: true});
        expect(isValidPlaceValueArithmeticProblem({...problem, answer: problem.answer + 1})).toBe(false);
        expect(isValidPlaceValueArithmeticProblem({
            ...problem,
            operands: [{...problem.operands[0], ones: problem.operands[0].ones + 1}, problem.operands[1]]
        })).toBe(false);
        expect(isValidPlaceValueArithmeticProblem({...problem, operandProfile: 'multiples-of-ten'})).toBe(false);
        expect(isValidPlaceValueArithmeticProblem({
            ...problem,
            regrouping: {...problem.regrouping, statement: 'No regrouping is needed.'}
        })).toBe(false);
    });

    it('rejects altered step type, place, equation, or authored explanation', () => {
        const problem = generate(Area.Addition, {
            singleDigit: true,
            twoDigit: true,
            regrouping: true
        });
        const [first, second, third] = problem.strategySteps;
        expect(isValidPlaceValueArithmeticProblem({
            ...problem,
            strategySteps: [{...first, kind: 'result'}, second, third]
        })).toBe(false);
        expect(isValidPlaceValueArithmeticProblem({
            ...problem,
            strategySteps: [first, {...second, place: 'tens'}, third]
        })).toBe(false);
        expect(isValidPlaceValueArithmeticProblem({
            ...problem,
            strategySteps: [first, second, {...third, equation: `${problem.answer} = ${problem.answer}`}]
        })).toBe(false);
        expect(isValidPlaceValueArithmeticProblem({
            ...problem,
            strategySteps: [first, second, {...third, explanation: 'Use place value.'}]
        })).toBe(false);
    });

    it('distinguishes original ones from available ones when decomposing a ten', () => {
        const problem = generate(Area.Subtraction, {regrouping: true});
        expect(problem.regrouping.kind).toBe('decompose-ten');
        expect(isValidPlaceValueArithmeticProblem(problem)).toBe(true);
        expect(isValidPlaceValueArithmeticProblem({
            ...problem,
            regrouping: {
                ...problem.regrouping,
                onesBefore: problem.regrouping.onesAfter
            }
        })).toBe(false);
    });

    it('verbalizes trivial zero-place work for a positive whole-tens difference', () => {
        const problem = generate(Area.Subtraction, {multipleOf10: true});
        expect(problem.answer).toBeGreaterThan(0);
        expect(usesWholeTensPresentation(problem)).toBe(true);

        const visibleText = [
            regroupingPresentation(problem),
            ...problem.strategySteps.flatMap(step => {
                const presentation = strategyStepPresentation(problem, step);
                return [presentation.equation, presentation.explanation];
            })
        ].filter((value): value is string => value !== null);

        expect(visibleText).toContain('There are no ones to subtract.');
        expect(visibleText).toContain(
            `Subtract the tens: ${problem.strategySteps[1].equation}.`
        );
        expect(visibleText.some(text => text.includes('hundreds'))).toBe(false);
        expect(visibleText).toContain(`Result: ${problem.answer}`);
        expect(visibleText.every(text => !/(^|\D)0(\D|$)/.test(text))).toBe(true);
        expect(isValidPlaceValueArithmeticProblem(problem)).toBe(true);
    });

    it('preserves explicit zero evidence for an equal-operands zero result', () => {
        const problem = generate(Area.Subtraction, {multipleOf10: true, zero: true});
        expect(problem.answer).toBe(0);
        expect(usesWholeTensPresentation(problem)).toBe(false);
        expect(regroupingPresentation(problem)).toBe(problem.regrouping.statement);
        expect(strategyStepPresentation(problem, problem.strategySteps[0])).toEqual({
            equation: problem.strategySteps[0].equation,
            explanation: problem.strategySteps[0].explanation
        });
    });
});
