import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {
    GeometryPrimitiveKind,
    GeometryPrimitiveScene,
    GeometryPrimitivesProblem
} from '../../../types/problems.ts';
import {GeometryPrimitivesGenerator} from './generator.ts';
import {
    GEOMETRY_PRIMITIVE_LABELS,
    GeometryPrimitivesGeneratorConfig
} from './spec.ts';

const generator = new GeometryPrimitivesGenerator();

const CASES = [
    {
        label: Area.PointConcept,
        kind: 'point',
        displayName: 'point',
        indefiniteName: 'a point',
        definition: 'A point is an exact location with no length, width, or thickness.',
        prompt: 'Draw and label point P.',
        identificationPrompt: 'Which diagram shows only a single point?',
        answer: 'Point P',
        answerStatement: 'The completed construction shows point P.',
        explanation: 'A single marked location labeled P represents the point.'
    },
    {
        label: Area.LineConcept,
        kind: 'line',
        displayName: 'line',
        indefiniteName: 'a line',
        definition: 'A line is a straight path that extends forever in both directions.',
        prompt: 'Draw a line through points A and B.',
        identificationPrompt: 'Which diagram shows one line extending in both directions?',
        answer: 'Line AB',
        answerStatement: 'The completed construction shows line AB.',
        explanation: 'The arrow at each end shows that line AB continues in both directions.'
    },
    {
        label: Area.LineSegment,
        kind: 'line-segment',
        displayName: 'line segment',
        indefiniteName: 'a line segment',
        definition: 'A line segment is part of a line with two endpoints.',
        prompt: 'Draw line segment AB.',
        identificationPrompt: 'Which diagram shows one line segment with two endpoints?',
        answer: 'Line segment AB',
        answerStatement: 'The completed construction shows line segment AB.',
        explanation: 'The straight path stops at endpoints A and B and has no arrows.'
    },
    {
        label: Area.RayConcept,
        kind: 'ray',
        displayName: 'ray',
        indefiniteName: 'a ray',
        definition: 'A ray is part of a line with one endpoint that extends forever in one direction.',
        prompt: 'Draw ray AB with endpoint A.',
        identificationPrompt: 'Which diagram shows one ray with a single endpoint?',
        answer: 'Ray AB',
        answerStatement: 'The completed construction shows ray AB.',
        explanation: 'Ray AB starts at endpoint A, passes through B, and continues in the arrow direction.'
    },
    {
        label: Area.RightAngle,
        kind: 'right-angle',
        displayName: 'right angle',
        indefiniteName: 'a right angle',
        definition: 'A right angle forms a square corner.',
        prompt: 'Draw a right angle with vertex O and initial ray OA.',
        identificationPrompt: 'Which diagram shows two rays forming a right angle?',
        answer: 'Right angle AOB',
        answerStatement: 'The completed construction shows right angle AOB.',
        explanation: 'The two rays form a square corner, confirmed by the right-angle marker.'
    },
    {
        label: Area.AcuteAngle,
        kind: 'acute-angle',
        displayName: 'acute angle',
        indefiniteName: 'an acute angle',
        definition: 'An acute angle is smaller than a right angle.',
        prompt: 'Draw an acute angle with vertex O and initial ray OA.',
        identificationPrompt: 'Which diagram shows two rays forming an acute angle?',
        answer: 'Acute angle AOB',
        answerStatement: 'The completed construction shows acute angle AOB.',
        explanation: 'The opening between rays OA and OB is smaller than a right angle.'
    },
    {
        label: Area.ObtuseAngle,
        kind: 'obtuse-angle',
        displayName: 'obtuse angle',
        indefiniteName: 'an obtuse angle',
        definition: 'An obtuse angle is larger than a right angle and smaller than a straight angle.',
        prompt: 'Draw an obtuse angle with vertex O and initial ray OA.',
        identificationPrompt: 'Which diagram shows two rays forming an obtuse angle?',
        answer: 'Obtuse angle AOB',
        answerStatement: 'The completed construction shows obtuse angle AOB.',
        explanation: 'The opening between rays OA and OB is larger than a right angle and smaller than a straight angle.'
    },
    {
        label: Area.PerpendicularityRelation,
        kind: 'perpendicular-lines',
        displayName: 'perpendicular lines',
        indefiniteName: 'perpendicular lines',
        definition: 'Perpendicular lines intersect to form right angles.',
        prompt: 'Draw a line through O perpendicular to the shown line.',
        identificationPrompt: 'Which diagram shows two perpendicular lines?',
        answer: 'Perpendicular lines',
        answerStatement: 'The completed construction shows perpendicular lines intersecting at O.',
        explanation: 'The added line intersects the given line at O and forms a right angle.'
    },
    {
        label: Area.ParallelismRelation,
        kind: 'parallel-lines',
        displayName: 'parallel lines',
        indefiniteName: 'parallel lines',
        definition: 'Parallel lines are coplanar lines that never intersect.',
        prompt: 'Draw a line through P parallel to the shown line.',
        identificationPrompt: 'Which diagram shows two parallel lines?',
        answer: 'Parallel lines',
        answerStatement: 'The completed construction shows two parallel lines.',
        explanation: 'The added line passes through P and keeps the same direction as the given line.'
    }
] as const;

