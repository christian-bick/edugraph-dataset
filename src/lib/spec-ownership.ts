import type {ConfigSchema} from '../types/schema.ts';
import {digestIdentity, radixSortUtf8} from './content-identity.ts';
import {getCapabilityAncestors} from './ontology.ts';
import {findAbilityLabels} from './spec-contracts.ts';
import {extractSchemaLabels} from './utils.ts';
import type {WorkCounters} from './work-counters.ts';

export type CapabilityRole = 'generator' | 'view';
export type CapabilityDeclaration = 'generalLabels' | 'schema';

export interface CapabilityProvider {
    role: CapabilityRole;
    module_id: string;
    declaration: CapabilityDeclaration;
    parameter?: string;
    capability: string;
}

export interface OwnershipModule {
    role: CapabilityRole;
    module_id: string;
    generalLabels: readonly string[];
    schema?: ConfigSchema;
}

export interface OwnershipPair {
    generatorId: string;
    viewId: string;
}

export type OwnershipCode = 'generator-ability' | 'redundant-general-labels'
    | 'schema-general-overlap' | 'cross-role-positive-overlap';

export interface PositiveOwnershipIssue {
    id: string;
    code: OwnershipCode;
    rule_ids: string[];
    declarations: CapabilityProvider[];
    message: string;
}

const providerKey = (provider: CapabilityProvider): string => [provider.role, provider.module_id,
    provider.declaration, provider.parameter ?? '', provider.capability].join('\u0000');
const moduleKey = (role: CapabilityRole, id: string): string => `${role}\u0000${id}`;

/** Supported schema alternatives retain their field; they are not invariant conjunctions. */
export function collectPositiveCapabilities(module: OwnershipModule): CapabilityProvider[] {
    const common = {role: module.role, module_id: module.module_id};
    const declarations: CapabilityProvider[] = [...new Set(module.generalLabels)]
        .map(capability => ({...common, declaration: 'generalLabels', capability}));
    for (const [parameter, choice] of Object.entries(module.schema ?? {})) {
        for (const capability of new Set(extractSchemaLabels({[parameter]: choice}))) {
            declarations.push({...common, declaration: 'schema', parameter, capability});
        }
    }
    const byKey = new Map(declarations.map(declaration => [providerKey(declaration), declaration]));
    return radixSortUtf8([...byKey.keys()]).map(key => byKey.get(key)!);
}

function ownershipIssue(code: OwnershipCode, declarations: CapabilityProvider[]): PositiveOwnershipIssue {
    const ruleIds: Record<OwnershipCode, string[]> = {
        'generator-ability': ['SPEC-G3', 'SPEC-V5'],
        'redundant-general-labels': ['SPEC-2'],
        'schema-general-overlap': ['SPEC-7'],
        'cross-role-positive-overlap': ['SPEC-8', 'SPEC-11']
    };
    const reasons: Record<OwnershipCode, string> = {
        'generator-ability': 'Abilities belong exclusively to views',
        'redundant-general-labels': 'Invariant labels redundantly declare a specialization ancestor',
        'schema-general-overlap': 'Schema capabilities overlap invariant labels',
        'cross-role-positive-overlap': 'Compatible roles declare overlapping positive capabilities'
    };
    const references = declarations.map(declaration => {
        const field = declaration.declaration === 'schema' ? `schema.${declaration.parameter}` : 'generalLabels';
        return `${declaration.role}:${declaration.module_id} ${field} '${declaration.capability}'`;
    });
    return {
        id: `${code}:${digestIdentity(declarations.map(providerKey).join('\u0001')).slice(0, 12)}`,
        code,
        rule_ids: ruleIds[code],
        declarations,
        message: `${ruleIds[code].join('/')} ${reasons[code]}: ${references.join(' / ')}`
    };
}

interface CapabilityIndex {
    direct: Map<string, CapabilityProvider[]>;
    byAncestor: Map<string, CapabilityProvider[]>;
}

/**
 * D4's shared gate. Callers supply the existing payload-compatible pair index, independent
 * of currently matched targets. Ontology traversal remains in the shared ontology library.
 * Each referenced ancestry is resolved once; module indexes are reused across pair edges.
 */
