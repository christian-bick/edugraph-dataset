import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-general-division-story-creation',
    generalLabels: [Ability.TextualArticulation, Scope.ArabicNumerals, Scope.Base10,
        Scope.Numberline, Scope.BarModel, Scope.NumbersWithZero]
};

export const FractionsGeneralDivisionStoryCreationViewSchema = {} as const;
export type FractionsGeneralDivisionStoryCreationViewConfig = ConfigFromSchema<typeof FractionsGeneralDivisionStoryCreationViewSchema>;
