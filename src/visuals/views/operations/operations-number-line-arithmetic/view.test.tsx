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

type Bounds = {left: number; right: number; top: number; bottom: number};
const attributes = (source: string): Record<string, string> =>
    Object.fromEntries([...source.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
const numbers = (source: string): number[] => source.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
const separated = (left: Bounds, right: Bounds): boolean =>
    left.right < right.left || right.right < left.left || left.bottom < right.top || right.bottom < left.top;
const textBounds = (element: {attributes: Record<string, string>; text: string}): Bounds => {
    const x = Number(element.attributes.x), y = Number(element.attributes.y);
    const size = Number(element.attributes.class.match(/text-\[(\d+)px\]/)![1]);
    // Conservative bands contain the bold glyphs, including their descenders.
    const halfWidth = [...element.text].length * size * 0.7 / 2;
    return {left: x - halfWidth, right: x + halfWidth, top: y - size, bottom: y + size / 4};
};

function jumpGeometry(markup: string) {
    const marker = attributes(markup.match(/<marker\b([^>]*)>/)![1]);
    const arc = attributes(markup.match(/<path\b([^>]*marker-end="url\(#number-line-arrow\)"[^>]*)>/)![1]);
    const [startX, startY, controlX, controlY, endX, endY] = numbers(arc.d);
    const angle = Math.atan2(endY - controlY, endX - controlX);
    const scale = marker.markerUnits === 'userSpaceOnUse' ? 1 : Number(arc['stroke-width']);
    const points = numbers(markup.match(/<marker\b[^>]*><path\b[^>]*d="([^"]*)"/)![1]);
    const triangle = [0, 2, 4].map(index => {
        const x = (points[index] - Number(marker.refX)) * scale;
        const y = (points[index + 1] - Number(marker.refY)) * scale;
        return {x: endX + x * Math.cos(angle) - y * Math.sin(angle),
            y: endY + x * Math.sin(angle) + y * Math.cos(angle)};
    });
    const arrow: Bounds = {left: Math.min(...triangle.map(point => point.x)), right: Math.max(...triangle.map(point => point.x)),
        top: Math.min(...triangle.map(point => point.y)), bottom: Math.max(...triangle.map(point => point.y))};
    const text = [...markup.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)]
        .map(match => ({attributes: attributes(match[1]), text: match[2]}));
    const result = text.find(element => element.attributes.class?.includes('fill-emerald-700'))!;
    const jump = text.find(element => element.attributes.class?.includes('fill-blue-700'))!;
    const [, , width, height] = numbers(attributes(markup.match(/<svg\b([^>]*)>/)![1]).viewBox);
    return {arrow, result, jump, resultBounds: textBounds(result), jumpBounds: textBounds(jump),
        startX, startY, endX, endY, width, height};
}

describe('arithmetic number-line references', () => {
    it.each([
        {num1: 15, num2: 1, answer: 16, operation: 'addition'},
        {num1: 16, num2: 1, answer: 15, operation: 'subtraction'},
        {num1: 99, num2: 1, answer: 100, operation: 'addition'},
        {num1: 1, num2: 1, answer: 0, operation: 'subtraction'},
        {num1: 0, num2: 0, answer: 0, operation: 'addition'},
        {num1: 20, num2: 0, answer: 20, operation: 'addition'},
        {num1: 20, num2: 0, answer: 20, operation: 'subtraction'},
        {num1: 0, num2: 100, answer: 100, operation: 'addition'},
        {num1: 100, num2: 100, answer: 0, operation: 'subtraction'},
        {num1: 100, num2: 99, answer: 1, operation: 'subtraction'}
    ] satisfies ArithmeticPairProblem[])('separates labels from the arrow for $num1 $operation $num2', data => {
        const solution = render(data, true);
        const geometry = jumpGeometry(solution);
        expect(geometry.result.text).toBe(String(data.answer));
        expect(geometry.jump.text).toBe(`${data.operation === 'addition' ? '+' : '−'}${data.num2}`);
        expect(Number(geometry.result.attributes.x)).toBe(geometry.endX);
        expect(Math.sign(geometry.endX - geometry.startX)).toBe(Math.sign(data.answer - data.num1));
        expect(geometry.endY).toBe(geometry.startY);
        for (const [first, second] of [[geometry.resultBounds, geometry.arrow],
            [geometry.jumpBounds, geometry.arrow], [geometry.resultBounds, geometry.jumpBounds]]) {
            expect(separated(first, second)).toBe(true);
        }
        for (const bounds of [geometry.resultBounds, geometry.jumpBounds, geometry.arrow]) {
            expect(bounds.left).toBeGreaterThanOrEqual(0);
            expect(bounds.right).toBeLessThanOrEqual(geometry.width);
            expect(bounds.top).toBeGreaterThanOrEqual(0);
            expect(bounds.bottom).toBeLessThanOrEqual(geometry.height);
        }
        expect(tickValues(solution).includes(0)).toBe([data.num1, data.num2, data.answer].includes(0));
        const question = render(data, false);
        expect(question).toContain(' = □');
        expect(question).not.toContain('marker-end="url(#number-line-arrow)"');
        expect(question).not.toContain('fill-emerald-700');
    });

    it('detects the original short-jump collision instead of checking only fixed coordinates', () => {
        const markup = render({num1: 15, num2: 1, answer: 16, operation: 'addition'}, true);
        const original = markup.replace('markerUnits="userSpaceOnUse"', 'markerUnits="strokeWidth"')
            .replace(/(<text[^>]* y=")24("[^>]*class="fill-emerald-700)/,
                (_match, prefix, suffix) => `${prefix}98${suffix}`);
        const geometry = jumpGeometry(original);
        expect(separated(geometry.resultBounds, geometry.arrow)).toBe(false);
        expect(separated(geometry.jumpBounds, geometry.arrow)).toBe(false);
    });

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
            expect(values.at(-1)).toBe(maximum <= 5 ? 5 : Math.ceil(maximum / 10) * 10);
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

    it('resolves and replays every canonical Grade-2 choice with truthful zero absence in both modes', () => {
        const generator = new ArithmeticOpsPairsGenerator();
        const evaluate = createLabelDependencyEvaluator().evaluate;
        const actual = targets.filter(target => target.id.startsWith('2.MD.B.6-number-line-arithmetic~'));
        expect(actual).toHaveLength(8);
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
        expect(choices).toBeGreaterThanOrEqual(actual.length);
    });
});
