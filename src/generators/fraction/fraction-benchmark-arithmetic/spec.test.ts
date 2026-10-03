import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {FractionBenchmarkArithmeticGenerator} from './generator.ts';
import {FractionBenchmarkArithmeticGeneratorSchema, spec} from './spec.ts';

const common = [Area.FractionReferenceComparison, Scope.FractionNumbers, Scope.SingleFrameOfReference];

describe('fraction-benchmark-arithmetic schema integration', () => {
    it('keeps common-whole fraction reference comparison invariant and Ability-neutral', () => {
        expect(spec.generalLabels).toEqual(common);
        expect(spec.generalLabels).not.toContain(Area.NumericApproximation);
        for (const label of Object.values(Ability)) expect(spec.generalLabels).not.toContain(label);
    });

    it.each([
        [Area.Addition, 'addition'], [Area.Subtraction, 'subtraction']
    ] as const)('resolves %s for both benchmark task profiles', (area, operation) => {
        const estimation = [...common, area, Area.NumericApproximation, Ability.ProcedureExecution];
        const reasonableness = [...common, area, Ability.PlausibilityEvaluation];
        const estimateResolution = extractConfig(FractionBenchmarkArithmeticGeneratorSchema, estimation);
        const judgmentResolution = extractConfig(FractionBenchmarkArithmeticGeneratorSchema, reasonableness);
        expect(estimateResolution.config).toEqual({operation, approximationModel: 'nearest-quarter'});
        expect(new Set(estimateResolution.resolvedLabels)).toEqual(new Set([area, Area.NumericApproximation]));
        expect(judgmentResolution.config).toEqual({operation, approximationModel: 'bounds-only'});
        expect(judgmentResolution.resolvedLabels).toEqual([area]);

        const generator = new FractionBenchmarkArithmeticGenerator();
        const estimate = generateWithLabels(generator, estimation)!;
        const judgment = generateWithLabels(generator, reasonableness)!;
        expect(estimate.data.approximation).toBeDefined();
        expect(judgment.data.approximation).toBeUndefined();
        expect(new Set(estimate.labels)).toEqual(new Set([area, Area.NumericApproximation]));
        expect(judgment.labels).toEqual([area]);
    });
});
