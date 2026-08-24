import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {ShapeLineSymmetryGenerator} from '../../../../generators/shape/shape-line-symmetry/generator.ts';
import {computeTaskFingerprint, resolveViewConfig} from '../../../../lib/generation.ts';
import {extractSchemaLabels} from '../../../../lib/utils.ts';
import {ShapeLineSymmetryIdentificationViewSchema, spec} from './spec.ts';

describe('shape-line-symmetry-identification view spec', () => {
    it('owns invariant recognition and classification', () => {
        expect(spec.generalLabels).toEqual([
            Ability.ConceptClassification,
            Ability.VisualRecognition
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });

    it('resolves a fingerprint-visible semantic subset without consuming labels', () => {
        expect(extractSchemaLabels(ShapeLineSymmetryIdentificationViewSchema)).toEqual([]);
        const configs = Array.from({length: 40}, (_, seed) =>
            resolveViewConfig(ShapeLineSymmetryIdentificationViewSchema, [], seed)
        );
        expect(new Set(configs.map(config => config.multiAxisKind)))
            .toEqual(new Set(['rectangle', 'square']));
        const data = new ShapeLineSymmetryGenerator().generate({})!.data;
        expect(new Set(configs.map(config => computeTaskFingerprint(data, config))).size).toBe(2);
    });
});
