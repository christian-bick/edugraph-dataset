import {rejectTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-representation',
    generalLabels: [
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ],
    compatibility: [
        rejectTargetLabels('representation-capacity', [...deductAdmitting([Scope.NumbersLarger10])]),
        {
            id: 'object-operation-domain',
            dependencies: [
                Scope.IntegerNumbers, Scope.NumbersWithoutNegatives,
                Scope.NumbersSmaller5, Scope.NumbersSmaller10,
                Area.Addition, Area.Subtraction
            ].map(label => ({scope: 'generator' as const, label})),
            predicate: labels => labels.has('generator', Scope.IntegerNumbers)
                && labels.has('generator', Scope.NumbersWithoutNegatives)
                && [Scope.NumbersSmaller5, Scope.NumbersSmaller10].some(label => labels.has('generator', label))
                && [Area.Addition, Area.Subtraction].some(label => labels.has('generator', label))
        }
    ]
};

export const OperationsRepresentationViewSchema = {} as const;

export type OperationsRepresentationViewConfig = ConfigFromSchema<typeof OperationsRepresentationViewSchema>;
