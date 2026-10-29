import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {numericProfileBundles, numericProfileLabels, resolveNumericProfile} from './numeric-profiles.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

const structures = [[[], 'single-power'], [[Area.OrderOfOperations], 'mixed-precedence']] as const;
const exponents = [[[], 'allow-zero'], [[Scope.PositiveExponent], 'positive']] as const;

export const spec: GeneratorSpec = {
    generatorId: 'numerical-power-expressions',
    generalLabels: [Area.ArithmeticExpression, Area.Exponentiation, Scope.IntegerExponent,
        Scope.RationalNumbers],
    compatibility: [generatorLabelRule('single-power-numeric-profile',
        [Area.OrderOfOperations, Scope.PositiveExponent, ...numericProfileLabels], selected => {
            const labels = numericProfileLabels.filter(label => selected(label));
            if (selected(Area.OrderOfOperations)) return labels.length === 0;
            return numericProfileBundles.some((bundle, index) => labels.length === bundle.length
                && bundle.every(label => selected(label))
                && !(index === 3 && selected(Scope.PositiveExponent)));
        })]
};

export const NumericalPowerExpressionsGeneratorSchema = {
    structure: [[Area.OrderOfOperations], selectExactLabelSetMap(structures), structures.map(([labels]) => labels)],
    exponents: [[Scope.PositiveExponent], selectExactLabelSetMap(exponents), exponents.map(([labels]) => labels)],
    numericProfile: [numericProfileLabels, resolveNumericProfile, numericProfileBundles]
} as const;

export type NumericalPowerExpressionsGeneratorConfig = ConfigFromSchema<typeof NumericalPowerExpressionsGeneratorSchema>;
