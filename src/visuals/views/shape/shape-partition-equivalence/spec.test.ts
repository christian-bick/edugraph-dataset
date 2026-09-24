import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-partition-equivalence view spec', () => {
    it('owns the invariant derivation task', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptDerivation, Scope.ProofByConstruction]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });
});
