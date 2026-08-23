import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-number-line-representation',
    generalLabels: [Scope.Numberline, Ability.VisualArticulation],
    rejectedLabels: [
        Scope.NumbersWithoutZero,
        ...deductAdmitting([Scope.NumbersWithNegatives]),
        ...deductAdmitting([Scope.NumbersLarger100])
    ]
};

export const OperationsNumberLineRepresentationViewSchema = {} as const;
export type OperationsNumberLineRepresentationViewConfig = ConfigFromSchema<
    typeof OperationsNumberLineRepresentationViewSchema
>;
