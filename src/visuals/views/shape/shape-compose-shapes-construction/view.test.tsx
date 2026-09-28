import {Area, Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ShapeComposeShapesGenerator} from '../../../../generators/shape/shape-compose-shapes/generator.ts';
import {ShapeAssemblyProblem} from '../../../../types/problems.ts';
import {ShapeAssemblyDrawing} from '../shape-composition-geometry.tsx';
import {ShapeComposeShapesConstructionCore} from './view.tsx';

const render = (data: ShapeAssemblyProblem, solution: boolean) => renderToStaticMarkup(
    <ShapeComposeShapesConstructionCore config={{}} payload={{
        problem: {type: 'shape', data, labels: []}, viewId: 'shape-compose-shapes-construction',
        targetLabels: [], seed: 42, isSolutionView: solution
    }} />
);
const generator = new ShapeComposeShapesGenerator();
const shapes = [Area.Rectangle, Area.Square, Area.Triangle, Area.Hexagon, Area.Trapezoid,
    Area.HalfCircle, Area.QuarterCircle, Area.Cube, Area.RectangularPrism, Area.Cone, Area.Cylinder];

describe('shape composition construction', () => {
    it('hides back faces of solids, including the cone base', () => {
        const cube = generator.generate({classify: Area.Cube, compositionStructure: Scope.SingleLevelComposition})!.data;
        const cubeImage = renderToStaticMarkup(<ShapeAssemblyDrawing assembly={cube.assembly} label="cube" />);
        expect(cubeImage.match(/<polygon /g)).toHaveLength(3);
        const cone = generator.generate({classify: Area.Cone, compositionStructure: Scope.SingleLevelComposition})!.data;
        const coneImage = renderToStaticMarkup(<ShapeAssemblyDrawing assembly={cone.assembly} label="cone" />);
        const polygons = [...coneImage.matchAll(/<polygon points="([^"]+)"/g)];
        expect(polygons.length).toBeGreaterThan(1);
        expect(polygons.every(match => match[1].split(' ').length === 3)).toBe(true);
    });

    it.each(shapes.flatMap(shape => [Scope.SingleLevelComposition, Scope.MultiLevelComposition]
        .map(structure => ({shape, structure}))))('requires and solves the arrangement for $shape / $structure', ({shape, structure}) => {
        const data = generator.generate({classify: shape, compositionStructure: structure})!.data;
        const question = render(data, false);
        const solution = render(data, true);
        const stages = data.compositionDepth === 1 ? 1 : data.compositionTree.inputs.length + 1;
        expect(question.match(/Empty drawing space/g)).toHaveLength(stages);
        expect(question).toContain('Draw how the pieces fit together.');
        expect(question).not.toContain('Joined component pieces');
        expect(question).not.toContain('Which pieces');
        expect(solution.match(/Joined component pieces/g)).toHaveLength(stages);
        expect(solution).not.toContain('Empty drawing space');
        expect(solution).not.toContain('NaN');
        expect(solution).not.toContain('Infinity');
        expect(render(data, false)).toBe(question);
    });

    it('rejects missing, nonfinite or structurally inconsistent geometry', () => {
        const data = generator.generate({classify: Area.Cube, compositionStructure: Scope.SingleLevelComposition})!.data;
        expect(() => render({...data, assembly: undefined!}, false)).toThrow();
        expect(() => render({...data, assembly: {...data.assembly, parts: []}}, false)).toThrow(/correspond/);
        expect(() => render({...data, assembly: {...data.assembly,
            region: {kind: 'box', min: [0, 0, 0], max: [NaN, 2, 2]}}}, false)).toThrow(/finite/);
    });
});
