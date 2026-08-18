import {beforeEach, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import * as shapeHelpers from '../helpers.ts';
import {
    getDefiningAttributeStatements,
    getShapeDefinition,
    NON_DEFINING_ATTRIBUTE_STATEMENTS
} from '../helpers.ts';
import {ShapeClassifyAttributesGenerator} from './generator.ts';
import {Area, Scope} from 'edugraph-ts';
import {
    ShapeClassificationFigure,
    ShapeClassificationStroke,
} from '../../../types/problems.ts';

const legacyConfig = {
    subsumption: false,
    shapes: [],
    attributeCounts: [],
    criteria: []
};

describe('ShapeClassifyAttributesGenerator', () => {
    let generator: ShapeClassifyAttributesGenerator;

    beforeEach(() => {
        generator = new ShapeClassifyAttributesGenerator();
        setSeed(42);
    });

    it('has the shape problem type and accepts its default config', () => {
        expect(generator.type).toBe('shape');
        expect(generator.generate(legacyConfig)).not.toBeNull();
    });

    it('preserves the exact legacy payload and RNG path for seed 42', () => {
        setSeed(42);
        expect(generator.generate(legacyConfig)).toEqual({
            data: {
                shape: 'rectangle',
                definition: {
                    sideCount: 4,
                    vertexCount: 4,
                    closed: true,
                    boundary: 'straight',
                    rightAngleCount: 4
                },
                options: [
                    {text: 'is blue', kind: 'non-defining', id: 'A'},
                    {text: 'has 4 straight sides', kind: 'defining', id: 'B'},
                    {text: 'points upward', kind: 'non-defining', id: 'C'},
                    {text: 'is large', kind: 'non-defining', id: 'D'}
                ],
                answer: 'B'
            },
            tags: [Area.Rectangle]
        });
    });

    it('rejects a null config before generating', () => {
        expect(() => generator.generate(null as never)).toThrow(
            '[Generator: shape-classify-attributes] Validation Error'
        );
    });

    it('returns null when a selected ontology label has no shape mapping', () => {
        const shapeNameSpy = vi.spyOn(shapeHelpers, 'shapeNameFromLabel').mockReturnValueOnce(null);

        expect(generator.generate(legacyConfig)).toBeNull();
        expect(shapeNameSpy).toHaveBeenCalledOnce();
    });

    it('generates exactly one defining option and three non-defining options', () => {
        const stub = generator.generate(legacyConfig)!;
        expect('shape' in stub.data).toBe(true);
        if (stub.data.task !== undefined) return;
        const {shape, definition, options, answer} = stub.data;
        const definingOptions = options.filter(option => option.kind === 'defining');
        const nonDefiningOptions = options.filter(option => option.kind === 'non-defining');

        expect(options).toHaveLength(4);
        expect(options.map(option => option.id)).toEqual(['A', 'B', 'C', 'D']);
        expect(definingOptions).toHaveLength(1);
        expect(nonDefiningOptions).toHaveLength(3);
        expect(nonDefiningOptions.map(option => option.text).sort()).toEqual(
            [...NON_DEFINING_ATTRIBUTE_STATEMENTS].sort()
        );
        expect(getDefiningAttributeStatements(shape)).toContain(definingOptions[0].text);
        expect(definition).toEqual(getShapeDefinition(shape));
        expect(answer).toBe(definingOptions[0].id);
    });

    it('varies shapes, defining statements and answer positions across seeds', () => {
        const shapes = new Set<string>();
        const definingStatements = new Set<string>();
        const answerPositions = new Set<string>();

        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const stub = generator.generate(legacyConfig)!;
            if (stub.data.task !== undefined) throw new Error('Expected a legacy classification problem.');
            const definingOption = stub.data.options.find(option => option.kind === 'defining')!;

            shapes.add(stub.data.shape);
            definingStatements.add(definingOption.text);
            answerPositions.add(stub.data.answer);
        }

        expect(shapes.size).toBe(5);
        expect(definingStatements.size).toBeGreaterThanOrEqual(6);
        expect(answerPositions.size).toBe(4);
    });

    it('is deterministic for the same seed', () => {
        setSeed('classification-example');
        const first = generator.generate(legacyConfig);
        setSeed('classification-example');
        const second = generator.generate(legacyConfig);

        expect(second).toEqual(first);
    });

    it('classifies polygons by a visibly countable vertex total', () => {
        const stub = generator.generate({
            subsumption: false,
            shapes: [],
            attributeCounts: [Scope.VertexCount],
            criteria: []
        })!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data.attribute).toBe('vertices');
        expect(stub.data.options).toHaveLength(4);
        expect(stub.data.options.filter(option => option.satisfies)).toHaveLength(1);
        const answer = stub.data.answer;
        expect(stub.data.options.find(option => option.id === answer)?.count)
            .toBe(stub.data.requiredCount);
    });

    it('honors a specifically requested polygon in vertex-count mode', () => {
        const stub = generator.generate({
            subsumption: false,
            shapes: [Area.Pentagon],
            attributeCounts: [Scope.VertexCount],
            criteria: []
        })!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data.requiredCount).toBe(5);
        expect(stub.tags).toEqual([Area.Pentagon]);
    });

    it('classifies simple polygons by a visibly countable angle total', () => {
        const stub = generator.generate({
            subsumption: false,
            shapes: [],
            attributeCounts: [Scope.AngleCount],
            criteria: []
        })!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        const data = stub.data;
        expect(data.attribute).toBe('angles');
        expect(data.options).toHaveLength(4);
        expect(data.options.filter(option => option.satisfies)).toHaveLength(1);
        expect(data.options.find(option => option.id === data.answer)?.count)
            .toBe(data.requiredCount);
        expect(data.options.every(option => option.count >= 3 && option.count <= 6)).toBe(true);
    });

    it('classifies a cube from inspectable equal-face alternatives', () => {
        const stub = generator.generate({
            subsumption: false,
            shapes: [],
            attributeCounts: [Scope.FaceCount, Scope.Equal],
            criteria: []
        })!;

        expect(stub.data.task).toBe('classify-count');
        if (stub.data.task !== 'classify-count') return;
        expect(stub.data).toMatchObject({attribute: 'equal-faces', requiredCount: 6});
        const answer = stub.data.answer;
        expect(stub.data.options.find(option => option.id === answer)?.shape).toBe('cube');
    });

    it.each([
        [Area.Rhombus, 'rhombus'],
        [Area.Rectangle, 'rectangle'],
        [Area.Square, 'square']
    ] as const)('classifies %s as a quadrilateral from visible attributes', (label, shape) => {
        const stub = generator.generate({
            subsumption: true,
            shapes: [label],
            attributeCounts: [],
            criteria: []
        })!;

        expect(stub.data.task).toBe('classify-quadrilateral-subcategory');
        if (stub.data.task !== 'classify-quadrilateral-subcategory') return;
        expect(stub.data.shape).toBe(shape);
        expect(stub.data.attributes).toContain('4 straight sides');
        expect(stub.data.category).toBe('quadrilateral');
        const answer = stub.data.answer;
        expect(stub.data.options.find(option => option.id === answer))
            .toMatchObject({category: 'quadrilateral', satisfies: true});
        expect(stub.tags).toEqual([label]);
    });

    it('rejects missing and unsupported quadrilateral subsumption subjects', () => {
        expect(generator.generate({
            subsumption: true,
            shapes: [],
            attributeCounts: [],
            criteria: []
        })).toBeNull();
        const shapeNameSpy = vi.spyOn(shapeHelpers, 'shapeNameFromLabel').mockReturnValueOnce('triangle');
        expect(generator.generate({
            subsumption: true,
            shapes: [Area.Rhombus],
            attributeCounts: [],
            criteria: []
        })).toBeNull();
        expect(shapeNameSpy).toHaveBeenCalledWith(Area.Rhombus);
    });

    it('rejects contradictory attribute-count configurations', () => {
        expect(() => generator.generate({
            subsumption: false,
            shapes: [],
            attributeCounts: [Scope.VertexCount, Scope.FaceCount, Scope.Equal],
            criteria: []
        })).toThrow('Attribute-count labels must select vertex count, angle count, or equal face count.');
        expect(() => generator.generate({
            subsumption: false,
            shapes: [],
            attributeCounts: [Scope.VertexCount, Scope.AngleCount],
            criteria: []
        })).toThrow('Attribute-count labels must select vertex count, angle count, or equal face count.');
    });

    it('requires a no-fallback criterion array and rejects contradictory criteria', () => {
        expect(() => generator.generate({
            subsumption: false,
            shapes: [],
            criteria: []
        })).toThrow('The attributeCounts field must be an array.');
        expect(() => generator.generate({
            subsumption: false,
            attributeCounts: [],
            criteria: []
        })).toThrow('The shapes field must be an array.');
        expect(() => generator.generate({
            subsumption: false,
            shapes: [],
            attributeCounts: []
        })).toThrow('The criteria field must be an array.');
        expect(() => generator.generate({
            subsumption: false,
            shapes: [],
            attributeCounts: [],
            criteria: [Area.RightAngle, Area.AcuteAngle]
        })).toThrow('Exactly one classification criterion may be selected.');
    });
});

