import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {countingQuantityLabels, countingQuantitySchema} from '../counting-quantity-schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'parity-grouping',
    generalLabels: countingQuantityLabels,
    compatibility: [generatorLabelRule('parity-grouping-positive-domain', [
        Area.EvenDivisibility, Area.UnevenDivisibility, Scope.EvenNumbers, Scope.OddNumbers,
        Scope.NumbersLarger5, Scope.NumbersLarger10, Scope.NumbersLarger20,
        Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20
    ], selected => {
        const even = selected(Area.EvenDivisibility) || selected(Scope.EvenNumbers);
        const odd = selected(Area.UnevenDivisibility) || selected(Scope.OddNumbers);
        if (even && odd) return false;
        let minimum = selected(Scope.NumbersLarger20) ? 20 : selected(Scope.NumbersLarger10) ? 10
            : selected(Scope.NumbersLarger5) ? 5 : 1;
        const maximum = selected(Scope.NumbersSmaller5) ? 5 : selected(Scope.NumbersSmaller10) ? 10 : 20;
        if (even && minimum % 2 !== 0 || odd && minimum % 2 !== 1) minimum++;
        return minimum <= maximum;
    })]
};

const parityChoices = countingQuantitySchema.parity[2];
const evenChoices = parityChoices.slice(0, 3);
const completedParityChoices = parityChoices.map((labels, index) =>
    index < 3 ? [...labels, Scope.NumbersWithZero] : labels);
// A remainder of zero is part of every even grouping. Keep the original
// aliases equivalent while completing planned annotations in this owner only.
const resolveGroupingParity = selectExactLabelSetMap([
    [[], 'any'],
    ...parityChoices.map((labels, index) => [labels, index < 3 ? 'even' : 'odd'] as const),
    ...evenChoices.map(labels => [[...labels, Scope.NumbersWithZero], 'even'] as const)
] as const);

export const ParityGroupingGeneratorSchema = {
    ...countingQuantitySchema,
    parity: [[...countingQuantitySchema.parity[0], Scope.NumbersWithZero],
        resolveGroupingParity, completedParityChoices]
} as const;
export type ParityGroupingGeneratorConfig = ConfigFromSchema<typeof ParityGroupingGeneratorSchema>;
