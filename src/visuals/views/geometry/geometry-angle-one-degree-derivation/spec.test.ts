import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('geometry-angle-one-degree-derivation view spec', () => {
    it('owns invariant one-degree concept derivation', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptDerivation]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
