import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {ShapeLineSymmetryGenerator} from './generator.ts';
import {spec} from './spec.ts';

const generator = new ShapeLineSymmetryGenerator();

describe('ShapeLineSymmetryGenerator spec integration', () => {
    it('declares the corrected invariant reflective-fold capabilities', () => {
        expect(spec.generalLabels).toEqual([Area.ShapeReflection, Scope.Foldable]);
    });

    it('resolves the corrected Grade 4 identification target', () => {
        const labels = [
            Area.ShapeReflection,
            Scope.Foldable,
            Ability.ConceptClassification,
            Ability.VisualRecognition
        ];
        expect(labelSetHash(labels)).toBe('245bc791');
        const stub = generateWithLabels(generator, labels);
        expect(stub).not.toBeNull();
        expect(stub!.data.identification.answerIds).toHaveLength(2);
        expect(stub!.tags).not.toContain(Ability.ConceptClassification);
        expect(stub!.tags).not.toContain(Ability.VisualRecognition);
    });

    it('resolves the corrected Grade 4 drawing target', () => {
        const labels = [
            Area.ShapeReflection,
            Scope.Foldable,
            Ability.VisualArticulation
        ];
        expect(labelSetHash(labels)).toBe('4b67d8c7');
        const stub = generateWithLabels(generator, labels);
        expect(stub).not.toBeNull();
        expect(stub!.data.drawing.completedAxes).toEqual(stub!.data.drawing.figure.validAxes);
        expect(stub!.tags).not.toContain(Ability.VisualArticulation);
    });
});
