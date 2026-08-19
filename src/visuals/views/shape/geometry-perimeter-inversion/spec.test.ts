import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('geometry-perimeter-inversion view spec', () => {
    it('owns invariant perimeter inversion', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureInversion]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
