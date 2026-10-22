import {Ability} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'unit-rate-language',
    generalLabels: [Ability.Interpretation, Ability.TextualArticulation]
};

export const UnitRateLanguageViewSchema = {} as const;
export type UnitRateLanguageViewConfig = ConfigFromSchema<typeof UnitRateLanguageViewSchema>;
