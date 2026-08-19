import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('geometry-angle-arithmetic view spec', () => {
    it('owns invariant angle-addition procedure understanding', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureUnderstanding]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
