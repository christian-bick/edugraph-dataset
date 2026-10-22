import {createElement, type ComponentType} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {makeCoordinateAxis} from '../../../generators/coordinate/coordinate-helpers.ts';
import {buildCoordinateAxisDistanceProblem} from '../../../generators/coordinate/coordinate-axis-distance/generator.ts';
import {buildCoordinateRouteProblem} from '../../../generators/coordinate/coordinate-problems/generator.ts';
import {CoordinateMetricPlane} from './coordinate-metric-plane.tsx';
import {CoordinateDistanceBody, CoordinatePolygonConstructionBody, CoordinatePolygonSideBody, CoordinateRouteBody} from './coordinate-metric-view.tsx';
import {metricConcaveDiagonalOracle, metricDistanceOracle, metricDownwardSideOracle, metricRouteOracle, metricSquareOracle} from './coordinate-metric-fixtures.ts';

const text = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x27;/g, "'").replace(/\s+/g, ' ');
const distance = (solution: boolean, story = false, data = metricDistanceOracle) => renderToStaticMarkup(<CoordinateDistanceBody data={data} story={story} isSolutionView={solution} seed={18} />);
const route = (solution: boolean, story = false, data = metricRouteOracle) => renderToStaticMarkup(<CoordinateRouteBody data={data} story={story} isSolutionView={solution} seed={18} />);
const construct = (solution: boolean, story = false, data = metricSquareOracle) => renderToStaticMarkup(<CoordinatePolygonConstructionBody data={data} story={story} isSolutionView={solution} seed={18} />);
const side = (solution: boolean, story = false, data = metricDownwardSideOracle) => renderToStaticMarkup(<CoordinatePolygonSideBody data={data} story={story} isSolutionView={solution} seed={18} />);
const markerPositions = (markup: string) => new Map([...markup.matchAll(/data-role="metric-marker" data-point-ids="([^"]+)"><circle cx="([\d.]+)" cy="([\d.]+)"/g)].map(match => [match[1]!, [Number(match[2]), Number(match[3])] as const]));

describe('metric coordinate projections', () => {
    it('draws a physical2-by-2 square as a square with xhalf-step/ywhole-step tick spacing', () => {
        const markup = construct(true), positions = markerPositions(markup);
        const a = positions.get('A')!, b = positions.get('B')!, c = positions.get('C')!;
        expect(b[0] - a[0]).toBeCloseTo(a[1] - c[1], 10);
        expect(b[0] - a[0]).toBeCloseTo(440, 10);
        expect(a).toEqual([160, 500]);
        const ticks = [...markup.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*data-role="metric-x-tick">([^<]+)<\/text>/g)];
        expect(Number(ticks[2]![1]) - Number(ticks[1]![1])).toBeCloseTo(110, 10);
        expect(text(markup)).toContain('x step: 1/2; y step: 1');
    });
    it('withholds13/4 distance calculation in Q and projects the supplied exact absolute equation in S', () => {
        const question = distance(false);
        expect(question.match(/data-role="metric-marker"/g)).toHaveLength(2);
        expect(question).not.toContain('data-role="distance-absolute-equation"');
        expect(text(question)).not.toContain('13/4');
        expect(text(question)).toContain('Distance = |________ - ________|');
        const solution = text(distance(true));
        expect(solution).toContain('Distance = |(5/4) - (-2)| = |(13/4)| = 13/4 m');
        expect(solution).toContain('x coordinate is the same: -3/2');
    });
    it('combines zero-distance endpoint roles at one position and never invents a positive length', () => {
        const data = buildCoordinateAxisDistanceProblem({axes: metricDistanceOracle.axes, first: metricDistanceOracle.first, second: {...metricDistanceOracle.first, id: 'Z'}, varyingAxis: 'x'});
        const question = distance(false, false, data), solution = distance(true, false, data);
        expect(question.match(/data-role="metric-marker"/g)).toHaveLength(1);
        expect(text(question)).toContain('P / Z');
        expect(text(question)).not.toContain('= 0 m');
        expect(text(solution)).toContain('= 0 m');
        expect(text(solution)).toContain('both locations coincide');
    });
    it('keeps route Q completely unplotted and reveals every leg/prefix and total8 only in S', () => {
        const question = route(false);
        expect(question).not.toContain('data-role="metric-marker"');
        expect(question).not.toContain('data-role="metric-edge"');
        expect(question).not.toContain('data-role="route-leg-work"');
        expect(question).not.toContain('data-role="route-total"');
        const solution = route(true);
        expect(solution.match(/data-role="metric-edge"/g)).toHaveLength(2);
        expect(text(solution)).toContain('A to B: 3 - (-2) = 5 m. Cumulative length: 0 + 5 = 5 m');
        expect(text(solution)).toContain('B to C: 2 - (-1) = 3 m. Cumulative length: 5 + 3 = 8 m');
        expect(text(solution)).toContain('Total route length: 8 m');
        expect(text(question)).toContain('horizontal or vertical legs');
    });
    it('preserves repeated visits and stationary route legs rather than replacing them with endpoint distance', () => {
        const data = buildCoordinateRouteProblem({axes: metricRouteOracle.axes, landmarks: metricRouteOracle.landmarks, path: ['A', 'B', 'A', 'A', 'B', 'C']});
        const markup = route(true, false, data);
        expect(markup.match(/data-role="metric-edge"/g)).toHaveLength(5);
        expect(text(markup)).toContain('A to A: (-2) - (-2) = 0 m');
        expect(text(markup)).toContain('Total route length: 18 m');
    });
    it('keeps construction Q points AND edges blank while showing only the first supplied equation as a neutral given', () => {
        const data = {...metricDownwardSideOracle, sideDistanceEquations: [...metricDownwardSideOracle.sideDistanceEquations, {edgeIndex: 1, minuend: {numerator: 5, denominator: 1}, subtrahend: {numerator: 0, denominator: 1}, difference: {numerator: 5, denominator: 1}}]};
        const question = construct(false, false, data);
        expect(question).not.toContain('data-role="metric-marker"');
        expect(question).not.toContain('data-role="metric-edge"');
        expect(question.match(/data-role="given-side-distance-reference"/g)).toHaveLength(1);
        expect(text(question)).toContain('Given side-distance reference: y-coordinate difference 3 - 0 = 3 coordinate units');
        expect(text(question)).not.toContain('5 - 0 = 5');
        expect(question).not.toContain('emerald');
        expect(construct(false)).not.toContain('given-side-distance-reference');
        const solution = construct(true, false, data);
        expect(solution.match(/data-role="metric-marker"/g)).toHaveLength(4);
        expect(solution.match(/data-role="metric-edge"/g)).toHaveLength(4);
        expect(text(solution)).toContain('final edge closes the polygon');
        expect(text(question)).not.toMatch(/area|perimeter|cut/i);
    });
    it('withholds selected side proofs in side Q and uses supplied universal values when no proof is selected', () => {
        const question = side(false);
        expect(question).not.toContain('given-side-distance-reference');
        expect(question).not.toContain('polygon-side-work');
        expect(text(question)).not.toContain('3 - 0 = 3');
        expect(text(side(true))).toContain('DA = 3 - 0 = 3 m');
        expect(side(true)).toBe(side(true, false, {...metricDownwardSideOracle, sideDistanceEquations: []}));
        expect(text(side(true, false, metricConcaveDiagonalOracle))).toContain('CD = 4 - 3 = 1 m');
    });
    it('keeps required story coordinates/roles/units in prose rather than duplicating a ready pair table', () => {
        for (const markup of [distance(false, true), route(false, true), construct(false, true), side(false, true)]) {
            expect(markup).toContain('data-role="coordinate-story-prose"');
            expect(markup).not.toContain('data-role="coordinate-math-givens"');
            expect(text(markup)).toContain('positive x is east and positive y is north');
            expect(text(markup)).not.toMatch(/\b[A-Z] = \(/);
            const withoutProse = markup.replace(/<section[^>]*data-role="coordinate-story-prose">[\s\S]*?<\/section>/, '');
            expect(text(withoutProse)).not.toContain('meters');
        }
        expect(text(route(false, true))).toContain('2 meters west and 1 meters south');
    });
    it('protects origin numerals from diagonal edges and keeps point IDs away from segments', () => {
        const markup = construct(true, false, metricConcaveDiagonalOracle);
        const edges = [...markup.matchAll(/<line x1="([\d.]+)" x2="([\d.]+)" y1="([\d.]+)" y2="([\d.]+)"[^>]*data-role="metric-edge"/g)].map(match => [Number(match[1]), Number(match[3]), Number(match[2]), Number(match[4])]);
        expect(edges).toHaveLength(6);
        expect(edges[0]).toEqual([80, 430, 380, 130]);
        // The NE diagonal crosses the origin-label box. Its white backing and later SVG layer protect all glyphs.
        const zero = markup.match(/<rect x="87" y="401" width="13.5" height="22" fill="white" data-role="metric-tick-background"/);
        expect(zero).not.toBeNull();
        expect(markup.indexOf(zero![0])).toBeGreaterThan(markup.lastIndexOf('data-role="metric-edge"'));
        const labels = [...markup.matchAll(/data-role="metric-marker" data-point-ids="([^"]+)"><circle[^>]*><\/circle><text x="([\d.]+)" y="([\d.]+)" text-anchor="([^"]+)"[^>]*paint-order="stroke"/g)];
        expect(labels).toHaveLength(6);
        for (const label of labels) {
            const width = label[1]!.length * 8, lx = Number(label[2]), ly = Number(label[3]);
            const left = lx - (label[4] === 'end' ? width : label[4] === 'middle' ? width / 2 : 0), right = left + width;
            for (const [x1, y1, x2, y2] of edges) {
                // Independent sampling includes all screen edge interiors; no ID box is crossed.
                for (let k = 0; k <= 100; k++) {
                    const px = x1! + (x2! - x1!) * k / 100, py = y1! + (y2! - y1!) * k / 100;
                    expect(px > left && px < right && py > ly - 15 && py < ly + 3).toBe(false);
                }
            }
        }
    });
    it('keeps dense unequal-scale fractional tick labels separate with a stable above-right origin', () => {
        const axes = {x: makeCoordinateAxis({numerator: 1, denominator: 4}, -5, 5, 'fraction'), y: makeCoordinateAxis({numerator: 1, denominator: 2}, -5, 5, 'fraction')};
        const markup = renderToStaticMarkup(<CoordinateMetricPlane axes={axes} points={[]} edges={[]} solutionGeometry={false} highlightedEdge={null} seed={18} />);
        const labels = [...markup.matchAll(/<text x="([\d.]+)" y="([\d.]+)" text-anchor="([^"]+)"[^>]*data-role="metric-x-tick">([^<]+)<\/text>/g)];
        expect(labels).toHaveLength(11);
        const boxes = labels.map(label => {const x = Number(label[1]), y = Number(label[2]), width = label[4]!.length * 7.5; return [label[3] === 'start' ? x : x - width / 2, y - 16, label[3] === 'start' ? x + width : x + width / 2, y + 4];});
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i]!, b = boxes[j]!;
            expect(a[0]! < b[2]! && a[2]! > b[0]! && a[1]! < b[3]! && a[3]! > b[1]!).toBe(false);
        }
        const axisX = Number(markup.match(/<line x1="([\d.]+)"[^>]*data-role="metric-y-axis"/)![1]);
        expect(labels[5]![3]).toBe('start');
        expect(Number(labels[5]![1])).toBe(axisX + 10);
    });
    it('keeps staggered x labels clear of y labels for unequal canonical steps and extents', () => {
        const frames = [
            {x: makeCoordinateAxis({numerator: 1, denominator: 1}, -2, 2, 'integer'), y: makeCoordinateAxis({numerator: 2, denominator: 1}, -5, 5, 'integer')},
            {x: makeCoordinateAxis({numerator: 1, denominator: 4}, -5, 5, 'fraction'), y: makeCoordinateAxis({numerator: 1, denominator: 2}, -5, 5, 'fraction')},
        ];
        for (const axes of frames) {
            const markup = renderToStaticMarkup(<CoordinateMetricPlane axes={axes} points={[]} edges={[]} solutionGeometry={false} highlightedEdge={null} seed={18} />);
            const boxes = [...markup.matchAll(/<text x="([\d.]+)" y="([\d.]+)" text-anchor="([^"]+)"[^>]*data-role="metric-([xy])-tick">([^<]+)<\/text>/g)].map(label => {
                const x = Number(label[1]), y = Number(label[2]), width = label[5]!.length * 7.5;
                const left = x - (label[3] === 'end' ? width : label[3] === 'middle' ? width / 2 : 0);
                return {axis: label[4], left, right: left + width, top: y - 16, bottom: y + 4};
            });
            expect(boxes).toHaveLength(axes.x.ticks.length + axes.y.ticks.length - 1);
            for (const a of boxes.filter(box => box.axis === 'x')) for (const b of boxes.filter(box => box.axis === 'y')) {
                expect(a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top).toBe(false);
            }
            expect(text(markup)).toContain('x step:');
            expect(text(markup)).toContain('y step:');
        }
    });
    it('keeps questions neutral and computed solutions green without fallback square/arrow glyphs', () => {
        for (const render of [distance, route, construct, side]) for (const story of [false, true]) {
            expect(render(false, story)).not.toMatch(/emerald|#047857|[□→←]/);
            expect(render(true, story)).toContain('text-emerald-900');
        }
        expect(construct(true)).toContain('#047857');
        expect(route(true)).toContain('#047857');
    });
});

