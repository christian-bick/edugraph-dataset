import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {arithmeticTripleLabels, arithmeticTripleSchema} from '../arithmetic-triple-schema.ts';

const laws = [Area.CommutativeLaw, Area.AssociativeLaw, Area.DistributiveLaw] as const;

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-property-relations',
    generalLabels: arithmeticTripleLabels,
    compatibility: [
        generatorLabelRule('exactly-one-property-law', laws,
            selected => laws.filter(selected).length === 1),
        generatorLabelRule('property-operation', [Area.Addition, Area.Multiplication, ...laws], selected =>
            selected(Area.DistributiveLaw)
                ? selected(Area.Addition) && selected(Area.Multiplication)
                : selected(Area.Addition) !== selected(Area.Multiplication)),
        generatorLabelRule('property-value-profile', [
            Area.DistributiveLaw, Scope.NumbersWithZero, Scope.NumbersWithoutZero, Scope.MultiplesOf10
        ], selected => {
            if (selected(Scope.NumbersWithZero) && selected(Scope.NumbersWithoutZero)) return false;
            return !selected(Area.DistributiveLaw)
                || !selected(Scope.NumbersWithZero) && !selected(Scope.MultiplesOf10);
        })
    ]
};

export const ArithmeticPropertyRelationsGeneratorSchema = {
    ...arithmeticTripleSchema,
    operation: [
        [Area.Addition, Area.Multiplication],
        selectExactLabelSetMap([
            [[Area.Addition], Area.Addition],
            [[Area.Multiplication], Area.Multiplication],
            [[Area.Addition, Area.Multiplication], Area.Multiplication]
        ] as const)
    ]
} as const;

export type ArithmeticPropertyRelationsGeneratorConfig = ConfigFromSchema<typeof ArithmeticPropertyRelationsGeneratorSchema>;
