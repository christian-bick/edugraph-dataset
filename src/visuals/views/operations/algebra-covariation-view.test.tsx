import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {isAlgebraCovariationProblem} from '../../../generators/algebra/algebra-covariation-helpers.ts';
import type {AlgebraCovariationProblem as Problem} from '../../../types/problems.ts';
import {AlgebraCovariationBody, type CovariationTask} from './algebra-covariation-view.tsx';
import {CovariationGraph} from './algebra-covariation-graph.tsx';
import {covariationComplete, covariationFixture as fixture, covariationValue as q} from './algebra-covariation-fixtures.ts';
import * as modelSpec from './algebra-dependent-equation-model/spec.ts';
import * as interpretSpec from './algebra-covariation-interpretation/spec.ts';
import * as constructSpec from './algebra-covariation-table-graph/spec.ts';

const text = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replaceAll('&#x27;', "'").replace(/\s+/g, ' ').trim();
const render = (data: Problem, task: CovariationTask, solution: boolean, seed = 0) => renderToStaticMarkup(<AlgebraCovariationBody data={data} task={task} isSolutionView={solution} seed={seed} />);
const rental = fixture('rental-charge', 2), purchase = fixture('item-purchase', 0), motion = fixture('constant-speed', 1);
const tasks: readonly CovariationTask[] = ['model', 'interpret', 'construct'];
const roleAreas = [Area.AlgebraicModeling, Area.IndependentVariable, Area.DependentVariable];
const attribute = (markup: string, name: string): string => markup.match(new RegExp(`${name}="([^"]*)"`))![1]!;
const screenTexts = (markup: string) => [...markup.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)].map(match => ({attributes: match[1]!, label: match[2]!}));
const screenLines = (markup: string) => [...markup.matchAll(/<line\b([^>]*)>/g)].map(match => match[1]!);

