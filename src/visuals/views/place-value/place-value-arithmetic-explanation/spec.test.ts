import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('place-value-arithmetic-explanation spec', () => {
    it('declares only the abilities visibly elicited by the explanation task', () => {
        expect(spec.generalLabels).toEqual([
            Ability.TextualArticulation,
            Ability.ProcedureUnderstanding
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
