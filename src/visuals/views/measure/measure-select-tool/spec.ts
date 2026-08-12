import {Ability} from 'edugraph-ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measure-select-tool',
    generalLabels: [Ability.ConceptClassification]
};

export const MeasureSelectToolViewSchema = {} as const;
export type MeasureSelectToolViewConfig = ConfigFromSchema<typeof MeasureSelectToolViewSchema>;
