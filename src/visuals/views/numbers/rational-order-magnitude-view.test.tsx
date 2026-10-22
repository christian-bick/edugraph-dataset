import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Scope} from 'edugraph-ts';
import {buildRationalOrderRelationProblem} from '../../../generators/number/rational-order-relations/generator.ts';
import {buildRationalMagnitudeRelationProblem} from '../../../generators/number/rational-magnitude-relations/generator.ts';
import {buildRationalOrderContextProblem} from '../../../generators/number/rational-order-contexts/generator.ts';
import {buildRationalMagnitudeContextProblem} from '../../../generators/number/rational-magnitude-contexts/generator.ts';
import {AbsoluteValueDistanceBody, ContextAbsoluteValueBody, ContextOrderExplanationBody, ContextOrderWritingBody, InequalityLineBody, OrderVersusMagnitudeBody} from './rational-order-magnitude-view.tsx';
import {debtMagnitudeOracle, magnitudeLineOracle, oppositeMagnitudesOracle, orderLineOracle, temperatureOrderOracle, zeroContextMagnitudeOracle, zeroMagnitudeOracle} from './rational-order-magnitude-fixtures.ts';
import * as lineSpec from './numbers-inequality-line-interpretation/spec.ts';
import * as explanationSpec from './numbers-contextual-order-explanation/spec.ts';
import * as writingSpec from './numbers-contextual-order-writing/spec.ts';
import * as distanceSpec from './numbers-absolute-value-distance/spec.ts';
import * as absoluteSpec from './numbers-contextual-absolute-value/spec.ts';
import * as classificationSpec from './numbers-order-versus-magnitude/spec.ts';

const text = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'").replace(/\s+/g, ' ');
const line = (solution: boolean, seed: number, data = orderLineOracle) => renderToStaticMarkup(<InequalityLineBody data={data} isSolutionView={solution} seed={seed} />);
const distance = (solution: boolean, seed: number, data = magnitudeLineOracle) => renderToStaticMarkup(<AbsoluteValueDistanceBody data={data} isSolutionView={solution} seed={seed} />);
const explain = (solution: boolean, data = temperatureOrderOracle) => renderToStaticMarkup(<ContextOrderExplanationBody data={data} isSolutionView={solution} />);
const write = (solution: boolean, data = temperatureOrderOracle) => renderToStaticMarkup(<ContextOrderWritingBody data={data} isSolutionView={solution} />);
const absolute = (solution: boolean, data = debtMagnitudeOracle) => renderToStaticMarkup(<ContextAbsoluteValueBody data={data} isSolutionView={solution} />);
const classify = (solution: boolean, data = debtMagnitudeOracle) => renderToStaticMarkup(<OrderVersusMagnitudeBody data={data} isSolutionView={solution} />);

