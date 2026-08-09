import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measure-compare',
    generalLabels: [
        Ability.VisualReception,
    ],
};


export const MeasureCompareViewSchema = {} as const;

export type MeasureCompareViewConfig = ConfigFromSchema<typeof MeasureCompareViewSchema>;
