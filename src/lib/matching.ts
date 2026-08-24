import {getConceptAncestors, isSubConceptOf} from './ontology.ts';
import {
    getAcceptedGeneratorProblemTypes,
    getContainingProblemUnionTypes,
    isProblemTypeCompatible
} from './type-parser.ts';
import {
    digestIdentity,
    radixSortUtf8
} from './content-identity.ts';
import type {
    DependencyGraphSnapshot,
    DependencyMatchingIndex
} from './dependency-planner.ts';
import type {WorkCounters} from './work-counters.ts';
import type {CompetencyTarget} from '../types/ml-engine.ts';

const EDU_PREFIX = 'http://edugraph.io/edu/';
const UNKNOWN_PROBLEM_TYPE = '(unknown)';

export interface GeneratorMatchInfo {
    generatorId: string;
    /** Union of spec generalLabels and schema-extracted labels. */
    labels: string[];
    problemType?: string | null;
}

export interface ViewMatchInfo {
    viewId: string;
    /** Union of spec generalLabels and view-schema-extracted labels. */
    supportedLabels: string[];
    requiredLabels?: readonly string[];
    rejectedLabels?: readonly string[];
    problemType?: string | null;
}

export type MatchFailureReason =
    | 'incompatible-type'
    | 'unsupported-label'
    | 'missing-required-label'
    | 'rejected-label';

export type MatchVerdict =
    | {matched: true}
    | {matched: false; reason: MatchFailureReason; label?: string};

function hasCompatibleProblemTypes(
    generatorInfo: GeneratorMatchInfo,
    viewInfo: ViewMatchInfo
): boolean {
    if (generatorInfo.problemType == null || viewInfo.problemType == null) return true;
    if (!isProblemTypeCompatible(generatorInfo.problemType, viewInfo.problemType)) return false;

    const acceptsOnlyUnionMember = getContainingProblemUnionTypes(viewInfo.problemType)
        .includes(generatorInfo.problemType);
    return !acceptsOnlyUnionMember || (viewInfo.requiredLabels?.length ?? 0) > 0;
}

function matchesTargetCapabilities(
    targetLabels: string[],
    generatorInfo: GeneratorMatchInfo,
    viewInfo: ViewMatchInfo
): Exclude<MatchVerdict, {matched: false; reason: 'incompatible-type'}> {
    const missingRequired = viewInfo.requiredLabels?.find(requiredLabel =>
        !targetLabels.some(targetLabel => isSubConceptOf(targetLabel, requiredLabel))
    );
    if (missingRequired) {
        return {matched: false, reason: 'missing-required-label', label: missingRequired};
    }

    for (const compLabel of targetLabels) {
        if (!compLabel.startsWith(EDU_PREFIX)) continue;
        const supportedByGen = generatorInfo.labels.some(genLabel =>
            isSubConceptOf(genLabel, compLabel));
        const supportedByView = viewInfo.supportedLabels.some(viewLabel =>
            isSubConceptOf(viewLabel, compLabel));
        if (!supportedByGen && !supportedByView) {
            return {matched: false, reason: 'unsupported-label', label: compLabel};
        }
    }

    const rejected = viewInfo.rejectedLabels?.find(label => targetLabels.includes(label));
    if (rejected) return {matched: false, reason: 'rejected-label', label: rejected};
    return {matched: true};
}

/** The single matching predicate for target/generator/view triples. */
export function matchesTarget(
    targetLabels: string[],
    generatorInfo: GeneratorMatchInfo,
    viewInfo: ViewMatchInfo
): MatchVerdict {
    if (!hasCompatibleProblemTypes(generatorInfo, viewInfo)) {
        return {matched: false, reason: 'incompatible-type'};
    }
    return matchesTargetCapabilities(targetLabels, generatorInfo, viewInfo);
}

export interface MatchTuple {
    target: CompetencyTarget;
    generatorId: string;
    viewId: string;
}

export interface MatchRejection {
    targetId: string;
    generatorId: string;
    viewId: string;
    verdict: Exclude<MatchVerdict, {matched: true}>;
}

export interface MatchResult {
    tuples: MatchTuple[];
}

export interface MatchDiagnosticResult extends MatchResult {
    /** Label-level failures for type-compatible pairs; type mismatches are omitted as noise. */
    rejections: MatchRejection[];
}

