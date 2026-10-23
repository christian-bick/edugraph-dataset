import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as active} from '../../../spec/ccss/grade-06.ts';
import {spec as description, DistributionDescriptionViewSchema as descriptionSchema} from '../../../visuals/views/statistics/distribution-description/spec.ts';
import {spec as patterns, DistributionPatternsContextViewSchema as patternsSchema} from '../../../visuals/views/statistics/distribution-patterns-context/spec.ts';
import {isNumericalDataProblem} from '../numerical-data-helpers.ts';
import {numericalRelationSets as sets} from '../numerical-data-inputs.ts';
import {NumericalDataGenerator} from './generator.ts';
import {NumericalDataGeneratorSchema as schema, spec} from './spec.ts';

const prefixes = ['6.SP.A.2-describe-distribution', '6.SP.A.3-interpret-center-summary', '6.SP.A.3-interpret-variation-summary',
    '6.SP.B.4-construct-numerical-distribution-plot', '6.SP.B.5a-observation-count', '6.SP.B.5b-data-attribute-description',
    '6.SP.B.5c-compute-contextual-center', '6.SP.B.5c-compute-contextual-variation', '6.SP.B.5c-describe-contextual-patterns', '6.SP.B.5d-select-contextual-summaries'];
const targets = [...active, ...implementationTodos].filter(target => prefixes.includes(target.id.split('~')[0]));
function intended(target: typeof targets[number]) {
    const prefix = target.id.split('~')[0], labels = target.labels;
    if (prefix === prefixes[0]) return labels.includes(Area.ArithmeticMean) ? sets.distributionMean : sets.distributionMedian;
    if (prefix === prefixes[1] || prefix === prefixes[6]) return labels.includes(Area.ArithmeticMean) ? sets.mean : sets.median;
    if (prefix === prefixes[2] || prefix === prefixes[7]) return labels.includes(Area.MeanAbsoluteDeviation) ? sets.mad : sets.iqr;
    if (prefix === prefixes[3]) return labels.includes(Scope.BoxPlot) ? sets.quartiles : sets.frequency;
    if (prefix === prefixes[4]) return sets.sample;
    if (prefix === prefixes[5]) return sets.variable;
    if (prefix === prefixes[8]) return sets.departure;
    return sets.sensitivity;
}
const entries = [[description, descriptionSchema], [patterns, patternsSchema]] as const;
const plan = (target: typeof targets[number], entry: typeof entries[number]) => planCompatibility({
    identity: {targetId: target.id, generatorId: spec.generatorId, viewId: entry[0].viewId}, targetLabels: target.labels,
    generatorLabels: spec.generalLabels, viewLabels: entry[0].generalLabels, generatorRules: spec.compatibility, viewRules: entry[0].compatibility,
    fields: [...normalizeSchemaChoices(schema, target.labels, 'generator'), ...normalizeSchemaChoices(entry[1], target.labels, 'view')]
});

describe('numerical-data capability ownership and exact selection', () => {
    it('declares twelve genuine theorem bundles with no invariant statistical Area or Ability', () => {
        expect(spec.generalLabels).toEqual([]);
        expect(Object.keys(schema)).toEqual(['relations']);
        expect(schema.relations[2]).toHaveLength(12);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        for (const labels of schema.relations[2]) expect(Object.values(sets)).toContainEqual(schema.relations[1]([...labels]));
    });

    it('exhaustively resolves all17 actual authored producer contracts without inventing future views', () => {
        expect(targets).toHaveLength(17);
        const covered = new Set<string>();
        for (const target of targets) {
            const fields = normalizeSchemaChoices(schema, target.labels, 'generator');
            expect(fields).toHaveLength(1); expect(fields[0].alternatives).toHaveLength(1);
            for (const binding of fields[0].alternatives) {
                const resolved = resolveSchemaChoices(schema, target.labels, {relations: binding.labels});
                expect(resolved.config.relations).toEqual(intended(target));
                const expectedOwned = target.labels.filter(label => (schema.relations[0] as readonly string[]).includes(label));
                expect(new Set(resolved.resolvedLabels)).toEqual(new Set(expectedOwned));
                setSeed(227); const stub = new NumericalDataGenerator().generate(resolved.config);
                expect(isNumericalDataProblem(stub.data)).toBe(true);
                expect(new Set(stub.data.relations.map(row => row.kind))).toEqual(new Set(intended(target)));
                covered.add(JSON.stringify(resolved.config.relations));
            }
        }
        expect(covered.size).toBe(12);
    });

    it('executes exactly the three current reviewed paired target/view plans and excludes the future task identities', () => {
        let matched = 0;
        for (const target of targets) for (const entry of entries) {
            const expected = target.id.startsWith(prefixes[0] + '~') ? description.viewId
                : target.id.startsWith(prefixes[8] + '~') ? patterns.viewId : undefined;
            const result = plan(target, entry);
            expect(result.supported, `${target.id} at ${entry[0].viewId}`).toBe(entry[0].viewId === expected);
            if (!result.supported) continue;
            matched++;
            for (let seed = 0; seed < 6; seed++) {
                const draw = generatePlannedDraw({generator: new NumericalDataGenerator(), viewSchema: entry[1], plan: result.plan,
                    sampleKey: `${target.id}#numerical-data#${entry[0].viewId}#train#question#inst:0`, seed, attempt: 1});
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                expect(isNumericalDataProblem(draw.stub!.data)).toBe(true);
            }
        }
        expect(matched).toBe(3);
    });

    it('does not let a learner Ability choose the observed data or selected mathematical relation', () => {
        setSeed(424); const first = generateWithLabels(new NumericalDataGenerator(), [Area.ArithmeticMean, Ability.Interpretation]);
        setSeed(424); expect(generateWithLabels(new NumericalDataGenerator(), [Area.ArithmeticMean, Ability.ProcedureExecution])).toEqual(first);
        expect(first!.labels).toEqual([Area.ArithmeticMean]);
        expect(() => new NumericalDataGenerator().generate({} as never)).toThrow();
    });
});