describe('order and magnitude fixed learner-task projections', () => {
    it('gives the strict inequality and neutral exact points in Q, then interprets right/up direction in S', () => {
        for (const seed of [18, 19]) {
            const question = line(false, seed);
            expect(text(question)).toContain('Given: -3/2 > -7/4');
            expect(question.match(/data-role="order-magnitude-marker"/g)).toHaveLength(2);
            expect(question).not.toContain('data-role="order-magnitude-answer"');
            expect(text(question)).toContain('Step: 1/4');
        }
        expect(line(false, 18)).toContain('<circle cx="220" cy="80"');
        expect(line(false, 19)).toContain('<circle cx="370" cy="442.5"');
        expect(text(line(true, 18))).toContain('A (-3/2) is to the right of B (-7/4)');
        expect(text(line(true, 19))).toContain('A (-3/2) is above B (-7/4)');
        const reversed = {...orderLineOracle, first: orderLineOracle.second, second: orderLineOracle.first, relation: 'less' as const};
        expect(text(line(true, 18, reversed))).toContain('A (-7/4) is to the left of B (-3/2)');
        expect(text(line(true, 19, reversed))).toContain('A (-7/4) is below B (-3/2)');
        expect(line(false, 18)).toBe(line(false, 18));
    });
    it('retains necessary context and the given inequality without revealing an explanation in Q', () => {
        expect(text(explain(false))).toContain('Celsius temperatures');
        expect(text(explain(false))).toContain('Given: -3/2 > -7/4');
        expect(text(explain(false))).not.toContain('warmer than');
        expect(text(explain(true))).toContain("A's temperature is warmer than B's");
        const balance = buildRationalOrderContextProblem('balance', {numerator: -40, denominator: 1}, {numerator: -30, denominator: 1});
        expect(text(explain(true, balance))).toContain("A's net balance is lower than B's");
    });
    it('makes context-writing Q prose-only and withholds the entire signed formalization', () => {
        const question = write(false);
        expect(question).toContain('data-role="order-context-prose"');
        expect(text(question)).toContain('3/2 degrees Celsius below 0°C');
        expect(text(question)).toContain('7/4 degrees Celsius below 0°C');
        expect(text(question)).toContain("A's temperature is warmer than B's");
        expect(text(question)).not.toContain('-3/2');
        expect(text(question)).not.toContain('-7/4');
        expect(question).not.toContain('data-role="given-inequality"');
        expect(question).not.toContain('data-role="context-readings"');
        expect(text(write(true))).toContain('-3/2 > -7/4 °C');
    });
    it('shows the genuine zero-to-point segment but withholds its label/equation until Solution', () => {
        for (const seed of [18, 19]) {
            const question = distance(false, seed), solution = distance(true, seed);
            expect(question).toContain('data-role="absolute-distance-segment"');
            expect(question).not.toContain('data-role="distance-length"');
            expect(text(question)).toContain('|-7/4| = __________');
            expect(text(question)).not.toContain('|-7/4| = 7/4');
            expect(solution).toContain('data-role="distance-length">7/4');
            expect(text(solution)).toContain('|-7/4| = 7/4');
            expect(text(solution)).toContain('distance from zero to a is 7/4');
        }
    });
    it('renders zero as one coincident point and no positive segment in either mode or orientation', () => {
        for (const solution of [false, true]) for (const seed of [18, 19]) {
            const markup = distance(solution, seed, zeroMagnitudeOracle);
            expect(markup.match(/data-role="order-magnitude-marker"/g)).toHaveLength(1);
            expect(text(markup)).toContain('a / 0');
            expect(markup).not.toContain('data-role="absolute-distance-segment"');
            expect(markup).not.toContain('data-role="distance-length"');
        }
        expect(text(distance(false, 18, zeroMagnitudeOracle))).not.toContain('|0| = 0');
        expect(text(distance(true, 19, zeroMagnitudeOracle))).toContain('|0| = 0');
        expect(text(distance(true, 19, zeroMagnitudeOracle))).toContain('point and zero coincide');
    });
    it('preserves the GIVEN signed inequality in context-abs Q while withholding both absolute equations and magnitude comparison', () => {
        const question = absolute(false);
        expect(text(question)).toContain('Given: -40 < -30');
        expect(question).toContain('data-role="given-inequality"');
        expect(question).not.toContain('data-role="context-absolute-answer"');
        expect(question).not.toContain('data-role="magnitude-comparison"');
        expect(text(question)).not.toContain('|-40|');
        expect(text(question)).not.toContain('|-30|');
        expect(text(question)).not.toContain('40 > 30');
        expect(text(question)).not.toContain('A owes 40');
        const solution = text(absolute(true));
        expect(solution).toContain('Given: -40 < -30');
        expect(solution).toContain('A: |-40| = 40 dollars');
        expect(solution).toContain('B: |-30| = 30 dollars');
        expect(solution).toContain('A owes 40 dollars');
        expect(solution).toContain('Magnitudes: 40 > 30');
    });
    it('gives both classification statements but no category labels or completed explanation in Q', () => {
        const question = text(classify(false));
        expect(question).toContain('Statement 1: -40 < -30');
        expect(question).toContain('Statement 2: |-40| > |-30|');
        expect(question).not.toContain('compares signed');
        expect(question).not.toContain('compares absolute magnitudes');
        expect(question).not.toContain('lower signed balance means');
        const solution = text(classify(true));
        expect(solution).toContain('Statement 1 compares signed net balance');
        expect(solution).toContain('Statement 2 compares absolute magnitudes: 40 > 30 dollars');
        expect(solution).toContain('lower signed balance means a larger amount owed');
    });
    it('preserves equal magnitudes, zero and non-reversing mixed-sign pairs truthfully', () => {
        expect(text(classify(false, oppositeMagnitudesOracle))).toContain('Statement 2: |-7/4| = |7/4|');
        expect(text(absolute(true, oppositeMagnitudesOracle))).toContain('Magnitudes: 7/4 = 7/4');
        expect(text(absolute(true, zeroContextMagnitudeOracle))).toContain('A: |0| = 0 °C');
        expect(text(absolute(true, zeroContextMagnitudeOracle))).toContain('distance from 0°C');
        for (const [first, second, expected] of [[-3, 7, '3/2 < 7/2'], [-7, 3, '7/2 > 3/2']] as const) {
            const data = buildRationalMagnitudeContextProblem('elevation', {numerator: first, denominator: 2}, {numerator: second, denominator: 2});
            expect(text(absolute(true, data))).toContain(`Magnitudes: ${expected}`);
            expect(text(classify(true, data))).not.toContain('larger amount owed');
        }
    });
    it('uses neutral Q, green completed S and no fallback square/arrow glyphs in every task', () => {
        for (const markup of [line(false, 18), distance(false, 19), explain(false), write(false), absolute(false), classify(false)]) {
            expect(markup).not.toMatch(/emerald|#047857|[□→←]/);
            expect(markup).not.toContain('<title');
        }
        for (const markup of [line(true, 18), distance(true, 19), explain(true), write(true), absolute(true), classify(true)]) expect(markup).toContain('text-emerald-900');
    });
    it('keeps empty leaf schemas, independent ownership and fixed reviewed Ability conjunctions', () => {
        const specs = [lineSpec, explanationSpec, writingSpec, distanceSpec, absoluteSpec, classificationSpec];
        for (const spec of specs) expect(Object.values(spec).find(value => value && typeof value === 'object' && Object.keys(value).length === 0)).toEqual({});
        expect(lineSpec.spec.generalLabels).toEqual([Scope.Numberline, Ability.Interpretation]);
        expect(distanceSpec.spec.generalLabels).toEqual([Scope.Numberline, Ability.Interpretation]);
        expect(absoluteSpec.spec.generalLabels).toEqual([Ability.Interpretation, Ability.Formalization]);
        expect(classificationSpec.spec.generalLabels).toEqual([Ability.ConceptClassification]);
    });
});

let cores: readonly ComponentType<{config: object; payload: unknown}>[];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const modules = await Promise.all([import('./numbers-inequality-line-interpretation/view.tsx'), import('./numbers-contextual-order-explanation/view.tsx'),
        import('./numbers-contextual-order-writing/view.tsx'), import('./numbers-absolute-value-distance/view.tsx'), import('./numbers-contextual-absolute-value/view.tsx'), import('./numbers-order-versus-magnitude/view.tsx')]);
    cores = [modules[0].NumbersInequalityLineInterpretationCore, modules[1].NumbersContextualOrderExplanationCore, modules[2].NumbersContextualOrderWritingCore,
        modules[3].NumbersAbsoluteValueDistanceCore, modules[4].NumbersContextualAbsoluteValueCore, modules[5].NumbersOrderVersusMagnitudeCore] as unknown as typeof cores;
});
afterAll(() => vi.unstubAllGlobals());
describe('order-magnitude leaf uniform boundaries', () => {
    const leaf = (index: number, data: unknown, solution: boolean) => renderToStaticMarkup(createElement(cores[index]!, {config: {}, payload: {problem: {type: 'arithmetic', data, labels: []}, targetLabels: [], seed: 19, isSolutionView: solution}}));
    it('accepts every context/sign/relation case in both sibling tasks and generic two-tick scalar axes', () => {
        for (const kind of ['temperature', 'elevation', 'balance'] as const) for (const values of [[-3, -7], [-7, -3], [-3, 3], [0, 1], [1, 3]] as const) {
            const first = {numerator: values[0], denominator: 1}, second = {numerator: values[1], denominator: 1};
            const order = buildRationalOrderContextProblem(kind, first, second), magnitude = buildRationalMagnitudeContextProblem(kind, first, second);
            for (const solution of [false, true]) {
                for (const index of [1, 2]) expect(leaf(index, order, solution)).not.toMatch(/NaN|undefined|null/);
                for (const index of [4, 5]) expect(leaf(index, magnitude, solution)).not.toMatch(/NaN|undefined|null/);
            }
        }
        const order = buildRationalOrderRelationProblem(zeroMagnitudeOracle.axis, 0, 1);
        for (const solution of [false, true]) {
            expect(leaf(0, order, solution)).not.toMatch(/NaN|undefined|null/);
            expect(leaf(3, buildRationalMagnitudeRelationProblem(zeroMagnitudeOracle.axis, 1), solution)).not.toMatch(/NaN|undefined|null/);
            expect(leaf(3, zeroMagnitudeOracle, solution)).not.toMatch(/NaN|undefined|null/);
        }
    });
    it('rejects malformed full witnesses through ViewValidationError before either mode renders', () => {
        const bad = [{...orderLineOracle, relation: 'less'}, {...temperatureOrderOracle, relation: 'less'}, {...temperatureOrderOracle, context: {kind: 'toString'}},
            {...magnitudeLineOracle, distance: {...magnitudeLineOracle.distance, toTickIndex: 0}}, {...debtMagnitudeOracle, magnitudeRelation: 'less'}, {...debtMagnitudeOracle, signedRelation: 'greater'}];
        for (let index = 0; index < 6; index++) for (const solution of [false, true]) {
            expect(() => leaf(index, undefined, solution)).toThrow('Validation Error');
            expect(() => leaf(index, bad[index], solution)).toThrow('Validation Error');
        }
    });
});
