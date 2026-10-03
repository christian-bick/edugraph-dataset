import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-product-story-creation',
    generalLabels: [Ability.TextualArticulation]
};

export const FractionsProductStoryCreationViewSchema = {} as const;
export type FractionsProductStoryCreationViewConfig = ConfigFromSchema<typeof FractionsProductStoryCreationViewSchema>;
