import type {ConfigFromSchema, ConfigSchema, LabelChoiceContract, ResolvedConfig, ResolverFn} from '../types/schema.ts';
import type {LabelChoiceDomain} from '../types/compatibility.ts';
import {capabilitySatisfies} from './ontology.ts';

type Owner = 'generator' | 'view';
type Tuple = readonly [readonly string[], ResolverFn<unknown>, ...unknown[]];
const isTuple = (value: unknown): value is Tuple =>
    Array.isArray(value) && Array.isArray(value[0]) && typeof value[1] === 'function';
const canonical = (labels: readonly string[]): string[] => [...new Set(labels)].sort();
const key = (labels: readonly string[]): string => JSON.stringify(canonical(labels));

export class SchemaChoiceContractError extends Error {
    constructor(readonly field: string, message: string) {
        super(`Schema choice "${field}": ${message}`);
        this.name = 'SchemaChoiceContractError';
    }
}

interface Declaration {
    supported: readonly string[];
    contract: LabelChoiceContract;
    fallback?: readonly (readonly string[])[];
    direct: boolean;
}

function declaration(field: string, value: ConfigSchema[string]): Declaration | null {
    if (typeof value === 'function') {
        if (value.ontologyNeutral !== true) {
            throw new SchemaChoiceContractError(field, 'function-only choices must be ontology-neutral.');
        }
        return null;
    }
    const tuple = isTuple(value);
    const supported = tuple ? value[0] : value as readonly string[];
    if (supported.length === 0 || supported.some(label => typeof label !== 'string' || !label)) {
        throw new SchemaChoiceContractError(field, 'supported labels must be nonempty strings.');
    }
    if (new Set(supported).size !== supported.length) {
        throw new SchemaChoiceContractError(field, 'supported labels must be unique.');
    }
    const contract = tuple ? value[1].labelChoices : {kind: 'alternatives'} as const;
    if (!contract) throw new SchemaChoiceContractError(field, 'resolver has no declared label choices.');
    if (contract.kind !== 'alternatives' && contract.kind !== 'target') {
        throw new SchemaChoiceContractError(field, 'unknown choice kind.');
    }
    if (contract.kind === 'target' && contract.relation !== undefined
        && contract.relation !== 'exact' && contract.relation !== 'capability') {
        throw new SchemaChoiceContractError(field, 'unknown target relation.');
    }
    const checkLabels = (labels: readonly string[], local: boolean): void => {
        if (!Array.isArray(labels) || labels.some(label => typeof label !== 'string' || !label)
            || new Set(labels).size !== labels.length) {
            throw new SchemaChoiceContractError(field, 'label bundles must contain unique nonempty strings.');
        }
        if (local && labels.some(label => !supported.includes(label))) {
            throw new SchemaChoiceContractError(field, 'a selection contains an unsupported label.');
        }
    };
    if (contract.contextLabels) checkLabels(contract.contextLabels, false);
    const fallback = tuple && value.length >= 3
        ? value[2] as readonly (readonly string[])[] : undefined;
    if (contract.kind === 'alternatives') {
        const alternatives = contract.alternatives ?? supported.map(label => [label]);
        if (!Array.isArray(alternatives) || !alternatives.length) {
            throw new SchemaChoiceContractError(field, 'alternatives must not be empty.');
        }
        alternatives.forEach(labels => checkLabels(labels, true));
        const keys = new Set(alternatives.map(key));
        if (keys.size !== alternatives.length) {
            throw new SchemaChoiceContractError(field, 'duplicate alternatives.');
        }
        const grouped = new Set<string>();
        for (const group of contract.equivalenceGroups ?? []) {
            if (!Array.isArray(group) || group.length < 2) {
                throw new SchemaChoiceContractError(field, 'equivalence groups need at least two selections.');
            }
            for (const labels of group) {
                checkLabels(labels, true);
                const selectionKey = key(labels);
                if (!keys.has(selectionKey) || grouped.has(selectionKey)) {
                    throw new SchemaChoiceContractError(field, 'equivalence selections must be legal and belong to one group.');
                }
                grouped.add(selectionKey);
            }
        }
        for (const item of contract.defaults ?? []) {
            checkLabels(item.labels, true);
            if (!keys.has(key(item.labels))) throw new SchemaChoiceContractError(field, 'default is not a legal alternative.');
            if (item.whenAll) checkLabels(item.whenAll, false);
            if (item.whenNone) checkLabels(item.whenNone, false);
        }
        if (fallback) {
            if (!Array.isArray(fallback) || !fallback.length) {
                throw new SchemaChoiceContractError(field, 'fallback alternatives must not be empty.');
            }
            for (const labels of fallback) {
                checkLabels(labels, true);
                if (!keys.has(key(labels))) throw new SchemaChoiceContractError(field, 'fallback is not a legal alternative.');
            }
        }
    } else {
        if (contract.predicate) checkLabels(contract.predicate.all, false);
        if (fallback) {
            if (!contract.predicate) {
                throw new SchemaChoiceContractError(field, 'target conjunction fallbacks require declared predicate semantics.');
            }
            if (!Array.isArray(fallback) || !fallback.length) {
                throw new SchemaChoiceContractError(field, 'fallback alternatives must not be empty.');
            }
            fallback.forEach(labels => checkLabels(labels, true));
        }
    }
    return {supported, contract, fallback, direct: !tuple};
}

/** Validates declarations without invoking any value resolver or consuming randomness. */
export function validateSchemaChoiceContracts(schema: ConfigSchema): void {
    for (const [field, value] of Object.entries(schema)) declaration(field, value);
}

