import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {DataPictureGraphViewSchema, spec} from './spec.ts';

describe('data-picture-graph view spec', () => {
    it('owns only construction and numeric-response presentation abilities', () => {
        expect(extractConfig(DataPictureGraphViewSchema, [Ability.VisualArticulation]).config).toEqual({
            showConstructionTask: true,
            showArithmeticTask: false,
            interpretCategory: false,
            classifyData: false
        });
        expect(extractConfig(DataPictureGraphViewSchema, [Ability.ProcedureExecution]).config).toEqual({
            showConstructionTask: false,
            showArithmeticTask: true,
            interpretCategory: false,
            classifyData: false
        });
        expect(extractConfig(DataPictureGraphViewSchema, [Ability.Interpretation]).config).toEqual({
            showConstructionTask: false,
            showArithmeticTask: false,
            interpretCategory: true,
            classifyData: false
        });
    });

    it('declares the picture layout boundaries for legacy arithmetic', () => {
        expect(spec.rejectedLabels).toEqual([Scope.SingleStep, Scope.MultiStep]);
    });
});
