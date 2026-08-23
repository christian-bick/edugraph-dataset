import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('measure-conversion-derivation view spec', () => {
    it('owns derivation and requires generator-established unit-scale mathematics', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptDerivation]);
        expect(spec.requiredLabels).toEqual([Area.UnitScaleRelation]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
