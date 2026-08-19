import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-line-symmetry',
    generalLabels: []
};

const resolveTaskMode = (labels: string[]): 'identify' | 'draw' | undefined => {
    const identifies = labels.includes(Ability.ConceptClassification)
        && labels.includes(Ability.VisualRecognition)
        && !labels.includes(Ability.VisualArticulation);
    if (identifies) return 'identify';
    const draws = labels.includes(Ability.VisualArticulation)
        && !labels.includes(Ability.ConceptClassification)
        && !labels.includes(Ability.VisualRecognition);
    return draws ? 'draw' : undefined;
};

export const ShapeLineSymmetryViewSchema = {
    taskMode: [[
        Ability.ConceptClassification,
        Ability.VisualRecognition,
        Ability.VisualArticulation
    ], resolveTaskMode]
} as const;

export type ShapeLineSymmetryViewConfig = ConfigFromSchema<
    typeof ShapeLineSymmetryViewSchema
>;
