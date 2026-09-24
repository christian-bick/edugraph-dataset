import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-square-array-interpretation view spec', () => {
    it('owns tile-scale area interpretation', () => {
        expect(spec.generalLabels).toEqual([Ability.Interpretation]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Scope.TileScale]);
    });
});
