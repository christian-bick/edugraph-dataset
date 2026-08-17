import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-patterns',
    generalLabels: []
};

export const ShapePatternsViewSchema = {} as const;

export type ShapePatternsViewConfig = ConfigFromSchema<typeof ShapePatternsViewSchema>;
