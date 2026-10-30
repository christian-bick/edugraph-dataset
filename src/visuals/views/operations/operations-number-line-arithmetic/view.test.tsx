import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Scope} from 'edugraph-ts';
import {ArithmeticOpsPairsGenerator} from '../../../../generators/arithmetic/arithmetic-ops-pairs/generator.ts';
import {spec as generatorSpec} from '../../../../generators/arithmetic/arithmetic-ops-pairs/spec.ts';
import {createGenerationSelectionReceipt} from '../../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../../lib/label-dependency-audit.ts';
import {createLabelDependencyEvaluator} from '../../../../lib/label-dependencies.ts';
import {planModelCompatibility} from '../../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../../lib/planned-generation.ts';
import {getRandomState, setSeed} from '../../../../lib/random.ts';
import {spec as targets} from '../../../../spec/ccss/grade-02.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {ArithmeticPairProblem} from '../../../../types/problems.ts';
import {OperationsNumberLineArithmeticViewSchema, spec} from './spec.ts';

let Core: typeof import('./view.tsx')['OperationsNumberLineArithmeticCore'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    Core = (await import('./view.tsx')).OperationsNumberLineArithmeticCore;
});
afterAll(() => vi.unstubAllGlobals());

const payload = (data: ArithmeticPairProblem, isSolutionView: boolean):
    ViewRenderPayload<'operations-number-line-arithmetic'> => ({
    problem: {type: 'arithmetic', data, labels: []}, viewId: 'operations-number-line-arithmetic',
    targetLabels: [], isSolutionView, seed: 1
});
const render = (data: ArithmeticPairProblem, solution: boolean) =>
    renderToStaticMarkup(createElement(Core, {config: {}, payload: payload(data, solution)}));
const tickValues = (markup: string) => [...markup.matchAll(/<text[^>]* y="156"[^>]*>(\d+)<\/text>/g)]
    .map(match => Number(match[1]));

