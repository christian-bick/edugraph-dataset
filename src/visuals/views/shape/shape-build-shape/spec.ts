import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-build-shape',
    generalLabels: [
        Ability.VisualArticulation
    ],
};


export const ShapeBuildShapeViewSchema = {} as const;

export type ShapeBuildShapeViewConfig = ConfigFromSchema<typeof ShapeBuildShapeViewSchema>;
