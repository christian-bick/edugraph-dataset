import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {AreaPerimeterComparisonViewSchema, spec} from './spec.ts';

describe('area-perimeter-comparison view spec', () => {
    it('owns classification of the companion measure relation', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptClassification]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(AreaPerimeterComparisonViewSchema).toEqual({});
    });
});
