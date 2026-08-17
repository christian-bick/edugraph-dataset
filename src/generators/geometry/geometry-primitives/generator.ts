import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    GeometryPrimitiveCandidate,
    GeometryPrimitiveCandidateId,
    GeometryPrimitiveKind,
    GeometryPrimitiveScene,
    GeometryPrimitivesProblem
} from '../../../types/problems.ts';
import {
    GeometryPrimitivesGeneratorConfig,
    GeometryPrimitivesGeneratorSchema
} from './spec.ts';

type PrimitiveLabel = GeometryPrimitivesGeneratorConfig['primitive'];

type PrimitiveDescriptor = {
    label: PrimitiveLabel;
    kind: GeometryPrimitiveKind;
    displayName: string;
    indefiniteName: string;
    definition: string;
    drawingPrompt: string;
    identificationPrompt: string;
    drawingAnswer: string;
    drawingAnswerStatement: string;
    drawingExplanation: string;
};

const POINT = (id: string, label: string, x: number, y: number, labelX: number, labelY: number) => ({
    id,
    label,
    x,
    y,
    labelPosition: {x: labelX, y: labelY}
});

const STROKE = (
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

const EMPTY_SCENE = (): GeometryPrimitiveScene => ({points: [], strokes: [], markers: []});

const DESCRIPTORS: readonly PrimitiveDescriptor[] = [
    {
        label: Area.PointConcept,
        kind: 'point',
        displayName: 'point',
        indefiniteName: 'a point',
        definition: 'A point is an exact location with no length, width, or thickness.',
        drawingPrompt: 'Draw and label point P.',
        identificationPrompt: 'Which diagram shows only a single point?',
        drawingAnswer: 'Point P',
        drawingAnswerStatement: 'The completed construction shows point P.',
        drawingExplanation: 'A single marked location labeled P represents the point.'
    },
    {
        label: Area.LineConcept,
        kind: 'line',
        displayName: 'line',
        indefiniteName: 'a line',
        definition: 'A line is a straight path that extends forever in both directions.',
        drawingPrompt: 'Draw a line through points A and B.',
        identificationPrompt: 'Which diagram shows one line extending in both directions?',
        drawingAnswer: 'Line AB',
        drawingAnswerStatement: 'The completed construction shows line AB.',
        drawingExplanation: 'The arrow at each end shows that line AB continues in both directions.'
    },
    {
        label: Area.LineSegment,
        kind: 'line-segment',
        displayName: 'line segment',
        indefiniteName: 'a line segment',
        definition: 'A line segment is part of a line with two endpoints.',
        drawingPrompt: 'Draw line segment AB.',
        identificationPrompt: 'Which diagram shows one line segment with two endpoints?',
        drawingAnswer: 'Line segment AB',
        drawingAnswerStatement: 'The completed construction shows line segment AB.',
        drawingExplanation: 'The straight path stops at endpoints A and B and has no arrows.'
    },
    {
        label: Area.RayConcept,
        kind: 'ray',
        displayName: 'ray',
        indefiniteName: 'a ray',
        definition: 'A ray is part of a line with one endpoint that extends forever in one direction.',
        drawingPrompt: 'Draw ray AB with endpoint A.',
        identificationPrompt: 'Which diagram shows one ray with a single endpoint?',
        drawingAnswer: 'Ray AB',
        drawingAnswerStatement: 'The completed construction shows ray AB.',
        drawingExplanation: 'Ray AB starts at endpoint A, passes through B, and continues in the arrow direction.'
    },
    {
        label: Area.RightAngle,
        kind: 'right-angle',
        displayName: 'right angle',
        indefiniteName: 'a right angle',
        definition: 'A right angle forms a square corner.',
        drawingPrompt: 'Draw a right angle with vertex O and initial ray OA.',
        identificationPrompt: 'Which diagram shows two rays forming a right angle?',
        drawingAnswer: 'Right angle AOB',
        drawingAnswerStatement: 'The completed construction shows right angle AOB.',
        drawingExplanation: 'The two rays form a square corner, confirmed by the right-angle marker.'
    },
    {
        label: Area.AcuteAngle,
        kind: 'acute-angle',
        displayName: 'acute angle',
        indefiniteName: 'an acute angle',
        definition: 'An acute angle is smaller than a right angle.',
        drawingPrompt: 'Draw an acute angle with vertex O and initial ray OA.',
        identificationPrompt: 'Which diagram shows two rays forming an acute angle?',
        drawingAnswer: 'Acute angle AOB',
        drawingAnswerStatement: 'The completed construction shows acute angle AOB.',
        drawingExplanation: 'The opening between rays OA and OB is smaller than a right angle.'
    },
    {
        label: Area.ObtuseAngle,
        kind: 'obtuse-angle',
        displayName: 'obtuse angle',
        indefiniteName: 'an obtuse angle',
        definition: 'An obtuse angle is larger than a right angle and smaller than a straight angle.',
        drawingPrompt: 'Draw an obtuse angle with vertex O and initial ray OA.',
        identificationPrompt: 'Which diagram shows two rays forming an obtuse angle?',
        drawingAnswer: 'Obtuse angle AOB',
        drawingAnswerStatement: 'The completed construction shows obtuse angle AOB.',
        drawingExplanation: 'The opening between rays OA and OB is larger than a right angle and smaller than a straight angle.'
    },
    {
        label: Area.PerpendicularityRelation,
        kind: 'perpendicular-lines',
        displayName: 'perpendicular lines',
        indefiniteName: 'perpendicular lines',
        definition: 'Perpendicular lines intersect to form right angles.',
        drawingPrompt: 'Draw a line through O perpendicular to the shown line.',
        identificationPrompt: 'Which diagram shows two perpendicular lines?',
        drawingAnswer: 'Perpendicular lines',
        drawingAnswerStatement: 'The completed construction shows perpendicular lines intersecting at O.',
        drawingExplanation: 'The added line intersects the given line at O and forms a right angle.'
    },
    {
        label: Area.ParallelismRelation,
        kind: 'parallel-lines',
        displayName: 'parallel lines',
        indefiniteName: 'parallel lines',
        definition: 'Parallel lines are coplanar lines that never intersect.',
        drawingPrompt: 'Draw a line through P parallel to the shown line.',
        identificationPrompt: 'Which diagram shows two parallel lines?',
        drawingAnswer: 'Parallel lines',
        drawingAnswerStatement: 'The completed construction shows two parallel lines.',
        drawingExplanation: 'The added line passes through P and keeps the same direction as the given line.'
    }
];

const DISTRACTORS: Record<GeometryPrimitiveKind, readonly GeometryPrimitiveKind[]> = {
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

function descriptorFromLabel(label: PrimitiveLabel): PrimitiveDescriptor | undefined {
    return DESCRIPTORS.find(descriptor => descriptor.label === label);
}

function guideScene(kind: GeometryPrimitiveKind): GeometryPrimitiveScene {
    if (kind === 'point') return EMPTY_SCENE();
    if (kind === 'line' || kind === 'line-segment' || kind === 'ray') {
        return {
            points: [POINT('A', 'A', 25, 50, 19, 43), POINT('B', 'B', 75, 50, 79, 43)],
            strokes: [],
            markers: []
        };
    }
    if (kind === 'right-angle' || kind === 'acute-angle' || kind === 'obtuse-angle') {
        return {
            points: [POINT('O', 'O', 20, 75, 12, 84), POINT('A', 'A', 85, 75, 89, 83)],
            strokes: [STROKE('OA', 20, 75, 90, 75, false, true)],
            markers: []
        };
    }
    if (kind === 'perpendicular-lines') {
        return {
            points: [POINT('O', 'O', 50, 50, 44, 44)],
            strokes: [STROKE('given-line', 8, 50, 92, 50, true, true)],
            markers: []
        };
    }
    return {
        points: [POINT('P', 'P', 50, 28, 55, 23)],
        strokes: [STROKE('given-line', 10, 70, 90, 60, true, true)],
        markers: []
    };
}

function completedScene(kind: GeometryPrimitiveKind): GeometryPrimitiveScene {
    if (kind === 'point') {
        return {
            points: [POINT('P', 'P', 50, 50, 56, 44)],
            strokes: [],
            markers: []
        };
    }
    if (kind === 'line') {
        return {
            points: [POINT('A', 'A', 25, 50, 19, 43), POINT('B', 'B', 75, 50, 79, 43)],
            strokes: [STROKE('AB', 8, 50, 92, 50, true, true)],
            markers: []
        };
    }
    if (kind === 'line-segment') {
        return {
            points: [POINT('A', 'A', 20, 50, 14, 43), POINT('B', 'B', 80, 50, 84, 43)],
            strokes: [STROKE('AB', 20, 50, 80, 50)],
            markers: []
        };
    }
    if (kind === 'ray') {
        return {
            points: [POINT('A', 'A', 20, 50, 14, 43), POINT('B', 'B', 65, 50, 69, 43)],
            strokes: [STROKE('AB', 20, 50, 92, 50, false, true)],
            markers: []
        };
    }
    if (kind === 'right-angle') {
        return {
            points: [
                POINT('O', 'O', 20, 75, 12, 84),
                POINT('A', 'A', 85, 75, 89, 83),
                POINT('B', 'B', 20, 15, 10, 13)
            ],
            strokes: [
                STROKE('OA', 20, 75, 90, 75, false, true),
                STROKE('OB', 20, 75, 20, 10, false, true)
            ],
            markers: [{kind: 'right-angle', points: [{x: 34, y: 75}, {x: 34, y: 61}, {x: 20, y: 61}]}]
        };
    }
    if (kind === 'acute-angle') {
        return {
            points: [
                POINT('O', 'O', 20, 75, 12, 84),
                POINT('A', 'A', 85, 75, 89, 83),
                POINT('B', 'B', 65, 30, 69, 24)
            ],
            strokes: [
                STROKE('OA', 20, 75, 90, 75, false, true),
                STROKE('OB', 20, 75, 75, 20, false, true)
            ],
            markers: [{kind: 'angle-arc', center: {x: 20, y: 75}, radius: 20, startDegrees: 0, endDegrees: -45}]
        };
    }
    if (kind === 'obtuse-angle') {
        return {
            points: [
                POINT('O', 'O', 50, 75, 46, 85),
                POINT('A', 'A', 90, 75, 92, 83),
                POINT('B', 'B', 20, 45, 11, 41)
            ],
            strokes: [
                STROKE('OA', 50, 75, 94, 75, false, true),
                STROKE('OB', 50, 75, 10, 35, false, true)
            ],
            markers: [{kind: 'angle-arc', center: {x: 50, y: 75}, radius: 20, startDegrees: 0, endDegrees: -135}]
        };
    }
    if (kind === 'perpendicular-lines') {
        return {
            points: [POINT('O', 'O', 50, 50, 44, 44)],
            strokes: [
                STROKE('horizontal', 8, 50, 92, 50, true, true),
                STROKE('vertical', 50, 8, 50, 92, true, true)
            ],
            markers: [{kind: 'right-angle', points: [{x: 62, y: 50}, {x: 62, y: 38}, {x: 50, y: 38}]}]
        };
    }
    return {
        points: [POINT('P', 'P', 50, 28, 55, 23)],
        strokes: [
            STROKE('lower', 10, 70, 90, 60, true, true),
            STROKE('upper', 10, 33, 90, 23, true, true)
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

function shuffle<T>(items: readonly T[]): T[] {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
}

function identificationCandidates(targetKind: GeometryPrimitiveKind): {
    candidates: GeometryPrimitivesProblem['identification']['candidates'];
    correctCandidateId: GeometryPrimitiveCandidateId;
} {
    const kinds = shuffle([targetKind, ...DISTRACTORS[targetKind]]);
    const ids: readonly GeometryPrimitiveCandidateId[] = ['A', 'B', 'C', 'D'];
    const candidates = kinds.map((kind, index): GeometryPrimitiveCandidate => ({
        id: ids[index],
        kind,
        scene: completedScene(kind)
    })) as GeometryPrimitivesProblem['identification']['candidates'];
    return {
        candidates,
        correctCandidateId: candidates.find(candidate => candidate.kind === targetKind)!.id
    };
}

export class GeometryPrimitivesGenerator implements ProblemGenerator<
    GeometryPrimitivesProblem,
    GeometryPrimitivesGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = GeometryPrimitivesGeneratorSchema;

    generate(config: GeometryPrimitivesGeneratorConfig): ProblemStub<GeometryPrimitivesProblem> | null {
        validateConfigFields('geometry-primitives', config, ['primitive']);
        const descriptor = descriptorFromLabel(config.primitive);
        if (!descriptor) return null;

        const {candidates, correctCandidateId} = identificationCandidates(descriptor.kind);
        const identificationAnswer = `Diagram ${correctCandidateId}: ${descriptor.displayName}`;
        const identificationAnswerStatement = `Diagram ${correctCandidateId} shows ${descriptor.indefiniteName}.`;

        return {
            data: {
                primitiveKind: descriptor.kind,
                displayName: descriptor.displayName,
                definition: descriptor.definition,
                drawing: {
                    prompt: descriptor.drawingPrompt,
                    guideScene: guideScene(descriptor.kind),
                    solutionScene: completedScene(descriptor.kind),
                    answer: descriptor.drawingAnswer,
                    answerStatement: descriptor.drawingAnswerStatement,
                    explanation: descriptor.drawingExplanation
                },
                identification: {
                    prompt: descriptor.identificationPrompt,
                    candidates,
                    correctCandidateId,
                    answer: identificationAnswer,
                    answerStatement: identificationAnswerStatement,
                    explanation: `${identificationAnswerStatement} ${descriptor.definition}`
                }
            }
        };
    }
}