describe('arithmetic number-line references', () => {
    it.each([
        {num1: 1, num2: 1, answer: 2, operation: 'addition'},
        {num1: 31, num2: 24, answer: 55, operation: 'addition'},
        {num1: 99, num2: 1, answer: 100, operation: 'addition'},
        {num1: 100, num2: 99, answer: 1, operation: 'subtraction'}
    ] satisfies ArithmeticPairProblem[])('omits an unnecessary zero reference for $num1 $operation $num2', data => {
        for (const solution of [false, true]) {
            setSeed(19);
            const continuation = getRandomState();
            const markup = render(data, solution);
            expect(getRandomState()).toBe(continuation);
            expect(tickValues(markup)).not.toContain(0);
            expect(markup).not.toContain('beginning at zero');
            expect(markup).toContain('Number line with a positive numerical scale');
            expect(markup).toContain(`start ${data.num1}`);
            expect(markup.includes(' = □')).toBe(!solution);
            expect(markup.includes('marker-end="url(#number-line-arrow)"')).toBe(solution);
            if (solution) expect(markup).toContain(`>${data.answer}</text>`);
        }
    });

    it.each([
        {num1: 0, num2: 20, answer: 20, operation: 'addition'},
        {num1: 20, num2: 0, answer: 20, operation: 'addition'},
        {num1: 20, num2: 20, answer: 0, operation: 'subtraction'}
    ] satisfies ArithmeticPairProblem[])('retains a genuine zero for $num1 $operation $num2', data => {
        for (const solution of [false, true]) {
            const markup = render(data, solution);
            expect(tickValues(markup)[0]).toBe(0);
            expect(markup).toContain('Number line beginning at zero');
        }
    });

    it('preserves an integer, evenly spaced scale for every supported maximum including 100', () => {
        for (let maximum = 0; maximum <= 100; maximum++) {
            const data: ArithmeticPairProblem = maximum < 2
                ? {num1: 0, num2: maximum, answer: maximum, operation: 'addition'}
                : {num1: 1, num2: maximum - 1, answer: maximum, operation: 'addition'};
            const values = tickValues(render(data, false));
            expect(values.every(Number.isInteger)).toBe(true);
            expect(values.at(-1)).toBe(Math.max(10, Math.ceil(maximum / 10) * 10));
            expect(new Set(values.slice(1).map((value, index) => value - values[index]!)).size).toBe(1);
            expect(values.includes(0)).toBe(maximum < 2);
        }
        expect(tickValues(render({num1: 99, num2: 1, answer: 100, operation: 'addition'}, true)).at(-1)).toBe(100);
    });

    it('rejects incoherent or out-of-domain mathematics before rendering', () => {
        const malformed = [
            {num1: 1, num2: 2, answer: 4, operation: 'addition'},
            {num1: 101, num2: 1, answer: 100, operation: 'subtraction'},
            {num1: 1, num2: 2, answer: -1, operation: 'subtraction'},
            {num1: 1.5, num2: 1, answer: 2.5, operation: 'addition'}
        ] satisfies ArithmeticPairProblem[];
        for (const data of malformed) expect(() => render(data, false)).toThrow(/Validation Error/);
        // @ts-expect-error Runtime payload validation also protects malformed external input.
        expect(() => render({num1: 1}, false)).toThrow(/Required field/);
    });

    it('resolves and replays all five real Grade-2 choices with truthful zero absence in both modes', () => {
        const generator = new ArithmeticOpsPairsGenerator();
        const evaluate = createLabelDependencyEvaluator().evaluate;
        const actual = targets.filter(target => target.id.startsWith('2.MD.B.6-number-line-arithmetic~'));
        expect(actual).toHaveLength(2);
        let choices = 0;
        for (const target of actual) {
            const result = planModelCompatibility(target,
                {generatorId: generatorSpec.generatorId, generalLabels: generatorSpec.generalLabels,
                    schema: generator.schema, spec: generatorSpec},
                {viewId: spec.viewId, generalLabels: spec.generalLabels,
                    schema: OperationsNumberLineArithmeticViewSchema, spec});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error('The real arithmetic target must remain supported.');
            const enumeration = enumerateDependencyAuditSelections(result.plan);
            expect(enumeration.status).toBe('complete');
            for (const selection of enumeration.selections) {
                choices++;
                const sampleKey = `${target.id}#${generatorSpec.generatorId}#${spec.viewId}#train#question#inst:0`;
                const seed = 41;
                const replay = {version: 1 as const, sampleKey, attempt: 1, seed,
                    selection: createGenerationSelectionReceipt(result.plan, selection.choices)};
                const input = {generator, generatorSpec, viewSpec: spec, viewSchema: OperationsNumberLineArithmeticViewSchema,
                    plan: result.plan, sampleKey, attempt: 1, seed, replay};
                const draw = generatePlannedDraw(input);
                expect(draw.labels).toContain(Scope.NumbersWithoutZero);
                expect(draw.labels).not.toContain(Scope.NumbersWithZero);
                const evaluation = evaluate(draw.labels);
                expect(evaluation.conflicts).toEqual([]);
                expect(evaluation.assessments.filter(item => item.status === 'missing' && item.facet !== 'range')).toEqual([]);
                expect(draw.stub).not.toBeNull();
                const data = draw.stub!.data as ArithmeticPairProblem;
                expect([data.num1, data.num2, data.answer].every(value => value > 0)).toBe(true);
                const continuation = getRandomState();
                for (const solution of [false, true]) {
                    const markup = render(data, solution);
                    expect(tickValues(markup)).not.toContain(0);
                    expect(getRandomState()).toBe(continuation);
                }
                const repeated = generatePlannedDraw(input);
                expect(repeated.stub).toEqual(draw.stub);
                expect(repeated.replay).toEqual(draw.replay);
                expect(getRandomState()).toBe(continuation);
            }
        }
        expect(choices).toBe(5);
    });
});
