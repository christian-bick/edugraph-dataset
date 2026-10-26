import {beforeAll, describe, expect, it} from 'vitest';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Ability, Area, Scope} from 'edugraph-ts/generated';
import {loadGeneratorModelCatalog, loadViewModelCatalog} from './model-catalog.ts';
import {matchTargets, type MatchTuple} from './matching.ts';
import {computeContentFingerprint, computeSampleKey, computeSampleSeed, computeTaskFingerprint, loadGeneratorCatalog} from './generation.ts';
import {generatePlannedDraw} from './planned-generation.ts';
import {createLabelDependencyEvaluator} from './label-dependencies.ts';
import {buildLabelDependencyAudit, enumerateDependencyAuditSelections, replayDependencyAuditRow} from './label-dependency-audit.ts';
import type {ProblemGenerator} from '../types/ml-engine.ts';
import type {ConfigSchema} from '../types/schema.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
let tuple: MatchTuple;
let generator: ProblemGenerator;
let viewSchema: ConfigSchema;

beforeAll(async () => {
    const generatorFiles = new Map([['arithmetic-ops-pairs', resolve(root, 'src/generators/arithmetic/arithmetic-ops-pairs/spec.ts')]]);
    const viewFiles = new Map([['operations-boxes', resolve(root, 'src/visuals/views/operations/operations-boxes/spec.ts')]]);
    const [generators, views, runtime] = await Promise.all([
        loadGeneratorModelCatalog(undefined, undefined, generatorFiles),
        loadViewModelCatalog(undefined, undefined, viewFiles),
        loadGeneratorCatalog(undefined, undefined, generatorFiles)
    ]);
    const target = {id: 'dependency-audit-integration', labels: [Area.Addition, Scope.IntegerNumbers,
        Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero, Scope.NumbersSmaller10, Ability.ProcedureExecution]};
    tuple = matchTargets([target], generators, views).tuples[0];
    generator = runtime[0].generator;
    viewSchema = views[0].schema;
});

describe('label dependency audit with real generation contracts', () => {
    it('checks every admitted selection using the complete generator/view capability conjunction', () => {
        expect(tuple).toBeDefined();
        const selections = enumerateDependencyAuditSelections(tuple.plan);
        expect(selections.status).toBe('complete');
        expect(Number(selections.total)).toBe(selections.selections.length);
        const evaluate = createLabelDependencyEvaluator().evaluate;
        for (const selection of selections.selections) {
            expect(selection.labels).toContain(Area.Addition);
            expect(selection.labels).toContain(Ability.ProcedureExecution);
            expect(evaluate(selection.labels).context.status).toBe('eligible');
        }
    });

    it('replays a real stored draw and catches an omitted base independently of passing supplied labels', () => {
        const sampleKey = computeSampleKey({...tuple.plan.identity, split: 'train', mode: 'question', instanceIdx: 0});
        const seed = computeSampleSeed(sampleKey, 1);
        const draw = generatePlannedDraw({generator, viewSchema, plan: tuple.plan, sampleKey, seed, attempt: 1});
        expect(draw.stub).not.toBeNull();
        const row = {file_name: 'question.png', sample_key: sampleKey, spec: 'integration',
            target_id: tuple.target.id, generator: tuple.generatorId, view: tuple.viewId, mode: 'question',
            labels: draw.labels.filter(label => label !== Scope.Base10), generation_plan: tuple.plan,
            generation_plan_hash: tuple.plan.hash, generation_replay: draw.replay, seed, attempt: 1,
            content_fingerprint: computeContentFingerprint(draw.stub!.data),
            task_fingerprint: computeTaskFingerprint(draw.stub!.data, draw.view.config)};
        const replayed = replayDependencyAuditRow({row, currentPlan: tuple.plan, generator, viewSchema, sourceIssues: []});
        expect(replayed.status).toBe('verified');
        const evaluator = createLabelDependencyEvaluator();
        const result = evaluator.evaluate(row.labels, replayed.evidence);
        expect(result.assessments.find(assessment => assessment.facet === 'base')).toMatchObject({
            status: 'missing', missingLabels: [Scope.Base10]
        });
        const report = buildLabelDependencyAudit({spec: 'integration', policyHash: evaluator.policyHash, ontology: {},
            dataset: {status: 'available', generationId: 'fixture'}, selectionCoverage: [], evaluate: evaluator.evaluate,
            subjects: [{kind: 'sample', id: sampleKey, targetId: tuple.target.id, generatorId: tuple.generatorId,
                viewId: tuple.viewId, labels: row.labels, evidence: replayed.evidence, replay: replayed.status,
                targetAssociations: [{spec: 'integration', target_id: 'alias'}]}]});
        expect(report.findings.some(finding => finding.facet === 'base' && finding.status === 'missing')).toBe(true);
        expect(report.subjects[0].targetAssociations).toEqual([{spec: 'integration', target_id: 'alias'}]);
    });
});
