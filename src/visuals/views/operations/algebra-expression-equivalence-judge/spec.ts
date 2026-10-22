import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

const specializedProperties = [Area.DistributingLinearCombinations, Area.CollectingLinearTerms, Area.AssociativeLaw, Area.CommutativeLaw] as const;

export const spec: ViewSpec = {
    viewId: 'algebra-expression-equivalence-judge',
    generalLabels: [Scope.ArabicNumerals, Ability.CorrectnessEvaluation],
    compatibility: [
        requireTargetLabels('algebra-equivalence-universal-judgment', [Area.AlgebraicExpression, Area.AlgebraicEquivalence]),
        {
            id: 'algebra-equivalence-judge-evidence',
            description: 'The fixed universal comparison task preserves broad equivalence evidence without an additional specialized-law reference.',
            dependencies: specializedProperties.map(label => ({scope: 'generator' as const, label})),
            predicate: labels => specializedProperties.every(label => !labels.has('generator', label))
        }
    ]
};
export const AlgebraExpressionEquivalenceJudgeViewSchema = {} as const;
export type AlgebraExpressionEquivalenceJudgeViewConfig = ConfigFromSchema<typeof AlgebraExpressionEquivalenceJudgeViewSchema>;
