import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Area, Ability, Scope} from 'edugraph-ts';
import {buildCoordinateReflectionRelationProblem} from '../../../generators/coordinate/coordinate-reflection-relations/generator.ts';
import {buildCoordinatePointsProblem} from '../../../generators/coordinate/coordinate-points/generator.ts';
import {makeCoordinateAxis} from '../../../generators/coordinate/coordinate-helpers.ts';
import {coordinateOracle, decimalCoordinateOracle, fixedReflectionOracle, reflectionOracle, unreducedCoordinateOracle} from './rational-coordinate-fixtures.ts';
import {formatCoordinatePair} from './rational-coordinate-helpers.ts';
import {CoordinatePlottingBody, CoordinateReadingBody, CoordinateQuadrantBody, CoordinateReflectionBody} from './rational-coordinate-view.tsx';
import {spec as readingSpec, CoordinatePointReadingViewSchema} from './coordinate-point-reading/spec.ts';
import {spec as plottingSpec, CoordinatePointPlottingViewSchema} from './coordinate-point-plotting/spec.ts';
import {spec as quadrantSpec, CoordinateQuadrantInterpretationViewSchema} from './coordinate-quadrant-interpretation/spec.ts';
import {spec as reflectionSpec, CoordinateSignReflectionViewSchema} from './coordinate-sign-reflection/spec.ts';

const text = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ');
const plot = (solution: boolean, data = coordinateOracle) => renderToStaticMarkup(<CoordinatePlottingBody data={data} isSolutionView={solution} seed={18} />);
const read = (solution: boolean, data = coordinateOracle) => renderToStaticMarkup(<CoordinateReadingBody data={data} isSolutionView={solution} seed={18} />);
const quadrant = (solution: boolean, data = coordinateOracle) => renderToStaticMarkup(<CoordinateQuadrantBody data={data} isSolutionView={solution} seed={18} />);
const reflect = (solution: boolean, data = reflectionOracle, seed = 18) => renderToStaticMarkup(<CoordinateReflectionBody data={data} isSolutionView={solution} seed={seed} />);

