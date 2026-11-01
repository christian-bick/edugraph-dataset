import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

const numberKinds = [
    [[Area.NumerationWithIntegers, Scope.IntegerNumbers], 'integer'],
    // Every fraction axis explicitly displays its step 1/d, d in {2,3,4,6,8}.
    // Other ticks may be improper too; evidenced descriptors can coexist (ONT-E5).
    [[Area.NumerationWithFractions, Scope.FractionNumbers, Scope.ProperFractions], 'fraction'],
    [[Area.NumerationWithDecimals, Scope.DecimalNumbers], 'decimal']
] as const;

const formLabels: string[] = [Area.NumerationWithIntegers, Scope.IntegerNumbers, Area.NumerationWithFractions, Scope.FractionNumbers,
    Area.NumerationWithDecimals, Scope.DecimalNumbers, Scope.ProperFractions];
const rangeLabels = [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20];
const selectKind = selectExactLabelSetMap(numberKinds);
const resolveKind = withLabelChoices(exactResolver((labels: string[]) => {
    const kind = selectKind(labels);
    return kind !== 'integer' && labels.some(label => label === Scope.NumbersSmaller10 || label === Scope.NumbersSmaller20)
        ? undefined : kind;
}), {kind: 'alternatives', alternatives: numberKinds.map(([labels]) => labels), contextLabels: rangeLabels});
const selectRange = selectExactLabelMap(rangeLabels.map((label, index) => [label, createCanonicalNumericRange([5, 10, 20][index]!)] as const));
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = selectRange(labels);
    return range && range.max > 5 && labels.some(label => formLabels.includes(label)) && !labels.includes(Scope.IntegerNumbers)
        ? undefined : range;
}), {kind: 'alternatives', alternatives: rangeLabels.map(label => [label]), contextLabels: formLabels, resolvedContext: true});

export const spec: GeneratorSpec = {generatorId: 'rational-numberline-values', generalLabels: [Scope.NumbersWithZero],
    compatibility: [generatorLabelRule('rational-line-scale-range', [...formLabels, ...rangeLabels], selected =>
        !(selected(Scope.NumbersSmaller10) || selected(Scope.NumbersSmaller20)) || selected(Scope.IntegerNumbers))]};

export const RationalNumberlineValuesGeneratorSchema = {
    numberKind: [formLabels, resolveKind, numberKinds.map(([labels]) => labels)],
    signDomain: [[Scope.NumbersWithoutNegatives, Scope.NumbersWithNegatives], selectExactLabelMap([
        [Scope.NumbersWithoutNegatives, 'nonnegative'], [Scope.NumbersWithNegatives, 'signed']
    ] as const), [[Scope.NumbersWithoutNegatives]]],
    range: [rangeLabels, resolveRange, rangeLabels.map(label => [label])]
} as const;

export type RationalNumberlineValuesGeneratorConfig = ConfigFromSchema<typeof RationalNumberlineValuesGeneratorSchema>;