function expectSceneCoordinates(scene: GeometryPrimitiveScene): void {
    for (const point of scene.points) {
        expect(point.id).not.toBe('');
        expect(point.label).not.toBe('');
        for (const coordinate of [point, point.labelPosition]) {
            expect(coordinate.x).toBeGreaterThanOrEqual(0);
            expect(coordinate.x).toBeLessThanOrEqual(100);
            expect(coordinate.y).toBeGreaterThanOrEqual(0);
            expect(coordinate.y).toBeLessThanOrEqual(100);
        }
    }
    for (const stroke of scene.strokes) {
        expect(stroke.id).not.toBe('');
        for (const coordinate of [stroke.start, stroke.end]) {
            expect(coordinate.x).toBeGreaterThanOrEqual(0);
            expect(coordinate.x).toBeLessThanOrEqual(100);
            expect(coordinate.y).toBeGreaterThanOrEqual(0);
            expect(coordinate.y).toBeLessThanOrEqual(100);
        }
        expect(typeof stroke.arrowStart).toBe('boolean');
        expect(typeof stroke.arrowEnd).toBe('boolean');
    }
}

function expectPointOnStroke(
    point: GeometryPrimitiveScene['points'][number],
    stroke: GeometryPrimitiveScene['strokes'][number]
): void {
    const crossProduct =
        (point.x - stroke.start.x) * (stroke.end.y - stroke.start.y)
        - (point.y - stroke.start.y) * (stroke.end.x - stroke.start.x);
    expect(Math.abs(crossProduct)).toBe(0);
}

function expectPrimitiveSemantics(kind: GeometryPrimitiveKind, data: GeometryPrimitivesProblem): void {
    const {guideScene, solutionScene} = data.drawing;
    if (kind === 'point') {
        expect(guideScene).toEqual({points: [], strokes: [], markers: []});
        expect(solutionScene.points.map(point => point.label)).toEqual(['P']);
        expect(solutionScene.strokes).toHaveLength(0);
        return;
    }
    if (kind === 'line' || kind === 'line-segment' || kind === 'ray') {
        expect(guideScene.points.map(point => point.label)).toEqual(['A', 'B']);
        expect(guideScene.strokes).toHaveLength(0);
        expect(solutionScene.strokes).toHaveLength(1);
        const [stroke] = solutionScene.strokes;
        for (const point of solutionScene.points) expectPointOnStroke(point, stroke);
        expect([stroke.arrowStart, stroke.arrowEnd]).toEqual(
            kind === 'line' ? [true, true] : kind === 'ray' ? [false, true] : [false, false]
        );
        return;
    }
    if (kind === 'right-angle' || kind === 'acute-angle' || kind === 'obtuse-angle') {
        expect(guideScene.points.map(point => point.label)).toEqual(['O', 'A']);
        expect(guideScene.strokes.map(stroke => stroke.id)).toEqual(['OA']);
        expect(solutionScene.strokes.map(stroke => stroke.id)).toEqual(['OA', 'OB']);
        const pointO = solutionScene.points.find(point => point.id === 'O')!;
        const pointA = solutionScene.points.find(point => point.id === 'A')!;
        const pointB = solutionScene.points.find(point => point.id === 'B')!;
        expectPointOnStroke(pointO, solutionScene.strokes[0]);
        expectPointOnStroke(pointA, solutionScene.strokes[0]);
        expectPointOnStroke(pointO, solutionScene.strokes[1]);
        expectPointOnStroke(pointB, solutionScene.strokes[1]);
        expect(solutionScene.markers.map(marker => marker.kind)).toEqual([
            kind === 'right-angle' ? 'right-angle' : 'angle-arc'
        ]);
        return;
    }
    if (kind === 'perpendicular-lines') {
        expect(guideScene.strokes.map(stroke => stroke.id)).toEqual(['given-line']);
        expect(guideScene.points[0].labelPosition).toEqual({x: 44, y: 44});
        expect(solutionScene.strokes).toHaveLength(2);
        expect(solutionScene.points[0].labelPosition).toEqual({x: 44, y: 44});
        expect(solutionScene.strokes.every(stroke => stroke.arrowStart && stroke.arrowEnd)).toBe(true);
        const pointO = solutionScene.points.find(point => point.id === 'O')!;
        for (const stroke of solutionScene.strokes) expectPointOnStroke(pointO, stroke);
        expect(solutionScene.markers.map(marker => marker.kind)).toEqual(['right-angle']);
        return;
    }
    expect(kind).toBe('parallel-lines');
    expect(guideScene.points.map(point => point.label)).toEqual(['P']);
    expect(guideScene.strokes.map(stroke => stroke.id)).toEqual(['given-line']);
    expect(solutionScene.strokes).toHaveLength(2);
    expect(solutionScene.strokes.every(stroke => stroke.arrowStart && stroke.arrowEnd)).toBe(true);
    expect(solutionScene.markers.map(marker => marker.kind)).toEqual(['parallel']);
    const pointP = solutionScene.points.find(point => point.id === 'P')!;
    const [lower, upper] = solutionScene.strokes;
    expectPointOnStroke(pointP, upper);
    expect(upper.end.x - upper.start.x).toBe(lower.end.x - lower.start.x);
    expect(upper.end.y - upper.start.y).toBe(lower.end.y - lower.start.y);
    expect(upper.start.y - lower.start.y).toBe(upper.end.y - lower.end.y);
}

