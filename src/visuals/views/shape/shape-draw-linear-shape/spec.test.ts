import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ShapeDrawLinearShapeViewSchema, spec} from './spec.ts';

describe('shape-draw-linear-shape view spec', () => {
    it('contributes linear drawing only for supported generator-established polygons', () => {
        expect(spec.requiredLabels).toEqual([Area.Polygon]);
        expect(spec.generalLabels).toEqual([
            Area.LinearShapeDrawing,
            Ability.ConceptSpecification,
            Ability.VisualArticulation
        ]);
        expect(spec.generalLabels).not.toContain(Area.CircularShapeDrawing);
        expect(spec.rejectedLabels).toEqual([
            Area.Hexagon,
            Area.Pentagon,
            Scope.ShapeProperties,
            Scope.VertexCount,
            Scope.AngleCount,
            Scope.FaceCount
        ]);
        expect(ShapeDrawLinearShapeViewSchema).toEqual({});
    });
});
