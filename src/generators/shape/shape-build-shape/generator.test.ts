import {beforeEach, describe, expect, it} from 'vitest';
import {ShapeBuildShapeGenerator} from './generator.ts';
import {Area, Scope} from 'edugraph-ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';

describe('ShapeBuildShapeGenerator', () => {
    let generator: ShapeBuildShapeGenerator;

    beforeEach(() => {
        generator = new ShapeBuildShapeGenerator();
    });

    const configFor = (target: string) => ({
        targets: [target],
        attributeCounts: []
    });

    it('should have the correct type', () => {
        expect(generator.type).toBe('shape');
    });

    it.each([
        [Area.Circle, 'circle', 0, 0],
        [Area.Triangle, 'triangle', 3, 3],
        [Area.Square, 'square', 4, 4],
        [Area.Rectangle, 'rectangle', 4, 4],
        [Area.Hexagon, 'hexagon', 6, 6]
    ] as const)('preserves the legacy construction payload for %s', (target, name, sides, corners) => {
        const stub = generator.generate({
            ...configFor(target),
            constructionScopes: [Scope.ShapeProperties],
            specifyAttributes: false,
            shapeArea: Area.ShapeIdentity
        });

        expect(stub).toEqual({
            data: {target: name, sides, corners},
            tags: []
        });
    });

    it('generates a construction payload for rotation-conservation drawing', () => {
        const stub = generator.generate({
            ...configFor(Area.Triangle),
            constructionScopes: [],
            specifyAttributes: false,
            shapeArea: Area.ShapeRotationConservation
        });

        expect(stub).toEqual({
            data: {
                target: 'triangle',
                sides: 3,
                corners: 3,
                task: 'rotation-conservation'
            },
            tags: []
        });
    });

    it.each([
        [Area.Triangle, 'triangle', 3],
        [Area.Square, 'square', 4],
        [Area.Rectangle, 'rectangle', 4],
        [Area.Hexagon, 'hexagon', 6]
    ] as const)('generates explicit loose-part assembly evidence for %s', (label, target, count) => {
        const stub = generator.generate({
            ...configFor(label),
            constructionScopes: [Scope.ShapeAttributes],
            specifyAttributes: false,
            shapeArea: Area.ShapeIdentity
        });

        expect(stub).toEqual({
            data: {
                target,
                sides: count,
                corners: count,
                task: 'assemble-from-parts'
            },
            tags: []
        });
    });

    it('rejects a curved shape for loose-stick assembly', () => {
        expect(generator.generate({
            ...configFor(Area.Circle),
            constructionScopes: [Scope.ShapeAttributes],
            specifyAttributes: false,
            shapeArea: Area.ShapeIdentity
        })).toBeNull();
    });

    it('generates a quadrilateral that excludes the named subcategories', () => {
        const stub = generator.generate({
            ...configFor(Area.Quadrilateral),
            constructionScopes: [Scope.ShapeAttributes],
            specifyAttributes: false,
            shapeArea: Area.ShapeSubsumption
        });

        expect(stub).toEqual({
            data: {
                target: 'quadrilateral',
                sides: 4,
                corners: 4,
                task: 'exclude-quadrilateral-subcategories',
                definition: {
                    sideCount: 4,
                    vertexCount: 4,
                    closed: true,
                    boundary: 'straight',
                    equalSides: false,
                    rightAngleCount: 0
                },
                excludedCategories: ['rhombus', 'rectangle', 'square']
            },
            tags: []
        });
    });

    it('does not apply the exclusion task to a named quadrilateral subtype', () => {
        expect(generator.generate({
            ...configFor(Area.Square),
            constructionScopes: [Scope.ShapeAttributes],
            specifyAttributes: false,
            shapeArea: Area.ShapeSubsumption
        })).toBeNull();
    });

    it.each([
        [Area.Circle, 'circle', {sideCount: 0, vertexCount: 0, closed: true, boundary: 'curved'}],
        [Area.Triangle, 'triangle', {sideCount: 3, vertexCount: 3, closed: true, boundary: 'straight'}],
        [Area.Square, 'square', {
            sideCount: 4,
            vertexCount: 4,
            closed: true,
            boundary: 'straight',
            equalSides: true,
            rightAngleCount: 4
        }],
        [Area.Rectangle, 'rectangle', {
            sideCount: 4,
            vertexCount: 4,
            closed: true,
            boundary: 'straight',
            rightAngleCount: 4
        }],
        [Area.Hexagon, 'hexagon', {sideCount: 6, vertexCount: 6, closed: true, boundary: 'straight'}]
    ] as const)('emits defining attributes for %s specification', (target, name, definition) => {
        const stub = generator.generate({
            ...configFor(target),
            constructionScopes: [],
            specifyAttributes: true,
            shapeArea: Area.ShapeClassification
        });

        expect(stub).toEqual({
            data: {
                target: name,
                sides: definition.sideCount,
                corners: definition.vertexCount,
                task: 'specify-attributes',
                definition
            },
            tags: []
        });
    });

    it('returns null for unsupported target labels', () => {
        expect(generator.generate({
            ...configFor(Area.Cube),
            constructionScopes: [Scope.ShapeProperties],
            specifyAttributes: false,
            shapeArea: Area.ShapeIdentity
        })).toBeNull();
    });

    it('returns null for unsupported scope and task combinations', () => {
        expect(generator.generate({
            ...configFor(Area.Triangle),
            constructionScopes: [Scope.ShapeProperties],
            specifyAttributes: true,
            shapeArea: Area.ShapeClassification
        })).toBeNull();
    });

    it('specifies a polygon from its required vertex count', () => {
        const stub = generator.generate({
            targets: [],
            constructionScopes: [],
            specifyAttributes: true,
            shapeArea: Area.ShapeClassification,
            attributeCounts: [Scope.VertexCount]
        })!;

        expect(stub.data.task).toBe('specify-count');
        if (stub.data.task !== 'specify-count') return;
        expect(stub.data.attribute).toBe('vertices');
        expect(stub.data.corners).toBe(stub.data.requiredCount);
        expect(stub.tags).toHaveLength(1);
    });

    it('specifies a polygon from its required angle count', () => {
        const stub = generator.generate({
            targets: [],
            constructionScopes: [],
            specifyAttributes: true,
            shapeArea: Area.ShapeClassification,
            attributeCounts: [Scope.AngleCount]
        })!;

        expect(stub.data.task).toBe('specify-count');
        if (stub.data.task !== 'specify-count') return;
        expect(stub.data.attribute).toBe('angles');
        expect(stub.data.sides).toBe(stub.data.requiredCount);
        expect(stub.data.corners).toBe(stub.data.requiredCount);
        expect(stub.tags).toHaveLength(1);
    });

    it('rejects mixed angle and vertex count requirements', () => {
        expect(() => generator.generate({
            targets: [],
            constructionScopes: [],
            specifyAttributes: true,
            shapeArea: Area.ShapeClassification,
            attributeCounts: [Scope.VertexCount, Scope.AngleCount]
        })).toThrow('Attribute-count labels must select vertex count, angle count, or equal face count.');
    });

    it('specifies a cube from six equal faces', () => {
        const stub = generator.generate({
            targets: [],
            constructionScopes: [],
            specifyAttributes: true,
            shapeArea: Area.ShapeClassification,
            attributeCounts: [Scope.FaceCount, Scope.Equal]
        });

        expect(stub).toEqual({
            data: {
                target: 'cube',
                sides: 12,
                corners: 8,
                task: 'specify-count',
                attribute: 'equal-faces',
                requiredCount: 6
            },
            tags: [Area.Cube]
        });
    });

    it('throws a validation error for an empty config', () => {
        expect(() => generator.generate({} as any)).toThrow(GeneratorValidationError);
    });
});
