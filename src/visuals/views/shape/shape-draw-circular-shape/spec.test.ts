import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ShapeDrawCircularShapeViewSchema, spec} from './spec.ts';

describe('shape-draw-circular-shape view spec', () => {
    it('contributes circular drawing only for generator-established circles', () => {
        expect(spec.requiredLabels).toEqual([Area.ShapeClassification]);
        expect(spec.generalLabels).toEqual([
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Area.CircularShapeDrawing,
            Ability.ConceptSpecification,
            Ability.VisualArticulation
        ]);
        expect(spec.generalLabels).not.toContain(Area.LinearShapeDrawing);
        expect(spec).not.toHaveProperty('rejectedLabels');
        expect(ShapeDrawCircularShapeViewSchema).toEqual({});
    });
});
