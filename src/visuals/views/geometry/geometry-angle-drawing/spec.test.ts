import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('geometry-angle-drawing view spec', () => {
    it('owns the observable angle-specification ability', () => {
        expect(spec.generalLabels).toContain(Ability.ConceptSpecification);
    });
});
