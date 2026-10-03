import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-division-story-creation',
    generalLabels: [Ability.TextualArticulation]
};

export const FractionsDivisionStoryCreationViewSchema = {} as const;
export type FractionsDivisionStoryCreationViewConfig = ConfigFromSchema<typeof FractionsDivisionStoryCreationViewSchema>;