export interface CompatibleModulePair {
    generator: GeneratorMatchInfo;
    view: ViewMatchInfo;
    /** Capability labels and their ancestors, used as target-label index keys. */
    supportedTargetLabels: ReadonlySet<string>;
}

export interface CompatibleModulePairIndex {
    orderedPairs: CompatibleModulePair[];
    byProblemType: Map<string, CompatibleModulePair[]>;
    bySupportedTargetLabel: Map<string, CompatibleModulePair[]>;
}

export interface TargetCapabilityPostingIndex {
    orderedTargets: CompetencyTarget[];
    byRequiredTargetLabel: Map<string, CompetencyTarget[]>;
    withoutOntologyLabels: CompetencyTarget[];
}

/** Builds the target-side postings used when one or more module pairs change. */
export function buildTargetCapabilityPostingIndex(
    targets: CompetencyTarget[],
    counters?: WorkCounters
): TargetCapabilityPostingIndex {
    counters?.add('match.target_index_builds');
    const byRequiredTargetLabel = new Map<string, CompetencyTarget[]>();
    const withoutOntologyLabels: CompetencyTarget[] = [];
    for (const target of targets) {
        const labels = [...new Set(target.labels.filter(label => label.startsWith(EDU_PREFIX)))];
        if (labels.length === 0) withoutOntologyLabels.push(target);
        for (const label of labels) {
            const posting = byRequiredTargetLabel.get(label);
            if (posting) posting.push(target);
            else byRequiredTargetLabel.set(label, [target]);
            counters?.add('match.target_posting_entries');
        }
    }
    return {orderedTargets: [...targets], byRequiredTargetLabel, withoutOntologyLabels};
}

export function buildDependencyMatchingIndex(
    targets: CompetencyTarget[],
    tuples: readonly MatchTuple[] = []
): DependencyMatchingIndex {
    const targetIndex = buildTargetCapabilityPostingIndex(targets);
    const matchedPairKeysByTarget = new Map<string, string[]>();
    for (const tuple of tuples) {
        const pairs = matchedPairKeysByTarget.get(tuple.target.id);
        const key = modulePairKey(tuple.generatorId, tuple.viewId);
        if (pairs) pairs.push(key);
        else matchedPairKeysByTarget.set(tuple.target.id, [key]);
    }
    return {
        target_ids_by_label: Object.fromEntries([...targetIndex.byRequiredTargetLabel]
            .map(([label, posting]) => [label, posting.map(target => target.id)])),
        targets_without_ontology_labels: targetIndex.withoutOntologyLabels.map(target => target.id),
        matched_pair_keys_by_target: Object.fromEntries(matchedPairKeysByTarget)
    };
}

function candidateTargetsForPairs(
    pairIndex: CompatibleModulePairIndex,
    targetIndex: TargetCapabilityPostingIndex,
    counters?: WorkCounters
): CompetencyTarget[] {
    const candidates = new Set(targetIndex.withoutOntologyLabels);
    for (const pair of pairIndex.orderedPairs) {
        for (const label of pair.supportedTargetLabels) {
            counters?.add('match.pair_target_label_lookups');
            const posting = targetIndex.byRequiredTargetLabel.get(label);
            if (!posting) continue;
            counters?.add('match.pair_target_posting_entries', posting.length);
            for (const target of posting) candidates.add(target);
        }
    }
    const ordered = targetIndex.orderedTargets.filter(target => candidates.has(target));
    counters?.add('match.delta_pair_candidate_targets', ordered.length);
    return ordered;
}

function persistedCandidateTargetsForPairs(
    pairIndex: CompatibleModulePairIndex,
    matchingIndex: DependencyMatchingIndex,
    targetsById: ReadonlyMap<string, CompetencyTarget>,
    counters?: WorkCounters
): CompetencyTarget[] {
    const targetIds = new Set(matchingIndex.targets_without_ontology_labels);
    for (const pair of pairIndex.orderedPairs) {
        for (const label of pair.supportedTargetLabels) {
            counters?.add('match.persisted_target_label_lookups');
            const posting = matchingIndex.target_ids_by_label[label];
            if (!posting) continue;
            counters?.add('match.persisted_target_posting_entries', posting.length);
            for (const targetId of posting) targetIds.add(targetId);
        }
    }
    const targets: CompetencyTarget[] = [];
    for (const targetId of targetIds) {
        const target = targetsById.get(targetId);
        if (target) targets.push(target);
    }
    counters?.add('match.delta_pair_candidate_targets', targets.length);
    return targets;
}

