import {AbstractProblem, ResolvedProblemStub} from '../types/ml-engine.ts';
import {assertResolvedTargetCoverage, ResolvedLabelContractError} from './label-contracts.ts';
import {
    computeSampleKey, computeSampleFilename, computeSampleSeed, computeContentFingerprint,
    computeTaskFingerprint, resolvePairCapabilities, generateSampleWithRetry, isValTuple,
    DEFAULT_VAL_RATIO, buildProblem, type GeneratorCatalogEntry, type MatchTuple,
    type ViewCatalogEntry, type SampleIdentity, type SampleMode, type SampleSplit
} from './generation.ts';
import {radixSortUtf8} from './content-identity.ts';

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

        const makeIdentity = (mode: SampleMode): SampleIdentity => ({
            targetId: target.id,
            generatorId: moduleName,
            viewId: tuple.viewId,
            split,
            mode,
            instanceIdx
        });

        const fingerprintStub = (stub: ResolvedProblemStub, seed: number) => {
            const pair = resolvePairCapabilities({
                targetLabels,
                generatorGeneralLabels: genEntry.generalLabels,
                generatorResolvedLabels: stub.labels,
                viewGeneralLabels: viewEntry.generalLabels,
                viewSchema: viewEntry.schema,
                seed
            });
            assertResolvedTargetCoverage(pair.labels, targetLabels, `${target.id}/${moduleName}/${tuple.viewId}`);
            const problem = buildProblem({
                stub,
                type: genEntry.generator.type,
                labels: pair.labels
            });
            const contentFingerprint = computeContentFingerprint(problem.data);
            return {
                problem,
                contentFingerprint,
                taskFingerprint: computeTaskFingerprint(problem.data, pair.viewConfig)
            };
        };

        // A task-identical sample may represent another target. A train sample
        // with only the same mathematical payload cannot: it merely excludes
        // that payload from validation to protect the split boundary.
        const representingSamples: RenderSample[] = [];
        const isDuplicate = (stub: ResolvedProblemStub, { seed }: { seed: number }) => {
            const { problem, contentFingerprint, taskFingerprint } = fingerprintStub(stub, seed);
            const taskMatches = [
                ...samplesForFingerprint(taskFingerprintsByView, tuple.viewId, taskFingerprint),
                ...samplesForFingerprint(trainTaskFingerprintsByView, tuple.viewId, taskFingerprint)
            ];
            for (const sample of taskMatches) {
                sample.problem.labels = radixSortUtf8([...new Set([
                    ...sample.problem.labels,
                    ...problem.labels
                ])]);
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

        let question: { stub: ResolvedProblemStub | null; attempt: number; seed: number };
        try {
            question = generateSampleWithRetry({
                generator: genEntry.generator,
                labels: targetLabels,
                sampleKey: questionKey,
                maxAttempts: MAX_ATTEMPTS,
                isDuplicate
            });
        } catch (e) {
            if (e instanceof ResolvedLabelContractError) throw e;
            console.warn(`[${moduleName}] Skipping ${questionKey}: generator error: ${e instanceof Error ? e.message : e}`);
            continue;
        }
        if (!question.stub) {
            const representedBy = representingSamples[0];
            if (representedBy) {
                assertResolvedTargetCoverage(representedBy.problem.labels, targetLabels, representedBy.sampleKey);
                representedBy.associatedTargetIds.add(target.id);
                console.warn(`[${moduleName}] Linked ${questionKey} to existing sample ${representedBy.sampleKey} after ${MAX_ATTEMPTS} duplicate attempts`);
                continue;
            }
            console.warn(`[${moduleName}] Skipping ${questionKey}: no unique stub after ${MAX_ATTEMPTS} attempts`);
            continue;
        }

        const questionResult = fingerprintStub(question.stub, question.seed);
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
            associatedTargetIds: new Set()
        };
        samples.push(questionSample);
        claimSample(taskFingerprintsByView, questionSample, questionSample.taskFingerprint);
        claimSample(contentFingerprintsByView, questionSample, questionSample.contentFingerprint);

        const solutionIdentity = makeIdentity('solution');
        const solutionKey = computeSampleKey(solutionIdentity);
        let solution: { stub: ResolvedProblemStub | null; attempt: number; seed: number };
        try {
            solution = generateSampleWithRetry({
                generator: genEntry.generator,
                labels: targetLabels,
                sampleKey: solutionKey,
                maxAttempts: MAX_ATTEMPTS,
                isDuplicate
            });
        } catch (e) {
            if (e instanceof ResolvedLabelContractError) throw e;
            solution = { stub: null, attempt: 1, seed: computeSampleSeed(solutionKey, 1) };
        }
        // A view whose content space is too small to offer a second distinct
        // problem falls back to showing the question's content solved. That is
        // the same exercise in the same split — never a cross-split leak.
        const solutionStub = solution.stub || question.stub;
        const solutionSeed = solution.stub ? solution.seed : question.seed;
        const solutionResult = fingerprintStub(solutionStub, solutionSeed);
        const solutionSample: RenderSample = {
            identity: solutionIdentity,
            targetLabels,
            sampleKey: solutionKey,
            fileName: computeSampleFilename(solutionIdentity),
            seed: solutionSeed,
            attempt: solution.stub ? solution.attempt : question.attempt,
            contentFingerprint: solutionResult.contentFingerprint,
            taskFingerprint: solutionResult.taskFingerprint,
            problem: solutionResult.problem,
            associatedTargetIds: new Set()
        };
        samples.push(solutionSample);
        claimSample(taskFingerprintsByView, solutionSample, solutionSample.taskFingerprint);
        claimSample(contentFingerprintsByView, solutionSample, solutionSample.contentFingerprint);
    }

    return samples;
}
