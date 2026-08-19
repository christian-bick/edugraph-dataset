import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('numbers-composite-classification view spec', () => {
    it('owns classification only for composite-number targets', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptClassification]);
        expect(spec.requiredLabels).toEqual([Area.CompositeNumbers]);
    });
});