function indexCompatiblePairs(
    pairs: readonly CompatibleModulePair[]
): CompatibleModulePairIndex {
    const orderedPairs = [...pairs];
    const byProblemType = new Map<string, CompatibleModulePair[]>();
    const bySupportedTargetLabel = new Map<string, CompatibleModulePair[]>();
    for (const pair of orderedPairs) {
        const problemType = pair.generator.problemType ?? UNKNOWN_PROBLEM_TYPE;
        const typePairs = byProblemType.get(problemType);
        if (typePairs) typePairs.push(pair);
        else byProblemType.set(problemType, [pair]);
        for (const label of pair.supportedTargetLabels) {
            const labelPairs = bySupportedTargetLabel.get(label);
            if (labelPairs) labelPairs.push(pair);
            else bySupportedTargetLabel.set(label, [pair]);
        }
    }
    return {orderedPairs, byProblemType, bySupportedTargetLabel};
}

/** Computes the payload-compatible generator/view search space once. */
export function buildCompatibleModulePairIndex(
    generatorCatalog: GeneratorMatchInfo[],
    viewCatalog: ViewMatchInfo[],
    counters?: WorkCounters
): CompatibleModulePairIndex {
    counters?.add('match.pair_index_builds');
    const orderedPairs: CompatibleModulePair[] = [];
    const knownGeneratorTypes = new Set(generatorCatalog
        .map(generator => generator.problemType)
        .filter((problemType): problemType is string => problemType != null));
    const viewsByGeneratorType = new Map(
        [...knownGeneratorTypes].map(problemType => [problemType, [] as ViewMatchInfo[]])
    );

    for (const view of viewCatalog) {
        if (view.problemType == null) {
            for (const views of viewsByGeneratorType.values()) views.push(view);
            continue;
        }
        for (const acceptedType of getAcceptedGeneratorProblemTypes(view.problemType, counters)) {
            viewsByGeneratorType.get(acceptedType)?.push(view);
        }
        if ((view.requiredLabels?.length ?? 0) > 0) {
            for (const containingUnion of getContainingProblemUnionTypes(view.problemType, counters)) {
                viewsByGeneratorType.get(containingUnion)?.push(view);
            }
        }
    }

    for (const generator of generatorCatalog) {
        const compatibleViews = generator.problemType == null
            ? viewCatalog
            : viewsByGeneratorType.get(generator.problemType) ?? [];
        for (const view of compatibleViews) {
            const supportedTargetLabels = new Set<string>();
            for (const label of [...generator.labels, ...view.supportedLabels]) {
                for (const ancestor of getConceptAncestors(label)) supportedTargetLabels.add(ancestor);
            }
            orderedPairs.push({generator, view, supportedTargetLabels});
            counters?.add('match.compatible_pairs');
        }
    }
    return indexCompatiblePairs(orderedPairs);
}

export function subsetCompatibleModulePairIndex(
    index: CompatibleModulePairIndex,
    include: (pair: CompatibleModulePair) => boolean
): CompatibleModulePairIndex {
    return indexCompatiblePairs(index.orderedPairs.filter(include));
}

const candidatePairsForTarget = (
    targetLabels: readonly string[],
    index: CompatibleModulePairIndex,
    counters?: WorkCounters
): CompatibleModulePair[] => {
    const capabilityLabels = [...new Set(targetLabels.filter(label => label.startsWith(EDU_PREFIX)))];
    if (capabilityLabels.length === 0) return index.orderedPairs;

    const postings: CompatibleModulePair[][] = [];
    for (const label of capabilityLabels) {
        counters?.add('match.target_label_lookups');
        const pairs = index.bySupportedTargetLabel.get(label);
        if (!pairs) return [];
        counters?.add('match.posting_entries', pairs.length);
        postings.push(pairs);
    }

    const counts = new Map<CompatibleModulePair, number>();
    let shortest = postings[0];
    for (const pairs of postings) {
        if (pairs.length < shortest.length) shortest = pairs;
        for (const pair of pairs) counts.set(pair, (counts.get(pair) ?? 0) + 1);
    }
    const candidates = shortest.filter(pair => counts.get(pair) === postings.length);
    counters?.add('match.candidate_pairs', candidates.length);
    return candidates;
};

export interface MatchOptions {
    pairIndex?: CompatibleModulePairIndex;
    counters?: WorkCounters;
}

