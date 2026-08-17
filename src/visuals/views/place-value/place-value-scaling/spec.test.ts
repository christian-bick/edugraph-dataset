import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('place-value-scaling view spec', () => {
    it('owns the visible factor-ten derivation capability', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptDerivation]);
    });
});
