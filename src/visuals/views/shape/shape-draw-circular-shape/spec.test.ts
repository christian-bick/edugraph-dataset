import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ShapeDrawCircularShapeViewSchema, spec} from './spec.ts';

describe('shape-draw-circular-shape view spec', () => {
    it('contributes circular drawing only for generator-established circles', () => {
        expect(spec.requiredLabels).toEqual([Area.Circle]);
        expect(spec.generalLabels).toEqual([
            Area.CircularShapeDrawing,
            Ability.ConceptSpecification,
            Ability.VisualArticulation
        ]);
        expect(spec.generalLabels).not.toContain(Area.LinearShapeDrawing);
        expect(spec.rejectedLabels).toEqual([
            Scope.ShapeProperties,
            Scope.VertexCount,
            Scope.AngleCount,
            Scope.FaceCount
        ]);
        expect(ShapeDrawCircularShapeViewSchema).toEqual({});
    });
});