describe('one law with exact full-domain table and graph witnesses', () => {
    it('agrees with independent literal rental, motion and count oracles', () => {
        expect(rental.table.map(row => [row.value.input, row.value.output])).toEqual([[q(0), q(3)], [q(2), q(6)], [q(4), q(9)]]);
        expect(rental.domainImage.atMinimumInput.output).toEqual(q(3));
        expect(rental.domainImage.atMaximumInput.output).toEqual(q(9));
        expect(rental.output.domain).toEqual({kind: 'real', minimum: q(0), maximum: q(20)});
        expect(motion.table.map(row => row.value.output)).toEqual([q(0), q(1), q(2), q(3)]);
        expect(purchase.table.map(row => row.value.output)).toEqual([q(1), q(5), q(7)]);
        expect(purchase.graph.geometry.kind === 'discrete-points' && purchase.graph.geometry.visibleValues.map(row => row.value.output)).toEqual([q(1), q(3), q(5), q(7)]);
        for (const data of [rental, motion, purchase]) expect(isAlgebraCovariationProblem(data)).toBe(true);
    });
    it('keeps model Q dependent on situation facts while hiding the completed equation, roles and all numeric work', () => {
        const question = render(rental, 'model', false);
        expect(text(question)).toContain('initial charge of 3 dollars');
        expect(text(question)).toContain('3/2 dollars per hour');
        expect(text(question)).toContain('rental duration: all real values from 0 to 4 hours');
        expect(text(question)).toContain('rental cost: all real values from 0 to 20 dollars');
        expect(question).not.toMatch(/covariation-equation|covariation-role-answer|covariation-table|covariation-graph|row-work|emerald/);
        expect(question).toContain('Equation: ____');
    });
    it('constructs the original model with symbol meanings, both roles, rate/constant facts and units in S', () => {
        const solution = render(rental, 'model', true), words = text(solution);
        expect(words).toContain('C = (3/2) × t + 3');
        expect(words).toContain('t represents rental duration, measured in hours');
        expect(words).toContain('independent variable, chosen from its stated domain');
        expect(words).toContain('C represents rental cost, measured in dollars');
        expect(words).toContain('dependent variable');
        expect(words).toContain('rate is the total coefficient of t : 3/2 dollars per hour');
        expect(words).toContain('initial amount is the constant part: 3 dollars');
        expect(solution).toContain('text-emerald-900');
    });
    it('gives full equation/table/graph in interpretation Q without the requested explanation', () => {
        const question = render(rental, 'interpret', false);
        expect(question).toMatch(/covariation-equation/);
        expect(question).toMatch(/covariation-table/);
        expect(question).toMatch(/covariation-continuous-segment/);
        expect(text(question)).toContain('C: rental cost (dollars)');
        expect(question).not.toMatch(/covariation-role-answer|covariation-row-work|covariation-answer|emerald|#047857/);
        expect(question).toContain('Variable roles and correspondence explanation: ____');
    });
    it('uses the FIRST original table row, its exact calculation and linked plot position to explain correspondence', () => {
        const data = fixture('rental-charge', 1, {repeated: true, retained: true}), solution = render(data, 'interpret', true);
        expect(text(solution)).toContain('row for point P1, t = 2.00 hours corresponds to C = 6 dollars');
        expect(text(solution)).toContain('(2.00, 6) locates that point');
        expect(solution).toContain('data-literal-notation="0.750"');
        expect(solution).toContain('data-literal-notation="3/4"');
        expect(solution).toContain('data-literal-notation="2.00"');
        expect(solution).toContain('covariation-row-work');
        expect(solution).not.toContain('point-row-');
    });
    it('leaves every construction output/pair and graph mark blank in Q, including selected-proof members off-target', () => {
        for (const count of [0, 1, 2] as const) {
            const question = render(covariationComplete(rental, count), 'construct', false);
            expect(question.match(/data-role="covariation-output-blank"/g)).toHaveLength(3);
            expect(question.match(/data-role="covariation-pair-blank"/g)).toHaveLength(3);
            expect(question).toContain('covariation-equation');
            expect(question).not.toMatch(/covariation-point|covariation-continuous-segment|covariation-window-cut|covariation-row-work|covariation-role-answer|#047857|emerald/);
        }
    });
    it('fills exact ordered pairs and green geometry while preserving neutral prescribed inputs', () => {
        const solution = render(rental, 'construct', true);
        expect(text(solution)).toContain('(0, 3)'); expect(text(solution)).toContain('(2, 6)'); expect(text(solution)).toContain('(4, 9)');
        expect(solution.match(/data-role="covariation-ordered-pair"/g)).toHaveLength(3);
        expect(solution).toContain('text-emerald-800'); expect(solution).toContain('stroke="#047857"');
        expect(solution).not.toMatch(/covariation-output-blank|covariation-pair-blank/);
        expect(solution.match(/<td class="border border-slate-300 p-3">0<\/td>/g)).toHaveLength(1);
    });
    it('plots ALL integer inputs as isolated points even when the table omits an interior count', () => {
        const solution = render(purchase, 'construct', true);
        expect(solution.match(/data-role="covariation-point"/g)).toHaveLength(4);
        expect(solution).not.toContain('covariation-continuous-segment');
        expect(solution).not.toContain('covariation-window-cut');
        expect(text(solution)).toContain('isolated points');
        expect(text(solution)).toContain('item count n');
        expect(text(solution)).toContain('integer values from 0 to 3 items');
    });
    it('uses full supplied real segment and distinguishes a window cut from an actual domain endpoint', () => {
        const data = fixture('rental-charge', 1, {crop: true});
        expect(data.domainImage.atMaximumInput.output).toEqual(q(9));
        expect(data.graph.window).toEqual({minimumInput: q(0), maximumInput: q(2)});
        expect(data.graph.geometry.kind === 'continuous-affine-segment' && data.graph.geometry.lastBoundary).toBe('window-cut');
        const graph = render(data, 'construct', true);
        expect(graph.match(/data-role="covariation-window-cut"/g)).toHaveLength(1);
        expect(graph).toContain('covariation-continuous-segment');
        expect(text(graph)).toContain('continuation within the stated domain');
        expect(render(rental, 'construct', true)).not.toContain('data-role="covariation-window-cut"');
    });
    it('keeps a cut arrow head and visible shaft beyond its coincident point circle, with labels clear of the arrow', () => {
        const data = fixture('rental-charge', 1, {crop: true});
        for (const seed of [0, 1]) {
            const graph = renderToStaticMarkup(<CovariationGraph data={data} visible solutionGeometry highlightedRowId={null} seed={seed} />);
            const head = graph.match(/<polygon\b([^>]*data-role="covariation-cut-head"[^>]*)>/)![1]!;
            const vertices = attribute(head, 'points').split(' ').map(pair => pair.split(',').map(Number));
            const shaft = screenLines(graph).find(line => line.includes('data-role="covariation-cut-shaft"'))!;
            const px = Number(attribute(shaft, 'x1')), py = Number(attribute(shaft, 'y1'));
            const circle = [...graph.matchAll(/<circle\b([^>]*)>/g)].map(match => match[1]!).find(circle => Number(attribute(circle, 'cx')) === px && Number(attribute(circle, 'cy')) === py)!;
            const radius = Number(attribute(circle, 'r')) + Number(attribute(circle, 'stroke-width')) / 2;
            for (const [x, y] of vertices) expect(Math.hypot(x! - px, y! - py)).toBeGreaterThan(radius + 2);
            expect(Math.hypot(Number(attribute(shaft, 'x2')) - px, Number(attribute(shaft, 'y2')) - py)).toBeGreaterThan(radius + 2);
            const left = Math.min(...vertices.map(point => point[0]!)), right = Math.max(...vertices.map(point => point[0]!)), top = Math.min(...vertices.map(point => point[1]!)), bottom = Math.max(...vertices.map(point => point[1]!));
            for (const label of screenTexts(graph).filter(item => /^P\d+$/.test(item.label))) {
                const x = Number(attribute(label.attributes, 'x')), y = Number(attribute(label.attributes, 'y')), anchor = attribute(label.attributes, 'text-anchor'), extent = label.label.length * 8;
                const labelLeft = x - (anchor === 'end' ? extent : anchor === 'middle' ? extent / 2 : 0);
                expect(labelLeft + extent < left || labelLeft > right || y + 4 < top || y - 16 > bottom).toBe(true);
            }
        }
    });
    it('places the zero backing entirely left of the positive curve and vertical axis in nonnegative and signed frames', () => {
        for (const data of [motion, fixture('constant-speed', 1, {signedFrame: true})]) for (const seed of [0, 1]) {
            const graph = renderToStaticMarkup(<CovariationGraph data={data} visible solutionGeometry highlightedRowId={null} seed={seed} />);
            const backing = graph.match(/<rect\b([^>]*data-role="covariation-zero-backing"[^>]*)>/)![1]!;
            const right = Number(attribute(backing, 'x')) + Number(attribute(backing, 'width'));
            const lines = screenLines(graph), curve = lines.find(line => line.includes('data-role="covariation-continuous-segment"'))!;
            const axis = lines.find(line => line.includes('stroke="#334155"') && line.includes('stroke-width="2"') && attribute(line, 'x1') === attribute(line, 'x2'))!;
            expect(Number(attribute(backing, 'x'))).toBeGreaterThanOrEqual(0);
            expect(right).toBeLessThan(Number(attribute(axis, 'x1')) - 5);
            expect(right).toBeLessThanOrEqual(Math.min(Number(attribute(curve, 'x1')), Number(attribute(curve, 'x2'))) - 5);
            const zero = screenTexts(graph).find(item => item.attributes.includes('data-role="covariation-x-tick"') && item.label === '0/1')!;
            expect(attribute(zero.attributes, 'text-anchor')).toBe('end');
            const zx = Number(attribute(zero.attributes, 'x')), zy = Number(attribute(zero.attributes, 'y'));
            for (const tick of screenTexts(graph).filter(item => item.label !== '0/1' && item.attributes.includes('font-size="14"') && item.attributes.includes('text-anchor="end"'))) {
                const tx = Number(attribute(tick.attributes, 'x')), ty = Number(attribute(tick.attributes, 'y'));
                expect(zx < tx - tick.label.length * 7.5 - 3 || zx - 22.5 > tx + 3 || zy + 4 < ty - 18 || zy - 15 > ty + 7).toBe(true);
            }
        }
    });
    it('keeps REAL physical domains separate from the all-Q syntax proof and accepts broad asymmetric frames', () => {
        const data = fixture('constant-production', 0, {broadAxis: true, nonzeroMinimum: true});
        expect(data.graph.axes.x.ticks).toHaveLength(13);
        expect(data.lawProof.proofDomain.symbols[0].domain.kind).toBe('rational');
        expect(data.input.domain.kind).toBe('real'); expect(data.output.domain.kind).toBe('real');
        for (const task of tasks) for (const mode of [false, true]) {
            const result = render(data, task, mode);
            expect(text(result)).toContain('production time');
            expect(text(result)).toContain('all real values from 1 to 4 hours');
            expect(result).not.toMatch(/rational numbers|NaN|undefined|null/);
        }
    });
    it('keeps original repeated-input syntax and supplied exact notation; model Q is independent of hidden equation length', () => {
        const repeated = fixture('rental-charge', 2, {repeated: true});
        expect(render(rental, 'model', false)).toBe(render(repeated, 'model', false));
        expect(render(repeated, 'model', true)).toContain('data-literal-notation="0.750"');
        expect(text(render(repeated, 'model', true))).toContain('total coefficient of t : 3/2');
        for (const data of [motion, rental, purchase]) for (const task of tasks) for (const mode of [false, true]) expect(render(data, task, mode)).not.toMatch(/[□→←]/);
    });
    it('uses short consistent point names and keeps origin tick and point labels separated', () => {
        for (const seed of [0, 1]) {
            const graph = renderToStaticMarkup(<CovariationGraph data={motion} visible solutionGeometry highlightedRowId={null} seed={seed} />);
            expect(graph).toContain('>P1</text>'); expect(graph).not.toContain('point-row-');
            const pointLabel = graph.match(/<text x="([\d.]+)" y="([\d.]+)" text-anchor="(start|end|middle)"[^>]*>P1<\/text>/)!;
            const zero = graph.match(/<text x="([\d.]+)" y="([\d.]+)"[^>]*data-role="covariation-x-tick">0\/1<\/text>/)!;
            expect(pointLabel).not.toBeNull(); expect(zero).not.toBeNull();
            const px = Number(pointLabel[1]), py = Number(pointLabel[2]), zx = Number(zero[1]), zy = Number(zero[2]);
            const pointLeft = px - (pointLabel[3] === 'end' ? 16 : pointLabel[3] === 'middle' ? 8 : 0);
            expect(pointLeft + 16 < zx - 3 || pointLeft > zx + 26 || py + 4 < zy - 18 || py - 16 > zy + 7).toBe(true);
        }
    });
});

let cores: readonly ComponentType<{config: object; payload: unknown}>[];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const modules = await Promise.all([import('./algebra-dependent-equation-model/view.tsx'), import('./algebra-covariation-interpretation/view.tsx'), import('./algebra-covariation-table-graph/view.tsx')]);
    cores = [modules[0].AlgebraDependentEquationModelCore, modules[1].AlgebraCovariationInterpretationCore, modules[2].AlgebraCovariationTableGraphCore] as unknown as typeof cores;
});
afterAll(() => vi.unstubAllGlobals());
const leaf = (index: number, data: unknown, solution: boolean) => renderToStaticMarkup(createElement(cores[index]!, {config: {}, payload: {problem: {type: 'arithmetic', data, labels: []}, isSolutionView: solution, seed: 18}}));

