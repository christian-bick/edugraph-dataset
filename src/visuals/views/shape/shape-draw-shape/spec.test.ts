import {describe, expect, it} from 'vitest';
import {Ability} from 'edugraph-ts';
import {spec} from './spec.ts';

describe('shape-draw-shape view spec', () => {
    it('owns the observable attribute-specification ability', () => {
        expect(spec.generalLabels).toContain(Ability.ConceptSpecification);
    });
});
