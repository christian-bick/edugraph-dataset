import {Scope} from 'edugraph-ts';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {resolveDependencyAuditAnnotation} from '../../../lib/label-dependency-annotation-resolution.ts';
import {resolveInferredLabels} from '../../../lib/inferred-labels.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {spec as viewSpec} from '../../../visuals/views/place-value/place-value-expanded-form/spec.ts';
import {spec as gradeTwo} from '../../../spec/ccss/grade-02.ts';
import {spec as gradeFour} from '../../../spec/ccss/grade-04.ts';
import {expandedNumbers, expandedRangeBounds} from './domain.ts';
import {PlaceValueExpandedGenerator} from './generator.ts';
import {PlaceValueExpandedGeneratorSchema as schema, spec, type PlaceValueExpandedGeneratorConfig} from './spec.ts';

let View: typeof import('../../../visuals/views/place-value/place-value-expanded-form/view.tsx')['PlaceValueExpandedForm'];
beforeAll(async () => {
    vi.stubGlobal('window', {});
    ({PlaceValueExpandedForm: View} = await import('../../../visuals/views/place-value/place-value-expanded-form/view.tsx'));
});
afterAll(() => vi.unstubAllGlobals());

describe('expanded-form range resolution and projections', () => {
    it('keeps all18 profiles truthful in direct/planned resolution, inference, replay and the complete Q/S consumer', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
        let profiles = 0;
        for (const [upper, lower] of expandedRangeBounds) for (const cardinality of [Scope.TwoOperands, Scope.ThreeOperands]) {
            const rangeLabels = [`http://edugraph.io/edu/NumbersSmaller${upper}`, ...(lower ? [`http://edugraph.io/edu/NumbersLarger${lower}`] : [])];
            const labels = [...spec.generalLabels, ...viewSpec.generalLabels, cardinality, ...rangeLabels];
            const match = planModelCompatibility({id: 'expanded-profile', labels},
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: {}, spec: viewSpec});
            if (cardinality === Scope.ThreeOperands && lower >= 10) {
                expect(match.supported).toBe(false);
                expect(() => extractConfig(schema, labels)).toThrow();
                continue;
            }
            expect(match.supported).toBe(true);
            const direct = extractConfig(schema, labels), planned = resolveSchemaChoices(schema, labels,
                {operandCardinality: [cardinality], range: rangeLabels});
            expect(planned.config).toEqual(direct.config);
            expect([...planned.resolvedLabels].sort()).toEqual([...direct.resolvedLabels].sort());
            expect(direct.config.range).toEqual(createCanonicalNumericRange(upper, lower));
            const generator = new PlaceValueExpandedGenerator();
            setSeed(profiles);
            const result = generator.generate(direct.config), continuation = getRandomState();
            setSeed(profiles);
            expect(generator.generate(planned.config)).toEqual(result);
            expect(getRandomState()).toBe(continuation);
            expect(resolveInferredLabels({spec, schema, config: direct.config, labels: [], owner: 'generator'}))
                .toEqual([upper <= 1000 ? Scope.NumbersWithoutZero : Scope.NumbersWithZero]);
            for (const isSolutionView of [false, true]) {
                const html = renderToStaticMarkup(createElement(View, {payload: {problem: {type: 'arithmetic', data: result.data, labels},
                    viewId: viewSpec.viewId, targetLabels: labels, seed: 0, isSolutionView,
                    preparedView: {version: 1, viewId: viewSpec.viewId, planHash: 'expanded-proof', variantHash: 'empty', config: {}, labels: [], randomState: 1}}}));
                expect(html).not.toMatch(/NaN|undefined/);
                expect(html).toContain('sum of');
                if (upper > 1000) expect(html).toContain('Hundred');
            }
            profiles++;
        }
        expect(profiles).toBe(18);
    });

    it('resolves a two-term cardinality fallback for every explicit large positive legacy floor', () => {
        for (const lower of [10, 20]) for (const upper of [120, 1000]) for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const config = extractConfig(schema, [`http://edugraph.io/edu/NumbersSmaller${upper}`, `http://edugraph.io/edu/NumbersLarger${lower}`]).config;
            expect(config.operandCardinality).toBe(Scope.TwoOperands);
            expect(expandedNumbers(config.range!, 2).length).toBeGreaterThan(0);
        }
    });

    it('covers the entire authored corpus through all seven real source routes and eighteen admitted bindings', () => {
        const targets = [...gradeTwo, ...gradeFour].filter(t => t.id.startsWith('2.NBT.A.3-expanded-form~') || t.id.startsWith('4.NBT.A.2-expanded-form~'));
        expect(targets).toHaveLength(7);
        const covered = new Set<number>(), profiles = new Set<string>();
        let bindings = 0;
        for (const target of targets) {
            const matched = planModelCompatibility(target,
                {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec},
                {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: {}, spec: viewSpec});
            if (!matched.supported) throw Error('An expanded-form source lost coverage');
            for (const selection of enumerateDependencyAuditSelections(matched.plan).selections) {
                expect(resolveDependencyAuditAnnotation({id: selection.variantHash, plan: matched.plan, selection,
                    generator: {schema, spec}, view: {schema: {}, spec: viewSpec}}).annotationResolution.status).toBe('exhaustive');
                const sampleKey = `${target.id}#${spec.generatorId}#${viewSpec.viewId}#train#question#inst:0`;
                const resolved = resolvePlannedConfigurations({generatorSchema: schema, viewSchema: {}, generatorSpec: spec, viewSpec,
                    plan: matched.plan, sampleKey, seed: 0, attempt: 1, replay: {version: 1, sampleKey, seed: 0, attempt: 1,
                        selection: createGenerationSelectionReceipt(matched.plan, selection.choices)}});
                const config = resolved.generatorConfig as PlaceValueExpandedGeneratorConfig;
                const cardinality = config.operandCardinality === Scope.TwoOperands ? 2 : 3;
                for (const value of expandedNumbers(config.range!, cardinality)) covered.add(value);
                profiles.add(`${config.range!.max}:${config.range!.min}:${cardinality}`);
                bindings++;
            }
        }
        expect(bindings).toBe(18);
        expect(profiles.size).toBe(18);
        expect(covered.size).toBe(15714);
    });
});
