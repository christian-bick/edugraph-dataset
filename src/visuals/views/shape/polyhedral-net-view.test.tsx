import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {buildPolyhedralNetProblem as build, isPolyhedralNetProblem as valid} from '../../../generators/shape/polyhedral-net-helpers.ts';
import {makePolyhedralNetCatalogInput} from '../../../generators/shape/polyhedral-net-catalog.ts';
import type {CompatibilityQueries} from '../../../types/compatibility.ts';
import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {NetScalar, PolyhedralNetProblem as Problem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {literalCubeInput, literalExternalFootPyramidInput, literalSkinnyBoxInput, literalTetrahedronInput} from './polyhedral-net-fixtures.ts';
import {netValue} from './polyhedral-net-format.tsx';
import {netConstructionEvidence, netSurfaceAreaEvidence} from './polyhedral-net-view-policy.ts';
import {NetPlanarDiagram, NetSolidDiagram} from './polyhedral-net-diagram.tsx';
import {spec as constructionSpec, SolidNetConstructionViewSchema} from './solid-net-construction/spec.ts';
import {spec as storyConstructionSpec, SolidNetConstructionStoryViewSchema} from './solid-net-construction-story/spec.ts';
import {spec as areaSpec, NetSurfaceAreaViewSchema} from './net-surface-area/spec.ts';
import {spec as storyAreaSpec, NetSurfaceAreaStoryViewSchema} from './net-surface-area-story/spec.ts';

type ViewId = 'solid-net-construction' | 'solid-net-construction-story' | 'net-surface-area' | 'net-surface-area-story';
type Core = (props: {config: {}; payload: ViewRenderPayload<ViewId>}) => React.ReactNode;
const ids: readonly ViewId[] = ['solid-net-construction', 'solid-net-construction-story', 'net-surface-area', 'net-surface-area-story'];
const cores = new Map<ViewId, Core>();
beforeAll(async () => {
    vi.stubGlobal('window', {});
    const modules = await Promise.all([import('./solid-net-construction/view.tsx'), import('./solid-net-construction-story/view.tsx'), import('./net-surface-area/view.tsx'), import('./net-surface-area-story/view.tsx')]);
    const values = [modules[0].SolidNetConstructionCore, modules[1].SolidNetConstructionStoryCore, modules[2].NetSurfaceAreaCore, modules[3].NetSurfaceAreaStoryCore];
    ids.forEach((id, index) => cores.set(id, values[index] as Core));
});
afterAll(() => vi.unstubAllGlobals());
const render = (id: ViewId, data: Problem, solution: boolean, seed = 7): string => {
    const Component = cores.get(id)!;
    return renderToStaticMarkup(<Component config={{}} payload={{viewId: id, problem: {type: 'shape', data, labels: []}, targetLabels: [], isSolutionView: solution, seed}} />);
};
const text = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const q = (numerator: number, denominator = 1): NetScalar => ({numerator, denominator});
const svgBlocks = (markup: string): string[] => markup.match(/<svg[\s\S]*?<\/svg>/g) ?? [];
function clearTextBoxes(markup: string) {
    for (const svg of svgBlocks(markup)) {
        const boxes = [...svg.matchAll(/data-label-box="([^"]+)"/g)].map(match => match[1].split(',').map(Number));
        for (const box of boxes) expect(box.every(Number.isFinite)).toBe(true);
        for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) expect(boxes[a][0] < boxes[b][2] && boxes[a][2] > boxes[b][0] && boxes[a][1] < boxes[b][3] && boxes[a][3] > boxes[b][1]).toBe(false);
    }
}

