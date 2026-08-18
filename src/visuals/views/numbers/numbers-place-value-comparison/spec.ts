import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-place-value-comparison',
    rejectedLabels: [
        Scope.NumbersWithNegatives,
        Scope.NumbersWithZero,
        Scope.NumbersSmaller10,
        ...deductAdmitting([Scope.NumbersLarger100])
    ],
    generalLabels: [
        Area.PlaceValue,
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding
    ]
};

export const NumbersPlaceValueComparisonViewSchema = {} as const;

export type NumbersPlaceValueComparisonViewConfig = ConfigFromSchema<
    typeof NumbersPlaceValueComparisonViewSchema
>;
