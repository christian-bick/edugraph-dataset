import {Scope} from 'edugraph-ts';
import type {CompetencyTarget} from '../types/ml-engine.ts';
import type {ConfigSchema} from '../types/schema.ts';
import {radixSortUtf8} from './content-identity.ts';
import {
    computeSampleKey,
    computeSampleSeed
} from './generation.ts';
import type {MatchTuple} from './matching.ts';
import {capabilitySatisfies} from './ontology.ts';
import {setSeed} from './random.ts';
import {
    extractConfig,
    findSchemaCoResolutionGroups,
    schemaResolutionKey
} from './utils.ts';

const scopeLabels = new Set<string>(Object.values(Scope));

export interface ScopeInventoryGenerator {
    generatorId: string;
    generalLabels: readonly string[];
    schema?: ConfigSchema;
}

export interface ScopeInventoryView {
    viewId: string;
    generalLabels: readonly string[];
    schema: ConfigSchema;
}

export interface ScopeCompletenessTupleRef {
    target_id: string;
    generator_id: string;
    view_id: string;
}

export interface MissingScopeCandidate {
    role: 'generator' | 'view';
    module_id: string;
    parameter: string;
    resolved_value: unknown;
    co_resolving_labels: string[];
    missing_scope_labels: string[];
    affected_tuples: ScopeCompletenessTupleRef[];
}

export interface ScopeRealizationCount {
    label: string;
    tuple_count: number;
}

export interface ScopeCompletenessInventory {
    tuples: number;
    missing_candidates: MissingScopeCandidate[];
    additional_scopes: ScopeRealizationCount[];
    specialized_target_scopes: ScopeRealizationCount[];
}

const tupleRef = (tuple: MatchTuple): ScopeCompletenessTupleRef => ({
    target_id: tuple.target.id,
    generator_id: tuple.generatorId,
    view_id: tuple.viewId
});

const tupleKey = (tuple: ScopeCompletenessTupleRef): string =>
    `${tuple.target_id}\u0000${tuple.generator_id}\u0000${tuple.view_id}`;

const orderedTupleRefs = (tuples: readonly ScopeCompletenessTupleRef[]) => {
    const byKey = new Map(tuples.map(tuple => [tupleKey(tuple), tuple]));
    return radixSortUtf8([...byKey.keys()]).map(key => byKey.get(key)!);
};

const increment = (counts: Map<string, number>, label: string) =>
    counts.set(label, (counts.get(label) ?? 0) + 1);

const orderedCounts = (counts: Map<string, number>): ScopeRealizationCount[] =>
    radixSortUtf8([...counts.keys()]).map(label => ({
        label,
        tuple_count: counts.get(label)!
    }));

const scopeOnly = (labels: readonly string[]) => labels.filter(label => scopeLabels.has(label));

function targetScopes(target: CompetencyTarget): string[] {
    return scopeOnly(target.labels);
}

/**
 * Resolves one deterministic configuration per active match tuple. The report
 * inventories unlabeled co-resolving Scope candidates and separately records
 * the additional/specialized Scopes already recovered by pair resolution.
 */
export function buildScopeCompletenessInventory(options: {
    tuples: readonly MatchTuple[];
    generators: readonly ScopeInventoryGenerator[];
    views: readonly ScopeInventoryView[];
}): ScopeCompletenessInventory {
    const generators = new Map(options.generators.map(generator => [
        generator.generatorId,
        generator
    ]));
    const views = new Map(options.views.map(view => [view.viewId, view]));
    const generatorCandidates = new Map(options.generators.map(generator => [
        generator.generatorId,
        findSchemaCoResolutionGroups(generator.schema ?? {})
    ]));
    const viewCandidates = new Map(options.views.map(view => [
        view.viewId,
        findSchemaCoResolutionGroups(view.schema)
    ]));
    const missingByKey = new Map<string, Omit<MissingScopeCandidate, 'affected_tuples'> & {
        affected_tuples: ScopeCompletenessTupleRef[];
    }>();
    const additionalScopes = new Map<string, number>();
    const specializedTargetScopes = new Map<string, number>();

    for (const tuple of options.tuples) {
        const generator = generators.get(tuple.generatorId);
        const view = views.get(tuple.viewId);
        if (!generator || !view) continue;
        const sampleKey = computeSampleKey({
            targetId: tuple.target.id,
            generatorId: tuple.generatorId,
            viewId: tuple.viewId,
            split: 'train',
            mode: 'question',
            instanceIdx: 0
        });
        const seed = computeSampleSeed(sampleKey, 1);
        setSeed(seed);
        const generatorResolution = extractConfig(generator.schema ?? {}, [...tuple.target.labels]);
        setSeed(seed);
        const viewResolution = extractConfig(view.schema, [...tuple.target.labels]);
        const pairLabels = [...new Set([
            ...generator.generalLabels,
            ...generatorResolution.resolvedLabels,
            ...view.generalLabels,
            ...viewResolution.resolvedLabels
        ])];
        const resolvedScopes = scopeOnly(pairLabels);
        const requestedScopes = targetScopes(tuple.target);
        for (const label of resolvedScopes) {
            const satisfiedTargets = requestedScopes.filter(target =>
                capabilitySatisfies(label, target));
            if (satisfiedTargets.length === 0) increment(additionalScopes, label);
            if (satisfiedTargets.some(target => target !== label)) {
                increment(specializedTargetScopes, label);
            }
        }

        const inspect = (
            role: 'generator' | 'view',
            moduleId: string,
            config: Record<string, unknown>,
            candidates: ReturnType<typeof findSchemaCoResolutionGroups>
        ) => {
            for (const candidate of candidates) {
                if (schemaResolutionKey(config[candidate.field])
                    !== schemaResolutionKey(candidate.resolvedValue)) continue;
                const candidateScopes = scopeOnly(candidate.labels);
                const missing = candidateScopes.filter(candidateLabel => !pairLabels.some(label =>
                    capabilitySatisfies(label, candidateLabel)
                ));
                if (missing.length === 0) continue;
                const key = [
                    role,
                    moduleId,
                    candidate.field,
                    schemaResolutionKey(candidate.resolvedValue),
                    ...candidate.labels,
                    '|missing|',
                    ...missing
                ].join('\u0000');
                const existing = missingByKey.get(key);
                if (existing) existing.affected_tuples.push(tupleRef(tuple));
                else missingByKey.set(key, {
                    role,
                    module_id: moduleId,
                    parameter: candidate.field,
                    resolved_value: candidate.resolvedValue,
                    co_resolving_labels: radixSortUtf8(candidate.labels),
                    missing_scope_labels: radixSortUtf8(missing),
                    affected_tuples: [tupleRef(tuple)]
                });
            }
        };
        inspect(
            'generator',
            generator.generatorId,
            generatorResolution.config as Record<string, unknown>,
            generatorCandidates.get(generator.generatorId) ?? []
        );
        inspect(
            'view',
            view.viewId,
            viewResolution.config as Record<string, unknown>,
            viewCandidates.get(view.viewId) ?? []
        );
    }

    return {
        tuples: options.tuples.length,
        missing_candidates: radixSortUtf8([...missingByKey.keys()]).map(key => {
            const candidate = missingByKey.get(key)!;
            return {...candidate, affected_tuples: orderedTupleRefs(candidate.affected_tuples)};
        }),
        additional_scopes: orderedCounts(additionalScopes),
        specialized_target_scopes: orderedCounts(specializedTargetScopes)
    };
}
