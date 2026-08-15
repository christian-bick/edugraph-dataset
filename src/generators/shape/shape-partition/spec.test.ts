import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {ShapePartitionGenerator} from './generator.ts';
import {ShapePartitionGeneratorSchema, spec} from './spec.ts';

const generator = new ShapePartitionGenerator();

describe('ShapePartitionGenerator spec integration', () => {
    it('declares proportional equal-share structure and conditionally consumes fraction notation', () => {
        expect(spec.generalLabels).toEqual([
            Area.ProportionSense,
            Scope.EqualShares
        ]);
        expect(extractSchemaLabels(ShapePartitionGeneratorSchema)).toContain(
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

    it.each([Area.Circle, Area.Rectangle] as const)(
        'combines partitioning and unit-fraction labeling for %s models',
        shape => {
            const labels = [
                Area.ProportionSense,
                Scope.EqualShares,
                Scope.UnitFractions,
                Ability.VisualArticulation,
                Ability.Formalization,
                shape
            ];
            const stub = generateWithLabels(generator, labels)!;

            expect(stub.data.task).toBe('partition-and-label-unit-fraction');
            expect(stub.tags).toEqual(expect.arrayContaining([
                shape,
                Scope.UnitFractions,
                Ability.VisualArticulation,
                Ability.Formalization
            ]));
        }
    );

    it.each([
        [Scope.UnitFractions, Area.Circle],
        [Scope.UnitFractions, Area.Rectangle],
        [Scope.NonUnitFractions, Area.Circle],
        [Scope.NonUnitFractions, Area.Rectangle]
    ] as const)('interprets %s using a %s model', (fractionType, shape) => {
        const labels = [
            Area.ProportionSense,
            Area.FractionNotation,
            Scope.EqualShares,
            fractionType,
            Ability.ConceptDerivation,
            shape
        ];
        const stub = generateWithLabels(generator, labels)!;

        expect(stub.data.task).toBe('interpret-fraction');
        expect(stub.tags).toEqual(expect.arrayContaining([
            shape,
            fractionType,
            Area.FractionNotation,
            Ability.ConceptDerivation
        ]));
    });
});
