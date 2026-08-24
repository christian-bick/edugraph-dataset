import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-rectangle-area-inversion view spec', () => {
    it('owns rectangle-area inversion', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureInversion]);
        expect(spec.requiredLabels).toBeUndefined();
    });
});
