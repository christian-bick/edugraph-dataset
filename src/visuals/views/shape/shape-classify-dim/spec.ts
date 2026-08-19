import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-classify-dim',
    generalLabels: [
        Ability.ConceptClassification
    ]
};


export const ShapeClassifyDimViewSchema = {} as const;

export type ShapeClassifyDimViewConfig = ConfigFromSchema<typeof ShapeClassifyDimViewSchema>;