let cores: readonly ComponentType<{config: object; payload: unknown}>[];
let specs: {generalLabels: readonly string[]}[];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const modules = await Promise.all([import('./coordinate-axis-distance/view.tsx'), import('./coordinate-axis-distance-story/view.tsx'), import('./coordinate-problem-plotting/view.tsx'), import('./coordinate-problem-story/view.tsx'),
        import('./coordinate-polygon-construction/view.tsx'), import('./coordinate-polygon-construction-story/view.tsx'), import('./coordinate-polygon-side-length/view.tsx'), import('./coordinate-polygon-side-length-story/view.tsx')]);
    cores = [modules[0].CoordinateAxisDistanceCore, modules[1].CoordinateAxisDistanceStoryCore, modules[2].CoordinateProblemPlottingCore, modules[3].CoordinateProblemStoryCore,
        modules[4].CoordinatePolygonConstructionCore, modules[5].CoordinatePolygonConstructionStoryCore, modules[6].CoordinatePolygonSideLengthCore, modules[7].CoordinatePolygonSideLengthStoryCore] as unknown as typeof cores;
    const definitions = await Promise.all([import('./coordinate-axis-distance/spec.ts'), import('./coordinate-axis-distance-story/spec.ts'), import('./coordinate-problem-plotting/spec.ts'), import('./coordinate-problem-story/spec.ts'),
        import('./coordinate-polygon-construction/spec.ts'), import('./coordinate-polygon-construction-story/spec.ts'), import('./coordinate-polygon-side-length/spec.ts'), import('./coordinate-polygon-side-length-story/spec.ts')]);
    specs = definitions.map(module => module.spec) as typeof specs;
    for (const definition of definitions) expect(Object.entries(definition).find(([name]) => name.endsWith('ViewSchema'))![1]).toEqual({});
});
afterAll(() => vi.unstubAllGlobals());
describe('eight metric-coordinate leaf boundaries', () => {
    const leaf = (index: number, data: unknown, solution: boolean) => renderToStaticMarkup(createElement(cores[index]!, {config: {}, payload: {problem: {type: 'arithmetic', data, labels: []}, targetLabels: [], seed: 19, isSolutionView: solution}}));
    it('renders the full uniform model in every math/story sibling including no/partial/full selected equations', () => {
        for (const solution of [false, true]) {
            for (const index of [0, 1]) expect(leaf(index, metricDistanceOracle, solution)).not.toMatch(/NaN|undefined|null/);
            for (const index of [2, 3]) expect(leaf(index, metricRouteOracle, solution)).not.toMatch(/NaN|undefined|null/);
            for (const index of [4, 5, 6, 7]) for (const data of [metricSquareOracle, metricConcaveDiagonalOracle, metricDownwardSideOracle]) expect(leaf(index, data, solution)).not.toMatch(/NaN|undefined|null/);
        }
    });
    it('throws ViewValidationError before either mode renders malformed geometry or sparse proof arrays', () => {
        for (const solution of [false, true]) for (let index = 0; index < 8; index++) {
            expect(() => leaf(index, undefined, solution)).toThrow('Validation Error');
            const bad = index < 2 ? {...metricDistanceOracle, absoluteDifference: {}} : index < 4 ? {...metricRouteOracle, legs: new Array(2)} : {...metricSquareOracle, sideDistanceEquations: new Array(1)};
            expect(() => leaf(index, bad, solution)).toThrow('Validation Error');
        }
    });
    it('retains exact reviewed ownership with stronger story leaves and no incidental ordered-pair or area claim', () => {
        expect(specs[0]!.generalLabels).toEqual([Scope.CartesianCoordinateSystem, Ability.ProcedureExecution]);
        expect(specs[2]!.generalLabels).toContain(Area.PointPlotting);
        expect(specs[4]!.generalLabels).toContain(Area.ShapePlotting);
        for (let index = 0; index < specs.length; index++) {
            expect(specs[index]!.generalLabels.includes(Ability.TextualReception)).toBe(index % 2 === 1);
            expect(specs[index]!.generalLabels).not.toContain(Area.OrderedCoordinatePair);
            expect(specs[index]!.generalLabels).not.toContain(Area.AreaCalculation);
        }
    });
});
