import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'counting-hundred-more-less',
    requiredLabels: [Scope.StepsOf100],
    generalLabels: [
        Area.PlaceValue,
        Scope.ArabicNumerals,
        Scope.PhysicalNumbers,
        Ability.ProcedureUnderstanding
    ]
};

export const CountingHundredMoreLessViewSchema = {} as const;

export type CountingHundredMoreLessViewConfig = ConfigFromSchema<typeof CountingHundredMoreLessViewSchema>;
