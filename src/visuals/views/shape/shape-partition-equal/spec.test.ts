import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, extractSchemaLabels} from '../../../../lib/utils.ts';
import {ShapePartitionEqualViewSchema, spec} from './spec.ts';

const abilities = [
    Ability.VisualArticulation,
    Ability.ActiveVocabulary,
    Ability.ConceptComposition,
    Ability.ConceptDerivation,
    Ability.Formalization,
    Ability.Interpretation
];

describe('ShapePartitionEqualViewSchema', () => {
    it.each(abilities)('resolves %s as a view-owned task Ability', ability => {
        const {config, consumedLabels} = extractConfig(
            ShapePartitionEqualViewSchema,
            [ability]
        );

        expect(config.taskAbilities).toEqual([ability]);
        expect(consumedLabels).toContain(ability);
    });

    it('preserves the combined visual articulation and formalization projection', () => {
        const {config, consumedLabels} = extractConfig(
            ShapePartitionEqualViewSchema,
            [Ability.VisualArticulation, Ability.Formalization]
        );

        expect(config.taskAbilities).toEqual([
            Ability.VisualArticulation,
            Ability.Formalization
        ]);
        expect(consumedLabels).toEqual(expect.arrayContaining([
            Ability.VisualArticulation,
            Ability.Formalization
        ]));
    });

    it('owns all task Abilities as parameters rather than general claims', () => {
        expect(extractSchemaLabels(ShapePartitionEqualViewSchema)).toEqual(
            expect.arrayContaining(abilities)
        );
        expect(spec.generalLabels).toEqual([]);
    });
});
