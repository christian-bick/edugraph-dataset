import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {spec} from './spec.ts';

describe('fractions-equivalence-unit-scaling view spec', () => {
    it('owns interpretation and requires the explicit scaling target', () => {
        expect(spec.generalLabels).toEqual([Ability.Interpretation]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Area.ProportionalScaling]);
    });
});
