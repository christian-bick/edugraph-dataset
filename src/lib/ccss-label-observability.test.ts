import { describe, expect, it } from 'vitest';
import { Ability, Area, Scope } from 'edugraph-ts';
import { spec as kindergarten } from '../spec/ccss/kindergarten.ts';
import { spec as gradeOne } from '../spec/ccss/grade-01.ts';

const targets = (spec: typeof kindergarten, idPrefix: string) =>
    spec.filter(target => target.id.startsWith(idPrefix));

const expectAll = (specTargets: typeof kindergarten, labels: string[]) => {
    expect(specTargets.length).toBeGreaterThan(0);
    for (const target of specTargets) {
        expect(target.labels).toEqual(expect.arrayContaining(labels));
    }
};

const expectNone = (specTargets: typeof kindergarten, labels: string[]) => {
    for (const target of specTargets) {
        for (const label of labels) {
            expect(target.labels).not.toContain(label);
        }
    }
};

describe('CCSS observable-label contracts', () => {
    it('separates physical group comparison from written-numeral comparison', () => {
        const groups = targets(kindergarten, 'K.CC.C.6-compare-groups');
        const numerals = targets(kindergarten, 'K.CC.C.7-compare-numerals');

        expectAll(groups, [Area.SetComparison, Scope.PhysicalNumbers]);
        expectNone(groups, [Area.NumericComparison, Scope.ArabicNumerals, Scope.Base10]);
        expectAll(numerals, [Area.NumericComparison, Scope.ArabicNumerals, Scope.Base10]);
        expectNone(numerals, [Area.SetComparison, Scope.PhysicalNumbers]);
    });

    it('describes conservation as a physical representation', () => {
        const conservation = targets(kindergarten, 'K.CC.B.4b-conservation');

        expectAll(conservation, [Area.NumericIdentity, Scope.PhysicalNumbers]);
        expectNone(conservation, [Scope.ArabicNumerals]);
    });

    it('does not claim physical objects for text-only word problems', () => {
        const wordProblems = [
            ...targets(kindergarten, 'K.OA.A.2-word-problems'),
            ...targets(gradeOne, '1.OA.A.1-word-problems')
        ];

        expectAll(wordProblems, [Scope.ArabicNumerals, Ability.TextualReception]);
        expectNone(wordProblems, [Scope.PhysicalNumbers]);
    });

    it('describes teen composition as a bounded sum without a global lower-bound claim', () => {
        const teenNumbers = [
            ...targets(kindergarten, 'K.NBT.A.1-teen-numbers'),
            ...targets(gradeOne, '1.NBT.B.2b-teen-numbers')
        ];

        expectAll(teenNumbers, [Area.Sum, Scope.NumbersSmaller20]);
        expectNone(teenNumbers, [Area.Difference, Scope.NumbersLarger10]);
    });

    it('keeps pairwise measurement comparison distinct from object sorting', () => {
        const comparisons = targets(kindergarten, 'K.MD.A.2-compare-attributes');

        expectAll(comparisons, [Area.Measurement, Ability.ProcedureExecution]);
        expectNone(comparisons, [Area.ObjectSorting]);
    });

    it('uses drawing labels rather than coordinate-plane plotting for shape tracing', () => {
        const drawingTargets = targets(kindergarten, 'K.G.B.5-draw-shapes');

        expectAll(drawingTargets, [Area.ShapeIdentity, Ability.VisualArticulation]);
        expectNone(drawingTargets, [Area.ShapePlotting]);
        for (const target of drawingTargets) {
            const isCircle = target.labels.includes(Area.Circle);
            expect(target.labels).toContain(isCircle
                ? Area.CircularShapeDrawing
                : Area.LinearShapeDrawing);
        }
    });

    it('treats writing Arabic numeral symbols as visual articulation', () => {
        const writingTargets = [
            ...targets(kindergarten, 'K.CC.A.3-write-numerals'),
            ...targets(gradeOne, '1.NBT.A.1-write-numerals')
        ];

        expectAll(writingTargets, [Area.DigitNotation, Scope.ArabicNumerals, Ability.VisualArticulation]);
        expectNone(writingTargets, [Ability.TextualArticulation]);
    });
});
