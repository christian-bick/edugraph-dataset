import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../../lib/planned-generation.ts';
import {normalizeSchemaChoices} from '../../../../lib/schema-choices.ts';
import type {CompatibilityQueries} from '../../../../types/compatibility.ts';
import {implementationTodos, spec as active} from '../../../../spec/ccss/grade-06.ts';
import {NumericalDataGenerator} from '../../../../generators/statistics/numerical-data/generator.ts';
import {NumericalDataGeneratorSchema, spec as producer} from '../../../../generators/statistics/numerical-data/spec.ts';
import {isNumericalDataProblem} from '../../../../generators/statistics/numerical-data-helpers.ts';
import {summarySelectionClaims, summarySelectionEvidence} from '../summary-selection-view-policy.ts';
import {spec, StatisticalSummarySelectionViewSchema as schema} from './spec.ts';

const prefixes = ['6.SP.A.2-describe-distribution', '6.SP.A.3-interpret-center-summary', '6.SP.A.3-interpret-variation-summary',
    '6.SP.B.4-construct-numerical-distribution-plot', '6.SP.B.5a-observation-count', '6.SP.B.5b-data-attribute-description',
    '6.SP.B.5c-compute-contextual-center', '6.SP.B.5c-compute-contextual-variation', '6.SP.B.5c-describe-contextual-patterns', '6.SP.B.5d-select-contextual-summaries'];
const targets = [...active, ...implementationTodos].filter(target => prefixes.includes(target.id.split('~')[0]));
const query = (generator: readonly string[], target: readonly string[] = []): CompatibilityQueries => ({
    has: (owner, label) => (owner === 'generator' ? generator : owner === 'target' ? target : []).includes(label),
    exact: (owner, label) => (owner === 'generator' ? generator : owner === 'target' ? target : []).includes(label)
});

describe('summary applicability exact task and claim participation', () => {
    it('declares fixed ProcedureApplicability with no task/schema selector and exact original+selected mathematical evidence', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureApplicability]); expect(schema).toEqual({});
        expect(summarySelectionEvidence.predicate(query(summarySelectionClaims))).toBe(true);
        for (const claims of [[Area.ArithmeticMean], summarySelectionClaims.slice(0, -1), [...summarySelectionClaims, Area.StatisticalVariability],
            [...summarySelectionClaims, Area.StatisticalOutlier], [...summarySelectionClaims, Area.FrequencyDistribution]]) expect(summarySelectionEvidence.predicate(query(claims))).toBe(false);
        expect(spec.compatibility![0].predicate(query(summarySelectionClaims, summarySelectionClaims))).toBe(true);
        expect(spec.compatibility![0].predicate(query(summarySelectionClaims, [Area.ArithmeticMean, Ability.ProcedureApplicability]))).toBe(false);
    });
    it('matches only the actual authored single suitability target among all17 numerical-data contracts', () => {
        expect(targets).toHaveLength(17); let paths = 0;
        for (const target of targets) {
            const result = planCompatibility({identity: {targetId: target.id, generatorId: producer.generatorId, viewId: spec.viewId}, targetLabels: target.labels,
                generatorLabels: producer.generalLabels, viewLabels: spec.generalLabels, generatorRules: producer.compatibility, viewRules: spec.compatibility,
                fields: [...normalizeSchemaChoices(NumericalDataGeneratorSchema, target.labels, 'generator'), ...normalizeSchemaChoices(schema, target.labels, 'view')]});
            expect(result.supported, target.id).toBe(target.id.startsWith('6.SP.B.5d-select-contextual-summaries~'));
            if (!result.supported) continue; paths++;
            for (const seed of [4, 19, 63]) {
                const draw = generatePlannedDraw({generator: new NumericalDataGenerator(), viewSchema: schema, plan: result.plan,
                    sampleKey: `${target.id}#numerical-data#${spec.viewId}#train#question#inst:0`, seed, attempt: 1});
                const data: unknown = draw.stub!.data;
                if (!isNumericalDataProblem(data)) throw Error('The real planned producer draw must provide complete numerical-data evidence.');
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                expect(new Set(draw.stub!.labels)).toEqual(new Set(summarySelectionClaims));
                expect(data.relations.some(row => row.kind === 'single-record-replacement')).toBe(true);
            }
        }
        expect(paths).toBe(1);
    });
});
