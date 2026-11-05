import {Ability, Area, Scope} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {getRandomState, random, setRandomState} from '../../../lib/random.ts';
import {extractConfig, labelSetHash} from '../../../lib/utils.ts';
import {FractionComparisonView} from '../../../visuals/views/fractions/fraction-comparison-view.tsx';
import {FractionsCompareModelsViewSchema, spec as commonViewSpec} from '../../../visuals/views/fractions/fractions-compare-models/spec.ts';
import {FractionsCompareBenchmarkModelsViewSchema, spec as benchmarkViewSpec} from '../../../visuals/views/fractions/fractions-compare-benchmark-models/spec.ts';
import {FractionComparisonGenerator} from './generator.ts';
import {FractionComparisonGeneratorSchema as schema, spec} from './spec.ts';

// Frozen current source claims; no ignored snapshots or unrelated catalogs are loaded.
const currentTargets = [
    ['3.NF.A.3d-compare-fractions~11c34c21', Area.FractionCommonNumeratorComparison, Scope.CommonNumerator, Scope.Less],
    ['3.NF.A.3d-compare-fractions~225efa73', Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, Scope.Less],
    ['3.NF.A.3d-compare-fractions~4064bc28', Area.FractionCommonNumeratorComparison, Scope.CommonNumerator, Scope.Greater],
    ['3.NF.A.3d-compare-fractions~8d3ce302', Area.FractionCommonDenominatorComparison, Scope.CommonDenominator, Scope.Greater],
    ['4.NF.A.2-unlike-fraction-comparison~007bf5e6', Area.NumericInequality, Area.FractionReferenceComparison, Scope.Less],
    ['4.NF.A.2-unlike-fraction-comparison~928f1181', Area.NumericInequality, Area.FractionReferenceComparison, Scope.Greater],
    ['4.NF.A.2-unlike-fraction-comparison~b66df27a', Area.NumericEquality, Area.FractionReferenceComparison, Scope.Equal]
] as const;
// This producer has no inference callback; keep direct resolution schema-typed.
const directSpec = {...spec, inferredLabels: undefined};

describe('fraction comparison current-source range lineage', () => {
    it.each(currentTargets)('preserves target %s with exact direct/planned replay and both modes', (id, strategy, family, relation) => {
        const reference = family === Area.FractionReferenceComparison;
        expect(spec.inferredLabels).toBeUndefined();
        const labels = reference
            ? [strategy, family, relation, Scope.FractionNumbers, Scope.SingleFrameOfReference, Scope.VisualNumbers, Ability.ProcedureUnderstanding]
            : [strategy, family, relation, Scope.ProperFractions, Scope.SingleFrameOfReference, Scope.VisualNumbers, Ability.LogicalInference];
        expect(labelSetHash(labels)).toBe(id.split('~')[1]);
        const viewSpec = reference ? benchmarkViewSpec : commonViewSpec;
        const viewSchema = reference ? FractionsCompareBenchmarkModelsViewSchema : FractionsCompareModelsViewSchema;
        const target = {id, labels};
        const result = planModelCompatibility(target,
            {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
            {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: viewSchema, spec: viewSpec});
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error(result.reason);
        const enumeration = enumerateDependencyAuditSelections(result.plan);
        expect(enumeration.status).toBe('complete');
        expect(enumeration.selections).toHaveLength(relation === Scope.Equal ? 1 : 2);
        const uppers = new Set<number>();
        for (const selection of enumeration.selections) {
            const receipt = createGenerationSelectionReceipt(result.plan, selection.choices);
            const generator = new FractionComparisonGenerator();
            const sampleKey = `${id}#fraction-comparison#${viewSpec.viewId}#train#question#inst:0`;
            for (const seed of [0, 1, 2, 7, 19, 42, 255, 65535]) {
                const replay = {version: 1 as const, sampleKey, seed, attempt: 1, selection: receipt};
                const input = {generator, generatorSpec: spec, viewSchema, viewSpec, plan: result.plan, sampleKey, seed, attempt: 1, replay};
                const resolved = resolvePlannedConfigurations({...input, generatorSchema: schema});
                const complete = extractConfig(schema, selection.labels, {spec: directSpec, owner: 'generator'}).config;
                expect(complete).toEqual(resolved.generatorConfig);
                setRandomState(resolved.generatorRandomState);
                const direct = generator.generate(complete);
                const state = getRandomState(), continuation = random();
                setRandomState(resolved.generatorRandomState);
                for (let i = 0; i < (reference ? 1 : 3); i++) random();
                expect(getRandomState()).toBe(state);
                expect(random()).toBe(continuation);
                const planned = generatePlannedDraw(input);
                expect(planned.stub?.data).toEqual(direct.data);
                expect(getRandomState()).toBe(state);
                expect(generatePlannedDraw(input)).toEqual(planned);
                expect(getRandomState()).toBe(state);
                const range = complete.range!;
                uppers.add(range.max);
                const data = direct.data;
                const quantities = [data.first.numerator / data.first.denominator, data.second.numerator / data.second.denominator,
                    data.first.numerator, data.first.denominator, data.second.numerator, data.second.denominator, data.sharedWhole,
                    ...('benchmark' in data ? [data.benchmark.numerator / data.benchmark.denominator, data.benchmark.numerator, data.benchmark.denominator] : [])];
                expect(Math.max(...quantities)).toBeLessThanOrEqual(range.max);
                expect(Math.max(...quantities)).toBeGreaterThan(range.maximumAbove);
                expect(Math.min(...quantities)).toBeGreaterThanOrEqual(range.min);
                expect(Math.min(...quantities)).toBeLessThan(range.minimumBelow);
                for (const isSolutionView of [false, true]) {
                    const html = renderToStaticMarkup(<FractionComparisonView mode={reference ? 'procedure-understanding' : 'logical-inference'} viewId={viewSpec.viewId}
                        payload={{viewId: viewSpec.viewId, problem: {type: 'fraction', data, labels: planned.labels}, targetLabels: labels, seed, isSolutionView}} />);
                    expect(html).not.toMatch(/Validation Error|NaN|undefined/);
                    if (reference) expect(html).toContain('Explain how the benchmark justifies your comparison.');
                }
            }
        }
        expect(uppers).toEqual(new Set(relation === Scope.Equal ? [10] : [5, 10]));
    });
});
