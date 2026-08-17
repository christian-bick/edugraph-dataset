import {GeometryPrimitiveKind} from '../../../types/problems.ts';

export type PrimitiveViewDescriptor = {
    displayName: string;
    indefiniteName: string;
    definition: string;
    drawingPrompt: string;
    drawingAnswer: string;
    drawingAnswerStatement: string;
    drawingExplanation: string;
    identificationPrompt: string;
};

export const PRIMITIVE_VIEW_DESCRIPTORS: Record<GeometryPrimitiveKind, PrimitiveViewDescriptor> = {
    point: {
        displayName: 'point',
        indefiniteName: 'a point',
        definition: 'A point is an exact location with no length, width, or thickness.',
        drawingPrompt: 'Draw and label point P.',
        drawingAnswer: 'Point P',
        drawingAnswerStatement: 'The completed construction shows point P.',
        drawingExplanation: 'A single marked location labeled P represents the point.',
        identificationPrompt: 'Which diagram shows only a single point?'
    },
    line: {
        displayName: 'line',
        indefiniteName: 'a line',
        definition: 'A line is a straight path that extends forever in both directions.',
        drawingPrompt: 'Draw a line through points A and B.',
        drawingAnswer: 'Line AB',
        drawingAnswerStatement: 'The completed construction shows line AB.',
        drawingExplanation: 'The arrow at each end shows that line AB continues in both directions.',
        identificationPrompt: 'Which diagram shows one line extending in both directions?'
    },
    'line-segment': {
        displayName: 'line segment',
        indefiniteName: 'a line segment',
        definition: 'A line segment is part of a line with two endpoints.',
        drawingPrompt: 'Draw line segment AB.',
        drawingAnswer: 'Line segment AB',
        drawingAnswerStatement: 'The completed construction shows line segment AB.',
        drawingExplanation: 'The straight path stops at endpoints A and B and has no arrows.',
        identificationPrompt: 'Which diagram shows one line segment with two endpoints?'
    },
    ray: {
        displayName: 'ray',
        indefiniteName: 'a ray',
        definition: 'A ray is part of a line with one endpoint that extends forever in one direction.',
        drawingPrompt: 'Draw ray AB with endpoint A.',
        drawingAnswer: 'Ray AB',
        drawingAnswerStatement: 'The completed construction shows ray AB.',
        drawingExplanation: 'Ray AB starts at endpoint A, passes through B, and continues in the arrow direction.',
        identificationPrompt: 'Which diagram shows one ray with a single endpoint?'
    },
    'right-angle': {
        displayName: 'right angle',
        indefiniteName: 'a right angle',
        definition: 'A right angle forms a square corner.',
        drawingPrompt: 'Draw a right angle with vertex O and initial ray OA.',
        drawingAnswer: 'Right angle AOB',
        drawingAnswerStatement: 'The completed construction shows right angle AOB.',
        drawingExplanation: 'The two rays form a square corner, confirmed by the right-angle marker.',
        identificationPrompt: 'Which diagram shows two rays forming a right angle?'
    },
    'acute-angle': {
        displayName: 'acute angle',
        indefiniteName: 'an acute angle',
        definition: 'An acute angle is smaller than a right angle.',
        drawingPrompt: 'Draw an acute angle with vertex O and initial ray OA.',
        drawingAnswer: 'Acute angle AOB',
        drawingAnswerStatement: 'The completed construction shows acute angle AOB.',
        drawingExplanation: 'The opening between rays OA and OB is smaller than a right angle.',
        identificationPrompt: 'Which diagram shows two rays forming an acute angle?'
    },
    'obtuse-angle': {
        displayName: 'obtuse angle',
        indefiniteName: 'an obtuse angle',
        definition: 'An obtuse angle is larger than a right angle and smaller than a straight angle.',
        drawingPrompt: 'Draw an obtuse angle with vertex O and initial ray OA.',
        drawingAnswer: 'Obtuse angle AOB',
        drawingAnswerStatement: 'The completed construction shows obtuse angle AOB.',
        drawingExplanation: 'The opening between rays OA and OB is larger than a right angle and smaller than a straight angle.',
        identificationPrompt: 'Which diagram shows two rays forming an obtuse angle?'
    },
    'perpendicular-lines': {
        displayName: 'perpendicular lines',
        indefiniteName: 'perpendicular lines',
        definition: 'Perpendicular lines intersect to form right angles.',
        drawingPrompt: 'Draw a line through O perpendicular to the shown line.',
        drawingAnswer: 'Perpendicular lines',
        drawingAnswerStatement: 'The completed construction shows perpendicular lines intersecting at O.',
        drawingExplanation: 'The added line intersects the given line at O and forms a right angle.',
        identificationPrompt: 'Which diagram shows two perpendicular lines?'
    },
    'parallel-lines': {
        displayName: 'parallel lines',
        indefiniteName: 'parallel lines',
        definition: 'Parallel lines are coplanar lines that never intersect.',
        drawingPrompt: 'Draw a line through P parallel to the shown line.',
        drawingAnswer: 'Parallel lines',
        drawingAnswerStatement: 'The completed construction shows two parallel lines.',
        drawingExplanation: 'The added line passes through P and keeps the same direction as the given line.',
        identificationPrompt: 'Which diagram shows two parallel lines?'
    }
};

export const PRIMITIVE_DISTRACTORS: Record<GeometryPrimitiveKind, readonly GeometryPrimitiveKind[]> = {
    point: ['line-segment', 'line', 'ray'],
    line: ['line-segment', 'ray', 'parallel-lines'],
    'line-segment': ['line', 'ray', 'point'],
    ray: ['line', 'line-segment', 'point'],
    'right-angle': ['acute-angle', 'obtuse-angle', 'parallel-lines'],
    'acute-angle': ['right-angle', 'obtuse-angle', 'ray'],
    'obtuse-angle': ['acute-angle', 'right-angle', 'ray'],
    'perpendicular-lines': ['parallel-lines', 'line', 'right-angle'],
    'parallel-lines': ['perpendicular-lines', 'line', 'line-segment']
};