function classificationConfig(
    criterion: Area,
    subsumption = false,
    shapes: Area[] = []
) {
    return {subsumption, shapes, attributeCounts: [], criteria: [criterion]};
}

function cross(first: ShapeClassificationStroke, second: ShapeClassificationStroke): number {
    return (first.end.x - first.start.x) * (second.end.y - second.start.y)
        - (first.end.y - first.start.y) * (second.end.x - second.start.x);
}

function dot(first: ShapeClassificationStroke, second: ShapeClassificationStroke): number {
    return (first.end.x - first.start.x) * (second.end.x - second.start.x)
        + (first.end.y - first.start.y) * (second.end.y - second.start.y);
}

function undirectedStrokeEquals(first: ShapeClassificationStroke, second: ShapeClassificationStroke): boolean {
    return (
        first.start.x === second.start.x
        && first.start.y === second.start.y
        && first.end.x === second.end.x
        && first.end.y === second.end.y
    ) || (
        first.start.x === second.end.x
        && first.start.y === second.end.y
        && first.end.x === second.start.x
        && first.end.y === second.start.y
    );
}

function expectValidFigure(figure: ShapeClassificationFigure): void {
    expect(figure.vertices.length).toBeGreaterThanOrEqual(3);
    expect(figure.sides).toHaveLength(figure.vertices.length);
    const doubledArea = figure.vertices.reduce((sum, vertex, index) => {
        const next = figure.vertices[(index + 1) % figure.vertices.length];
        return sum + vertex.x * next.y - vertex.y * next.x;
    }, 0);
    expect(Math.abs(doubledArea)).toBeGreaterThan(0);
    for (const [index, side] of figure.sides.entries()) {
        expect(side.start).toEqual(figure.vertices[index]);
        expect(side.end).toEqual(figure.vertices[(index + 1) % figure.vertices.length]);
        expect(side.start).not.toEqual(side.end);
    }
}

