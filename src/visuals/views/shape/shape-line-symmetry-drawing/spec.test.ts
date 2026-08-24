import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {ShapeLineSymmetryGenerator} from '../../../../generators/shape/shape-line-symmetry/generator.ts';
import {computeTaskFingerprint, resolveViewConfig} from '../../../../lib/generation.ts';
import {extractSchemaLabels} from '../../../../lib/utils.ts';
import {ShapeLineSymmetryDrawingViewSchema, spec} from './spec.ts';

describe('shape-line-symmetry-drawing view spec', () => {
    it('owns invariant visual articulation', () => {
        expect(spec.generalLabels).toEqual([Ability.VisualArticulation]);
        expect(spec.rejectedLabels).toBeUndefined();
    });

    it('resolves a fingerprint-visible drawing figure without consuming labels', () => {
        expect(extractSchemaLabels(ShapeLineSymmetryDrawingViewSchema)).toEqual([]);
        const configs = Array.from({length: 60}, (_, seed) =>
            resolveViewConfig(ShapeLineSymmetryDrawingViewSchema, [], seed)
        );
        expect(new Set(configs.map(config => config.figureKind))).toEqual(new Set([
            'isosceles-triangle',
            'rectangle',
            'square'
        ]));
        const data = new ShapeLineSymmetryGenerator().generate({})!.data;
        expect(new Set(configs.map(config => computeTaskFingerprint(data, config))).size).toBe(3);
    });
});