describe('polyhedral net fixed projections', () => {
    it('matches independent cube, rational tetrahedron and external-foot pyramid oracles', () => {
        const cube = build(literalCubeInput), tetra = build(literalTetrahedronInput), pyramid = build(literalExternalFootPyramidInput);
        expect(cube.surfaceArea).toEqual(q(6)); expect(tetra.surfaceArea).toEqual(q(16)); expect(pyramid.surfaceArea).toEqual(q(140));
        const face = tetra.net.faces.find(value => value.faceId === 'BCD')!;
        expect(face.measure).toMatchObject({kind: 'triangle', base: q(5), height: q(13, 5), baseOffset: q(9, 5), area: q(13, 2)});
        expect(pyramid.net.faces.find(value => value.faceId === 'AB')!.measure).toMatchObject({baseOffset: q(-5), height: q(12)});
        expect(pyramid.net.faces.find(value => value.faceId === 'CD')!.measure).toMatchObject({baseOffset: q(9), height: q(13)});
        [cube, tetra, pyramid].forEach(value => expect(valid(value)).toBe(true));
    });
    it('gives a solid and independent congruent faces without the chosen net or fold tree', () => {
        const data = build(literalTetrahedronInput), question = render(ids[0], data, false);
        expect(question).toContain('net-given-solid'); expect(question).toContain('net-source-adjacency');
        expect((question.match(/data-role="net-detached-face"/g) ?? []).length).toBe(4);
        expect(question).toContain('net-construction-blank');
        expect(text(question)).toContain('O4 = 9/5 m');
        expect(question).not.toMatch(/net-planar-diagram|net-hinge|net-area-work|net-area-answer|net-construction-answer|emerald|#047857/);
    });
    it('constructs the actual complete supplied net in green, retaining the solid and correspondence', () => {
        const data = build(literalCubeInput), solution = render(ids[0], data, true);
        expect(solution).toContain('net-given-solid'); expect(solution).toContain('net-construction-answer');
        expect((solution.match(/data-role="net-planar-face"/g) ?? []).length).toBe(6);
        expect((solution.match(/data-role="net-hinge"/g) ?? []).length).toBe(5);
        expect(solution).toContain('#047857'); expect(solution).not.toContain('net-area-work');
    });
    it('shows all neutral faces and perpendicular heights but no face areas or result in area Q', () => {
        const data = build(literalTetrahedronInput), question = render(ids[2], data, false);
        expect((question.match(/data-role="net-planar-face"/g) ?? []).length).toBe(4);
        expect((question.match(/data-role="net-face-altitude"/g) ?? []).length).toBe(4);
        expect(question).toContain('net-area-blank');
        expect(question).not.toMatch(/net-area-work|net-area-answer|net-surface-addition|emerald|#047857/);
        expect(text(question)).not.toContain('13/2'); expect(text(question)).not.toContain('16 m²');
    });
    it('ties every base and rectangle height premise unambiguously to named edges', () => {
        const data = build(literalCubeInput), plain = text(render(ids[2], data, false)), story = text(render(ids[3], data, false));
        expect(plain).toContain('B1 (AD) = 1 cm; H1 (DC) = 1 cm');
        expect(story).toContain('The side from A to D measures 1 centimeters');
        expect(story).toContain('The perpendicular rectangle side DC measures 1 centimeters');
    });
    it('projects exact per-face work and each supplied once-only prefix, using square units', () => {
        const data = build(literalTetrahedronInput), solution = render(ids[2], data, true);
        expect(text(solution)).toContain('5 × (13/5) = 13');
        expect(text(solution)).toContain('Surface area = 16 m²');
        expect((solution.match(/data-role="net-surface-addition"/g) ?? []).length).toBe(4);
        expect(solution).toContain('text-emerald-700'); expect(solution).not.toContain('m³');
    });
    it('accepts the empty additivity branch in area tasks without manufacturing prefix subtotals', () => {
        const data = build(literalCubeInput), solution = render(ids[2], data, true);
        expect(data.surfaceAdditivity).toEqual([]);
        expect(text(solution)).toContain('Surface area = 6 cm²');
        expect(solution).not.toContain('net-surface-addition');
    });
    it('keeps all numerical dimensions in necessary story prose and only codes on diagrams', () => {
        const data = build(literalTetrahedronInput);
        for (const id of [ids[1], ids[3]]) {
            const question = render(id, data, false);
            expect(question).toContain('net-story-premises'); expect(question).not.toContain('net-dimension-premises');
            expect(text(question)).toContain('The side from B to C measures 5 meters');
            expect(text(question)).toContain('Its perpendicular face height measures 13/5 meters');
            for (const svg of svgBlocks(question)) for (const match of svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)) expect(match[1]).toMatch(/^[A-Z]\d*(\/[A-Z]\d*)*$/);
        }
        expect(text(render(ids[1], data, false))).toContain('signed offset 9/5 meters');
    });
    it('accepts every solid family and both proof branches through all four fixed cores', () => {
        const shapes = ['cube', 'box', 'triangular-prism', 'triangular-pyramid', 'square-pyramid', 'rectangular-pyramid'] as const;
        const expected = ['6', '52', '36', '16', '96', '564'];
        shapes.forEach((shape, index) => {
            for (const relation of ['boundary-incidence', 'surface-additivity'] as const) {
                const data = build(makePolyhedralNetCatalogInput({shape, scale: q(1), lengthUnit: 'meters', mathematicalRelation: relation}));
                expect(netValue(data.surfaceArea)).toBe(expected[index]);
                for (const id of ids) for (const solution of [false, true]) expect(render(id, data, solution)).not.toMatch(/NaN|Infinity|undefined|\bnull\b|□|→/);
            }
        });
    });
    it('uses the provided addition order and commuted operands rather than silently rebuilding a trace', () => {
        const original = build(literalTetrahedronInput);
        const data: Problem = {...original, surfaceAdditivity: original.surfaceAdditivity.map(value => ({...value, arithmetic: {...value.arithmetic, operands: [value.arithmetic.operands[1], value.arithmetic.operands[0]]}}))};
        expect(valid(data)).toBe(true);
        const first = data.surfaceAdditivity[0].arithmetic, solution = text(render(ids[2], data, true));
        expect(solution).toContain(`${netValue(first.operands[0])} + ${netValue(first.operands[1])} = ${netValue(first.result)}`);
    });
    it('keeps all labels separated for the six-face box and rational/external-foot sheets', () => {
        for (const input of [literalCubeInput, literalTetrahedronInput, literalExternalFootPyramidInput]) {
            const data = build(input);
            for (const id of ids) for (const seed of [0, 1]) clearTextBoxes(render(id, data, true, seed));
            expect(renderToStaticMarkup(<NetPlanarDiagram data={data} solved={false} />)).toContain('data-scale=');
        }
    });
    it('keeps thin, dense face sheets finite and label-separated without narrowing physical dimensions', () => {
        const data = build(literalSkinnyBoxInput());
        expect(data.surfaceArea).toEqual(q(802));
        for (const id of ids) for (const solution of [false, true]) {
            const markup = render(id, data, solution);
            expect(markup).not.toMatch(/NaN|Infinity|undefined/); clearTextBoxes(markup);
        }
        const svg = renderToStaticMarkup(<NetPlanarDiagram data={data} solved />);
        expect(Number(svg.match(/data-scale="([^"]+)"/)![1])).toBeGreaterThan(0);
        expect(svg).toContain('net-label-leader');
    });
    it('keeps construction givens independent of the answer sheet position and orientation', () => {
        const transformed = literalTetrahedronInput.planarFaces.map(face => {
            const rotate = (value: typeof face.vertices[number]) => ({...value, point: {x: q(20 - value.point.y.numerator), y: q(value.point.x.numerator - 30)}});
            return {...face, vertices: [rotate(face.vertices[0]), rotate(face.vertices[1]), rotate(face.vertices[2]), ...face.vertices.slice(3).map(rotate)] as typeof face.vertices};
        });
        const original = build(literalTetrahedronInput), alternate = build({...literalTetrahedronInput, planarFaces: [transformed[0], ...transformed.slice(1)]});
        expect(valid(alternate)).toBe(true);
        for (const id of [ids[0], ids[1]]) expect(render(id, alternate, false)).toBe(render(id, original, false));
    });
    it('maps source hinge edges by vertex correspondence when a planar face cycle is independently rotated', () => {
        const original = build(literalCubeInput);
        const faces = original.net.faces.map(face => face.faceId !== 'front' ? face : {...face, vertices: [face.vertices[1], face.vertices[2], face.vertices[3], face.vertices[0]] as typeof face.vertices});
        const data: Problem = {...original, net: {...original.net, faces: [faces[0], ...faces.slice(1)]}};
        expect(valid(data)).toBe(true);
        const edge = data.solid.edges.find(value => value.vertexIds.includes('B') && value.vertexIds.includes('F'))!;
        const before = renderToStaticMarkup(<NetPlanarDiagram data={original} solved />), after = renderToStaticMarkup(<NetPlanarDiagram data={data} solved />);
        const hinge = (markup: string) => markup.match(new RegExp(`<line[^>]*data-role="net-hinge"[^>]*data-solid-edge-id="${edge.edgeId}"[^>]*>`))![0];
        expect(hinge(after)).toBe(hinge(before));
        const line = hinge(after);
        expect(line.match(/x1="([^"]+)"/)![1]).toBe(line.match(/x2="([^"]+)"/)![1]);
        expect(line.match(/y1="([^"]+)"/)![1]).not.toBe(line.match(/y2="([^"]+)"/)![1]);
        for (const id of ids) for (const solution of [false, true]) expect(render(id, data, solution)).not.toMatch(/NaN|undefined/);
    });
    it('preserves exact one-third faces under safe huge rational source and net translations', () => {
        const third = (numerator: number): NetScalar => numerator % 3 === 0 ? q(numerator / 3) : q(numerator, 3);
        const source = literalCubeInput.solid.vertices.map(vertex => ({...vertex, point: {x: third(vertex.point.x.numerator), y: third(vertex.point.y.numerator), z: third(vertex.point.z.numerator)}}));
        const planar = literalCubeInput.planarFaces.map(face => {
            const scale = (vertex: typeof face.vertices[number]) => ({...vertex, point: {x: third(vertex.point.x.numerator), y: third(vertex.point.y.numerator)}});
            return {...face, vertices: [scale(face.vertices[0]), scale(face.vertices[1]), scale(face.vertices[2]), ...face.vertices.slice(3).map(scale)] as typeof face.vertices};
        });
        const input = {...literalCubeInput, solid: {...literalCubeInput.solid, vertices: [source[0], ...source.slice(1)] as const}, planarFaces: [planar[0], ...planar.slice(1)] as const};
        const offset = 9007199254740987n;
        const shift = (value: NetScalar): NetScalar => third(Number(offset + BigInt(value.numerator) * (3n / BigInt(value.denominator))));
        const shiftedPlanar = planar.map(face => {
            const translate = (vertex: typeof face.vertices[number]) => ({...vertex, point: {...vertex.point, x: shift(vertex.point.x)}});
            return {...face, vertices: [translate(face.vertices[0]), translate(face.vertices[1]), translate(face.vertices[2]), ...face.vertices.slice(3).map(translate)] as typeof face.vertices};
        });
        const shiftedSource = source.map(vertex => ({...vertex, point: {...vertex.point, x: shift(vertex.point.x)}}));
        const original = build(input), netMoved = build({...input, planarFaces: [shiftedPlanar[0], ...shiftedPlanar.slice(1)]}), sourceMoved = build({...input, solid: {...input.solid, vertices: [shiftedSource[0], ...shiftedSource.slice(1)]}});
        expect(valid(netMoved)).toBe(true); expect(valid(sourceMoved)).toBe(true);
        expect(netMoved.surfaceArea).toEqual(q(2, 3)); expect(sourceMoved.surfaceArea).toEqual(q(2, 3));
        const pixels = (data: Problem) => renderToStaticMarkup(<NetPlanarDiagram data={data} solved={false} />).replace(/data-label-id="vertex-[^"]+"/g, 'data-label-id="vertex"');
        expect(pixels(netMoved)).toBe(pixels(original));
        for (const seed of [0, 1]) expect(renderToStaticMarkup(<NetSolidDiagram data={sourceMoved} seed={seed} />)).toBe(renderToStaticMarkup(<NetSolidDiagram data={original} seed={seed} />));
    });
    it('rejects missing data, sparse faces and false face/fold/area evidence through the view boundary', () => {
        const data = build(literalTetrahedronInput);
        const malformed: unknown[] = [undefined, {...data, surfaceArea: q(17)}, {...data, net: {...data.net, faces: new Array(4)}}, {...data, net: {...data.net, folds: []}}, {...data, surfaceAdditivity: new Array(4)}];
        for (const value of malformed) for (const id of ids) expect(() => render(id, value as Problem, false)).toThrow(ViewValidationError);
    });
    it('keeps one task per empty schema and only the reviewed independent view capabilities', () => {
        expect([SolidNetConstructionViewSchema, SolidNetConstructionStoryViewSchema, NetSurfaceAreaViewSchema, NetSurfaceAreaStoryViewSchema]).toEqual([{}, {}, {}, {}]);
        expect(constructionSpec.generalLabels).toEqual([Scope.GeometricNet, Ability.VisualArticulation]);
        expect(storyConstructionSpec.generalLabels).toEqual([Scope.GeometricNet, Ability.VisualArticulation, Ability.TextualReception]);
        expect(areaSpec.generalLabels).toEqual([Scope.GeometricNet, Ability.ProcedureExecution]);
        expect(storyAreaSpec.generalLabels).toEqual([Scope.GeometricNet, Ability.ProcedureExecution, Ability.TextualReception]);
    });
    it('restricts selected evidence semantically while leaving the full runtime type accepted', () => {
        const query = (surface: boolean): CompatibilityQueries => {
            const member: CompatibilityQueries['has'] = (scope, label) => scope === 'generator' && (label === Area.ShapeDecomposition || surface && label === Area.SurfaceAreaCalculation);
            return {has: member, exact: member};
        };
        expect(netConstructionEvidence.predicate(query(false))).toBe(true);
        expect(netConstructionEvidence.predicate(query(true))).toBe(false);
        expect(netSurfaceAreaEvidence.predicate(query(false))).toBe(false);
        expect(netSurfaceAreaEvidence.predicate(query(true))).toBe(true);
        expect(netConstructionEvidence.dependencies).toEqual([{scope: 'generator', label: Area.SurfaceAreaCalculation}]);
    });
});