function relationsIn(figure: ShapeClassificationFigure): Array<'parallel' | 'perpendicular'> {
    const found = new Set<'parallel' | 'perpendicular'>();
    for (let first = 0; first < figure.sides.length; first++) {
        for (let second = first + 1; second < figure.sides.length; second++) {
            if (cross(figure.sides[first], figure.sides[second]) === 0) found.add('parallel');
            if (dot(figure.sides[first], figure.sides[second]) === 0) found.add('perpendicular');
        }
    }
    return [...found].sort();
}

function angleClassesIn(figure: ShapeClassificationFigure): Array<'right' | 'acute' | 'obtuse'> {
    return figure.vertices.map((vertex, index) => {
        const previous = figure.vertices[(index - 1 + figure.vertices.length) % figure.vertices.length];
        const next = figure.vertices[(index + 1) % figure.vertices.length];
        const first = strokeForTest(vertex, previous);
        const second = strokeForTest(vertex, next);
        const denominator = Math.hypot(first.end.x - first.start.x, first.end.y - first.start.y)
            * Math.hypot(second.end.x - second.start.x, second.end.y - second.start.y);
        const degrees = Math.acos(dot(first, second) / denominator) * 180 / Math.PI;
        if (Math.abs(degrees - 90) < 0.001) return 'right';
        return degrees < 90 ? 'acute' : 'obtuse';
    });
}

