import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {ArithmeticOpsFourGenerator} from './generator.ts';
import {spec} from './spec.ts';

const generator = new ArithmeticOpsFourGenerator();
describe('canonical four-addend declarations', () => {
    it('advertises only resolvable four-addend cells and rejects every other catalog cell during matching', () => {
        expect(findSchemaFallbackContractIssues(generator.schema)).toEqual([]);
        expect(generator.schema.range[2]).toHaveLength(6);
        for (const {labels, range} of canonicalRangeProfiles) {
            const supported = [10, 20].includes(range.min) && [100, 120, 1000].includes(range.max);
            const result = planModelCompatibility({id: 'four-catalog', labels: [Area.Addition, ...labels]},
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: generator.schema, spec},
                {viewId: 'test', generalLabels: [], schema: {}, spec: {viewId: 'test', generalLabels: []}});
            // An upper-only target is a partial request and legitimately completes a stronger lower.
            const partial = range.min === 0 && [100, 120, 1000].includes(range.max);
            expect(result.supported).toBe(supported || partial);
        }
    });
    it('retains both two-digit operand extremes and exposes all six source cells', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Scope.TwoDigitSmallestOperand, Scope.TwoDigitLargestOperand]));
        for (const lower of [Scope.NumbersLarger10, Scope.NumbersLarger20])
            for (const upper of [Scope.NumbersSmaller100, Scope.NumbersSmaller120, Scope.NumbersSmaller1000]) {
                const labels = [Area.Addition, lower, upper];
                const result = planModelCompatibility({id: 'four', labels},
                    {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: generator.schema, spec},
                    {viewId: 'test', generalLabels: [], schema: {}, spec: {viewId: 'test', generalLabels: []}});
                expect(result.supported).toBe(true);
                expect(generateWithLabels(generator, labels)).not.toBeNull();
            }
    });
    it('completes an unspecified lower to a feasible source interval before generation', () => {
        const stub = generateWithLabels(generator, [Area.Addition, Scope.NumbersSmaller100]);
        expect(stub).not.toBeNull();
        expect(stub!.labels.some(label => [Scope.NumbersLarger10, Scope.NumbersLarger20].includes(label as Scope))).toBe(true);
    });
});