/** Produces the full deterministic list of matched target/module tuples. */
export function matchTargets(
    targets: CompetencyTarget[],
    generatorCatalog: GeneratorMatchInfo[],
    viewCatalog: ViewMatchInfo[],
    options: MatchOptions = {}
): MatchResult {
    const tuples: MatchTuple[] = [];
    const index = options.pairIndex
        ?? buildCompatibleModulePairIndex(generatorCatalog, viewCatalog, options.counters);
    for (const target of targets) {
        options.counters?.add('match.targets');
        for (const {generator, view} of candidatePairsForTarget(
            target.labels,
            index,
            options.counters
        )) {
            options.counters?.add('match.capability_checks');
            if (matchesTargetCapabilities(target.labels, generator, view).matched) {
                tuples.push({target, generatorId: generator.generatorId, viewId: view.viewId});
            }
        }
    }
    return {tuples};
}

/** Explicit exhaustive diagnostic mode; production uses the indexed matcher. */
export function diagnoseTargetMatches(
    targets: CompetencyTarget[],
    generatorCatalog: GeneratorMatchInfo[],
    viewCatalog: ViewMatchInfo[],
    options: MatchOptions = {}
): MatchDiagnosticResult {
    const tuples: MatchTuple[] = [];
    const rejections: MatchRejection[] = [];
    const {orderedPairs} = options.pairIndex
        ?? buildCompatibleModulePairIndex(generatorCatalog, viewCatalog, options.counters);
    for (const target of targets) {
        options.counters?.add('match.diagnostic_targets');
        for (const {generator, view} of orderedPairs) {
            options.counters?.add('match.diagnostic_pair_checks');
            const verdict = matchesTargetCapabilities(target.labels, generator, view);
            if (verdict.matched) {
                tuples.push({target, generatorId: generator.generatorId, viewId: view.viewId});
            } else {
                rejections.push({
                    targetId: target.id,
                    generatorId: generator.generatorId,
                    viewId: view.viewId,
                    verdict
                });
                options.counters?.add('match.rejections');
            }
        }
    }
    return {tuples, rejections};
}

export function findTargetsWithoutMatch(
    targets: CompetencyTarget[],
    generatorCatalog: GeneratorMatchInfo[],
    viewCatalog: ViewMatchInfo[],
    options: MatchOptions = {}
): CompetencyTarget[] {
    const index = options.pairIndex
        ?? buildCompatibleModulePairIndex(generatorCatalog, viewCatalog, options.counters);
    return targets.filter(target => !candidatePairsForTarget(target.labels, index, options.counters)
        .some(({generator, view}) => matchesTargetCapabilities(target.labels, generator, view).matched));
}

const matchingClosure = (labels: readonly string[]): Array<{label: string; ancestors: string[]}> =>
    radixSortUtf8([...new Set(labels)]).map(label => ({
        label,
        ancestors: radixSortUtf8([...new Set(getConceptAncestors(label))])
    }));

export const matchingPolicyNodeId = (): string => 'matching-policy:target-capabilities';
export const targetCapabilityNodeId = (specName: string, targetId: string): string =>
    `target-capability:${specName}:${targetId}`;
export const generatorCapabilityNodeId = (generatorId: string): string =>
    `generator-capability:${generatorId}`;
export const viewCapabilityNodeId = (viewId: string): string =>
    `view-capability:${viewId}`;
export const modulePairKey = (generatorId: string, viewId: string): string =>
    `${generatorId}#${viewId}`;
export const modulePairNodeId = (generatorId: string, viewId: string): string =>
    `module-pair:${modulePairKey(generatorId, viewId)}`;
export const matchTupleNodeId = (
    specName: string,
    targetId: string,
    generatorId: string,
    viewId: string
): string => `match:${specName}:${targetId}#${generatorId}#${viewId}`;

export function targetCapabilityInputHash(target: CompetencyTarget): string {
    return digestIdentity({labels: matchingClosure(target.labels)});
}

export function generatorCapabilityInputHash(generator: GeneratorMatchInfo): string {
    return digestIdentity({
        labels: matchingClosure(generator.labels),
        problem_type: generator.problemType ?? null
    });
}

export function viewCapabilityInputHash(view: ViewMatchInfo): string {
    return digestIdentity({
        supported: matchingClosure(view.supportedLabels),
        required: matchingClosure(view.requiredLabels ?? []),
        rejected: radixSortUtf8([...(view.rejectedLabels ?? [])]),
        problem_type: view.problemType ?? null
    });
}

