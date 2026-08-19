import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-pattern-table view spec', () => {
    it('owns invariant table-pattern classification', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ConceptClassification
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
