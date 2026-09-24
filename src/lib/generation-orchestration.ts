import {AbstractProblem} from '../types/ml-engine.ts';
import {assertResolvedTargetCoverage} from './label-contracts.ts';
import {
    computeSampleKey, computeSampleFilename, computeContentFingerprint,
    computeTaskFingerprint, generatePlannedSampleWithRetry, isValTuple,
    DEFAULT_VAL_RATIO, buildProblem, type GeneratorCatalogEntry, type MatchTuple,
    type ViewCatalogEntry, type SampleIdentity, type SampleMode, type SampleSplit
} from './generation.ts';
import {restorePersistedMatchTuple} from './matching.ts';
import {selectionAdmittedByPlan, type PlannedGenerationDraw} from './planned-generation.ts';
import type {GenerationPlan, GenerationSelectionReceipt} from '../types/compatibility.ts';
import type {GenerationReplay, PreparedViewConfiguration} from '../types/generation-plan.ts';

const MAX_ATTEMPTS = 50;

/**
 * One fully specified image to render: the sample identity plus everything
 * derived from it. All fields are pure functions of (identity, attempt), so
 * the same tuple always produces the same image regardless of what else is
 * in the dataset.
 */
export interface RenderSample {
    identity: SampleIdentity;
    /** Target claims that selected the resolved view configuration. */
    targetLabels: string[];
    sampleKey: string;
    fileName: string;
    seed: number;
    attempt: number;
    contentFingerprint: string;
    taskFingerprint: string;
    problem: AbstractProblem;
    associatedTargetIds: Set<string>;
    associatedSelections: Map<string, GenerationSelectionReceipt>;
    associatedPlans: Map<string, GenerationPlan>;
    plan: GenerationPlan;
    replay: GenerationReplay;
    preparedView: PreparedViewConfiguration;
}

export type SampleFingerprintIndex = Map<string, Map<string, RenderSample[]>>;

function samplesForFingerprint(
    index: SampleFingerprintIndex | undefined,
    viewId: string,
    fingerprint: string
): RenderSample[] {
    return index?.get(viewId)?.get(fingerprint) ?? [];
}

function claimSample(index: SampleFingerprintIndex, sample: RenderSample, fingerprint: string): void {
    const byFingerprint = index.get(sample.identity.viewId) ?? new Map<string, RenderSample[]>();
    const samples = byFingerprint.get(fingerprint) ?? [];
    samples.push(sample);
    byFingerprint.set(fingerprint, samples);
    index.set(sample.identity.viewId, byFingerprint);
}

/**
 * Generates all samples of one module (generator) for one split.
 *
 * Dedup is scoped per (module, split, view) via task fingerprints (problem
 * data plus resolved view configuration), and covers both modes. The val
 * split separately rejects mathematical content already claimed by train,
 * even when the view configuration differs.
 *
 * The module scope is deliberate — it keeps `--generator=X` reproducing exactly
 * what a full run produces for that module. It costs nothing in practice
 * because no view is rendered by more than one generator, so cross-module
 * collisions within a view cannot occur.
 */
