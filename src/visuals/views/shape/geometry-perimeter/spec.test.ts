import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('geometry-perimeter view spec', () => {
    it('owns invariant perimeter execution', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureExecution]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
