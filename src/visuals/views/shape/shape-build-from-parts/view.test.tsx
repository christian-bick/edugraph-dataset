import {renderToStaticMarkup} from 'react-dom/server';
import {Area} from 'edugraph-ts';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {ShapeEdgeCompositionGenerator} from '../../../../generators/shape/shape-edge-composition/generator.ts';
import {ShapeEdgeCompositionGeneratorSchema, spec as generatorSpec} from '../../../../generators/shape/shape-edge-composition/spec.ts';
import {planModelCompatibility} from '../../../../lib/model-compatibility.ts';
import {resolvePlannedConfigurations} from '../../../../lib/planned-generation.ts';
import {ShapeBuildFromPartsViewSchema, spec as viewSpec} from './spec.ts';

let ShapeBuildFromParts: typeof import('./view.tsx')['ShapeBuildFromParts'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({ShapeBuildFromParts} = await import('./view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

const shapeLabels = {triangle: Area.Triangle, square: Area.Square, rectangle: Area.Rectangle, hexagon: Area.Hexagon};
const prepareShape = (shape: keyof typeof shapeLabels) => {
    const target = {id: 'shape-construction-fixture', labels: [shapeLabels[shape]]};
    const planned = planModelCompatibility(target,
        {...generatorSpec, schema: ShapeEdgeCompositionGeneratorSchema, spec: generatorSpec},
        {...viewSpec, schema: ShapeBuildFromPartsViewSchema, spec: viewSpec});
    if (!planned.supported) throw new Error(`Shape fixture is unsupported: ${planned.reason}`);
    const prepared = resolvePlannedConfigurations({
        generatorSchema: ShapeEdgeCompositionGeneratorSchema, viewSchema: ShapeBuildFromPartsViewSchema,
        plan: planned.plan, sampleKey: `${target.id}#shape-edge-composition#shape-build-from-parts#train#question#inst:0`,
        attempt: 1, seed: 42
    });
    expect(prepared.generatorConfig).toEqual({shape});
    return {target, prepared};
};
const payloadFor = (data: ReturnType<ShapeEdgeCompositionGenerator['generate']>['data'],
    isSolutionView: boolean, fixture: ReturnType<typeof prepareShape>) => ({
    problem: {type: 'shape' as const, data, labels: fixture.prepared.generatorLabels},
    targetLabels: fixture.target.labels, viewId: 'shape-build-from-parts' as const, seed: 42, isSolutionView,
    preparedView: fixture.prepared.view
});

describe('loose-part construction', () => {
    it.each(['triangle', 'square', 'rectangle', 'hexagon'] as const)('constructs %s only in Solution Mode', shape => {
        const fixture = prepareShape(shape);
        const {data} = new ShapeEdgeCompositionGenerator().generate({shape});
        const question = renderToStaticMarkup(<ShapeBuildFromParts payload={payloadFor(data, false, fixture)} />);
        const solution = renderToStaticMarkup(<ShapeBuildFromParts payload={payloadFor(data, true, fixture)} />);
        expect(question).toContain(`Use the loose sticks and corners to build a ${shape}.`);
        expect(question).toContain('Unassembled construction materials');
        expect(question).not.toContain('<polygon');
        expect(solution).toContain(`built from ${data.sides} sticks and ${data.corners} corners`);
        expect(solution).toContain('<polygon');
        expect(solution).not.toContain('Unassembled construction materials');
        expect(renderToStaticMarkup(<ShapeBuildFromParts payload={payloadFor(data, false, fixture)} />)).toBe(question);
    });

    it.each([
        {target: 'triangle', sides: 4, corners: 3},
        {target: 'hexagon', sides: 6, corners: 4},
        {target: 'circle', sides: 0, corners: 0},
        {target: 'triangle', corners: 3}
    ])('rejects incomplete or inconsistent composition evidence: %j', data => {
        const fixture = prepareShape('triangle');
        expect(() => renderToStaticMarkup(<ShapeBuildFromParts payload={payloadFor(data as never, false, fixture)} />))
            .toThrow(/Expected coherent edge and vertex counts|Required field "sides" is missing/);
    });
});
