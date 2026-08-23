import {Area} from 'edugraph-ts';
import {beforeEach, describe, expect, it} from 'vitest';
import {setSeed} from '../../../../lib/random.ts';
import {ShapeClassifyAttributesGenerator} from '../../../../generators/shape/shape-classify-attributes/generator.ts';
import {
    RightTriangleCategoryProblem,
    ShapeAngleClassificationProblem,
    ShapeLineRelationClassificationProblem
} from '../../../../types/problems.ts';
import {isValidGrade4ShapeClassificationProblem} from './helpers.ts';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe('shape-classify-attributes Grade 4 validation', () => {
    const generator = new ShapeClassifyAttributesGenerator();

    beforeEach(() => setSeed('shape-view-validation'));

    const generate = (
        criterion: Area,
        subsumption = false,
        shapes: Area[] = []
    ) => generator.generate({
        subsumption,
        shapes,
        attributeCounts: [],
        criteria: [criterion]
    })!.data;

    it.each([
        Area.ParallelismRelation,
        Area.PerpendicularityRelation,
        Area.RightAngle,
        Area.AcuteAngle,
        Area.ObtuseAngle
    ])('accepts coherent whole-figure classification for %s', criterion => {
        const data = generate(criterion);
        if (data.task !== 'classify-line-relation' && data.task !== 'classify-angle-size') {
            throw new Error('Expected a Grade 4 line or angle classification problem.');
        }
        expect(isValidGrade4ShapeClassificationProblem(data)).toBe(true);
    });

    it('accepts four triangles with a truthful two-by-two right-triangle partition', () => {
        const data = generate(Area.RightAngle, true, [Area.RightTriangle]);
        if (data.task !== 'classify-right-triangle-category') {
            throw new Error('Expected a right-triangle category problem.');
        }
        expect(isValidGrade4ShapeClassificationProblem(data)).toBe(true);
    });

    it('rejects evidence strokes that are not sides of the supplied polygon', () => {
        const data = clone(generate(Area.ParallelismRelation)) as ShapeLineRelationClassificationProblem;
        data.options[0].evidenceStrokes[0] = {
            start: {x: 1, y: 1},
            end: {x: 99, y: 1}
        };
        expect(isValidGrade4ShapeClassificationProblem(data)).toBe(false);
    });

    it('rejects a relation marker that does not cross its nominated sides', () => {
        const data = clone(generate(Area.ParallelismRelation)) as ShapeLineRelationClassificationProblem;
        const option = data.options.find(candidate => candidate.marker?.kind === 'parallel')!;
        option.marker = {
            kind: 'parallel',
            strokes: [
                {start: {x: 2, y: 2}, end: {x: 4, y: 6}},
                {start: {x: 8, y: 2}, end: {x: 10, y: 6}}
            ]
        };
        expect(isValidGrade4ShapeClassificationProblem(data)).toBe(false);
    });

    it('rejects a self-crossing or degenerate polygon', () => {
        const data = clone(generate(Area.PerpendicularityRelation)) as ShapeLineRelationClassificationProblem;
        const option = data.options[0];
        option.figure.vertices = [
            {x: 20, y: 20},
            {x: 80, y: 80},
            {x: 20, y: 80},
            {x: 80, y: 20}
        ];
        option.figure.sides = option.figure.vertices.map((vertex, index, vertices) => ({
            start: vertex,
            end: vertices[(index + 1) % vertices.length]
        }));
        expect(isValidGrade4ShapeClassificationProblem(data)).toBe(false);
    });

    it('rejects a negative line option whose full polygon contains the criterion', () => {
        const data = clone(generate(Area.ParallelismRelation)) as ShapeLineRelationClassificationProblem;
        const positive = data.options.find(option => option.satisfies)!;
        const negative = data.options.find(option => !option.satisfies)!;
        positive.satisfies = false;
        negative.satisfies = true;
        expect(isValidGrade4ShapeClassificationProblem(data)).toBe(false);
    });

    it('rejects angle evidence, marker, and full-figure membership contradictions', () => {
        const data = clone(generate(Area.AcuteAngle)) as ShapeAngleClassificationProblem;
        const positive = data.options.find(option => option.satisfies)!;
        positive.evidenceRays[1] = positive.figure.sides.find(
            side => side.start.x !== positive.evidenceRays[0].start.x
                || side.start.y !== positive.evidenceRays[0].start.y
        )!;
        expect(isValidGrade4ShapeClassificationProblem(data)).toBe(false);

        const markerData = clone(generate(Area.ObtuseAngle)) as ShapeAngleClassificationProblem;
        const marked = markerData.options.find(option => option.satisfies)!;
        if (marked.marker.kind !== 'angle-arc') throw new Error('Expected an angle arc.');
        marked.marker.center.x += 5;
        expect(isValidGrade4ShapeClassificationProblem(markerData)).toBe(false);

        const membershipData = clone(generate(Area.RightAngle)) as ShapeAngleClassificationProblem;
        const matching = membershipData.options.find(option => option.satisfies)!;
        const nonmatching = membershipData.options.find(option => !option.satisfies)!;
        matching.satisfies = false;
        nonmatching.satisfies = true;
        expect(isValidGrade4ShapeClassificationProblem(membershipData)).toBe(false);
    });

    it('rejects a right-triangle negative that secretly has a right-angle vertex', () => {
        const data = clone(generate(
            Area.RightAngle,
            true,
            [Area.RightTriangle]
        )) as RightTriangleCategoryProblem;
        const positive = data.options.find(option => option.satisfies)!;
        const negative = data.options.find(option => !option.satisfies)!;
        negative.figure = clone(positive.figure);
        negative.angleClasses = clone(positive.angleClasses);
        negative.angleClass = positive.angleClass;
        negative.evidenceRays = clone(positive.evidenceRays);
        negative.marker = clone(positive.marker);
        expect(isValidGrade4ShapeClassificationProblem(data)).toBe(false);
    });

    it('rejects a contradictory answer partition', () => {
        const data = clone(generate(Area.PerpendicularityRelation)) as ShapeLineRelationClassificationProblem;
        data.options.find(option => option.satisfies)!.satisfies = false;
        expect(isValidGrade4ShapeClassificationProblem(data)).toBe(false);
    });
});
