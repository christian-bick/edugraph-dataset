import {rejectTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

const boundedRanges = [Scope.NumbersSmaller5, Scope.NumbersSmaller10,
    Scope.NumbersSmaller20, Scope.NumbersSmaller100];

export const spec: ViewSpec = {
    viewId: 'operations-number-line-representation',
    generalLabels: [Scope.Numberline, Scope.ArabicNumerals, Ability.VisualArticulation],
    compatibility: [
        rejectTargetLabels('number-line-domain', [
            Scope.NumbersWithoutZero,
            ...deductAdmitting([Scope.NumbersWithNegatives]),
            ...deductAdmitting([Scope.NumbersLarger100])
        ]),
        {
            id: 'number-line-bounded-domain',
            dependencies: boundedRanges.map(label => ({scope: 'target', label})),
            predicate: labels => boundedRanges.some(label => labels.has('target', label))
        }
    ]
};

export const OperationsNumberLineRepresentationViewSchema = {} as const;
export type OperationsNumberLineRepresentationViewConfig = ConfigFromSchema<
    typeof OperationsNumberLineRepresentationViewSchema
>;
