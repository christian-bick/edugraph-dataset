import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {numericalExpressionProfiles} from '../numerical-expression-profiles.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-numerical-expressions',
    generalLabels: [Area.ArithmeticExpression, Scope.IntegerNumbers,
        Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]
};

export const ArithmeticNumericalExpressionsGeneratorSchema = {
    profile: (() => {
        const profiles = numericalExpressionProfiles('structure').map(({profile}) => {
            const {labels} = canonicalRangeProfiles.find(({range}) =>
                range.max === profile.range.max && range.min === profile.range.min)!;
            return {labels: [...(profile.structure === 'grouped' ? [Area.GroupingSymbol, Area.OrderOfOperations] : []), ...labels], profile};
        });
        return [[...new Set(profiles.flatMap(({labels}) => labels))],
            selectExactLabelSetMap(profiles.map(({labels, profile}) => [labels, profile] as const)),
            profiles.map(({labels}) => labels)] as const;
    })()
} as const;

export type ArithmeticNumericalExpressionsGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticNumericalExpressionsGeneratorSchema
>;
