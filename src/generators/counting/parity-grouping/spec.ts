import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {countingQuantityLabels, countingQuantitySchema} from '../counting-quantity-schema.ts';

const parityLabels = [Area.EvenDivisibility, Area.UnevenDivisibility, Scope.EvenNumbers, Scope.OddNumbers] as const;
const zeroLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero] as const;
const lowerBounds = [[Scope.NumbersLargerZero, 0], [Scope.NumbersLarger5, 5], [Scope.NumbersLarger10, 10],
    [Scope.NumbersLarger20, 20], [Scope.NumbersLarger100, 100], [Scope.NumbersLarger120, 120],
    [Scope.NumbersLarger1000, 1000], [Scope.NumbersLarger10000, 10000],
    [Scope.NumbersLarger100000, 100000], [Scope.NumbersLarger1000000, 1000000]] as const;
const upperBounds = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20],
    [Scope.NumbersSmaller100, 100], [Scope.NumbersSmaller120, 120], [Scope.NumbersSmaller1000, 1000],
    [Scope.NumbersSmaller10000, 10000], [Scope.NumbersSmaller100000, 100000],
    [Scope.NumbersSmaller1000000, 1000000]] as const;
const rangeLabels = [...lowerBounds, ...upperBounds].map(([label]) => label);

export const spec: GeneratorSpec = {
    generatorId: 'parity-grouping',
    generalLabels: countingQuantityLabels,
    compatibility: [{
        id: 'parity-grouping-positive-domain',
        dependencies: [...[...parityLabels, ...zeroLabels].map(label => ({scope: 'generator' as const, label})),
            ...rangeLabels.flatMap(label => [{scope: 'generator' as const, label}, {scope: 'target' as const, label}])],
        predicate: labels => {
            const selected = (label: string) => labels.exact('generator', label);
            const bounded = (label: string) => selected(label) || labels.exact('target', label);
            const even = selected(Area.EvenDivisibility) || selected(Scope.EvenNumbers);
            const odd = selected(Area.UnevenDivisibility) || selected(Scope.OddNumbers);
            const withZero = selected(Scope.NumbersWithZero), withoutZero = selected(Scope.NumbersWithoutZero);
            if (even === odd || withZero === withoutZero || even && withoutZero) return false;
            // Match the existing inclusive range resolver, then intersect with
            // the profile's complete finite collection domain before any draw.
            let minimum = Math.max(1, ...lowerBounds.filter(([label]) => bounded(label)).map(([, value]) => value),
                odd && withoutZero ? 3 : 1);
            const maximum = Math.min(20, ...upperBounds.filter(([label]) => bounded(label)).map(([, value]) => value),
                odd && withZero ? 1 : 20);
            if (even && minimum % 2 !== 0 || odd && minimum % 2 !== 1) minimum++;
            return minimum <= maximum;
        }
    }]
};

const parityChoices = countingQuantitySchema.parity[2];
const evenChoices = parityChoices.slice(0, 3);
const oddChoices = parityChoices.slice(3);
const evenProfiles = evenChoices.map(labels => [[...labels, Scope.NumbersWithZero], 'even'] as const);
const oddProfiles = oddChoices.flatMap(labels => [
    [[...labels, Scope.NumbersWithZero], 'singleton-odd'],
    [[...labels, Scope.NumbersWithoutZero], 'positive-odd']
] as const);
// A zero remainder belongs to even groups; two empty groups belong only to
// singleton odd collections. Other odd collections involve positive counts.
const resolveGroupingParity = selectExactLabelSetMap([
    ...evenChoices.map(labels => [labels, 'even'] as const), ...evenProfiles, ...oddProfiles
] as const);

export const ParityGroupingGeneratorSchema = {
    ...countingQuantitySchema,
    parity: [[...parityLabels, ...zeroLabels], resolveGroupingParity,
        [...evenProfiles, ...oddProfiles].map(([labels]) => labels)]
} as const;
export type ParityGroupingGeneratorConfig = ConfigFromSchema<typeof ParityGroupingGeneratorSchema>;
