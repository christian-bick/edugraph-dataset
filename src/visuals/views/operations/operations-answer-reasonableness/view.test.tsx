import {renderToStaticMarkup} from 'react-dom/server';
import {Ability, Area, Scope} from 'edugraph-ts';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {ArithmeticEstimationGenerator} from '../../../../generators/arithmetic/arithmetic-estimation/generator.ts';
import {ArithmeticEstimationGeneratorSchema, spec as generatorSpec} from '../../../../generators/arithmetic/arithmetic-estimation/spec.ts';
import {planModelCompatibility} from '../../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../../lib/planned-generation.ts';
import type {ArithmeticEstimationProblem} from '../../../../types/problems.ts';
import {resolveEstimationClaim} from './helpers.ts';
import {OperationsAnswerReasonablenessViewSchema, spec as viewSpec} from './spec.ts';

const targets = [Area.Addition, Area.Subtraction].map(operation => ({
    id: `small-number-${operation.split('/').at(-1)}`,
    labels: [operation, Scope.ArabicNumerals, Scope.Base10, Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20, Ability.PlausibilityEvaluation]
}));
const estimationTargets = [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division].map(operation => ({
    id: `rounded-${operation.split('/').at(-1)}`,
    labels: [operation, Area.IntegerRounding, Scope.NumbersSmaller1000, Ability.PlausibilityEvaluation]
}));
const zeroRoundingTarget = {
    id: '3.OA.D.8-answer-reasonableness~4ec714b8',
    labels: [Area.Division, Area.IntegerRounding, Scope.NumbersSmaller1000, Ability.PlausibilityEvaluation]
};
const text = (markup: string) => markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const symbols = {addition: '+', subtraction: '−', multiplication: '×', division: '÷'} as const;
const comparisonMethod = 'Round the proposed answer and the estimate to the nearest ten.';

