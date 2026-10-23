import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../../lib/planned-generation.ts';
import {normalizeSchemaChoices} from '../../../../lib/schema-choices.ts';
import {findSchemaFallbackContractIssues} from '../../../../lib/utils.ts';
import {implementationTodos, spec as active} from '../../../../spec/ccss/grade-06.ts';
import {NumericalDataGenerator} from '../../../../generators/statistics/numerical-data/generator.ts';
import {NumericalDataGeneratorSchema, spec as producer} from '../../../../generators/statistics/numerical-data/spec.ts';
import {isNumericalDataProblem} from '../../../../generators/statistics/numerical-data-helpers.ts';
import {spec, NumericalDistributionPlotViewSchema as schema} from './spec.ts';

const prefix = '6.SP.B.4-construct-numerical-distribution-plot~';
const prefixes = ['6.SP.A.2-describe-distribution', '6.SP.A.3-interpret-center-summary', '6.SP.A.3-interpret-variation-summary',
    '6.SP.B.4-construct-numerical-distribution-plot', '6.SP.B.5a-observation-count', '6.SP.B.5b-data-attribute-description',
    '6.SP.B.5c-compute-contextual-center', '6.SP.B.5c-compute-contextual-variation', '6.SP.B.5c-describe-contextual-patterns', '6.SP.B.5d-select-contextual-summaries'];
const targets = [...active, ...implementationTodos].filter(target => prefixes.includes(target.id.split('~')[0]));
const plan = (target: typeof targets[number]) => planCompatibility({identity: {targetId: target.id, generatorId: producer.generatorId, viewId: spec.viewId}, targetLabels: target.labels,
    generatorLabels: producer.generalLabels, viewLabels: spec.generalLabels, generatorRules: producer.compatibility, viewRules: spec.compatibility,
    fields: [...normalizeSchemaChoices(NumericalDataGeneratorSchema, target.labels, 'generator'), ...normalizeSchemaChoices(schema, target.labels, 'view')]});

describe('numerical display construction exact participation', () => {
    it('declares one fixed VisualArticulation task with three presentation conventions and complete fallbacks', () => {
        expect(spec.generalLabels).toEqual([Ability.VisualArticulation]); expect(Object.keys(schema)).toEqual(['plot']);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        for (const [scope, plot] of [[Scope.LinePlot, 'line-plot'], [Scope.Histogram, 'histogram'], [Scope.BoxPlot, 'box-plot']] as const) expect(schema.plot[1]([scope])).toBe(plot);
        expect(() => schema.plot[1]([Scope.LinePlot, Scope.Histogram])).toThrow();
    });
    it('pairs only the three authored display targets and preserves their exact emitted bundles', () => {
        expect(targets).toHaveLength(17); let matched = 0;
        for (const target of targets) {
            const result = plan(target); expect(result.supported, target.id).toBe(target.id.startsWith(prefix));
            if (!result.supported) continue;
            matched++;
            for (const seed of [3, 27, 51]) {
                const draw = generatePlannedDraw({generator: new NumericalDataGenerator(), viewSchema: schema, plan: result.plan,
                    sampleKey: `${target.id}#numerical-data#${spec.viewId}#train#question#inst:0`, seed, attempt: 1});
                expect(isNumericalDataProblem(draw.stub!.data)).toBe(true); expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                const expected = target.labels.includes(Scope.BoxPlot) ? [Area.Quartile, Area.Median] : [Area.FrequencyDistribution];
                expect(new Set(draw.stub!.labels)).toEqual(new Set(expected));
            }
        }
        expect(matched).toBe(3);
    });
});
