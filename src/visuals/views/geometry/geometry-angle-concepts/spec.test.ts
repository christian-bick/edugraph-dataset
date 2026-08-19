import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {GeometryAngleConceptsViewSchema} from './spec.ts';

describe('GeometryAngleConceptsViewSchema', () => {
    it.each([
        Ability.Interpretation,
        Ability.ConceptDerivation
    ])('resolves %s as a view-owned task mode', ability => {
        expect(extractConfig(GeometryAngleConceptsViewSchema, [ability]).config.abilityMode)
            .toBe(ability);
    });
});
