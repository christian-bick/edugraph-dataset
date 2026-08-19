import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-partition-equivalence view spec', () => {
    it('owns the invariant derivation task', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptDerivation]);
        expect(spec.requiredLabels).toBeUndefined();
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
