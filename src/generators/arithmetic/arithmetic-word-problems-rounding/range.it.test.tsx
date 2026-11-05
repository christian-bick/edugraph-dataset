import {Area} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, describe, expect, it} from 'vitest';
import {createGenerationSelectionReceipt} from '../../../lib/compatibility.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {enumerateDependencyAuditSelections} from '../../../lib/label-dependency-audit.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import * as rng from '../../../lib/random.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues} from '../../../lib/utils.ts';
import {spec as gradeThree} from '../../../spec/ccss/grade-03.ts';
import {spec as gradeFour} from '../../../spec/ccss/grade-04.ts';
import {ArithmeticWordProblemWithin100View} from '../../../visuals/views/operations/arithmetic-word-problem-within-100-view.tsx';
import {spec as viewSpec} from '../../../visuals/views/operations/operations-word-problem-reasoning/spec.ts';
import {roundingDomain, roundingOperationProfiles, roundingRangeProfiles} from './domain.ts';
import {ArithmeticWordProblemsRoundingGenerator} from './generator.ts';
import {ArithmeticWordProblemsRoundingGeneratorSchema as schema, spec} from './spec.ts';

const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
const view = {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: {}, spec: viewSpec};

describe('canonical rounding-story integration', () => {
    // Only completion counts are shared; no mathematical fixtures or random
    // state depend on another case or on execution order.
    const completedProfiles = new Map<string, number>();
    afterAll(() => {
        expect([...completedProfiles.keys()].sort()).toEqual(roundingOperationProfiles.map(profile => profile.operations.join('-')).sort());
        expect(roundingOperationProfiles.length * roundingRangeProfiles.length).toBe(290);
        expect([...completedProfiles.values()].reduce((sum, count) => sum + count, 0)).toBe(232);
    });

    it('retains complete schema fallback contracts', () => {
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
    });

    it.each(roundingOperationProfiles)('resolves every candidate range for $operations through both native paths and preserves equal-value Q/S rendering', operations => {
        const generator = new ArithmeticWordProblemsRoundingGenerator();
        let profiles = 0;
        for (const {range, labels: rangeLabels} of roundingRangeProfiles) {
            const labels = [...spec.generalLabels, ...viewSpec.generalLabels, ...operations.labels, ...rangeLabels];
            const match = planModelCompatibility({id: 'rounding-story-profile', labels}, model, view);
            if (!roundingDomain(operations.operations, range).weight) {
                expect(match.supported).toBe(false);
                expect(() => extractConfig(schema, labels)).toThrow();
                continue;
            }
            expect(match.supported).toBe(true);
            const direct = extractConfig(schema, labels), planned = resolveSchemaChoices(schema, labels,
                {operations: operations.labels, range: rangeLabels});
            expect(planned.config).toEqual(direct.config);
            expect([...planned.resolvedLabels].sort()).toEqual([...direct.resolvedLabels].sort());
            const data = generator.generate(direct.config)!.data;
            const legacy = {...data, numberDomain: {min: 1, max: 1000000}};
            for (const isSolutionView of [false, true]) {
                const markup = (input: typeof data) => renderToStaticMarkup(<ArithmeticWordProblemWithin100View
                    config={{expectedKind: 'rounding', invertProcedure: false, useLengthContext: false}}
                    payload={{viewId: viewSpec.viewId, targetLabels: labels, problem: {type: 'arithmetic', data: input, labels}, seed: 0, isSolutionView}} />);
                const currentMarkup = markup(data), legacyMarkup = markup(legacy);
                expect(currentMarkup).toBe(legacyMarkup);
                expect(currentMarkup).toContain('Use the rounding check');
                expect(currentMarkup).not.toMatch(/NaN|undefined/);
            }
            profiles++;
        }
        completedProfiles.set(operations.operations.join('-'), profiles);
    });

    it('replays2320 native profile draws with exact random continuation', () => {
        const generator = new ArithmeticWordProblemsRoundingGenerator();
        let draws = 0;
        for (const operations of roundingOperationProfiles) for (const profile of roundingRangeProfiles) {
            if (!roundingDomain(operations.operations, profile.range).weight) continue;
            const config = extractConfig(schema, [...operations.labels, ...profile.labels]).config;
            for (let seed = 0; seed < 10; seed++) {
                rng.setSeed(seed);
                const first = generator.generate(config)!, continuation = rng.getRandomState(), data = first.data;
                expect(hasCanonicalRangeWitness([...data.operands, data.intermediate, data.answer, data.roundedAnswer,
                    data.proposal.proposedAnswer, data.proposal.roundedProposedAnswer], profile.range)).toBe(true);
                rng.setSeed(seed);
                expect(generator.generate(config)).toEqual(first);
                expect(rng.getRandomState()).toBe(continuation);
                draws++;
            }
        }
        expect(draws).toBe(2320);
    });

    it('retains all eight old high-band source identities and validates every one of the134 actual source bindings', () => {
        const targets = [...gradeThree, ...gradeFour].filter(t => t.id.startsWith('3.OA.D.8-answer-reasonableness~') || t.id.startsWith('4.OA.A.3-answer-reasonableness~'));
        expect(targets).toHaveLength(51);
        const generator = new ArithmeticWordProblemsRoundingGenerator();
        let routes = 0, bindings = 0;
        const retained = new Set<string>();
        for (const target of targets) {
            const matched = planModelCompatibility(target, model, view);
            if (!matched.supported) {
                expect(target.labels).toContain(Area.Division);
                expect(target.labels).toContain('http://edugraph.io/edu/NumbersSmaller10');
                // This finer Grade3 target is served by the estimation producer.
                expect(target.id.startsWith('3.')).toBe(true);
                continue;
            }
            routes++;
            retained.add(target.id);
            for (const selection of enumerateDependencyAuditSelections(matched.plan).selections) {
                const sampleKey = `${target.id}#${spec.generatorId}#${viewSpec.viewId}#train#question#inst:0`;
                const input = {generator, generatorSpec: spec, viewSchema: {}, viewSpec, plan: matched.plan,
                    sampleKey, seed: 17, attempt: 1, replay: {version: 1 as const, sampleKey, seed: 17, attempt: 1,
                        selection: createGenerationSelectionReceipt(matched.plan, selection.choices)}};
                const first = generatePlannedDraw(input);
                expect(first.stub).not.toBeNull();
                expect(generatePlannedDraw(input)).toEqual(first);
                bindings++;
            }
        }
        expect(routes).toBe(50);
        expect(bindings).toBe(134);
        for (const id of ['3.OA.D.8-answer-reasonableness~e8634c8d', '3.OA.D.8-answer-reasonableness~f6de319b',
            '3.OA.D.8-answer-reasonableness~68d068eb', '3.OA.D.8-answer-reasonableness~4ec714b8',
            '4.OA.A.3-answer-reasonableness~16741a5d', '4.OA.A.3-answer-reasonableness~ca2db62b',
            '4.OA.A.3-answer-reasonableness~156effd3', '4.OA.A.3-answer-reasonableness~55bcb5c0']) expect(retained.has(id)).toBe(true);
    });
});
