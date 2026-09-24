import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ShapeDrawCircularShapeViewSchema, spec} from './spec.ts';

describe('shape-draw-circular-shape view spec', () => {
    it('contributes circular drawing only for generator-established circles', () => {
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Area.ShapeClassification]);
        expect(spec.generalLabels).toEqual([
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Area.CircularShapeDrawing,
            Ability.ConceptSpecification,
            Ability.VisualArticulation
        ]);
        expect(spec.generalLabels).not.toContain(Area.LinearShapeDrawing);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(ShapeDrawCircularShapeViewSchema).toEqual({});
    });
});