export const MATCHING_POLICY_EPOCH = 3;

/**
 * Matching implementation code is deliberately outside automatic cache
 * identity. A behavioral machinery change requires --rebuild-graph; this
 * epoch exists only for an intentional persisted-contract migration.
 */
export function matchingPolicyInputHash(): string {
    return digestIdentity({matching_policy_epoch: MATCHING_POLICY_EPOCH});
}

export interface DeltaMatchResult extends MatchResult {
    pairIndex: CompatibleModulePairIndex;
    reusedTuples: number;
    evaluatedTargets: number;
    evaluatedPairs: number;
    baseline: boolean;
}

function tupleIdentity(tuple: MatchTuple): string {
    return `${tuple.target.id}\u0000${tuple.generatorId}\u0000${tuple.viewId}`;
}

/**
 * Reuses successful match tuples whose target and module-pair capability inputs
 * are unchanged. Changed targets use the full label index; changed pairs use a
 * filtered index, so discovery includes newly possible matches without storing
 * the Cartesian set of rejected triples.
 */
export function matchTargetsDelta(options: {
    targets: CompetencyTarget[];
    generatorCatalog: GeneratorMatchInfo[];
    viewCatalog: ViewMatchInfo[];
    specName: string;
    policyHash: string;
    previousGraph: DependencyGraphSnapshot | null;
    pairIndex?: CompatibleModulePairIndex;
    targetIndex?: TargetCapabilityPostingIndex;
    counters?: WorkCounters;
}): DeltaMatchResult {
    const pairIndex = options.pairIndex ?? buildCompatibleModulePairIndex(
        options.generatorCatalog,
        options.viewCatalog,
        options.counters
    );
    const previous = options.previousGraph;
    const currentPolicy = previous?.nodes[matchingPolicyNodeId()];
    const baseline = !previous || !currentPolicy || currentPolicy.input_hash !== options.policyHash;
    if (baseline) {
        const result = matchTargets(options.targets, options.generatorCatalog, options.viewCatalog, {
            pairIndex,
            counters: options.counters
        });
        options.counters?.add('match.delta_evaluated_targets', options.targets.length);
        options.counters?.add('match.delta_evaluated_pairs', pairIndex.orderedPairs.length);
        return {
            ...result,
            pairIndex,
            reusedTuples: 0,
            evaluatedTargets: options.targets.length,
            evaluatedPairs: pairIndex.orderedPairs.length,
            baseline: true
        };
    }

    const targetsById = new Map(options.targets.map(target => [target.id, target]));
    const currentPairs = new Map(pairIndex.orderedPairs.map(pair => [
        modulePairKey(pair.generator.generatorId, pair.view.viewId),
        pair
    ]));
    const changedTargets = new Set(options.targets
        .filter(target => previous.nodes[targetCapabilityNodeId(options.specName, target.id)]?.input_hash
            !== targetCapabilityInputHash(target))
        .map(target => target.id));
    const changedPairs = new Set<string>();
    for (const [key, pair] of currentPairs) {
        const generatorChanged = previous.nodes[generatorCapabilityNodeId(pair.generator.generatorId)]?.input_hash
            !== generatorCapabilityInputHash(pair.generator);
        const viewChanged = previous.nodes[viewCapabilityNodeId(pair.view.viewId)]?.input_hash
            !== viewCapabilityInputHash(pair.view);
        if (generatorChanged || viewChanged || !previous.nodes[modulePairNodeId(
            pair.generator.generatorId,
            pair.view.viewId
        )]) changedPairs.add(key);
    }

    if (changedTargets.size === options.targets.length || changedPairs.size === currentPairs.size) {
        const result = matchTargets(options.targets, options.generatorCatalog, options.viewCatalog, {
            pairIndex,
            counters: options.counters
        });
        options.counters?.add('match.delta_evaluated_targets', options.targets.length);
        options.counters?.add('match.delta_evaluated_pairs', pairIndex.orderedPairs.length);
        return {
            ...result,
            pairIndex,
            reusedTuples: 0,
            evaluatedTargets: options.targets.length,
            evaluatedPairs: pairIndex.orderedPairs.length,
            baseline: false
        };
    }

    const tuples = new Map<string, MatchTuple>();
    if (previous.matching_index) {
        for (const [targetId, pairKeys] of Object.entries(
            previous.matching_index.matched_pair_keys_by_target
        )) {
            const target = targetsById.get(targetId);
            if (!target || changedTargets.has(targetId)) continue;
            for (const key of pairKeys) {
                const pair = currentPairs.get(key);
                if (!pair || changedPairs.has(key)) continue;
                const tuple = {
                    target,
                    generatorId: pair.generator.generatorId,
                    viewId: pair.view.viewId
                };
                tuples.set(tupleIdentity(tuple), tuple);
            }
        }
    } else {
        const targetPrefix = `target-capability:${options.specName}:`;
        for (const node of Object.values(previous.nodes)) {
            if (node.kind !== 'match-tuple') continue;
            const targetDependency = node.dependencies.find(id => id.startsWith(targetPrefix));
            const pairDependency = node.dependencies.find(id => id.startsWith('module-pair:'));
            if (!targetDependency || !pairDependency) continue;
            const targetId = targetDependency.slice(targetPrefix.length);
            const key = pairDependency.slice('module-pair:'.length);
            const target = targetsById.get(targetId);
            const pair = currentPairs.get(key);
            if (!target || !pair || changedTargets.has(targetId) || changedPairs.has(key)) continue;
            const tuple = {
                target,
                generatorId: pair.generator.generatorId,
                viewId: pair.view.viewId
            };
            tuples.set(tupleIdentity(tuple), tuple);
        }
    }
    const reusedTuples = tuples.size;

    const targetsToEvaluate = options.targets.filter(target => changedTargets.has(target.id));
    for (const tuple of matchTargets(
        targetsToEvaluate,
        options.generatorCatalog,
        options.viewCatalog,
        {pairIndex, counters: options.counters}
    ).tuples) tuples.set(tupleIdentity(tuple), tuple);

    const changedPairIndex = subsetCompatibleModulePairIndex(pairIndex, pair =>
        changedPairs.has(modulePairKey(pair.generator.generatorId, pair.view.viewId)));
    const pairCandidates = previous.matching_index && !options.targetIndex
        ? persistedCandidateTargetsForPairs(
            changedPairIndex,
            previous.matching_index,
            targetsById,
            options.counters
        )
        : candidateTargetsForPairs(
            changedPairIndex,
            options.targetIndex
                ?? buildTargetCapabilityPostingIndex(options.targets, options.counters),
            options.counters
        );
    const unchangedTargets = pairCandidates.filter(target => !changedTargets.has(target.id));
    if (changedPairIndex.orderedPairs.length > 0) {
        for (const tuple of matchTargets(
            unchangedTargets,
            options.generatorCatalog,
            options.viewCatalog,
            {pairIndex: changedPairIndex, counters: options.counters}
        ).tuples) tuples.set(tupleIdentity(tuple), tuple);
    }

    const targetOrder = new Map(options.targets.map((target, index) => [target.id, index]));
    const pairOrder = new Map(pairIndex.orderedPairs.map((pair, index) => [
        modulePairKey(pair.generator.generatorId, pair.view.viewId),
        index
    ]));
    const byOrder = new Map<string, MatchTuple>();
    for (const tuple of tuples.values()) {
        const targetIndex = targetOrder.get(tuple.target.id)!;
        const pairIndexValue = pairOrder.get(modulePairKey(tuple.generatorId, tuple.viewId))!;
        byOrder.set(
            `${targetIndex.toString().padStart(12, '0')}:${pairIndexValue.toString().padStart(12, '0')}`,
            tuple
        );
    }
    const ordered = radixSortUtf8([...byOrder.keys()]).map(key => byOrder.get(key)!);
    options.counters?.add('match.delta_reused_tuples', reusedTuples);
    options.counters?.add('match.delta_changed_targets', changedTargets.size);
    options.counters?.add('match.delta_changed_pairs', changedPairs.size);
    const evaluatedTargets = targetsToEvaluate.length
        + (changedPairIndex.orderedPairs.length > 0 ? unchangedTargets.length : 0);
    options.counters?.add('match.delta_evaluated_targets', evaluatedTargets);
    options.counters?.add('match.delta_evaluated_pairs', changedPairIndex.orderedPairs.length);
    return {
        tuples: ordered,
        pairIndex,
        reusedTuples,
        evaluatedTargets,
        evaluatedPairs: changedPairIndex.orderedPairs.length,
        baseline: false
    };
}