export function inspectPositiveOwnership(options: {
    modules: readonly OwnershipModule[];
    pairs: Iterable<OwnershipPair>;
    counters?: WorkCounters;
    ancestorsOf?: typeof getCapabilityAncestors;
}): PositiveOwnershipIssue[] {
    const counters = options.counters;
    const ancestorCache = new Map<string, ReadonlySet<string>>();
    const ancestors = (label: string): ReadonlySet<string> => {
        let result = ancestorCache.get(label);
        if (!result) {
            result = (options.ancestorsOf ?? getCapabilityAncestors)(label);
            ancestorCache.set(label, result);
            counters?.add('ownership.ancestry_resolutions');
            counters?.add('ownership.ancestor_entries', result.size);
        }
        return result;
    };
    const index = (declarations: CapabilityProvider[]): CapabilityIndex => {
        const direct = new Map<string, CapabilityProvider[]>();
        const byAncestor = new Map<string, CapabilityProvider[]>();
        for (const declaration of declarations) {
            const add = (map: Map<string, CapabilityProvider[]>, key: string) => {
                const entries = map.get(key);
                if (entries) entries.push(declaration);
                else map.set(key, [declaration]);
            };
            add(direct, declaration.capability);
            for (const ancestor of ancestors(declaration.capability)) {
                add(byAncestor, ancestor);
                counters?.add('ownership.index_entries');
            }
        }
        return {direct, byAncestor};
    };
    function* overlaps(left: CapabilityIndex, right: CapabilityProvider[]) {
        if (left.direct.size === 0) return;
        for (const declaration of right) {
            const candidates = new Set(left.byAncestor.get(declaration.capability) ?? []);
            counters?.add('ownership.label_lookups');
            for (const ancestor of ancestors(declaration.capability)) {
                counters?.add('ownership.label_lookups');
                for (const provider of left.direct.get(ancestor) ?? []) candidates.add(provider);
            }
            for (const provider of candidates) yield [provider, declaration];
        }
    }
    const issues = new Map<string, PositiveOwnershipIssue>();
    const addIssue = (code: OwnershipCode, declarations: CapabilityProvider[]) => {
        const issue = ownershipIssue(code, declarations);
        if (!issues.has(issue.id)) counters?.add('ownership.issues');
        issues.set(issue.id, issue);
    };
    const modules = new Map<string, {declarations: CapabilityProvider[]; index: CapabilityIndex}>();
    for (const module of options.modules) {
        const declarations = collectPositiveCapabilities(module);
        counters?.add('ownership.modules');
        counters?.add('ownership.declarations', declarations.length);
        const general = declarations.filter(entry => entry.declaration === 'generalLabels');
        const schema = declarations.filter(entry => entry.declaration === 'schema');
        const generalIndex = index(general);
        modules.set(moduleKey(module.role, module.module_id), {declarations, index: index(declarations)});
        if (module.role === 'generator') {
            const abilities = new Set(findAbilityLabels(declarations.map(entry => entry.capability)));
            for (const declaration of declarations) {
                if (abilities.has(declaration.capability)) addIssue('generator-ability', [declaration]);
            }
        }
        for (const declaration of general) {
            for (const ancestor of ancestors(declaration.capability)) {
                counters?.add('ownership.label_lookups');
                if (ancestor === declaration.capability) continue;
                for (const provider of generalIndex.direct.get(ancestor) ?? []) {
                    addIssue('redundant-general-labels', [declaration, provider]);
                }
            }
        }
        for (const pair of overlaps(generalIndex, schema)) addIssue('schema-general-overlap', pair);
    }
    for (const pair of options.pairs) {
        counters?.add('ownership.pairs');
        const generator = modules.get(moduleKey('generator', pair.generatorId));
        const view = modules.get(moduleKey('view', pair.viewId));
        if (!generator || !view) throw new Error(`Ownership declarations missing for ${pair.generatorId}#${pair.viewId}`);
        for (const overlap of overlaps(generator.index, view.declarations)) {
            addIssue('cross-role-positive-overlap', overlap);
        }
    }
    return radixSortUtf8([...issues.keys()]).map(key => issues.get(key)!);
}