describe('coordinate learner-task projections', () => {
    it('gives supplied ordered pairs but leaves the plotting grid completely unmarked in Question', () => {
        const question = plot(false, decimalCoordinateOracle);
        expect(text(question)).toContain('P = (1.50, 0.25)');
        expect(question).toContain('data-role="coordinate-plane"');
        expect(question).not.toContain('data-role="coordinate-marker"');
        expect(question).not.toContain('#047857');
        const solution = plot(true, decimalCoordinateOracle);
        expect(solution).toContain('data-x-index="3" data-y-index="1"');
        expect(solution.match(/#047857/g)).toHaveLength(2);
    });
    it('withholds reading answers everywhere while retaining complete fractional and decimal scale evidence', () => {
        for (const data of [coordinateOracle, decimalCoordinateOracle, unreducedCoordinateOracle]) {
            const question = read(false, data);
            expect(question.match(/data-role="coordinate-marker"/g)).toHaveLength(data.points.length);
            expect(question).toContain('data-role="blank-ordered-pairs"');
            expect(question).not.toContain('data-role="coordinate-answer"');
            expect(question).not.toContain('data-role="given-ordered-pairs"');
            expect(question).not.toContain('<title');
            data.points.forEach(point => expect(question).not.toContain(formatCoordinatePair(point)));
            expect(question).toContain('aria-label="Scaled Cartesian coordinate plane"');
        }
        expect(text(read(true, unreducedCoordinateOracle))).toContain('U = (2/4, 4/2)');
        expect(text(read(true, decimalCoordinateOracle))).toContain('P = (1.50, 0.25)');
        expect(read(true)).toContain('emerald');
    });
    it('preserves all four quadrant regions and explains zero components separately only in Solution', () => {
        const question = quadrant(false);
        for (const name of ['I', 'II', 'III', 'IV']) expect(question).toContain(`data-quadrant="${name}"`);
        expect(question).not.toContain('data-role="location-reason"');
        const solution = text(quadrant(true));
        expect(solution).toContain('A: x is negative and y is positive. The point is in Quadrant II.');
        expect(solution).toContain('point lies on the y-axis; axis points are not in a quadrant');
        expect(solution).toContain('Both coordinates are zero, so the point is at the origin.');
        const nonnegative = quadrant(false, decimalCoordinateOracle);
        expect(nonnegative).toContain('data-quadrant="I"');
        expect(nonnegative).not.toContain('data-quadrant="II"');
        expect(nonnegative).not.toContain('data-quadrant="IV"');
    });
    it('keeps Roman quadrant labels away from canonical radius-two point centers', () => {
        const a = makeCoordinateAxis({numerator: 1, denominator: 1}, -2, 2, 'integer');
        const data = buildCoordinatePointsProblem({x: a, y: a}, [{id: 'A', xTickIndex: 1, yTickIndex: 1}, {id: 'B', xTickIndex: 1, yTickIndex: 3},
            {id: 'C', xTickIndex: 3, yTickIndex: 1}, {id: 'D', xTickIndex: 3, yTickIndex: 3}]);
        const markup = quadrant(false, data);
        const centers = [...markup.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)"/g)].map(match => [Number(match[1]), Number(match[2])]);
        const labels = [...markup.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*data-quadrant="([IV]+)"/g)];
        expect(labels).toHaveLength(4);
        for (const label of labels) for (const [cx, cy] of centers) expect(Math.abs(Number(label[1]) - cx!) > label[3]!.length * 10 + 7 || cy! < Number(label[2]) - 31 || cy! > Number(label[2]) + 11).toBe(true);
    });
    it('keeps every zero numeral above and right of the origin while retaining centered nonzero labels', () => {
        for (const kind of ['integer', 'fraction', 'decimal'] as const) for (const first of [-2, 0]) {
            const step = {numerator: 1, denominator: kind === 'integer' ? 1 : 2};
            const axis = makeCoordinateAxis(step, first, 2, kind);
            const data = buildCoordinatePointsProblem({x: axis, y: axis}, [{id: 'P', xTickIndex: axis.zeroIndex + 1, yTickIndex: axis.zeroIndex + 1}]);
            const markup = quadrant(false, data);
            const verticalAxis = markup.match(/<line x1="([\d.]+)"[^>]*data-role="y-axis"/);
            const labels = [...markup.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*text-anchor="([^"]+)"[^>]*data-role="x-tick-label" data-tick-index="(\d+)"/g)];
            expect(verticalAxis).not.toBeNull();
            expect(labels).toHaveLength(axis.ticks.length);
            const zeroLabel = labels.find(label => Number(label[4]) === axis.zeroIndex)!;
            // A start-anchored numeral extends right of the axis and above the ordinary x-label row.
            expect(zeroLabel[3]).toBe('start');
            expect(Number(zeroLabel[1])).toBe(Number(verticalAxis![1]) + 10);
            const zeroY = 490 - axis.zeroIndex * 430 / (axis.ticks.length - 1);
            expect(Number(zeroLabel[2])).toBe(zeroY - 12);
            for (const label of labels.filter(label => Number(label[4]) !== axis.zeroIndex)) {
                expect(label[3]).toBe('middle');
                expect(Number(label[2])).toBe(zeroY + 23);
            }
        }
    });
    it('separates the origin numeral from both adjacent labels on dense decimal scales', () => {
        const intersects = (a: number[], b: number[]) => a[0]! < b[2]! && a[2]! > b[0]! && a[1]! < b[3]! && a[3]! > b[1]!;
        for (const denominator of [5, 2]) {
            const axis = makeCoordinateAxis({numerator: 1, denominator}, -5, 5, 'decimal');
            const data = buildCoordinatePointsProblem({x: axis, y: axis}, [{id: 'P', xTickIndex: axis.zeroIndex, yTickIndex: axis.zeroIndex}]);
            for (const solution of [false, true]) {
                const markup = quadrant(solution, data);
                const labels = [...markup.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*text-anchor="([^"]+)"[^>]*data-role="x-tick-label" data-tick-index="(\d+)"[^>]*>([^<]+)<\/text>/g)];
                expect(labels).toHaveLength(11);
                const bounds = (label: RegExpMatchArray) => {
                    const x = Number(label[1]), y = Number(label[2]), width = label[5]!.length * 7.5;
                    return [label[3] === 'start' ? x : x - width / 2, y - 15,
                        label[3] === 'start' ? x + width : x + width / 2, y + 3];
                };
                const zero = bounds(labels.find(label => Number(label[4]) === axis.zeroIndex)!);
                const verticalAxisX = Number(markup.match(/<line x1="([\d.]+)"[^>]*data-role="y-axis"/)![1]);
                expect(zero[0]).toBeGreaterThan(verticalAxisX + 1);
                for (const index of [axis.zeroIndex - 1, axis.zeroIndex + 1]) {
                    const neighbor = bounds(labels.find(label => Number(label[4]) === index)!);
                    expect(intersects(zero, neighbor)).toBe(false);
                    expect(neighbor[1]! - zero[3]!).toBeGreaterThan(10);
                }
                const markerLabel = markup.match(/data-role="coordinate-marker"[^>]*><circle[^>]*><\/circle><text x="([\d.]+)" y="([\d.]+)" text-anchor="([^"]+)"/)!;
                expect(markerLabel).not.toBeNull();
                const mx = Number(markerLabel[1]), my = Number(markerLabel[2]);
                const markerLeft = mx - (markerLabel[3] === 'end' ? 8 : markerLabel[3] === 'middle' ? 4 : 0);
                expect(intersects(zero, [markerLeft, my - 15, markerLeft + 8, my + 3])).toBe(false);
            }
        }
    });
    it('shows every ordered reflection/intermediate as givens while withholding the explanation', () => {
        const question = reflect(false);
        expect(text(question)).toContain("Step 1: reflect P across the x-axis to P'.");
        expect(text(question)).toContain("Step 2: reflect P' across the y-axis to P''.");
        expect(question.match(/data-role="mirror-guide"/g)).toHaveLength(2);
        expect(question).not.toContain('data-role="reflection-reason"');
        const solution = text(reflect(true));
        expect(solution).toContain('x-coordinate stays -3/2. The y-coordinate is negated: 1 becomes -1.');
        expect(solution).toContain('y-coordinate stays -1. The x-coordinate is negated: -3/2 becomes 3/2.');
        expect(solution).toContain('distances to that axis are 3/2 and 3/2');
    });
    it('combines coincident roles at one unchanged position and accepts repeated-axis involutions', () => {
        const question = reflect(false, fixedReflectionOracle);
        expect(question.match(/data-role="coordinate-marker"/g)).toHaveLength(1);
        expect(text(question)).toContain("P / P' / F1");
        expect(question).toContain('data-x-index="4" data-y-index="3"');
        expect(text(reflect(true, fixedReflectionOracle))).toContain('Negating zero leaves zero unchanged');
        for (const reflectionAxes of [['x', 'x'], ['y', 'y']] as const) {
            const data = buildCoordinateReflectionRelationProblem({axes: coordinateOracle.axes, xTickIndex: 1, yTickIndex: 4, reflectionAxes});
            expect(reflect(true, data).match(/data-role="reflection-reason"/g)).toHaveLength(2);
        }
    });
    it('uses seeded label layout without changing the supplied geometric positions', () => {
        const first = reflect(false, reflectionOracle, 18), second = reflect(false, reflectionOracle, 19);
        const positions = (markup: string) => [...markup.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)"/g)].map(match => [match[1], match[2]]);
        expect(positions(first)).toEqual(positions(second));
        expect(reflect(false, reflectionOracle, 18)).toBe(first);
        expect(first).not.toBe(second);
    });
    it('uses neutral questions, green completed answers and no fallback square/arrow glyphs', () => {
        for (const question of [plot(false), read(false), quadrant(false), reflect(false)]) {
            expect(question).not.toContain('emerald');
            expect(question).not.toContain('#047857');
            expect(question).not.toMatch(/[□→←]/);
        }
        expect(plot(true)).toContain('#047857');
        for (const solution of [read(true), quadrant(true), reflect(true)]) expect(solution).toContain('emerald');
    });
    it('retains fixed empty schemas and the approved sole producer ownership of ordered pairs', () => {
        for (const schema of [CoordinatePointReadingViewSchema, CoordinatePointPlottingViewSchema, CoordinateQuadrantInterpretationViewSchema, CoordinateSignReflectionViewSchema]) expect(schema).toEqual({});
        expect(readingSpec.generalLabels).toEqual([Scope.CartesianCoordinateSystem, Ability.VisualReception]);
        expect(plottingSpec.generalLabels).toContain(Area.PointPlotting);
        for (const spec of [readingSpec, plottingSpec, quadrantSpec, reflectionSpec]) expect(spec.generalLabels).not.toContain(Area.OrderedCoordinatePair);
    });
});

