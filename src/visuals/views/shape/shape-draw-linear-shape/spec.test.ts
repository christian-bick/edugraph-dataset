import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ShapeDrawLinearShapeViewSchema, spec} from './spec.ts';

describe('shape-draw-linear-shape view spec', () => {
    it('contributes linear drawing only for supported generator-established polygons', () => {
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Area.ShapeClassification]);
        expect(spec.generalLabels).toEqual([
            Area.ShapeClassification,
            Scope.ShapeAttributes,
            Area.LinearShapeDrawing,
            Ability.ConceptSpecification,
            Ability.VisualArticulation
        ]);
        expect(spec.generalLabels).not.toContain(Area.CircularShapeDrawing);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(ShapeDrawLinearShapeViewSchema).toEqual({});
    });
});
