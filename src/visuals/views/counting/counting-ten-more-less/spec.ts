import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'counting-ten-more-less',
    generalLabels: [
        Area.PlaceValue,
        Scope.ArabicNumerals,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]
};

export const CountingTenMoreLessViewSchema = {} as const;

export type CountingTenMoreLessViewConfig = ConfigFromSchema<typeof CountingTenMoreLessViewSchema>;
