import { beforeEach, describe, expect, it } from 'vitest';
import { ShapeBuildShapeGenerator } from './generator.ts';
import { Ability, Area, Scope } from 'edugraph-ts';
import { extractSchemaLabels, generateWithLabels } from '../../../lib/utils.ts';
import { ShapeBuildShapeGeneratorSchema } from './spec.ts';

describe('ShapeBuildShapeGenerator Spec Integration', () => {
    let generator: ShapeBuildShapeGenerator;

    beforeEach(() => {
        generator = new ShapeBuildShapeGenerator();
    });

    it('resolves the kindergarten construction path without changing its payload', () => {
        const stub = generateWithLabels(generator, [
            Area.Hexagon,
            Area.ShapeIdentity,
            Scope.ShapeProperties
        ]);

        expect(stub).toEqual({
            data: {target: 'hexagon', sides: 6, corners: 6},
            tags: [Area.Hexagon, Scope.ShapeProperties, Area.ShapeIdentity]
        });
    });

    it('resolves the Kindergarten loose-part assembly path from ShapeAttributes', () => {
        const labels = [
            Area.Hexagon,
            Area.ShapeIdentity,
            Scope.ShapeAttributes,
            Scope.GeometrySticks,
            Ability.VisualArticulation
        ];
        const stub = generateWithLabels(generator, labels);

        expect(stub?.data).toEqual({
            target: 'hexagon',
            sides: 6,
            corners: 6,
            task: 'assemble-from-parts'
        });
        expect(stub?.tags).toEqual(expect.arrayContaining([
            Area.Hexagon,
            Area.ShapeIdentity,
            Scope.ShapeAttributes
        ]));
        expect(stub?.tags).toHaveLength(3);
    });

    it('resolves the Grade 1 attribute-specification path and records each configured label once', () => {
        const labels = [
            Area.Circle,
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Ability.ConceptSpecification
        ];
        const stub = generateWithLabels(generator, labels);

        expect(stub?.data).toEqual({
            target: 'circle',
            sides: 0,
            corners: 0,
            task: 'specify-attributes',
            definition: {
                sideCount: 0,
                vertexCount: 0,
                closed: true,
                boundary: 'curved'
            }
        });
        expect(stub?.tags).toEqual(expect.arrayContaining(labels));
        expect(new Set(stub!.tags).size).toBe(stub!.tags!.length);
    });

    it('resolves shape identity only for the identity construction mode', () => {
        const labels = [Area.Circle, Scope.ShapeProperties, Area.ShapeIdentity];
        const stub = generateWithLabels(generator, labels);

        expect(stub).toEqual({
            data: {target: 'circle', sides: 0, corners: 0},
            tags: labels
        });
    });

    it('owns the rotation-conservation task mode', () => {
        expect(extractSchemaLabels(ShapeBuildShapeGeneratorSchema))
            .toContain(Area.ShapeRotationConservation);

        const stub = generateWithLabels(generator, [
            Area.Triangle,
            Area.ShapeRotationConservation,
            Area.LinearShapeDrawing,
            Ability.VisualArticulation
        ]);
        expect(stub?.data).toEqual({
            target: 'triangle',
            sides: 3,
            corners: 3,
            task: 'rotation-conservation'
        });
    });

    it('resolves the other-quadrilateral exclusion path', () => {
        const labels = [
            Area.Quadrilateral,
            Area.ShapeSubsumption,
            Area.LinearShapeDrawing,
            Scope.ShapeAttributes,
            Ability.VisualArticulation
        ];
        const stub = generateWithLabels(generator, labels);

        expect(stub?.data).toMatchObject({
            target: 'quadrilateral',
            task: 'exclude-quadrilateral-subcategories',
            excludedCategories: ['rhombus', 'rectangle', 'square']
        });
        expect(stub?.tags).toEqual(expect.arrayContaining([
            Area.Quadrilateral,
            Area.ShapeSubsumption,
            Scope.ShapeAttributes
        ]));
    });

    it('does not invent a named target for a generic vertex-count task', () => {
        const labels = [
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Scope.VertexCount,
            Ability.ConceptSpecification,
            Ability.VisualArticulation
        ];
        const stub = generateWithLabels(generator, labels)!;

        expect(stub.data.task).toBe('specify-count');
        if (stub.data.task !== 'specify-count') return;
        expect(stub.data.attribute).toBe('vertices');
        expect(stub.tags).toEqual(expect.arrayContaining([
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Scope.VertexCount,
            Ability.ConceptSpecification
        ]));
    });

    it('resolves an angle-count construction without substituting the vertex scope', () => {
        const labels = [
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Scope.AngleCount,
            Ability.ConceptSpecification,
            Ability.VisualArticulation
        ];
        const stub = generateWithLabels(generator, labels)!;

        expect(stub.data.task).toBe('specify-count');
        if (stub.data.task !== 'specify-count') return;
        expect(stub.data.attribute).toBe('angles');
        expect(stub.tags).toEqual(expect.arrayContaining([
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Scope.AngleCount,
            Ability.ConceptSpecification
        ]));
        expect(stub.tags).not.toContain(Scope.VertexCount);
    });

    it('resolves the equal-face construction path without a named target label', () => {
        const labels = [
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Scope.FaceCount,
            Scope.Equal,
            Ability.ConceptSpecification,
            Ability.VisualArticulation
        ];
        const stub = generateWithLabels(generator, labels)!;

        expect(stub.data).toMatchObject({
            task: 'specify-count',
            target: 'cube',
            attribute: 'equal-faces',
            requiredCount: 6
        });
        expect(stub.tags).toEqual(expect.arrayContaining([
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Scope.FaceCount,
            Scope.Equal,
            Ability.ConceptSpecification,
            Area.Cube
        ]));
    });
});
