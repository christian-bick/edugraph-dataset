import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'counting-ten-more-less',
    generalLabels: [
        Area.PlaceValue,
        Scope.ArabicNumerals,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ],
    rejectedLabels: [
        ...deductAdmitting([Scope.NumbersLarger100])
    ]
};

export const CountingTenMoreLessViewSchema = {} as const;

export type CountingTenMoreLessViewConfig = ConfigFromSchema<typeof CountingTenMoreLessViewSchema>;
