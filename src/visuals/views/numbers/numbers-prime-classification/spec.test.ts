import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('numbers-prime-classification view spec', () => {
    it('owns classification only for prime-number targets', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptClassification]);
        expect(spec.requiredLabels).toEqual([Area.PrimeNumbers]);
    });
});
