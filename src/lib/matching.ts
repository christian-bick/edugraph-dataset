import {capabilitySatisfies, getCapabilityAncestors} from './ontology.ts';
import {
    getAcceptedGeneratorProblemTypes,
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
import type {ConfigSchema, ResolverFn} from '../types/schema.ts';
import type {GeneratorSpec} from '../types/generator-spec.ts';
import type {ViewSpec} from '../types/view-spec.ts';
import type {CompatibilityRule, GenerationPlan, GeneratorCompatibilityRule, ViewCompatibilityRule} from '../types/compatibility.ts';
import {CompatibilityContractError, validateGenerationPlan} from './compatibility.ts';
import {planModelCompatibility} from './model-compatibility.ts';

const EDU_PREFIX = 'http://edugraph.io/edu/';
const UNKNOWN_PROBLEM_TYPE = '(unknown)';

export interface GeneratorMatchInfo {
    generatorId: string;
    /** Union of spec generalLabels and schema-extracted labels. */
    labels: string[];
    problemType?: string | null;
    schema?: ConfigSchema;
    generalLabels?: readonly string[];
    spec?: GeneratorSpec;
    compatibility?: readonly GeneratorCompatibilityRule[];
    matchingSourceHash?: string;
}

export interface ViewMatchInfo {
    viewId: string;
    /** Union of spec generalLabels and view-schema-extracted labels. */
    supportedLabels: string[];
    problemType?: string | null;
    schema?: ConfigSchema;
    generalLabels?: readonly string[];
    spec?: ViewSpec;
    compatibility?: readonly ViewCompatibilityRule[];
    matchingSourceHash?: string;
}

export type MatchFailureReason =
    | 'incompatible-type'
    | 'unsupported-label'
    | 'missing-required-label'
    | 'rejected-label'
    | 'empty-label-domain'
    | 'incompatible-label-variants';

export type MatchVerdict =
    | {matched: true}
    | {matched: false; reason: MatchFailureReason; label?: string; ruleIds?: readonly string[]};

export type PlannedMatchVerdict =
    | {matched: true; plan: GenerationPlan}
    | Exclude<MatchVerdict, {matched: true}>;

function hasCompatibleProblemTypes(
    generatorInfo: GeneratorMatchInfo,
    viewInfo: ViewMatchInfo
): boolean {
    return generatorInfo.problemType != null && viewInfo.problemType != null
        && isProblemTypeCompatible(generatorInfo.problemType, viewInfo.problemType);
}

function matchTargetCapabilities(
    target: CompetencyTarget,
    generatorInfo: GeneratorMatchInfo,
    viewInfo: ViewMatchInfo,
    counters?: WorkCounters
): PlannedMatchVerdict {
    for (const compLabel of target.labels) {
        if (!compLabel.startsWith(EDU_PREFIX)) continue;
        const supportedByGen = generatorInfo.labels.some(genLabel =>
            capabilitySatisfies(genLabel, compLabel));
        const supportedByView = viewInfo.supportedLabels.some(viewLabel =>
            capabilitySatisfies(viewLabel, compLabel));
        if (!supportedByGen && !supportedByView) {
            return {matched: false, reason: 'unsupported-label', label: compLabel};
        }
    }

    const generatorRules = generatorInfo.spec?.compatibility ?? generatorInfo.compatibility;
    const viewRules = viewInfo.spec?.compatibility ?? viewInfo.compatibility;
    const generatorLabels = generatorInfo.generalLabels ?? generatorInfo.spec?.generalLabels
        ?? (generatorInfo.schema === undefined ? generatorInfo.labels : []);
    const viewLabels = viewInfo.generalLabels ?? viewInfo.spec?.generalLabels
        ?? (viewInfo.schema === undefined ? viewInfo.supportedLabels : []);
    const result = planModelCompatibility(target, {
        generatorId: generatorInfo.generatorId,
        schema: generatorInfo.schema,
        generalLabels: generatorLabels,
        spec: {generatorId: generatorInfo.generatorId, generalLabels: generatorLabels, compatibility: generatorRules}
    }, {
        viewId: viewInfo.viewId,
        schema: viewInfo.schema ?? {},
        generalLabels: viewLabels,
        spec: {viewId: viewInfo.viewId, generalLabels: viewLabels, compatibility: viewRules}
    }, matchPlanInputHash(target, generatorInfo, viewInfo));
    for (const [name, value] of Object.entries(result.work)) counters?.add(`match.compatibility.${name}`, value);
    if (result.supported) return {matched: true, plan: result.plan};
    for (const rule of viewRules ?? []) {
        if (!result.ruleIds?.includes(`view:${rule.id}`) || !rule.targetPolicy) continue;
        const {kind, labels} = rule.targetPolicy;
        const label = labels.find(candidate => target.labels.some(request => capabilitySatisfies(request, candidate)) === (kind === 'reject'));
        if (label) return {matched: false, reason: kind === 'require' ? 'missing-required-label' : 'rejected-label', label};
    }
    if (result.reason === 'uncovered-target') return {matched: false, reason: 'unsupported-label', label: result.labels?.[0]};
    if (result.reason === 'empty-domain') return {matched: false, reason: 'empty-label-domain'};
    return {matched: false, reason: 'incompatible-label-variants', ruleIds: result.ruleIds};
}

/** The single authoritative matching operation for target/generator/view triples. */
export function matchTarget(
    target: CompetencyTarget,
    generatorInfo: GeneratorMatchInfo,
    viewInfo: ViewMatchInfo
): PlannedMatchVerdict {
    if (!hasCompatibleProblemTypes(generatorInfo, viewInfo)) return {matched: false, reason: 'incompatible-type'};
    return matchTargetCapabilities(target, generatorInfo, viewInfo);
}

/** Verdict-only adapter for callers that have no target identity. */
export function matchesTarget(
    targetLabels: string[],
    generatorInfo: GeneratorMatchInfo,
    viewInfo: ViewMatchInfo
): MatchVerdict {
    const result = matchTarget({id: `labels:${digestIdentity(radixSortUtf8([...new Set(targetLabels)]))}`, labels: targetLabels}, generatorInfo, viewInfo);
    return result.matched ? {matched: true} : result;
}

export interface MatchTuple {
    target: CompetencyTarget;
    generatorId: string;
    viewId: string;
    plan: GenerationPlan;
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
    const plansByTarget = new Map<string, Map<string, GenerationPlan>>();
    for (const tuple of tuples) {
        const pairs = matchedPairKeysByTarget.get(tuple.target.id);
        const key = modulePairKey(tuple.generatorId, tuple.viewId);
        if (pairs) pairs.push(key);
        else matchedPairKeysByTarget.set(tuple.target.id, [key]);
        let plans = plansByTarget.get(tuple.target.id);
        if (!plans) plansByTarget.set(tuple.target.id, plans = new Map());
        plans.set(key, tuple.plan);
    }
    return {
        target_ids_by_label: Object.fromEntries([...targetIndex.byRequiredTargetLabel]
            .map(([label, posting]) => [label, posting.map(target => target.id)])),
        targets_without_ontology_labels: targetIndex.withoutOntologyLabels.map(target => target.id),
        matched_pair_keys_by_target: Object.fromEntries(matchedPairKeysByTarget),
        generation_plans_by_target: Object.fromEntries([...plansByTarget].map(([target, plans]) => [target, Object.fromEntries(plans)]))
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
        if (view.problemType == null) continue;
        for (const acceptedType of getAcceptedGeneratorProblemTypes(view.problemType, counters)) {
            viewsByGeneratorType.get(acceptedType)?.push(view);
        }
    }

    for (const generator of generatorCatalog) {
        const compatibleViews = generator.problemType == null
            ? []
            : viewsByGeneratorType.get(generator.problemType) ?? [];
        for (const view of compatibleViews) {
            const supportedTargetLabels = new Set<string>();
            for (const label of [...generator.labels, ...view.supportedLabels]) {
                for (const ancestor of getCapabilityAncestors(label)) {
                    supportedTargetLabels.add(ancestor);
                }
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
            const result = matchTargetCapabilities(target, generator, view, options.counters);
            if (result.matched) {
                tuples.push({target, generatorId: generator.generatorId, viewId: view.viewId, plan: result.plan});
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
            const verdict = matchTargetCapabilities(target, generator, view, options.counters);
            if (verdict.matched) {
                tuples.push({target, generatorId: generator.generatorId, viewId: view.viewId, plan: verdict.plan});
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
        .some(({generator, view}) => matchTargetCapabilities(target, generator, view, options.counters).matched));
}

const matchingClosure = (labels: readonly string[]): Array<{label: string; ancestors: string[]}> =>
    radixSortUtf8([...new Set(labels)]).map(label => ({
        label,
        ancestors: radixSortUtf8([...new Set(getCapabilityAncestors(label))])
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

function schemaMetadata(schema: ConfigSchema | undefined, includeFunctionSource: boolean): unknown[] {
    return radixSortUtf8(Object.keys(schema ?? {})).map(field => {
        const value = schema![field];
        if (typeof value === 'function') return {
            field, kind: 'ontology-neutral',
            ...(includeFunctionSource ? {source: Function.prototype.toString.call(value)} : {})
        };
        if (!Array.isArray(value[0])) return {field, kind: 'direct', labels: radixSortUtf8([...(value as readonly string[])])};
        const [labels, resolver, fallback] = value as readonly [supported: readonly string[], resolver: ResolverFn<unknown>, fallback?: readonly (readonly string[])[]];
        return {
            field, kind: 'resolver', labels: radixSortUtf8([...labels]),
            resolution: resolver.labelResolution ?? null,
            choices: canonicalMetadata(resolver.labelChoices ?? null),
            fallback: fallback === undefined ? null : fallback.map(bundle => radixSortUtf8([...bundle])),
            ...(includeFunctionSource ? {source: Function.prototype.toString.call(resolver)} : {})
        };
    });
}

function canonicalMetadata(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(canonicalMetadata);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(radixSortUtf8(Object.keys(value)).map(key => [key, canonicalMetadata((value as Record<string, unknown>)[key])]));
}

function ruleMetadata(rules: readonly CompatibilityRule<any>[] | undefined, includeFunctionSource: boolean): unknown[] {
    const byId = new Map((rules ?? []).map(rule => [rule.id, rule]));
    return radixSortUtf8([...byId.keys()]).map(id => {
        const rule = byId.get(id)!;
        return {
            id,
            targetPolicy: rule.targetPolicy ?? null,
            dependencies: rule.dependencies === undefined ? null : rule.dependencies.map(dependency => ({scope: dependency.scope, label: dependency.label}))
                .sort((left, right) => `${left.scope}:${left.label}` < `${right.scope}:${right.label}` ? -1 : 1),
            ...(includeFunctionSource ? {source: Function.prototype.toString.call(rule.predicate)} : {})
        };
    });
}

function schemaOntologyLabels(schema: ConfigSchema | undefined): string[] {
    const labels: string[] = [];
    for (const value of Object.values(schema ?? {})) {
        if (typeof value === 'function') continue;
        if (!Array.isArray(value[0])) {
            labels.push(...value as readonly string[]);
            continue;
        }
        const [supported, resolver, fallback] = value as readonly [supported: readonly string[], resolver: ResolverFn<unknown>, fallback?: readonly (readonly string[])[]];
        labels.push(...supported, ...(fallback?.flat() ?? []));
        const choice = resolver.labelChoices;
        if (!choice) continue;
        labels.push(...(choice.contextLabels ?? []));
        if (choice.kind === 'target') labels.push(...(choice.predicate?.all ?? []));
        else {
            labels.push(...(choice.alternatives?.flat() ?? []), ...(choice.equivalenceGroups?.flat(2) ?? []));
            for (const item of choice.defaults ?? []) labels.push(...item.labels, ...(item.whenAll ?? []), ...(item.whenNone ?? []));
        }
    }
    return labels;
}

/** All semantic read roots, including label-choice defaults and declared rule queries. */
export function generatorMatchingOntologyLabels(generator: GeneratorMatchInfo): string[] {
    return radixSortUtf8([...new Set([
        ...generator.labels, ...(generator.generalLabels ?? generator.spec?.generalLabels ?? []),
        ...schemaOntologyLabels(generator.schema),
        ...(generator.spec?.compatibility ?? generator.compatibility ?? []).flatMap(rule => rule.dependencies?.map(dependency => dependency.label) ?? [])
    ])]);
}

export function viewMatchingOntologyLabels(view: ViewMatchInfo): string[] {
    return radixSortUtf8([...new Set([
        ...view.supportedLabels, ...(view.generalLabels ?? view.spec?.generalLabels ?? []),
        ...schemaOntologyLabels(view.schema),
        ...(view.spec?.compatibility ?? view.compatibility ?? []).flatMap(rule => rule.dependencies?.map(dependency => dependency.label) ?? [])
    ])]);
}

export function generatorCapabilityInputHash(generator: GeneratorMatchInfo): string {
    return digestIdentity({
        labels: matchingClosure(generator.labels),
        invariant_labels: radixSortUtf8([...(generator.generalLabels ?? generator.spec?.generalLabels ?? (generator.schema === undefined ? generator.labels : []))]),
        semantic_reads: matchingClosure(generatorMatchingOntologyLabels(generator)),
        schema: schemaMetadata(generator.schema, generator.matchingSourceHash === undefined),
        rules: ruleMetadata(generator.spec?.compatibility ?? generator.compatibility, generator.matchingSourceHash === undefined),
        matching_source: generator.matchingSourceHash ?? null,
        problem_type: generator.problemType ?? null
    });
}

export function viewCapabilityInputHash(view: ViewMatchInfo): string {
    return digestIdentity({
        supported: matchingClosure(view.supportedLabels),
        invariant_labels: radixSortUtf8([...(view.generalLabels ?? view.spec?.generalLabels ?? (view.schema === undefined ? view.supportedLabels : []))]),
        semantic_reads: matchingClosure(viewMatchingOntologyLabels(view)),
        schema: schemaMetadata(view.schema, view.matchingSourceHash === undefined),
        rules: ruleMetadata(view.spec?.compatibility ?? view.compatibility, view.matchingSourceHash === undefined),
        matching_source: view.matchingSourceHash ?? null,
        problem_type: view.problemType ?? null
    });
}

export const MATCHING_POLICY_EPOCH = 6;

/**
 * Matching implementation code is deliberately outside automatic cache
 * identity. A behavioral machinery change requires --rebuild-graph; this
 * epoch exists only for an intentional persisted-contract migration.
 */
export function matchingPolicyInputHash(): string {
    return digestIdentity({matching_policy_epoch: MATCHING_POLICY_EPOCH});
}

export function matchPlanInputHash(target: CompetencyTarget, generator: GeneratorMatchInfo, view: ViewMatchInfo): string {
    return digestIdentity({
        policy: matchingPolicyInputHash(), target: targetCapabilityInputHash(target),
        generator: generatorCapabilityInputHash(generator), view: viewCapabilityInputHash(view)
    });
}

/** Rehydrate a current, authoritative plan; old positive tuples are never sufficient. */
export function restorePersistedMatchTuple(
    target: CompetencyTarget, generator: GeneratorMatchInfo, view: ViewMatchInfo, persistedPlan: unknown
): MatchTuple {
    if (persistedPlan === undefined || persistedPlan === null) {
        throw new CompatibilityContractError('Persisted generation plan missing; rebuild matching');
    }
    const plan = validateGenerationPlan(persistedPlan);
    if (plan.identity.targetId !== target.id || plan.identity.generatorId !== generator.generatorId
        || plan.identity.viewId !== view.viewId) {
        throw new CompatibilityContractError('Persisted generation plan identity mismatch; rebuild matching');
    }
    if (plan.inputHash !== matchPlanInputHash(target, generator, view)) {
        throw new CompatibilityContractError('Persisted generation plan inputs changed; rebuild matching');
    }
    return {target, generatorId: generator.generatorId, viewId: view.viewId, plan};
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
    const baseline = !previous || !currentPolicy || currentPolicy.input_hash !== options.policyHash
        || !previous.matching_index?.generation_plans_by_target;
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
                const tuple = restorePersistedMatchTuple(target, pair.generator, pair.view,
                    previous.matching_index.generation_plans_by_target[targetId]?.[key]);
                tuples.set(tupleIdentity(tuple), tuple);
            }
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