describe('GeometryPrimitivesGenerator', () => {
    it('strictly requires a primitive label', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
    });

    it.each(CASES)('authors complete $kind drawing and identification payloads', expected => {
        setSeed(`geometry-primitives-${expected.kind}`);
        const data = generator.generate({primitive: expected.label})!.data;

        expect(data.primitiveKind).toBe(expected.kind);
        expect(data.displayName).toBe(expected.displayName);
        expect(data.definition).toBe(expected.definition);
        expect(data.drawing.prompt).toBe(expected.prompt);
        expect(data.drawing.answer).toBe(expected.answer);
        expect(data.drawing.answerStatement).toBe(expected.answerStatement);
        expect(data.drawing.explanation).toBe(expected.explanation);
        expect(data.identification.prompt).toBe(expected.identificationPrompt);
        expect(data.identification.answer).toBe(
            `Diagram ${data.identification.correctCandidateId}: ${expected.displayName}`
        );
        expect(data.identification.answerStatement).toBe(
            `Diagram ${data.identification.correctCandidateId} shows ${expected.indefiniteName}.`
        );
        expect(data.identification.explanation).toBe(
            `${data.identification.answerStatement} ${expected.definition}`
        );

        expectPrimitiveSemantics(expected.kind, data);
        expectSceneCoordinates(data.drawing.guideScene);
        expectSceneCoordinates(data.drawing.solutionScene);

        const candidates = data.identification.candidates;
        expect(candidates.map(candidate => candidate.id)).toEqual(['A', 'B', 'C', 'D']);
        expect(new Set(candidates.map(candidate => candidate.kind)).size).toBe(4);
        expect(candidates.filter(candidate => candidate.kind === expected.kind)).toHaveLength(1);
        expect(candidates.find(candidate => candidate.id === data.identification.correctCandidateId)?.kind)
            .toBe(expected.kind);
        for (const candidate of candidates) expectSceneCoordinates(candidate.scene);
    });

    it('rejects unsupported primitive labels', () => {
        expect(generator.generate({primitive: 'unsupported'} as unknown as GeometryPrimitivesGeneratorConfig))
            .toBeNull();
    });

    it('is deterministic while varying candidate order across seeds', () => {
        setSeed('geometry-primitives-deterministic');
        const first = generator.generate({primitive: Area.RayConcept});
        setSeed('geometry-primitives-deterministic');
        expect(generator.generate({primitive: Area.RayConcept})).toEqual(first);

        const correctIds = new Set<string>();
        for (let seed = 0; seed < 80; seed++) {
            setSeed(`geometry-primitives-order-${seed}`);
            correctIds.add(generator.generate({primitive: Area.RayConcept})!.data.identification.correctCandidateId);
        }
        expect(correctIds).toEqual(new Set(['A', 'B', 'C', 'D']));
    });

    it('declares every supported primitive exactly once', () => {
        expect(GEOMETRY_PRIMITIVE_LABELS).toHaveLength(9);
        expect(new Set(GEOMETRY_PRIMITIVE_LABELS).size).toBe(9);
        expect(CASES.map(entry => entry.label)).toEqual([...GEOMETRY_PRIMITIVE_LABELS]);
    });
});
