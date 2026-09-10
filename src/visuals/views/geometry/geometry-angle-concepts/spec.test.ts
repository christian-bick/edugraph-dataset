import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('geometry-angle-concepts view spec', () => {
    it('owns invariant arc-fraction interpretation', () => {
        expect(spec.generalLabels).toEqual([Ability.Interpretation, Area.FractionDenominatorInterpretation]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
