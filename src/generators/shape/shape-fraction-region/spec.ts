import {Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {partitionDenominators, partitionShape} from '../partition-schema.ts';

// A proper nonunit fraction requires 1 < numerator < denominator: halves have no such region.
const fractionChoices = partitionDenominators.flatMap(([label, parts]) => [
    [[label, Scope.UnitFractions], {parts, minNumerator: 1, maxNumerator: 1}] as const,
    ...(parts === 2 ? [] : [
        [[label, Scope.NonUnitFractions], {parts, minNumerator: 2, maxNumerator: parts - 1}] as const
    ])
]);

export const spec: GeneratorSpec = {
    generatorId: 'shape-fraction-region',
    generalLabels: [Scope.EqualShares]
};

export const ShapeFractionRegionGeneratorSchema = {
    shape: partitionShape,
    fraction: [
        [...partitionDenominators.map(([label]) => label), Scope.UnitFractions, Scope.NonUnitFractions],
        selectExactLabelSetMap(fractionChoices),
        fractionChoices.map(([labels]) => labels)
    ]
} as const;

export type ShapeFractionRegionGeneratorConfig = ConfigFromSchema<typeof ShapeFractionRegionGeneratorSchema>;