function strokeForTest(
    start: ShapeClassificationStroke['start'],
    end: ShapeClassificationStroke['end']
): ShapeClassificationStroke {
    return {start, end};
}

function expectEvidenceUsesSides(
    figure: ShapeClassificationFigure,
    evidence: readonly ShapeClassificationStroke[]
): void {
    for (const ray of evidence) {
        expect(figure.sides.some(side => undirectedStrokeEquals(side, ray))).toBe(true);
    }
}

function segmentsIntersect(first: ShapeClassificationStroke, second: ShapeClassificationStroke): boolean {
    const orientation = (
        line: ShapeClassificationStroke,
        point: ShapeClassificationStroke['start']
    ) => (line.end.x - line.start.x) * (point.y - line.start.y)
        - (line.end.y - line.start.y) * (point.x - line.start.x);
    return orientation(first, second.start) * orientation(first, second.end) <= 0
        && orientation(second, first.start) * orientation(second, first.end) <= 0;
}

function commonEndpoint(
    first: ShapeClassificationStroke,
    second: ShapeClassificationStroke
): ShapeClassificationStroke['start'] | undefined {
    return [first.start, first.end].find(point =>
        (point.x === second.start.x && point.y === second.start.y)
        || (point.x === second.end.x && point.y === second.end.y)
    );
}

function rightMarkerVertex(points: [
    ShapeClassificationStroke['start'],
    ShapeClassificationStroke['start'],
    ShapeClassificationStroke['start']
]): ShapeClassificationStroke['start'] {
    return {
        x: points[0].x + points[2].x - points[1].x,
        y: points[0].y + points[2].y - points[1].y
    };
}