let cores: readonly ComponentType<{payload: unknown; config: object}>[];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const modules = await Promise.all([import('./coordinate-point-plotting/view.tsx'), import('./coordinate-point-reading/view.tsx'),
        import('./coordinate-quadrant-interpretation/view.tsx'), import('./coordinate-sign-reflection/view.tsx')]);
    cores = [modules[0].CoordinatePointPlottingCore, modules[1].CoordinatePointReadingCore, modules[2].CoordinateQuadrantInterpretationCore, modules[3].CoordinateSignReflectionCore] as unknown as typeof cores;
});
afterAll(() => vi.unstubAllGlobals());
describe('coordinate leaf contract boundaries', () => {
    const leaf = (index: number, data: unknown, solution: boolean) => renderToStaticMarkup(createElement(cores[index]!, {config: {}, payload: {
        problem: {type: 'arithmetic', data, labels: []}, targetLabels: [], isSolutionView: solution, seed: 17
    }}));
    it('accepts every point form/domain in all three point leaves and all coherent reflection sequences', () => {
        for (let index = 0; index < 3; index++) for (const data of [coordinateOracle, decimalCoordinateOracle, unreducedCoordinateOracle]) for (const solution of [false, true]) expect(leaf(index, data, solution)).not.toMatch(/NaN|undefined|null/);
        for (const axes of [['x'], ['y'], ['x', 'y'], ['y', 'x'], ['x', 'x'], ['y', 'y']] as const) {
            const data = buildCoordinateReflectionRelationProblem({axes: coordinateOracle.axes, xTickIndex: 4, yTickIndex: 3, reflectionAxes: axes});
            for (const solution of [false, true]) expect(leaf(3, data, solution)).not.toMatch(/NaN|undefined|null/);
        }
    });
    it('rejects malformed witnesses and sparse arrays through ViewValidationError before either mode renders', () => {
        for (let index = 0; index < 4; index++) for (const solution of [false, true]) {
            expect(() => leaf(index, undefined, solution)).toThrow('Validation Error');
            const data = index < 3 ? {...coordinateOracle, points: new Array(1)} : {...reflectionOracle, steps: new Array(1)};
            expect(() => leaf(index, data, solution)).toThrow('Validation Error');
        }
    });
});
