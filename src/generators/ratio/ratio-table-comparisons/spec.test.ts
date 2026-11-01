import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {RatioTableComparisonsGenerator} from './generator.ts';
import {RatioTableComparisonsGeneratorSchema as schema, spec} from './spec.ts';
import {comparisonFramesForRange, comparisonRangeProfiles} from './numeric-domain.ts';

const relations = [
    [[Area.NumericInequality, Scope.Less], 'less'],
    [[Area.NumericEquality, Scope.Equal], 'equal'],
    [[Area.NumericInequality, Scope.Greater], 'greater']
] as const;

describe('ratio-table-comparisons capabilities', () => {
    it('resolves every feasible relation/range cell in both configuration paths', () => {
        let cells = 0;
        const counts: Record<string, number[]> = {};
        const evaluator = createLabelDependencyEvaluator();
        for (const [labels, relation] of relations) {
            const problem = generateWithLabels(new RatioTableComparisonsGenerator(), [...labels])!;
            expect(problem.data.relation).toBe(relation);
            expect(problem.labels).toEqual(expect.arrayContaining([...labels]));
            counts[relation] = [];
            for (const profile of comparisonRangeProfiles) {
                const pool = comparisonFramesForRange(relation, profile.range);
                counts[relation].push(pool.length);
                if (pool.length === 0) continue;
                cells++;
                const request = [...labels, ...profile.labels];
                expect(extractConfig(schema, request).config).toEqual({relation, range: profile.range});
                expect(resolveSchemaChoices(schema, request, {relation: labels, range: profile.labels}).config)
                    .toEqual({relation, range: profile.range});
                const result = evaluator.evaluate([...spec.generalLabels!, ...request, Ability.ProcedureExecution]);
                expect(result.errors).toEqual([]);
                expect(result.conflicts).toEqual([]);
                expect(result.assessments.filter(item => item.status === 'missing')).toEqual([]);
            }
        }
        expect(comparisonRangeProfiles.map(({range}) => [range.min, range.max]))
            .toEqual([[0, 10], [0, 20], [0, 100], [0, 120], [0, 1000]]);
        expect(counts).toEqual({less: [3, 70, 301, 6, 4], equal: [1, 4, 59, 0, 0], greater: [3, 70, 301, 6, 4]});
        expect(cells).toBe(13);
    }, 20000);

    it('rejects competing relation bundles and impossible equal-ratio bands', () => {
        for (const labels of [[Area.NumericEquality, Scope.Less], [Area.NumericInequality, Scope.Equal],
            [Area.NumericInequality, Scope.Less, Scope.Greater],
            [Area.NumericEquality, Scope.Equal, Scope.NumbersSmaller1000]]) {
            expect(() => generateWithLabels(new RatioTableComparisonsGenerator(), labels)).toThrow();
        }
    });
});