describe('ShapeClassifyAttributesGenerator Grade 4 classification', () => {
    const generator = new ShapeClassifyAttributesGenerator();

    it.each([
        [Area.ParallelismRelation, 'parallel'],
        [Area.PerpendicularityRelation, 'perpendicular']
    ] as const)('classifies whole figures by %s presence and absence', (label, criterion) => {
        setSeed(`line-relation-${criterion}`);
        const data = generator.generate(classificationConfig(label))!.data;
        expect(data.task).toBe('classify-line-relation');
        if (data.task !== 'classify-line-relation') return;
        expect(data.criterion).toBe(criterion);
        expect(data.prompt).toBe(`Classify each figure by whether it has ${criterion} sides.`);
        expect(data.options.filter(option => option.satisfies)).toHaveLength(2);
        expect(data.answerIds).toEqual(data.options.filter(option => option.satisfies).map(option => option.id));
        expect(data.answerStatement).toBe(`Figures ${data.answerIds.join(' and ')} have ${criterion} sides.`);
        for (const option of data.options) {
            expect(option.figureName).toBe('figure');
            expectValidFigure(option.figure);
            expect(option.relations.slice().sort()).toEqual(relationsIn(option.figure));
            expect(option.satisfies).toBe(option.relations.includes(criterion));
            expectEvidenceUsesSides(option.figure, option.evidenceStrokes);
            if (option.marker?.kind === 'right-angle') {
                expect(option.relations).toContain('perpendicular');
                expect(rightMarkerVertex(option.marker.points)).toEqual(
                    commonEndpoint(option.evidenceStrokes[0], option.evidenceStrokes[1])
                );
            }
            if (option.marker?.kind === 'parallel') {
                expect(option.relations).toContain('parallel');
                expect(option.marker.strokes).toHaveLength(2);
                expect(segmentsIntersect(option.evidenceStrokes[0], option.marker.strokes[0])).toBe(true);
                expect(segmentsIntersect(option.evidenceStrokes[1], option.marker.strokes[1])).toBe(true);
            }
        }
    });

    it.each([
        [Area.RightAngle, 'right', 'a'],
        [Area.AcuteAngle, 'acute', 'an'],
        [Area.ObtuseAngle, 'obtuse', 'an']
    ] as const)('classifies whole figures by %s presence and absence', (label, criterion, article) => {
        setSeed(`angle-class-${criterion}`);
        const data = generator.generate(classificationConfig(label))!.data;
        expect(data.task).toBe('classify-angle-size');
        if (data.task !== 'classify-angle-size') return;
        expect(data.criterion).toBe(criterion);
        expect(data.prompt).toBe(`Classify each figure by whether it has ${article} ${criterion} angle.`);
        expect(data.options.filter(option => option.satisfies)).toHaveLength(2);
        expect(data.answerIds).toEqual(data.options.filter(option => option.satisfies).map(option => option.id));
        for (const option of data.options) {
            expect(option.figureName).toBe('figure');
            expectValidFigure(option.figure);
            expect(option.angleClasses).toEqual(angleClassesIn(option.figure));
            expect(option.satisfies).toBe(option.angleClasses.includes(criterion));
            expect(option.angleClasses).toContain(option.angleClass);
            expectEvidenceUsesSides(option.figure, option.evidenceRays);
            expect(option.evidenceRays[0].start).toEqual(option.evidenceRays[1].start);
            if (option.marker.kind === 'right-angle') {
                expect(option.angleClass).toBe('right');
                expect(rightMarkerVertex(option.marker.points)).toEqual(option.evidenceRays[0].start);
            }
            if (option.marker.kind === 'angle-arc') {
                expect(option.angleClass).not.toBe('right');
                expect(option.marker.center).toEqual(option.evidenceRays[0].start);
            }
        }
    });

    it('identifies every supplied right triangle while preserving category subsumption', () => {
        setSeed('right-triangle-category');
        const data = generator.generate(classificationConfig(
            Area.RightAngle,
            true,
            [Area.RightTriangle]
        ))!.data;
        expect(data.task).toBe('classify-right-triangle-category');
        if (data.task !== 'classify-right-triangle-category') return;
        expect(data.prompt).toBe('Which figures are right triangles?');
        expect(data.options.filter(option => option.satisfies)).toHaveLength(2);
        expect(data.options.filter(option => !option.satisfies)).toHaveLength(2);
        expect(data.answerIds).toEqual(data.options.filter(option => option.satisfies).map(option => option.id));
        expect(data.categoryStatement).toBe('Every right triangle is a triangle.');
        expect(data.attributes).toEqual(['3 straight sides', '1 right angle']);
        for (const option of data.options) {
            expect(option.figureName).toBe('triangle');
            expect(option.figure.vertices).toHaveLength(3);
            expectValidFigure(option.figure);
            expect(option.angleClasses).toEqual(angleClassesIn(option.figure));
            expect(option.satisfies).toBe(option.angleClasses.includes('right'));
            expectEvidenceUsesSides(option.figure, option.evidenceRays);
            expect(option.evidenceRays[0].start).toEqual(option.evidenceRays[1].start);
            if (option.satisfies) {
                expect(option.angleClass).toBe('right');
                expect(option.marker.kind).toBe('right-angle');
                if (option.marker.kind === 'right-angle') {
                    expect(rightMarkerVertex(option.marker.points)).toEqual(option.evidenceRays[0].start);
                }
            } else {
                expect(option.angleClasses).not.toContain('right');
            }
        }
    });

    it('rejects unsupported subject/task combinations and is deterministic', () => {
        expect(generator.generate(classificationConfig(Area.AcuteAngle, true, [Area.RightTriangle])))
            .toBeNull();
        expect(generator.generate(classificationConfig(Area.RightAngle, true, []))).toBeNull();

        setSeed('grade4-classification-determinism');
        const first = generator.generate(classificationConfig(Area.ParallelismRelation));
        setSeed('grade4-classification-determinism');
        expect(generator.generate(classificationConfig(Area.ParallelismRelation))).toEqual(first);
    });
});
