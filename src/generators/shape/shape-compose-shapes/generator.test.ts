import {Area, Scope} from 'edugraph-ts';
import {beforeEach, describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {ShapeCompositionNode} from '../../../types/problems.ts';
import {ShapeComposeShapesGenerator} from './generator.ts';

const SHAPE_CASES = [
    [Area.Rectangle, 'rectangle'],
    [Area.Square, 'square'],
    [Area.Triangle, 'triangle'],
    [Area.Hexagon, 'hexagon'],
    [Area.Trapezoid, 'trapezoid'],
    [Area.HalfCircle, 'half circle'],
    [Area.QuarterCircle, 'quarter circle'],
    [Area.Cube, 'cube'],
    [Area.RectangularPrism, 'rectangular prism'],
    [Area.Cone, 'cone'],
    [Area.Cylinder, 'cylinder']
] as const;

function depth(node: ShapeCompositionNode): number {
    if (node.kind === 'primitive') return 0;
    return 1 + Math.max(...node.inputs.map(depth));
}

function expectValidRecursiveTree(node: ShapeCompositionNode): void {
    expect(node.shape.trim().length).toBeGreaterThan(0);
    if (node.kind === 'composite') {
        expect(node.inputs.length).toBeGreaterThanOrEqual(2);
        node.inputs.forEach(expectValidRecursiveTree);
    }
}

describe('ShapeComposeShapesGenerator', () => {
    let generator: ShapeComposeShapesGenerator;

    beforeEach(() => {
        generator = new ShapeComposeShapesGenerator();
        setSeed(42);
    });

    it('has the shape problem type', () => {
        expect(generator.type).toBe('shape');
    });

    it('rejects empty and incomplete configs', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({classify: Area.Rectangle})).toThrow(
            GeneratorValidationError
        );
        expect(() => generator.generate({
            compositionStructure: Scope.SingleLevelComposition
        })).toThrow(GeneratorValidationError);
    });

    it('preserves the legacy single-level rectangle projection', () => {
        const stub = generator.generate({
            classify: Area.Rectangle,
            compositionStructure: Scope.SingleLevelComposition
        })!;

        expect(stub.data.target).toBe('rectangle');
        expect(stub.data.components).toEqual(['triangle', 'triangle']);
        expect(stub.data.options).toEqual(['Two triangles', 'Two circles']);
        expect(stub.data.answer).toBe('Two triangles');
    });

    it.each(SHAPE_CASES)(
        'generates a strictly single-level composition for %s',
        (label, target) => {
            const stub = generator.generate({
                classify: label,
                compositionStructure: Scope.SingleLevelComposition
            })!;

            expect(stub.data.target).toBe(target);
            expect(stub.data.compositionTree.shape).toBe(target);
            expect(stub.data.compositionDepth).toBe(1);
            expect(depth(stub.data.compositionTree)).toBe(1);
            expect(stub.data.compositionTree.inputs.every(
                input => input.kind === 'primitive'
            )).toBe(true);
            expect(stub.data.components).toEqual(
                stub.data.compositionTree.inputs.map(input => input.shape)
            );
            expect(stub.data.options).toHaveLength(2);
            expect(stub.data.options).toContain(stub.data.answer);
            expectValidRecursiveTree(stub.data.compositionTree);
        }
    );

    it.each(SHAPE_CASES)(
        'generates a depth-two composition with an intermediate for %s',
        (label, target) => {
            const stub = generator.generate({
                classify: label,
                compositionStructure: Scope.MultiLevelComposition
            })!;

            expect(stub.data.target).toBe(target);
            expect(stub.data.compositionTree.shape).toBe(target);
            expect(stub.data.compositionDepth).toBe(2);
            expect(depth(stub.data.compositionTree)).toBe(2);
            expect(stub.data.compositionTree.inputs.some(
                input => input.kind === 'composite'
            )).toBe(true);
            expect(stub.data.components).toEqual(
                stub.data.compositionTree.inputs.map(input => input.shape)
            );
            expect(stub.data.options).toHaveLength(2);
            expect(stub.data.options).toContain(stub.data.answer);
            expectValidRecursiveTree(stub.data.compositionTree);
        }
    );

    it('uses trapezoid intermediates made from triangles for multi-level hexagons', () => {
        const tree = generator.generate({
            classify: Area.Hexagon,
            compositionStructure: Scope.MultiLevelComposition
        })!.data.compositionTree;

        expect(tree.inputs).toHaveLength(2);
        for (const input of tree.inputs) {
            expect(input.kind).toBe('composite');
            if (input.kind === 'composite') {
                expect(input.shape).toBe('trapezoid');
                expect(input.inputs).toEqual([
                    {kind: 'primitive', shape: 'triangle'},
                    {kind: 'primitive', shape: 'triangle'},
                    {kind: 'primitive', shape: 'triangle'}
                ]);
            }
        }
    });

    it('returns null for unsupported shape or structure values', () => {
        expect(generator.generate({
            classify: 'unsupported-shape' as typeof Area.Rectangle,
            compositionStructure: Scope.SingleLevelComposition
        })).toBeNull();
        expect(generator.generate({
            classify: Area.Rectangle,
            compositionStructure: 'unsupported-structure' as typeof Scope.SingleLevelComposition
        })).toBeNull();
    });

    it('tags all nested ontology-backed components without duplicating the target', () => {
        expect(generator.generate({
            classify: Area.Rectangle,
            compositionStructure: Scope.SingleLevelComposition
        })!.tags).toEqual([Area.Triangle]);
        expect(generator.generate({
            classify: Area.Hexagon,
            compositionStructure: Scope.MultiLevelComposition
        })!.tags).toEqual([Area.Trapezoid, Area.Triangle]);
        expect(generator.generate({
            classify: Area.Cube,
            compositionStructure: Scope.SingleLevelComposition
        })!.tags).toEqual([Area.RectangularPrism]);
        expect(generator.generate({
            classify: Area.Rectangle,
            compositionStructure: Scope.MultiLevelComposition
        })!.tags).toEqual([Area.Square, Area.Triangle]);
        expect(generator.generate({
            classify: Area.Triangle,
            compositionStructure: Scope.MultiLevelComposition
        })!.tags).toBeUndefined();
    });
});