export function generateModuleSamples(
    genEntry: GeneratorCatalogEntry,
    viewsById: ReadonlyMap<string, ViewCatalogEntry>,
    tuples: readonly MatchTuple[],
    split: SampleSplit,
    taskFingerprintsByView: SampleFingerprintIndex,
    contentFingerprintsByView: SampleFingerprintIndex,
    trainTaskFingerprintsByView?: SampleFingerprintIndex,
    trainContentFingerprintsByView?: SampleFingerprintIndex
): RenderSample[] {
    const moduleName = genEntry.generatorId;
    const samples: RenderSample[] = [];

    for (const tuple of tuples) {
        const target = tuple.target;
        if (split === 'val' && !isValTuple(target.id, moduleName, tuple.viewId, DEFAULT_VAL_RATIO)) continue;

        const targetLabels = [...target.labels];
        const instanceIdx = 0;
        const viewEntry = viewsById.get(tuple.viewId);
        if (!viewEntry) throw new Error(`View catalog entry not found: ${tuple.viewId}`);
        restorePersistedMatchTuple(target, genEntry, viewEntry, tuple.plan);

        const makeIdentity = (mode: SampleMode): SampleIdentity => ({
            targetId: target.id,
            generatorId: moduleName,
            viewId: tuple.viewId,
            split,
            mode,
            instanceIdx
        });

        const fingerprintDraw = (draw: PlannedGenerationDraw) => {
            assertResolvedTargetCoverage(draw.labels, targetLabels, `${target.id}/${moduleName}/${tuple.viewId}`);
            const problem = buildProblem({
                stub: draw.stub!,
                type: genEntry.generator.type,
                labels: draw.labels
            });
            const contentFingerprint = computeContentFingerprint(problem.data);
            return {
                problem,
                contentFingerprint,
                taskFingerprint: computeTaskFingerprint(problem.data, draw.view.config)
            };
        };

        // A task-identical sample may represent another target. A train sample
        // with only the same mathematical payload cannot: it merely excludes
        // that payload from validation to protect the split boundary.
        const representingSamples: RenderSample[] = [];
        const associationReceipts = new Map<RenderSample, GenerationSelectionReceipt>();
        const isDuplicate = (draw: PlannedGenerationDraw) => {
            const {contentFingerprint, taskFingerprint} = fingerprintDraw(draw);
            const taskMatches = [
                ...samplesForFingerprint(taskFingerprintsByView, tuple.viewId, taskFingerprint),
                ...samplesForFingerprint(trainTaskFingerprintsByView, tuple.viewId, taskFingerprint)
            ];
            for (const sample of taskMatches) {
                const receipt = selectionAdmittedByPlan(tuple.plan, sample.plan, sample.replay.selection);
                if (!receipt) continue;
                associationReceipts.set(sample, receipt);
                if (!representingSamples.includes(sample)) representingSamples.push(sample);
            }
            const trainContentMatches = samplesForFingerprint(
                trainContentFingerprintsByView,
                tuple.viewId,
                contentFingerprint
            );
            return taskMatches.length > 0 || trainContentMatches.length > 0;
        };

        const questionIdentity = makeIdentity('question');
        const questionKey = computeSampleKey(questionIdentity);

        const question = generatePlannedSampleWithRetry({
                generator: genEntry.generator,
                viewSchema: viewEntry.schema,
                plan: tuple.plan,
                sampleKey: questionKey,
                maxAttempts: MAX_ATTEMPTS,
                isDuplicate
            });
        if (!question.stub) {
            const representedBy = representingSamples[0];
            if (representedBy) {
                assertResolvedTargetCoverage(representedBy.problem.labels, targetLabels, representedBy.sampleKey);
                representedBy.associatedTargetIds.add(target.id);
                representedBy.associatedSelections.set(target.id, associationReceipts.get(representedBy)!);
                representedBy.associatedPlans.set(target.id, tuple.plan);
                console.warn(`[${moduleName}] Linked ${questionKey} to existing sample ${representedBy.sampleKey} after ${MAX_ATTEMPTS} duplicate attempts`);
                continue;
            }
            console.warn(`[${moduleName}] Skipping ${questionKey}: no unique stub after ${MAX_ATTEMPTS} attempts`);
            continue;
        }

        const questionResult = fingerprintDraw(question);
        const questionSample: RenderSample = {
            identity: questionIdentity,
            targetLabels,
            sampleKey: questionKey,
            fileName: computeSampleFilename(questionIdentity),
            seed: question.seed,
            attempt: question.attempt,
            contentFingerprint: questionResult.contentFingerprint,
            taskFingerprint: questionResult.taskFingerprint,
            problem: questionResult.problem,
            associatedTargetIds: new Set(),
            associatedSelections: new Map(),
            associatedPlans: new Map(),
            plan: tuple.plan,
            replay: question.replay,
            preparedView: question.view
        };
        samples.push(questionSample);
        claimSample(taskFingerprintsByView, questionSample, questionSample.taskFingerprint);
        claimSample(contentFingerprintsByView, questionSample, questionSample.contentFingerprint);

        const solutionIdentity = makeIdentity('solution');
        const solutionKey = computeSampleKey(solutionIdentity);
        const solution = generatePlannedSampleWithRetry({
                generator: genEntry.generator,
                viewSchema: viewEntry.schema,
                plan: tuple.plan,
                sampleKey: solutionKey,
                maxAttempts: MAX_ATTEMPTS,
                isDuplicate
            });
        // A view whose content space is too small to offer a second distinct
        // problem falls back to showing the question's content solved. That is
        // the same exercise in the same split — never a cross-split leak.
        const solutionDraw = solution.stub ? solution : question;
        const solutionResult = fingerprintDraw(solutionDraw);
        const solutionSample: RenderSample = {
            identity: solutionIdentity,
            targetLabels,
            sampleKey: solutionKey,
            fileName: computeSampleFilename(solutionIdentity),
            seed: solutionDraw.seed,
            attempt: solutionDraw.attempt,
            contentFingerprint: solutionResult.contentFingerprint,
            taskFingerprint: solutionResult.taskFingerprint,
            problem: solutionResult.problem,
            associatedTargetIds: new Set(),
            associatedSelections: new Map(),
            associatedPlans: new Map(),
            plan: tuple.plan,
            replay: solutionDraw.replay,
            preparedView: solutionDraw.view
        };
        samples.push(solutionSample);
        claimSample(taskFingerprintsByView, solutionSample, solutionSample.taskFingerprint);
        claimSample(contentFingerprintsByView, solutionSample, solutionSample.contentFingerprint);
    }

    return samples;
}
