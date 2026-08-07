import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {ShapePartitionGenerator} from './generator.ts';
import {ShapePartitionGeneratorSchema, spec} from './spec.ts';

const generator = new ShapePartitionGenerator();

describe('ShapePartitionGenerator spec integration', () => {
    it('declares proportional equal-share structure without requiring fraction notation', () => {
        expect(spec.generalLabels).toEqual([
            Area.ProportionSense,
            Scope.EqualShares
        ]);
        expect(extractSchemaLabels(ShapePartitionGeneratorSchema)).not.toContain(
            Area.FractionNotation
        );
    });

    it.each([
        [Ability.VisualArticulation, [], 'partition'],
        [Ability.ActiveVocabulary, [Scope.UnitFractions], 'name-share'],
        [Ability.ConceptComposition, [Scope.UnitFractions], 'compose-whole'],
        [
            Ability.ConceptDerivation,
            [Scope.UnitFractions, Scope.Less],
            'compare-share-size'
        ]
    ] as const)(
        'resolves %s to the matching mathematical task',
        (taskAbility, conditionalLabels, expectedTask) => {
            for (const shape of [Area.Circle, Area.Rectangle] as const) {
                const stub = generateWithLabels(generator, [
                    Area.ProportionSense,
                    Scope.EqualShares,
                    taskAbility,
                    shape,
                    ...conditionalLabels
                ])!;

                expect(stub).not.toBeNull();
                expect(stub.data.task).toBe(expectedTask);
                expect(stub.tags).toEqual(expect.arrayContaining([
                    shape,
                    taskAbility,
                    ...conditionalLabels
                ]));
            }
        }
    );

    it('does not consume unit-fraction or less labels for a partition task', () => {
        const stub = generateWithLabels(generator, [
            Area.ProportionSense,
            Scope.EqualShares,
            Ability.VisualArticulation,
            Area.Circle
        ])!;

        expect(stub.tags).not.toContain(Scope.UnitFractions);
        expect(stub.tags).not.toContain(Scope.Less);
    });
});
