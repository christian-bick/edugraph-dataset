import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-build-shape',
    generalLabels: [
        Ability.VisualArticulation
    ],
};


export const GeometryBuildShapeViewSchema = {} as const;

export type GeometryBuildShapeViewConfig = ConfigFromSchema<typeof GeometryBuildShapeViewSchema>;
