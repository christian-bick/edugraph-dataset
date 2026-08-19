import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';
describe('geometry-angle-arithmetic-inversion view spec', () => {
    it('owns invariant unknown-component inversion', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureInversion]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
