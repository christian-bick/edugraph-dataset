import {
    GeometryPrimitiveCandidate,
    GeometryPrimitiveCandidateId,
    GeometryPrimitiveKind,
    GeometryPrimitiveScene
} from '../../../types/problems.ts';

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

const point = (id: string, label: string, x: number, y: number, labelX: number, labelY: number) => ({
    id,
    label,
    x,
    y,
    labelPosition: {x: labelX, y: labelY}
});

const stroke = (
    id: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    arrowStart = false,
    arrowEnd = false
) => ({
    id,
    start: {x: startX, y: startY},
    end: {x: endX, y: endY},
    arrowStart,
    arrowEnd
});

const emptyScene = (): GeometryPrimitiveScene => ({points: [], strokes: [], markers: []});

export function primitiveGuideScene(kind: GeometryPrimitiveKind): GeometryPrimitiveScene {
    if (kind === 'point') return emptyScene();
    if (kind === 'line' || kind === 'line-segment' || kind === 'ray') {
        return {
            points: [point('A', 'A', 25, 50, 19, 43), point('B', 'B', 75, 50, 79, 43)],
            strokes: [],
            markers: []
        };
    }
    if (kind === 'right-angle' || kind === 'acute-angle' || kind === 'obtuse-angle') {
        return {
            points: [point('O', 'O', 20, 75, 12, 84), point('A', 'A', 85, 75, 89, 83)],
            strokes: [stroke('OA', 20, 75, 90, 75, false, true)],
            markers: []
        };
    }
    if (kind === 'perpendicular-lines') {
        return {
            points: [point('O', 'O', 50, 50, 44, 44)],
            strokes: [stroke('given-line', 8, 50, 92, 50, true, true)],
            markers: []
        };
    }
    return {
        points: [point('P', 'P', 50, 28, 55, 23)],
        strokes: [stroke('given-line', 10, 70, 90, 60, true, true)],
        markers: []
    };
}

export function completedPrimitiveScene(kind: GeometryPrimitiveKind): GeometryPrimitiveScene {
    if (kind === 'point') {
        return {
            points: [point('P', 'P', 50, 50, 56, 44)],
            strokes: [],
            markers: []
        };
    }
    if (kind === 'line') {
        return {
            points: [point('A', 'A', 25, 50, 19, 43), point('B', 'B', 75, 50, 79, 43)],
            strokes: [stroke('AB', 8, 50, 92, 50, true, true)],
            markers: []
        };
    }
    if (kind === 'line-segment') {
        return {
            points: [point('A', 'A', 20, 50, 14, 43), point('B', 'B', 80, 50, 84, 43)],
            strokes: [stroke('AB', 20, 50, 80, 50)],
            markers: []
        };
    }
    if (kind === 'ray') {
        return {
            points: [point('A', 'A', 20, 50, 14, 43), point('B', 'B', 65, 50, 69, 43)],
            strokes: [stroke('AB', 20, 50, 92, 50, false, true)],
            markers: []
        };
    }
    if (kind === 'right-angle') {
        return {
            points: [
                point('O', 'O', 20, 75, 12, 84),
                point('A', 'A', 85, 75, 89, 83),
                point('B', 'B', 20, 15, 10, 13)
            ],
            strokes: [
                stroke('OA', 20, 75, 90, 75, false, true),
                stroke('OB', 20, 75, 20, 10, false, true)
            ],
            markers: [{kind: 'right-angle', points: [{x: 34, y: 75}, {x: 34, y: 61}, {x: 20, y: 61}]}]
        };
    }
    if (kind === 'acute-angle') {
        return {
            points: [
                point('O', 'O', 20, 75, 12, 84),
                point('A', 'A', 85, 75, 89, 83),
                point('B', 'B', 65, 30, 69, 24)
            ],
            strokes: [
                stroke('OA', 20, 75, 90, 75, false, true),
                stroke('OB', 20, 75, 75, 20, false, true)
            ],
            markers: [{kind: 'angle-arc', center: {x: 20, y: 75}, radius: 20, startDegrees: 0, endDegrees: -45}]
        };
    }
    if (kind === 'obtuse-angle') {
        return {
            points: [
                point('O', 'O', 50, 75, 46, 85),
                point('A', 'A', 90, 75, 92, 83),
                point('B', 'B', 20, 45, 11, 41)
            ],
            strokes: [
                stroke('OA', 50, 75, 94, 75, false, true),
                stroke('OB', 50, 75, 10, 35, false, true)
            ],
            markers: [{kind: 'angle-arc', center: {x: 50, y: 75}, radius: 20, startDegrees: 0, endDegrees: -135}]
        };
    }
    if (kind === 'perpendicular-lines') {
        return {
            points: [point('O', 'O', 50, 50, 44, 44)],
            strokes: [
                stroke('horizontal', 8, 50, 92, 50, true, true),
                stroke('vertical', 50, 8, 50, 92, true, true)
            ],
            markers: [{kind: 'right-angle', points: [{x: 62, y: 50}, {x: 62, y: 38}, {x: 50, y: 38}]}]
        };
    }
    return {
        points: [point('P', 'P', 50, 28, 55, 23)],
        strokes: [
            stroke('lower', 10, 70, 90, 60, true, true),
            stroke('upper', 10, 33, 90, 23, true, true)
        ],
        markers: [{
            kind: 'parallel',
            strokes: [
                [{x: 47, y: 67}, {x: 51, y: 61}],
                [{x: 47, y: 31}, {x: 51, y: 25}]
            ]
        }]
    };
}

function shuffled<T>(values: readonly T[], seed: number): T[] {
    const result = [...values];
    let state = (seed ^ 0x9E3779B9) >>> 0;
    for (let index = result.length - 1; index > 0; index--) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        const swapIndex = state % (index + 1);
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}

export function primitiveIdentificationCandidates(
    targetKind: GeometryPrimitiveKind,
    seed: number
): {
    candidates: [
        GeometryPrimitiveCandidate,
        GeometryPrimitiveCandidate,
        GeometryPrimitiveCandidate,
        GeometryPrimitiveCandidate
    ];
    correctCandidateId: GeometryPrimitiveCandidateId;
} {
    const kinds = shuffled([targetKind, ...PRIMITIVE_DISTRACTORS[targetKind]], seed);
    const ids: readonly GeometryPrimitiveCandidateId[] = ['A', 'B', 'C', 'D'];
    const candidates = kinds.map((kind, index): GeometryPrimitiveCandidate => ({
        id: ids[index],
        kind,
        scene: completedPrimitiveScene(kind)
    })) as [
        GeometryPrimitiveCandidate,
        GeometryPrimitiveCandidate,
        GeometryPrimitiveCandidate,
        GeometryPrimitiveCandidate
    ];
    return {
        candidates,
        correctCandidateId: candidates.find(candidate => candidate.kind === targetKind)!.id
    };
}