/**
 * Builds finite, field-local domains from metadata only. An empty domain means the
 * request cannot be completed; a malformed declaration throws a contract error.
 */
export function normalizeSchemaChoices(
    schema: ConfigSchema, targetLabels: readonly string[], owner: Owner
): LabelChoiceDomain[] {
    const domains: LabelChoiceDomain[] = [];
    for (const field of Object.keys(schema).sort()) {
        const declared = declaration(field, schema[field]);
        if (!declared) continue;
        const {supported, contract, fallback, direct} = declared;
        let selections: readonly (readonly string[])[];
        if (contract.kind === 'target') {
            selections = [supported.filter(label => targetLabels.some(target =>
                contract.relation === 'capability' ? capabilitySatisfies(target, label) : target === label))];
            if (fallback && contract.predicate) {
                const predicate = contract.predicate;
                const truth = (labels: readonly string[]) => predicate.all.every(boundary =>
                    labels.some(label => predicate.relation === 'capability'
                        ? capabilitySatisfies(label, boundary) : label === boundary));
                const requested = supported.filter(label => targetLabels.includes(label));
                const completions = fallback.filter(labels => requested.every(request =>
                    labels.some(label => capabilitySatisfies(label, request)))
                    && truth([...targetLabels, ...labels]) === truth(targetLabels));
                if (completions.length) selections = completions;
            }
        } else {
            const legal = contract.alternatives ?? supported.map(label => [label]);
            const requested = supported.filter(label => targetLabels.includes(label));
            const exact = requested.length ? legal.find(labels => key(labels) === key(requested)) : undefined;
            const defaultChoice = !requested.length ? contract.defaults?.find(item =>
                (item.whenAll ?? []).every(label => targetLabels.includes(label))
                && (item.whenNone ?? []).every(label => !targetLabels.includes(label))) : undefined;
            const equivalentCompletions = (selection: readonly string[]) => {
                const selectionKey = key(selection);
                const group = contract.equivalenceGroups?.find(items => items.some(labels => key(labels) === selectionKey));
                const equivalents = new Set((group ?? [selection]).map(key));
                const completed = fallback?.filter(labels => equivalents.has(key(labels))
                    && requested.every(request => labels.some(label => capabilitySatisfies(label, request))));
                return completed?.length ? completed : [selection];
            };
            if (exact) selections = equivalentCompletions(exact);
            else if (defaultChoice) selections = equivalentCompletions(defaultChoice.labels);
            else {
                selections = (fallback ?? legal).filter(labels => requested.every(request =>
                    labels.some(label => capabilitySatisfies(label, request))));
                if (direct) {
                    const comparable = selections.filter(labels => labels.some(label =>
                        targetLabels.some(target => capabilitySatisfies(label, target)
                            || capabilitySatisfies(target, label))));
                    if (comparable.length) selections = comparable;
                }
            }
        }
        const score = (labels: readonly string[]): number => !fallback ? 0 : labels.reduce(
            (total, label) => total + targetLabels.reduce((sum, target) =>
                sum + (label === target ? 1 : capabilitySatisfies(label, target) ? 2 : 0), 0), 0);
        domains.push({owner, field, alternatives: selections.map(labels => ({
            id: key(labels), labels: canonical(labels), priority: score(labels)
        })).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)});
    }
    return domains;
}

export type SchemaChoiceSelection = Readonly<Record<string, readonly string[]>>;

/**
 * Resolves an admitted field binding. Only declared context reads cross field
 * boundaries, and selected labels never mutate or replace the original request.
 */
export function resolveSchemaChoices<T extends ConfigSchema>(
    schema: T, targetLabels: readonly string[], selection: SchemaChoiceSelection
): ResolvedConfig<ConfigFromSchema<T>> {
    const domains = normalizeSchemaChoices(schema, targetLabels, 'generator');
    const byField = new Map(domains.map(domain => [domain.field, domain]));
    for (const field of Object.keys(selection)) {
        if (!byField.has(field)) throw new SchemaChoiceContractError(field, 'unknown selected field.');
    }
    // Check every binding before any resolver can consume entropy or context.
    for (const {field, alternatives} of domains) {
        const labels = selection[field];
        if (!labels || new Set(labels).size !== labels.length
            || !alternatives.some(alternative => alternative.id === key(labels))) {
            throw new SchemaChoiceContractError(field, 'selection is missing or outside the admitted domain.');
        }
    }
    const config: Record<string, unknown> = {};
    const emitted = new Set<string>();
    const localContext = canonical([...targetLabels, ...Object.values(selection).flat()]);
    for (const [field, value] of Object.entries(schema)) {
        if (typeof value === 'function') {
            config[field] = value();
            continue;
        }
        const labels = selection[field];
        if (isTuple(value)) {
            const context = value[1].labelChoices!.contextLabels ?? [];
            const contextLabels = localContext.filter(label => !value[0].includes(label)
                && context.some(boundary => capabilitySatisfies(label, boundary)));
            config[field] = value[1](canonical([...contextLabels, ...labels]), value[0]);
        } else {
            config[field] = labels[0];
        }
        if (config[field] === undefined || config[field] === null) {
            throw new SchemaChoiceContractError(field, 'declared selection did not resolve a value.');
        }
        labels.forEach(label => emitted.add(label));
    }
    return {config: config as ConfigFromSchema<T>, resolvedLabels: canonical([...emitted])};
}
