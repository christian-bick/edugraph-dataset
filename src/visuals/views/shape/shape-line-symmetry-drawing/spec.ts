import {Ability} from 'edugraph-ts';
import {random} from '../../../../lib/random.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {ontologyNeutral} from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'shape-line-symmetry-drawing',
    generalLabels: [Ability.VisualArticulation]
};

export type DrawingFigureKind = 'isosceles-triangle' | 'rectangle' | 'square';

const DRAWING_FIGURE_KINDS: readonly DrawingFigureKind[] = [
    'isosceles-triangle',
    'rectangle',
    'square'
];

export const selectDrawingFigureKind = (): DrawingFigureKind =>
    DRAWING_FIGURE_KINDS[Math.floor(random() * DRAWING_FIGURE_KINDS.length)];

export const ShapeLineSymmetryDrawingViewSchema = {
    figureKind: ontologyNeutral(selectDrawingFigureKind)
} as const;

export type ShapeLineSymmetryDrawingViewConfig = ConfigFromSchema<
    typeof ShapeLineSymmetryDrawingViewSchema
>;
