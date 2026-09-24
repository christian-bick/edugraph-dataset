import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {AreaPerimeterConstructionViewSchema, spec} from './spec.ts';

describe('area-perimeter-construction view spec', () => {
    it('owns construction of a rectangle satisfying the relation constraints', () => {
        expect(spec.generalLabels).toEqual([
            Ability.ProcedureUnderstanding,
            Ability.VisualArticulation
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(AreaPerimeterConstructionViewSchema).toEqual({});
    });
});