let OperationsAnswerReasonableness: typeof import('./view.tsx')['OperationsAnswerReasonableness'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({OperationsAnswerReasonableness} = await import('./view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

function prepare(target = targets[0], seed = 0) {
    const planned = planModelCompatibility(target,
        {...generatorSpec, spec: generatorSpec, schema: ArithmeticEstimationGeneratorSchema},
        {...viewSpec, spec: viewSpec, schema: OperationsAnswerReasonablenessViewSchema});
    if (!planned.supported) throw new Error(`Fixture target was rejected: ${planned.reason}`);
    const draw = generatePlannedDraw({
        generator: new ArithmeticEstimationGenerator(), viewSchema: OperationsAnswerReasonablenessViewSchema,
        plan: planned.plan, sampleKey: `${target.id}#${generatorSpec.generatorId}#${viewSpec.viewId}#train#question#inst:0`,
        attempt: 1, seed
    });
    if (!draw.stub) throw new Error('Fixture target produced no data.');
    return {
        problem: {type: 'arithmetic' as const, data: draw.stub.data as ArithmeticEstimationProblem, labels: draw.stub.labels},
        targetLabels: target.labels, viewId: viewSpec.viewId, seed, isSolutionView: false,
        preparedView: draw.view
    };
}

describe('answer reasonableness domain rendering', () => {
    it.each([...targets, ...estimationTargets])('renders both modes and verdicts for fixture $id', target => {
        for (const seed of [0, 1]) {
            const payload = prepare(target, seed);
            const claim = resolveEstimationClaim(payload.problem.data);
            const question = renderToStaticMarkup(<OperationsAnswerReasonableness payload={payload} />);
            const solution = renderToStaticMarkup(<OperationsAnswerReasonableness payload={{...payload, isSolutionView: true}} />);
            expect(question).toContain('Round to the nearest ten');
            expect(text(question)).toContain(comparisonMethod);
            const data = payload.problem.data;
            const roundedCalculation = `${data.roundedNum1} ${symbols[data.operation]} ${data.roundedNum2} = ${data.estimatedAnswer}`;
            expect(text(question)).toContain(roundedCalculation);
            expect(text(solution)).toContain(roundedCalculation);
            expect(question).not.toContain('rounds to');
            expect(solution).toContain(`${claim.proposedAnswer} rounds to ${claim.roundedProposedAnswer}`);
            expect(solution).toContain(claim.isReasonable ? 'which matches' : 'which does not match');
            expect(question).not.toContain('Validation Error');
            expect(solution).not.toContain('Validation Error');
        }
    });

    it('requires the zero-producing comparison method for the original division failure without revealing its answer', () => {
        const payload = prepare(zeroRoundingTarget, 1789219894);
        expect(payload.problem.data).toEqual({
            numberDomain: {min: 0, max: 1000}, num1: 384, num2: 16, operation: 'division',
            roundedNum1: 380, roundedNum2: 20, roundingPlace: 10, exactAnswer: 24, estimatedAnswer: 19,
            proposal: {proposedAnswer: 2, roundedProposedAnswer: 0}
        });
        expect(payload.problem.labels).toContain(Scope.NumbersWithZero);
        const question = renderToStaticMarkup(<OperationsAnswerReasonableness payload={payload} />);
        const solution = renderToStaticMarkup(<OperationsAnswerReasonableness payload={{...payload, isSolutionView: true}} />);
        expect(text(question)).toContain(comparisonMethod);
        expect(text(question)).toContain('Matching rounded values mean the answer is reasonable.');
        expect(text(question)).toContain('384 ÷ 16 = ?');
        expect(text(question)).toContain('380 ÷ 20 = 19');
        expect(text(question)).not.toMatch(/\b(?:0|24)\b/);
        expect(question).not.toContain('rounds to');
        expect(question).not.toContain('bg-emerald-50');
        expect(text(solution)).toContain('384 ÷ 16 = 24');
        expect(text(solution)).toContain('2 rounds to 0, which does not match 19 rounded to 20.');
        expect(solution).toContain('bg-emerald-50');
    });

    it.each([0, 1, 2, 3, 4])('preserves the canonical zero rounding for boundary proposal %i', proposedAnswer => {
        const payload = prepare(zeroRoundingTarget, 1789219894);
        payload.problem.data = {...payload.problem.data, proposal: {proposedAnswer, roundedProposedAnswer: 0}};
        const question = renderToStaticMarkup(<OperationsAnswerReasonableness payload={payload} />);
        const solution = renderToStaticMarkup(<OperationsAnswerReasonableness payload={{...payload, isSolutionView: true}} />);
        expect(text(question)).toContain(comparisonMethod);
        expect(question).not.toContain('rounds to');
        expect(question).not.toContain('bg-emerald-50');
        expect(text(solution)).toContain(`${proposedAnswer} rounds to 0, which does not match 19 rounded to 20.`);
    });

    it.each([
        [{numberDomain: undefined}, 'Required field "numberDomain"'],
        [{proposal: undefined}, 'Required field "proposal"'],
        [{proposal: {proposedAnswer: 3, roundedProposedAnswer: 99}}, 'canonical bounded proposal'],
        [{numberDomain: {min: -1, max: 20}}, 'Invalid estimation number domain'],
        [{numberDomain: {min: 0, max: 1001}}, 'Invalid estimation number domain'],
        [{numberDomain: {min: 5.5, max: 20}}, 'Invalid estimation number domain'],
        [{num1: 21}, 'All mathematical values'],
        [{roundingPlace: 100}, 'Unsupported operation or rounding place'],
        [{operation: 'unknown'}, 'Unsupported operation or rounding place'],
        [{roundedNum1: 1}, 'mathematically inconsistent'],
        [{operation: 'division', num2: 0, roundedNum2: 0}, 'mathematically inconsistent']
    ] as const)('rejects malformed mathematical evidence %j', (overrides, expectedError) => {
        const payload = prepare();
        payload.problem.data = {...payload.problem.data, ...overrides} as ArithmeticEstimationProblem;
        expect(() => renderToStaticMarkup(<OperationsAnswerReasonableness payload={payload} />)).toThrow(expectedError);
    });
});