describe('three fixed uniform leaves and complete selected evidence boundaries', () => {
    it('accepts all four quantitative contexts and every selected proof tuple in each fixed leaf/mode', () => {
        for (const context of ['rental-charge', 'constant-speed', 'item-purchase', 'constant-production'] as const) for (const proofCount of [0, 1, 2] as const) {
            const data = fixture(context, proofCount);
            for (let index = 0; index < 3; index++) for (const mode of [false, true]) expect(leaf(index, data, mode)).not.toMatch(/NaN|undefined|null/);
        }
    });
    it('rejects malformed mathematics, sparse/cyclic syntax, lost row-point correspondence and forged selected proofs', () => {
        const cycle: Record<string, unknown> = {id: 'cycle', kind: 'group'}; cycle.expression = cycle;
        const invalid = [undefined, {}, {...rental, equation: undefined}, {...rental, selectedRelations: undefined}, {...rental, selectedRelations: new Array(1)},
            {...rental, table: new Array(2)}, {...rental, graph: {...rental.graph, tablePoints: new Array(3)}},
            {...rental, equation: {...rental.equation, right: cycle}}, {...rental, graph: {...rental.graph, horizontalQuantityId: rental.output.quantityId}},
            {...rental, output: {...rental.output, domain: {...rental.output.domain, maximum: q(8)}}},
            {...rental, selectedRelations: [{...rental.selectedRelations[0], lawExpressionId: 'wrong'}]},
            {...purchase, graph: {...purchase.graph, geometry: {kind: 'discrete-points', visibleValues: []}}}];
        for (const data of invalid) for (let index = 0; index < 3; index++) expect(() => leaf(index, data, false)).toThrow('Validation Error');
    });
    it('preserves exactly the reviewed invariant view ownership and empty fixed schemas', () => {
        expect(modelSpec.spec.generalLabels).toEqual([Scope.ArabicNumerals, Ability.TextualReception, Ability.Formalization]);
        expect(interpretSpec.spec.generalLabels).toEqual([Scope.TabularAlgebraicRepresentation, Scope.GraphicalAlgebraicRepresentation, Scope.CartesianCoordinateSystem, Ability.Interpretation, Ability.VisualReception]);
        expect(constructSpec.spec.generalLabels).toEqual([Area.OrderedCoordinatePair, Area.PointPlotting, Scope.TabularAlgebraicRepresentation, Scope.GraphicalAlgebraicRepresentation, Scope.CartesianCoordinateSystem, Ability.Formalization, Ability.VisualArticulation]);
        expect(modelSpec.AlgebraDependentEquationModelViewSchema).toEqual({}); expect(interpretSpec.AlgebraCovariationInterpretationViewSchema).toEqual({}); expect(constructSpec.AlgebraCovariationTableGraphViewSchema).toEqual({});
    });
    it('admits origin only for model, dependency without Modeling for interpretation, and no role extras for construction', () => {
        const target: readonly string[] = [...roleAreas, Area.PointPlotting];
        const supports = (spec: typeof modelSpec.spec, generator: readonly string[], requested = target) => spec.compatibility!.every(rule => rule.predicate({has: (scope, label) => (scope === 'target' ? requested : generator).includes(label), exact: (scope, label) => (scope === 'target' ? requested : generator).includes(label)}));
        const bundles = [roleAreas, roleAreas.slice(1), []];
        const definitions = [modelSpec.spec, interpretSpec.spec, constructSpec.spec];
        definitions.forEach((spec, index) => bundles.forEach((bundle, bundleIndex) => expect(supports(spec, bundle)).toBe(index === bundleIndex)));
        expect(supports(modelSpec.spec, roleAreas, [])).toBe(false);
        expect(supports(interpretSpec.spec, roleAreas.slice(1), [])).toBe(false);
        expect(supports(constructSpec.spec, [], [])).toBe(false);
    });
});
