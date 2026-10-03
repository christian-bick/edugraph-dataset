import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorCompatibilityRule} from '../../../types/compatibility.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const productProfiles = [
    [[Area.Division, Area.FractionNumeratorInterpretation,
        Area.FractionDenominatorInterpretation, Scope.FractionNumbers,
        Scope.EqualShares], 'fraction-partition'],
    [[Area.Equation, Scope.FractionNumbers,
        Scope.SingleFrameOfReference], 'fraction-equation'],
    [[Area.Equation, Scope.MixedNumbers,
        Scope.SingleFrameOfReference], 'mixed-equation']
] as const;

const exactProfile = selectExactLabelSetMap(productProfiles);

// A broad FractionNumbers request must not silently select mixed original
// operands merely because MixedNumbers specializes FractionNumbers.
const resolveProductProfile = withLabelChoices(exactResolver((labels: string[],
    supportedLabels?: readonly string[]) => {
    if (labels.includes(Scope.FractionNumbers) && labels.includes(Scope.MixedNumbers)) return undefined;
    return exactProfile(labels, supportedLabels);
}), {kind: 'alternatives', alternatives: productProfiles.map(([labels]) => [...labels])});

const originalOperandForm: GeneratorCompatibilityRule = {
    id: 'fraction-product-original-operand-form',
    dependencies: [
        {scope: 'target', label: Scope.FractionNumbers},
        {scope: 'target', label: Scope.MixedNumbers},
        {scope: 'generator', label: Scope.MixedNumbers}
    ],
    predicate: labels => !(
        labels.exact('target', Scope.FractionNumbers)
        && !labels.exact('target', Scope.MixedNumbers)
        && labels.exact('generator', Scope.MixedNumbers)
    )
};

export const spec: GeneratorSpec = {
    generatorId: 'fraction-products',
    generalLabels: [Area.Multiplication],
    compatibility: [originalOperandForm]
};

export const FractionProductsGeneratorSchema = {
    productProfile: [[
        Area.Division,
        Area.FractionNumeratorInterpretation,
        Area.FractionDenominatorInterpretation,
        Area.Equation,
        Scope.FractionNumbers,
        Scope.MixedNumbers,
        Scope.EqualShares,
        Scope.SingleFrameOfReference
    ], resolveProductProfile, productProfiles.map(([labels]) => labels)]
} as const;

export type FractionProductsGeneratorConfig = ConfigFromSchema<
    typeof FractionProductsGeneratorSchema
>;
