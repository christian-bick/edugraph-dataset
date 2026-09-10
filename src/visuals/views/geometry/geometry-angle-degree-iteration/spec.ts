import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-angle-degree-iteration',
    generalLabels: [Ability.Interpretation]
};

export const GeometryAngleDegreeIterationViewSchema = {} as const;
export type GeometryAngleDegreeIterationViewConfig = ConfigFromSchema<typeof GeometryAngleDegreeIterationViewSchema>;
