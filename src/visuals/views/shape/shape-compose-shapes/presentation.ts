import {
    ShapeCompositionNode,
    ShapeCompositionShapeId,
    ShapeCompositionTargetId,
    ShapeComposeShapesProblem
} from '../../../../types/problems.ts';
import {ViewValidationError} from '../../../helpers/validation.ts';

export type ShapeCompositionGlyph = 'triangle' | 'circle' | 'cube' | 'cone' | 'cylinder' | 'generic';

type ShapePresentation = {
    label: string;
    plural: string;
    glyph: ShapeCompositionGlyph;
    diagramTarget: ShapeCompositionTargetId;
};

const SHAPE_PRESENTATION = {
    rectangle: {label: 'rectangle', plural: 'rectangles', glyph: 'generic', diagramTarget: 'rectangle'},
    square: {label: 'square', plural: 'squares', glyph: 'generic', diagramTarget: 'square'},
    triangle: {label: 'triangle', plural: 'triangles', glyph: 'triangle', diagramTarget: 'triangle'},
    hexagon: {label: 'hexagon', plural: 'hexagons', glyph: 'generic', diagramTarget: 'hexagon'},
    trapezoid: {label: 'trapezoid', plural: 'trapezoids', glyph: 'generic', diagramTarget: 'trapezoid'},
    'half-circle': {label: 'half circle', plural: 'half circles', glyph: 'circle', diagramTarget: 'half-circle'},
    'quarter-circle': {label: 'quarter circle', plural: 'quarter circles', glyph: 'circle', diagramTarget: 'quarter-circle'},
    cube: {label: 'cube', plural: 'cubes', glyph: 'cube', diagramTarget: 'cube'},
    'rectangular-prism': {label: 'rectangular prism', plural: 'rectangular prisms', glyph: 'generic', diagramTarget: 'rectangular-prism'},
    cone: {label: 'cone', plural: 'cones', glyph: 'cone', diagramTarget: 'cone'},
    cylinder: {label: 'cylinder', plural: 'cylinders', glyph: 'cylinder', diagramTarget: 'cylinder'},
    'small-triangle': {label: 'smaller triangle', plural: 'smaller triangles', glyph: 'triangle', diagramTarget: 'triangle'},
    'tiny-triangle': {label: 'tiny triangle', plural: 'tiny triangles', glyph: 'triangle', diagramTarget: 'triangle'},
    'eighth-circle-piece': {label: 'eighth-circle piece', plural: 'eighth-circle pieces', glyph: 'circle', diagramTarget: 'quarter-circle'},
    'sixteenth-circle-piece': {label: 'sixteenth-circle piece', plural: 'sixteenth-circle pieces', glyph: 'circle', diagramTarget: 'quarter-circle'},
    'small-cube': {label: 'smaller cube', plural: 'smaller cubes', glyph: 'cube', diagramTarget: 'cube'},
    'half-cone': {label: 'half-cone', plural: 'half-cones', glyph: 'cone', diagramTarget: 'cone'},
    'quarter-cone-piece': {label: 'quarter-cone piece', plural: 'quarter-cone pieces', glyph: 'cone', diagramTarget: 'cone'},
    'short-cylinder': {label: 'shorter cylinder', plural: 'shorter cylinders', glyph: 'cylinder', diagramTarget: 'cylinder'},
    'cylinder-segment': {label: 'cylinder segment', plural: 'cylinder segments', glyph: 'cylinder', diagramTarget: 'cylinder'}
} as const satisfies Record<ShapeCompositionShapeId, ShapePresentation>;

const TARGET_IDS = [
    'rectangle',
    'square',
    'triangle',
    'hexagon',
    'trapezoid',
    'half-circle',
    'quarter-circle',
    'cube',
    'rectangular-prism',
    'cone',
    'cylinder'
] as const satisfies readonly ShapeCompositionTargetId[];

type AdditionalOptionId = 'circle' | 'sphere';
type OptionShapeId = ShapeCompositionShapeId | AdditionalOptionId;

const ADDITIONAL_OPTION_PLURALS: Record<AdditionalOptionId, string> = {
    circle: 'circles',
    sphere: 'spheres'
};

const DISTRACTOR_BY_TARGET = {
    rectangle: 'circle',
    square: 'circle',
    triangle: 'square',
    hexagon: 'circle',
    trapezoid: 'square',
    'half-circle': 'triangle',
    'quarter-circle': 'square',
    cube: 'cone',
    'rectangular-prism': 'sphere',
    cone: 'cylinder',
    cylinder: 'cone'
} as const satisfies Record<ShapeCompositionTargetId, OptionShapeId>;

