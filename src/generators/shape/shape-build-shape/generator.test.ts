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
            shapeIdentity: false
        });

        expect(stub).toEqual({
            data: {target: name, sides, corners},
            tags: []
        });
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
            shapeIdentity: false
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
            shapeIdentity: false
        })).toBeNull();
    });

    it('returns null for unsupported scope and task combinations', () => {
        expect(generator.generate({
            ...configFor(Area.Triangle),
            constructionScopes: [],
            specifyAttributes: false,
            shapeIdentity: false
        })).toBeNull();
        expect(generator.generate({
            ...configFor(Area.Triangle),
            constructionScopes: [Scope.ShapeProperties],
            specifyAttributes: true,
            shapeIdentity: false
        })).toBeNull();
        expect(generator.generate({
            ...configFor(Area.Triangle),
            constructionScopes: [],
            specifyAttributes: true,
            shapeIdentity: true
        })).toBeNull();
    });

    it('specifies a polygon from its required vertex count', () => {
        const stub = generator.generate({
            targets: [],
            constructionScopes: [],
            specifyAttributes: true,
            shapeIdentity: false,
            attributeCounts: [Scope.VertexCount]
        })!;

        expect(stub.data.task).toBe('specify-count');
        if (stub.data.task !== 'specify-count') return;
        expect(stub.data.attribute).toBe('vertices');
        expect(stub.data.corners).toBe(stub.data.requiredCount);
        expect(stub.tags).toHaveLength(1);
    });

    it('specifies a cube from six equal faces', () => {
        const stub = generator.generate({
            targets: [],
            constructionScopes: [],
            specifyAttributes: true,
            shapeIdentity: false,
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
