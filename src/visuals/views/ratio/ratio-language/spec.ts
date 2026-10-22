import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'ratio-language',
    generalLabels: [Ability.Interpretation, Ability.TextualArticulation]
};

export const RatioLanguageViewSchema = {} as const;
export type RatioLanguageViewConfig = ConfigFromSchema<typeof RatioLanguageViewSchema>;
