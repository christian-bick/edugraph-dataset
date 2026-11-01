import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {comparisonDomain} from './domain.ts';

export const spec: GeneratorSpec = {
    generatorId: 'multiplicative-comparison',
    generalLabels: [
        Area.ProportionalScaling,
        Scope.SingleStep,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

const operationProfiles = [
    [[Area.Multiplication, Scope.SingleDigitSmallestOperand], 'multiplication'],
    [[Area.Division, Scope.SingleDigitLargestOperand], 'division-single'],
    [[Area.Division, Scope.TwoDigitLargestOperand], 'division-two']
] as const;

export const MultiplicativeComparisonGeneratorSchema = {
    profile: (() => {
        const profiles = operationProfiles.flatMap(([operationLabels, operation]) => canonicalRangeProfiles
            .filter(({range}) => range.max <= 100)
            .map(({labels, range}) => [[...operationLabels, ...labels], {operation, range}] as const)
            .filter(([, profile]) => comparisonDomain(profile).length > 0));
        return [[...new Set(profiles.flatMap(([labels]) => labels))], selectExactLabelSetMap(profiles),
            profiles.map(([labels]) => labels)] as const;
    })()
} as const;

export type MultiplicativeComparisonGeneratorConfig = ConfigFromSchema<
    typeof MultiplicativeComparisonGeneratorSchema
>;
