import {Ability, Area, Scope} from 'edugraph-ts';
import {random} from '../../../lib/random.ts';
import {hasLabel, selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, ResolverFn} from '../../../types/schema.ts';

const selectComparisonKindPreservingLegacyRng: ResolverFn<string | null> = (
    labels,
    supportedLabels
) => {
    const comparisonKind = selectExactMatch(labels, supportedLabels) ?? null;
    if (comparisonKind === Area.NumericComparison) {
        // Before this schema became additive, its three plain-array fields each advanced
        // the shared RNG once during extraction. Preserve that label-driven dataset path
        // without changing direct generate(config) calls or selecting config by chance.
        random();
        random();
        random();
    }
    return comparisonKind;
};

export const spec: GeneratorSpec = {
    generatorId: 'fraction-comparison',
    generalLabels: [
        Area.FractionNotation,
        Scope.ProperFractions,
        Scope.SingleFrameOfReference,
        Ability.ConceptDerivation
    ]
};

export const FractionComparisonGeneratorSchema = {
    comparisonKind: [[
        Area.NumericComparison,
        Area.NumericEquality,
        Area.NumericInequality
    ], selectComparisonKindPreservingLegacyRng],
    usesProcedureUnderstanding: [[
        Ability.ProcedureUnderstanding
    ], hasLabel(Ability.ProcedureUnderstanding)],
    usesCommonDenominator: [[Scope.CommonDenominator], hasLabel(Scope.CommonDenominator)],
    usesCommonNumerator: [[Scope.CommonNumerator], hasLabel(Scope.CommonNumerator)],
    usesNumeratorInterpretation: [[
        Area.FractionNumeratorInterpretation
    ], hasLabel(Area.FractionNumeratorInterpretation)],
    usesDenominatorInterpretation: [[
        Area.FractionDenominatorInterpretation
    ], hasLabel(Area.FractionDenominatorInterpretation)],
    relation: [[Scope.Greater, Scope.Equal, Scope.Less], selectExactMatch]
} as const;

export type FractionComparisonGeneratorConfig = ConfigFromSchema<
    typeof FractionComparisonGeneratorSchema
>;
