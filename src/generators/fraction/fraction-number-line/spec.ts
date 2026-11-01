import { Area, Scope } from 'edugraph-ts';
import { GeneratorSpec } from '../../../types/generator-spec.ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { selectExactLabelMap } from '../../../lib/resolvers.ts';
import { createCanonicalNumericRange } from '../../../lib/canonical-numeric-range.ts';
import { exactResolver, withLabelChoices } from '../../../types/schema.ts';
import { generatorLabelRule } from '../../compatibility-rules.ts';
export const spec: GeneratorSpec = {
    generatorId: 'fraction-number-line',
    compatibility: [generatorLabelRule('fraction-line-count-range', [
            Scope.UnitFractions, Scope.NonUnitFractions, Scope.ImproperFractions, Scope.NumbersSmaller20
        ], selected => !selected(Scope.NumbersSmaller20) || selected(Scope.ImproperFractions))],
    generalLabels: [
        Area.NumerationWithFractions,
        Scope.NumbersWithoutNegatives
    ]
};
const kinds = [Scope.UnitFractions, Scope.NonUnitFractions, Scope.ImproperFractions];
const rangeLabels = [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20];
const selectRange = selectExactLabelMap([
    [Scope.NumbersSmaller5, createCanonicalNumericRange(5)],
    [Scope.NumbersSmaller10, createCanonicalNumericRange(10)],
    [Scope.NumbersSmaller20, createCanonicalNumericRange(20)]
] as const);
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = selectRange(labels);
    return range?.max === 20 && kinds.some(label => labels.includes(label)) && !labels.includes(Scope.ImproperFractions) ? undefined : range;
}), { kind: 'alternatives', alternatives: rangeLabels.map(label => [label]), contextLabels: kinds, resolvedContext: true });
export const FractionNumberLineGeneratorSchema = {
    fractionType: [kinds, selectExactLabelMap([
            [Scope.UnitFractions, 'unit'], [Scope.NonUnitFractions, 'nonunit'], [Scope.ImproperFractions, 'improper']
        ] as const)],
    range: [rangeLabels, resolveRange]
} as const;
export type FractionNumberLineGeneratorConfig = ConfigFromSchema<typeof FractionNumberLineGeneratorSchema>;
