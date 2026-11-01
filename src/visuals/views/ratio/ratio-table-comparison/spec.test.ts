import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {RatioTableComparisonsGeneratorSchema, spec as producerSpec} from '../../../../generators/ratio/ratio-table-comparisons/spec.ts';
import {matchTarget} from '../../../../lib/matching.ts';
import {extractSchemaLabels} from '../../../../types/schema.ts';
import {spec as kindergarten} from '../../../../spec/ccss/kindergarten.ts';
import {spec as grade6} from '../../../../spec/ccss/grade-06.ts';
import {RatioTableComparisonViewSchema, spec} from './spec.ts';

const generator = {generatorId: producerSpec.generatorId, spec: producerSpec,
    schema: RatioTableComparisonsGeneratorSchema, generalLabels: producerSpec.generalLabels,
    labels: [...producerSpec.generalLabels!, ...extractSchemaLabels(RatioTableComparisonsGeneratorSchema)],
    problemType: 'RatioTableComparisonProblem'};
const view = {viewId: spec.viewId, spec, schema: RatioTableComparisonViewSchema,
    generalLabels: spec.generalLabels, supportedLabels: [...spec.generalLabels!],
    problemType: 'RatioTableComparisonProblem'};

describe('ratio-table comparison participation', () => {
    it('preserves all Grade6 comparison targets and rejects generic Kindergarten numeral comparisons', () => {
        const ratioTargets = grade6.filter(target => target.id.startsWith('6.RP.A.3a-ratio-table-comparison~'));
        expect(ratioTargets).toHaveLength(3);
        for (const target of ratioTargets) expect(matchTarget(target, generator, view).matched).toBe(true);
        const numeralTargets = kindergarten.filter(target => target.id.startsWith('K.CC.C.7-compare-numerals~')
            && target.labels.includes(Scope.NumbersWithoutZero) && target.labels.includes(Scope.NumbersSmaller10));
        expect(numeralTargets).toHaveLength(3);
        const unrestricted = {...view, spec: {...spec, compatibility: []}};
        for (const target of numeralTargets) {
            expect(matchTarget(target, generator, unrestricted).matched).toBe(true);
            expect(matchTarget(target, generator, view)).toMatchObject({matched: false,
                reason: 'missing-required-label', label: Area.RatioEquivalence});
        }
    });
});
