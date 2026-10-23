import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area} from 'edugraph-ts';
import {buildPolygonAreaDissectionProblem as build, isPolygonAreaDissectionProblem as valid} from '../../../generators/shape/polygon-area-helpers.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {PolygonAreaDissectionProblem as Problem} from '../../../types/problems.ts';
import {areaBlueprint, areaDoublingBlueprint, areaFixture, areaStarBlueprint, areaValue as q, areaWedgeBlueprint, areaWideBlueprint, type AreaFixture} from './polygon-area-fixtures.ts';
import {PolygonAreaBody, type PolygonAreaTask} from './polygon-area-view.tsx';
import {spec as compositionSpec, PolygonAreaCompositionViewSchema} from './polygon-area-composition/spec.ts';
import {spec as compositionStorySpec, PolygonAreaCompositionStoryViewSchema} from './polygon-area-composition-story/spec.ts';
import {spec as decompositionSpec, PolygonAreaDecompositionViewSchema} from './polygon-area-decomposition/spec.ts';
import {spec as decompositionStorySpec, PolygonAreaDecompositionStoryViewSchema} from './polygon-area-decomposition-story/spec.ts';

const text = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replaceAll('&#x27;', "'").replace(/\s+/g, ' ').trim();
const render = (data: Problem, task: PolygonAreaTask, story: boolean, solution: boolean, seed = 3) => renderToStaticMarkup(<PolygonAreaBody data={data} task={task} story={story} isSolutionView={solution} seed={seed} />);
const kinds: AreaFixture[] = ['right', 'acute', 'obtuse', 'parallelogram', 'rhombus', 'trapezoid', 'kite', 'polygon', 'concave'];
const expected = [q(6), q(12), q(3), q(8), q(12), q(27, 2), q(8), q(35, 2), q(23)];
const data = kinds.map(areaFixture);
const doubled = build(areaDoublingBlueprint());
const labelBoxes = (svg: string) => [...svg.matchAll(/<text[^>]*data-role="polygon-area-(cell|point)-label"[^>]*data-label-box="([^"]+)"[^>]*>([^<]*)<\/text>/g)].map(match => ({kind: match[1], rect: match[2].split(',').map(Number), text: match[3]}));
const boxesOverlap = (a: number[], b: number[]) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
function assertClearLabels(svg: string) {
    const labels = labelBoxes(svg);
    for (let first = 0; first < labels.length; first++) for (let second = first + 1; second < labels.length; second++) expect(boxesOverlap(labels[first].rect, labels[second].rect), `${labels[first].text} / ${labels[second].text}`).toBe(false);
    const markers = [...svg.matchAll(/<circle[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"[^>]*data-role="polygon-area-point-marker"/g)].map(match => [Number(match[1]) - 4, Number(match[2]) - 4, Number(match[1]) + 4, Number(match[2]) + 4]);
    for (const label of labels) for (const marker of markers) expect(boxesOverlap(label.rect, marker), `${label.text} covers a point marker`).toBe(false);
}

describe('literal polygon area projections', () => {
    it('matches independent areas for all eight shape families and a non-star concave polygon', () => {
        data.forEach((problem, index) => {expect(valid(problem)).toBe(true); expect(problem.source.area).toEqual(expected[index]);});
        expect(doubled.source.area).toEqual(q(6));
        expect(doubled.assembly.areaSum.total).toEqual(q(12));
        expect(doubled.assembly.sourceAreaNormalization.operands).toEqual([q(12), q(2)]);
    });
    it('keeps the original polygon and copies visible without solving composition Q', () => {
        const question = render(doubled, 'composition', false, false);
        expect(text(question)).toContain('2 copies of the original region');
        expect(question).toContain('polygon-area-tray');
        expect(question).toContain('Target outline');
        expect(question).toContain('polygon-area-right-mark');
        expect(question).not.toMatch(/polygon-area-cut|polygon-area-cell|polygon-area-answer|polygon-area-assembly-work|emerald|12 ÷ 2/);
        expect((question.match(/data-role="polygon-area-boundary"/g) ?? []).length).toBe(6);
    });
    it('shows actual rigid placements and target normalization in green rather than answering the copied area', () => {
        const solution = render(doubled, 'composition', false, true);
        expect(solution).not.toContain('polygon-area-tray');
        expect((solution.match(/data-role="polygon-area-cell"/g) ?? []).length).toBe(4);
        expect(text(solution)).toContain('4 × 3 = 12');
        expect(text(solution)).toContain('12 ÷ 2 = 6');
        expect(text(solution)).toContain('Area of the original region: 6 square meters');
        expect(solution).toContain('text-emerald-900');
    });
    it('withholds cuts and computed measurements in decomposition Q, then shows complete cuts and base-height work', () => {
        const question = render(data[1]!, 'decomposition', false, false), solution = render(data[1]!, 'decomposition', false, true);
        expect(question).not.toMatch(/polygon-area-cut|polygon-area-cell|polygon-area-altitude|polygon-area-triangle-work|polygon-area-answer|emerald/);
        expect((solution.match(/data-role="polygon-area-cut"/g) ?? []).length).toBe(data[1]!.source.cuts.length);
        expect(text(solution)).toContain('3 × 4 = 12');
        expect(text(solution)).toContain('12 ÷ 2 = 6');
        expect(text(solution)).toContain('6 + 6 = 12');
        expect(solution).toContain('polygon-area-altitude');
    });
    it('keeps every numerical story premise in necessary prose and diagrams code/point-only', () => {
        for (const task of ['composition', 'decomposition'] as const) {
            const markup = render(doubled, task, true, false), prose = markup.match(/data-role="polygon-area-story"[\s\S]*?<\/div>/)![0];
            expect(text(prose)).toContain('garden bed');
            expect(text(prose)).toContain('Its length is 2 meters');
            for (const svg of markup.match(/<svg[\s\S]*?<\/svg>/g) ?? []) {
                const labels = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(match => match[1]);
                expect(labels.every(label => /^[A-Z]\d*$/.test(label))).toBe(true);
            }
            expect(markup).not.toMatch(/polygon-area-length-work|polygon-area-source-sum|polygon-area-target-sum/);
        }
    });
    it('makes arbitrary source ratio dependencies given without printing their derived numeric values', () => {
        const original = areaBlueprint('acute');
        const points = original.source.points.map(point => point.id === 'B' ? {...point, x: q(14)} : point.id === 'H' || point.id === 'C' ? {...point, x: q(7), ...(point.id === 'C' ? {y: q(3)} : {})} : point);
        const measures = original.measures.map(measure => measure.measureId.startsWith('base') ? {...measure, kind: 'measured-length' as const, value: q(7), notation: {kind: 'integer' as const, numeral: '7'}} : {measureId: measure.measureId, segment: measure.segment, kind: 'scaled-length' as const, sourceMeasureId: 'base-0', factor: q(3, 7)});
        const problem = build({...original, source: {...original.source, points: [points[0]!, ...points.slice(1)]}, measures: [measures[0]!, ...measures.slice(1)]});
        for (const task of ['composition', 'decomposition'] as const) {
            const plain = text(render(problem, task, false, false)), story = text(render(problem, task, true, false));
            expect(plain).toContain('D2 = (3/7) × D1');
            expect(story).toContain('Its length is 3/7 times D1');
            expect(story).not.toContain('Its length is 3 meters');
            expect(plain).not.toContain('D2 = 3');
            expect(render(problem, task, false, true)).toContain('polygon-area-length-work');
        }
    });
    it('preserves irrational-edge shape evidence through supplied equality/parallel markers, without fake side lengths', () => {
        const rhombus = render(data[4]!, 'decomposition', false, false), kite = render(data[6]!, 'composition', false, false);
        expect((rhombus.match(/polygon-area-equal-mark/g) ?? []).length).toBe(4);
        expect(rhombus).toContain('polygon-area-parallel-mark');
        expect((kite.match(/polygon-area-equal-mark/g) ?? []).length).toBe(6);
        expect(text(rhombus + kite)).not.toMatch(/sqrt|√|3\.605|2\.236/);
    });
    it('preserves supplied fraction/decimal spellings, alternate valid sum order and all three story contexts', () => {
        const input = areaBlueprint('right');
        const measures = input.measures.map(measure => measure.measureId === 'base-0' ? {...measure, notation: {kind: 'fraction' as const, numerator: 4, denominator: 2}} : measure.measureId === 'height-0' ? {...measure, notation: {kind: 'decimal' as const, coefficient: 300, scale: 2, numeral: '3.00'}} : measure);
        const retained = build({...input, measures: [measures[0]!, ...measures.slice(1)]});
        for (const context of ['garden-bed', 'floor-region', 'fabric-panel'] as const) for (const mode of [false, true]) {
            const markup = render({...retained, context: {...retained.context, kind: context}}, 'decomposition', true, mode);
            expect(text(markup)).toContain('4/2'); expect(text(markup)).toContain('3.00');
        }
    });
    it('accepts both assembly branches for every runtime task, including oblique/concave geometry and external feet', () => {
        for (const problem of [...data, doubled]) for (const task of ['composition', 'decomposition'] as const) for (const story of [false, true]) for (const solution of [false, true]) {
            expect(render(problem, task, story, solution)).not.toMatch(/NaN|undefined|\bnull\b|□|→/);
        }
        expect(text(render(data[0]!, 'decomposition', false, true))).toContain('extended base line');
        expect(text(render(data[8]!, 'composition', false, false))).not.toContain('make a rectangle');
    });
    it('keeps isotropic common scale for detached pieces and target and deterministic seeded tray order', () => {
        const first = render(doubled, 'composition', false, false, 1), second = render(doubled, 'composition', false, false, 2);
        const scales = [...first.matchAll(/data-pixels-per-unit="([^"]+)"/g)].map(match => Number(match[1]));
        expect(new Set(scales.slice(1)).size).toBe(1);
        expect(first).toBe(render(doubled, 'composition', false, false, 1));
        expect(first).not.toBe(second);
        const svg = first.match(/<svg[\s\S]*?<\/svg>/)![0], polygon = svg.match(/data-role="polygon-area-boundary"/)![0];
        expect(polygon).toBeTruthy();
    });
    it('preserves supplied alternate sum order instead of rebuilding the source arithmetic', () => {
        const original = data[3]!, ids = original.source.cells.map(cell => cell.cellId);
        const problem: Problem = {...original, source: {...original.source, areaSum: {pieceIds: [ids[2]!, ids[1]!, ids[0]!], additions: [
            {kind: 'binary', operation: 'addition', operands: [q(4), q(3)], result: q(7)},
            {kind: 'binary', operation: 'addition', operands: [q(7), q(1)], result: q(8)}
        ], total: q(8)}}};
        expect(valid(problem)).toBe(true);
        const solution = text(render(problem, 'decomposition', false, true));
        expect(solution).toContain('T3 + T2 + T1');
        expect(solution).toContain('4 + 3 = 7');
        expect(solution).toContain('7 + 1 = 8');
    });
    it('renders a rational rotation with exact metric lengths and right-angle geometry', () => {
        const input = areaBlueprint('right');
        const fifth = (numerator: number) => numerator % 5 === 0 ? q(numerator / 5) : q(numerator, 5);
        const points = input.source.points.map(point => ({...point, x: fifth(3 * point.x.numerator - 4 * point.y.numerator), y: fifth(4 * point.x.numerator + 3 * point.y.numerator)}));
        const problem = build({...input, source: {...input.source, points: [points[0]!, ...points.slice(1)]}});
        expect(valid(problem)).toBe(true); expect(problem.source.area).toEqual(q(6));
        for (const solution of [false, true]) {
            const markup = render(problem, 'decomposition', false, solution), svg = markup.match(/<svg[\s\S]*?<\/svg>/)![0];
            const scale = Number(svg.match(/data-pixels-per-unit="([^"]+)"/)![1]);
            const coords = svg.match(/<polygon points="([^"]+)"[^>]*data-role="polygon-area-boundary"/)![1].split(' ').map(pair => pair.split(',').map(Number));
            const [a, b, c] = coords;
            expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeCloseTo(4 * scale, 8);
            expect(Math.hypot(c[0] - a[0], c[1] - a[1])).toBeCloseTo(3 * scale, 8);
            expect((b[0] - a[0]) * (c[0] - a[0]) + (b[1] - a[1]) * (c[1] - a[1])).toBeCloseTo(0, 8);
        }
    });
    it('marks each edge once using consistent classes across the complete U parallel-pair graph', () => {
        const markup = render(data[8]!, 'decomposition', false, false), svg = markup.match(/<svg[\s\S]*?<\/svg>/)![0];
        const groups = [...svg.matchAll(/<g[^>]*data-role="polygon-area-parallel-mark"[^>]*data-parallel-edge-index="(\d+)"[^>]*data-parallel-class="(\d+)"[^>]*>([\s\S]*?)<\/g>/g)].map(match => ({edge: Number(match[1]), group: Number(match[2]), chevrons: (match[3].match(/<polyline/g) ?? []).length}));
        expect(groups).toHaveLength(7);
        expect(new Set(groups.map(group => group.edge)).size).toBe(7);
        for (const edges of [[0, 2, 4], [1, 3, 5, 7]]) {
            const members = groups.filter(group => edges.includes(group.edge));
            expect(members).toHaveLength(edges.length);
            expect(new Set(members.map(member => member.group)).size).toBe(1);
            expect(new Set(members.map(member => member.chevrons)).size).toBe(1);
        }
        expect(new Set(groups.map(group => group.group)).size).toBe(2);
        expect(groups.every(group => group.chevrons === group.group + 1)).toBe(true);
    });
    it('separates every star cell/point label and preserves a visible central marker in both plain/story projections', () => {
        const star = build(areaStarBlueprint());
        expect(star.source.area).toEqual(q(64));
        for (const story of [false, true]) for (const seed of [0, 5]) {
            const solution = render(star, 'decomposition', story, true, seed), svg = solution.match(/<svg[\s\S]*?<\/svg>/)![0];
            const labels = labelBoxes(svg);
            expect(labels.filter(label => label.kind === 'cell')).toHaveLength(8);
            expect(labels.filter(label => label.kind === 'point')).toHaveLength(13);
            expect(labels.filter(label => label.kind === 'point' && label.text === 'I')).toHaveLength(1);
            expect(Number(svg.match(/viewBox="[^"]* ([\d.]+)"/)![1])).toBeGreaterThanOrEqual(500);
            assertClearLabels(svg);
            const question = render(star, 'decomposition', story, false, seed);
            expect(question).not.toMatch(/polygon-area-cell-label|polygon-area-cell-leader|polygon-area-cut|emerald/);
            assertClearLabels(question.match(/<svg[\s\S]*?<\/svg>/)![0]);
        }
    });
    it('uses an unambiguous external leader for the narrow assembly cell without touching point labels or its text', () => {
        const wedge = build(areaWedgeBlueprint());
        expect(wedge.source.area).toEqual(q(8));
        for (const story of [false, true]) {
            const markup = render(wedge, 'composition', story, true), svg = markup.match(/<svg[\s\S]*?<\/svg>/g)![1];
            expect(labelBoxes(svg).filter(label => label.kind === 'cell').map(label => label.text)).toEqual(['T1.1', 'T2.1', 'T3.1']);
            expect(svg).toContain('polygon-area-cell-leader');
            assertClearLabels(svg);
            const cellBoxes = labelBoxes(svg).filter(label => label.kind === 'cell');
            for (const match of svg.matchAll(/<line[^>]*x2="([^"]+)"[^>]*y2="([^"]+)"[^>]*data-role="polygon-area-cell-leader"/g)) {
                const end = [Number(match[1]), Number(match[2])];
                expect(cellBoxes.every(label => end[0] < label.rect[0] || end[0] > label.rect[2] || end[1] < label.rect[1] || end[1] > label.rect[3])).toBe(true);
            }
            expect(text(markup)).toContain('Area of the original region: 8 square meters');
        }
    });
});

let cores: Array<(data: unknown, solution: boolean) => string>;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const modules = await Promise.all([import('./polygon-area-composition/view.tsx'), import('./polygon-area-composition-story/view.tsx'), import('./polygon-area-decomposition/view.tsx'), import('./polygon-area-decomposition-story/view.tsx')]);
    const components = [modules[0].PolygonAreaCompositionCore, modules[1].PolygonAreaCompositionStoryCore, modules[2].PolygonAreaDecompositionCore, modules[3].PolygonAreaDecompositionStoryCore];
    cores = components.map(Core => (problem, solution) => renderToStaticMarkup(<Core config={{}} payload={{problem: {type: 'geometry', data: problem, labels: []}, seed: 3, isSolutionView: solution} as unknown as ViewRenderPayload<'polygon-area-composition'>} />));
});
afterAll(() => vi.unstubAllGlobals());

describe('complete leaf boundaries', () => {
    it('all four strict cores accept the entire typed family in Q and S', () => {
        for (const core of cores) for (const problem of [...data, doubled]) for (const solution of [false, true]) expect(core(problem, solution)).toContain('original');
    });
    it('accepts the exact wide six-vertex rectangle without demanding an unstored unsafe base square', () => {
        const problem = build(areaWideBlueprint());
        expect(valid(problem)).toBe(true);
        expect(problem.source.area).toEqual(q(100_000_000));
        expect(problem.source.cells.map(cell => cell.area)).toEqual([q(50_000_000), q(50_000_000)]);
        expect(problem.source.shapeFacts.sides.every(side => Number.isSafeInteger(side.squaredLength.numerator))).toBe(true);
        expect(Math.max(...problem.source.shapeFacts.sides.map(side => side.squaredLength.numerator))).toBe(2_500_000_000_000_000);
        for (const core of cores) for (const solution of [false, true]) {
            const markup = core(problem, solution);
            expect(markup).not.toMatch(/NaN|undefined|Infinity/);
            expect(text(markup)).toContain('100000000');
            for (const match of markup.matchAll(/viewBox="([^"]+)"/g)) expect(match[1].split(' ').map(Number).slice(2).every(value => Number.isFinite(value) && value > 0)).toBe(true);
            for (const match of markup.matchAll(/data-pixels-per-unit="([^"]+)"/g)) expect(Number.isFinite(Number(match[1])) && Number(match[1]) > 0).toBe(true);
            expect(markup.includes('polygon-area-answer')).toBe(solution);
            if (solution) expect(text(markup)).toContain('Area of the original region: 100000000 square meters');
            else expect(markup).not.toContain('emerald');
        }
    });
    it('rejects malformed, sparse, cyclic, forged-area and nonisometric members with ViewValidationError', () => {
        const original = data[0]!, cyclic: Record<string, unknown> = {}; cyclic.source = cyclic;
        const invalid = [undefined, {}, cyclic, {...original, source: undefined}, {...original, points: new Array(4)}, {...original, context: {...original.context, dimensions: new Array(2)}}, {...original, source: {...original.source, area: q(99)}}, {...original, assembly: {...original.assembly, placements: new Array(2)}}];
        for (const core of cores) for (const problem of invalid) expect(() => core(problem, false)).toThrow('Validation Error');
    });
    it('uses invariant fixed abilities and genuine area/method/story participation', () => {
        const specs = [compositionSpec, compositionStorySpec, decompositionSpec, decompositionStorySpec];
        expect([PolygonAreaCompositionViewSchema, PolygonAreaCompositionStoryViewSchema, PolygonAreaDecompositionViewSchema, PolygonAreaDecompositionStoryViewSchema]).toEqual([{}, {}, {}, {}]);
        specs.forEach((spec, index) => {
            const method = index < 2 ? Area.ShapeSynthesis : Area.ShapeDecomposition;
            expect(spec.generalLabels).toEqual([Ability.ProcedureExecution, index < 2 ? Ability.SpatialGeneration : Ability.VisualDecomposition, ...(index % 2 ? [Ability.TextualReception] : [])]);
            const supports = (labels: readonly string[]) => spec.compatibility!.every(rule => rule.predicate({has: (_scope, label) => labels.includes(label), exact: (_scope, label) => labels.includes(label)}));
            expect(supports([Area.AreaCalculation, method, ...(index % 2 ? [Ability.TextualReception] : [])])).toBe(true);
            expect(supports([method, Ability.TextualReception])).toBe(false);
            expect(supports([Area.AreaCalculation, index < 2 ? Area.ShapeDecomposition : Area.ShapeSynthesis, Ability.TextualReception])).toBe(false);
            if (index % 2) expect(supports([Area.AreaCalculation, method])).toBe(false);
        });
    });
});
