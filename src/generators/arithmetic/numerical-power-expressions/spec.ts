import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {numericProfileBundles, numericProfileLabels, resolveNumericProfile} from './numeric-profiles.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {powerRangeLabels, powerRanges, resolvePowerRange, singlePowerRangeCandidates} from './range-profile.ts';

const structures = [[[], 'single-power'], [[Area.OrderOfOperations], 'mixed-precedence']] as const;
const exponents = [[[], 'allow-zero'], [[Scope.PositiveExponent], 'positive']] as const;

export const spec: GeneratorSpec = {
    generatorId: 'numerical-power-expressions',
    generalLabels: [Area.ArithmeticExpression, Area.Exponentiation, Scope.IntegerExponent,
        Scope.RationalNumbers],
    compatibility: [generatorLabelRule('single-power-numeric-profile',
        [Area.OrderOfOperations, Scope.PositiveExponent, ...numericProfileLabels], selected => {
            const labels = numericProfileLabels.filter(label => selected(label));
            return numericProfileBundles.some((bundle, index) => labels.length === bundle.length
                && bundle.every(label => selected(label))
                && !(index === 3 && selected(Scope.PositiveExponent) && !selected(Area.OrderOfOperations)));
        }), generatorLabelRule('power-canonical-range',
        [Area.OrderOfOperations, Scope.PositiveExponent, ...numericProfileLabels, ...powerRangeLabels], selected => {
            const rangeIndex = powerRangeLabels.findIndex(selected);
            if (rangeIndex < 0) return false;
            const profileIndex = numericProfileBundles.findIndex(bundle => bundle.every(selected));
            return profileIndex >= 0 && (selected(Area.OrderOfOperations)
                || singlePowerRangeCandidates(selected(Scope.PositiveExponent),
                    (profileIndex + 1) as 1 | 2 | 3 | 4, powerRanges[rangeIndex]!).length > 0);
        })]
};

export const NumericalPowerExpressionsGeneratorSchema = {
    structure: [[Area.OrderOfOperations], selectExactLabelSetMap(structures), structures.map(([labels]) => labels)],
    exponents: [[Scope.PositiveExponent], selectExactLabelSetMap(exponents), exponents.map(([labels]) => labels)],
    numericProfile: [numericProfileLabels, resolveNumericProfile, numericProfileBundles],
    range: [powerRangeLabels, resolvePowerRange, powerRangeLabels.map(label => [label])]
} as const;

export type NumericalPowerExpressionsGeneratorConfig = ConfigFromSchema<typeof NumericalPowerExpressionsGeneratorSchema>;
