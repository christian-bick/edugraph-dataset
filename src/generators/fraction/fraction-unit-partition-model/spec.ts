import {Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
const profiles = [[[], 'unit-dividend-basic'], [[Area.Multiplication], 'unit-dividend-inverse'], [[Area.Equation], 'unit-dividend-equation']] as const;
const ranges = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100]] as const;
const selectProfile = selectExactLabelSetMap(profiles);
// Preserve the existing explicit-unit request's basic preference. Broader
// fraction-dividend requests retain every supported witness profile.
const resolveProfile = withLabelChoices(exactResolver((labels: string[]) => selectProfile(labels)), {
    ...selectProfile.labelChoices!, kind: 'alternatives',
    defaults: [{whenAll: [Scope.UnitFractions], labels: []}], contextLabels: [Scope.UnitFractions]
});

export const spec: GeneratorSpec = {generatorId: 'fraction-unit-partition-model',
    generalLabels: [Area.Division, Scope.FractionDividend, Scope.IntegerDivisor, Scope.UnitFractions,
        Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero], compatibility: [{id: 'fraction-notation-original-wholes',
        dependencies: [{scope: 'target', label: Scope.FractionNumbers}, {scope: 'target', label: Scope.UnitFractions}],
        predicate: labels => !labels.exact('target', Scope.FractionNumbers) || labels.exact('target', Scope.UnitFractions)}]};
export const FractionUnitPartitionModelGeneratorSchema = {
    relationProfile: [[Area.Multiplication, Area.Equation], resolveProfile, profiles.map(([labels]) => labels)],
    range: [ranges.map(([label]) => label), selectExactLabelMap(ranges.map(([label, upper]) => [label, createCanonicalNumericRange(upper)] as const))]
} as const;
export type FractionUnitPartitionModelGeneratorConfig = ConfigFromSchema<typeof FractionUnitPartitionModelGeneratorSchema>;
