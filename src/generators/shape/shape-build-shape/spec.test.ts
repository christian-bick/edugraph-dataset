import { beforeEach, describe, expect, it } from 'vitest';
import { ShapeBuildShapeGenerator } from './generator.ts';
import { Ability, Area, Scope } from 'edugraph-ts';
import { generateWithLabels } from '../../../lib/utils.ts';

describe('ShapeBuildShapeGenerator Spec Integration', () => {
    let generator: ShapeBuildShapeGenerator;

    beforeEach(() => {
        generator = new ShapeBuildShapeGenerator();
    });

    it('resolves the kindergarten construction path without changing its payload', () => {
        const stub = generateWithLabels(generator, [
            Area.Hexagon,
            Scope.ShapeProperties
        ]);

        expect(stub).toEqual({
            data: {target: 'hexagon', sides: 6, corners: 6},
            tags: [Area.Hexagon, Scope.ShapeProperties]
        });
    });

    it('resolves the Grade 1 attribute-specification path and records each configured label once', () => {
        const labels = [Area.Circle, Scope.ShapeAttributes, Ability.ConceptSpecification];
        const stub = generateWithLabels(generator, labels);

        expect(stub).toEqual({
            data: {
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
            },
            tags: labels
        });
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
});