const NUMBER_WORDS: Readonly<Record<number, string>> = {
    2: 'Two',
    3: 'Three',
    6: 'Six'
};

const isShapeId = (value: unknown): value is ShapeCompositionShapeId =>
    typeof value === 'string' && Object.hasOwn(SHAPE_PRESENTATION, value);

const isTargetId = (value: unknown): value is ShapeCompositionTargetId =>
    typeof value === 'string' && TARGET_IDS.includes(value as ShapeCompositionTargetId);

export const shapeCompositionLabel = (id: ShapeCompositionShapeId): string =>
    SHAPE_PRESENTATION[id].label;

export const shapeCompositionGlyph = (id: ShapeCompositionShapeId): ShapeCompositionGlyph =>
    SHAPE_PRESENTATION[id].glyph;

export const shapeCompositionDiagramTarget = (
    id: ShapeCompositionShapeId
): ShapeCompositionTargetId => SHAPE_PRESENTATION[id].diagramTarget;

const optionPlural = (id: OptionShapeId): string =>
    isShapeId(id) ? SHAPE_PRESENTATION[id].plural : ADDITIONAL_OPTION_PLURALS[id];

const validateNode = (node: ShapeCompositionNode, path: string): number => {
    if (!node || typeof node !== 'object' || !isShapeId(node.shape)) {
        throw new ViewValidationError('shape-compose-shapes', `${path} must use a supported shape ID.`);
    }
    if (node.kind === 'primitive') return 0;
    if (node.kind !== 'composite' || !Array.isArray(node.inputs) || node.inputs.length < 2) {
        throw new ViewValidationError('shape-compose-shapes', `${path} must be a composite with at least two inputs.`);
    }
    return 1 + Math.max(...node.inputs.map((input, index) => validateNode(input, `${path}.inputs[${index}]`)));
};

export const validateShapeComposition = (data: ShapeComposeShapesProblem): void => {
    const tree = data.compositionTree;
    if (!tree || tree.kind !== 'composite' || !isTargetId(tree.shape)) {
        throw new ViewValidationError('shape-compose-shapes', 'The composition-tree root must use a supported target ID.');
    }
    const derivedDepth = validateNode(tree, 'compositionTree');
    if (data.compositionDepth !== 1 && data.compositionDepth !== 2) {
        throw new ViewValidationError('shape-compose-shapes', 'Composition depth must be 1 or 2.');
    }
    if (derivedDepth !== data.compositionDepth) {
        throw new ViewValidationError('shape-compose-shapes', 'The composition tree must match its calculated depth.');
    }
    if (data.compositionDepth === 1 && tree.inputs.some(input => input.kind !== 'primitive')) {
        throw new ViewValidationError('shape-compose-shapes', 'Single-level composition inputs must all be primitive.');
    }
    if (data.compositionDepth === 2 && !tree.inputs.some(input => input.kind === 'composite')) {
        throw new ViewValidationError('shape-compose-shapes', 'Multi-level composition requires a composed intermediate input.');
    }
    if (!NUMBER_WORDS[tree.inputs.length]
        || new Set(tree.inputs.map(input => input.shape)).size !== 1) {
        throw new ViewValidationError(
            'shape-compose-shapes',
            'The root must compose two, three, or six pieces of one component kind.'
        );
    }
};

export type ShapeCompositionOption = {
    id: 'correct' | 'distractor';
    label: string;
    correct: boolean;
};

export const shapeCompositionOptions = (
    data: ShapeComposeShapesProblem,
    seed: number
): readonly [ShapeCompositionOption, ShapeCompositionOption] => {
    const inputs = data.compositionTree.inputs;
    const numberWord = NUMBER_WORDS[inputs.length];
    const componentId = inputs[0].shape;
    const distractorId = DISTRACTOR_BY_TARGET[data.compositionTree.shape];
    const options: [ShapeCompositionOption, ShapeCompositionOption] = [
        {id: 'correct', label: `${numberWord} ${optionPlural(componentId)}`, correct: true},
        {id: 'distractor', label: `${numberWord} ${optionPlural(distractorId)}`, correct: false}
    ];
    return (seed >>> 0) % 2 === 0 ? options : [options[1], options[0]];
};
