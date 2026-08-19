import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-patterns-explanation view spec', () => {
    it('owns invariant procedural explanation', () => {
        expect(spec.generalLabels).toEqual([
            Ability.ProcedureUnderstanding,
            Ability.TextualArticulation
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
