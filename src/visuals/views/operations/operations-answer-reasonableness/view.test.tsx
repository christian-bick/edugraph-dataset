import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {ArithmeticEstimationGenerator} from '../../../../generators/arithmetic/arithmetic-estimation/generator.ts';
import {ArithmeticEstimationGeneratorSchema, spec as generatorSpec} from '../../../../generators/arithmetic/arithmetic-estimation/spec.ts';
import {planModelCompatibility} from '../../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../../lib/planned-generation.ts';
import {spec as targets} from '../../../../spec/test/arithmetic-equation-judgment.ts';
import {spec as estimationTargets} from '../../../../spec/test/arithmetic-estimation.ts';
import type {ArithmeticEstimationProblem} from '../../../../types/problems.ts';
import {resolveEstimationClaim} from './helpers.ts';
import {OperationsAnswerReasonablenessViewSchema, spec as viewSpec} from './spec.ts';

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
    it.each([...targets, ...estimationTargets])('renders both modes and verdicts for the original target $id', target => {
        for (const seed of [0, 1]) {
            const payload = prepare(target, seed);
            const claim = resolveEstimationClaim(payload.problem.data, seed);
            const question = renderToStaticMarkup(<OperationsAnswerReasonableness payload={payload} />);
            const solution = renderToStaticMarkup(<OperationsAnswerReasonableness payload={{...payload, isSolutionView: true}} />);
            expect(question).toContain('Round to the nearest ten');
            expect(question).not.toContain('rounds to');
            expect(solution).toContain(`${claim.proposedAnswer} rounds to ${claim.roundedProposedAnswer}`);
            expect(solution).toContain(claim.isReasonable ? 'which matches' : 'which does not match');
            expect(question).not.toContain('Validation Error');
            expect(solution).not.toContain('Validation Error');
        }
    });

    it.each([
        [{numberDomain: undefined}, 'Required field "numberDomain"'],
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
