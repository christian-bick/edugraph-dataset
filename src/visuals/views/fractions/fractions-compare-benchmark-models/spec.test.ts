import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('fractions-compare-benchmark-models view spec', () => {
    it('owns invariant benchmark procedure understanding', () => {
        expect(spec.generalLabels).toEqual([
            Scope.VisualNumbers,
            Ability.ProcedureUnderstanding
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
