import {digestIdentity} from './content-identity.ts';
import {getCapabilityAncestors} from './ontology.ts';
import {Ability} from 'edugraph-ts/generated';
import {CompatibilityContractError} from './compatibility-errors.ts';
export {CompatibilityContractError} from './compatibility-errors.ts';
export {getTargetPolicyLabels, requireTargetLabels, rejectTargetLabels} from './target-policies.ts';
import type {
    CompatibilityPlanningInput, CompatibilityPlanningResult, CompatibilityPlanningWork,
    CompatibilityQueries, CompatibilityRule, GenerationPlan, GenerationPlanGroup,
    GenerationPlanIdentity, GenerationSelectionReceipt,
    LabelChoiceDomain, LabelChoiceField, LabelDependency, LabelScope, SelectedLabelChoice
} from '../types/compatibility.ts';

export const GENERATION_PLAN_VERSION = 1 as const;
export const DEFAULT_MAX_COMPATIBILITY_ASSIGNMENTS = 4096;
const EDU_PREFIX = 'http://edugraph.io/edu/';
const scopes: readonly LabelScope[] = ['target', 'generator', 'view'];
const abilityLabels = new Set<string>(Object.values(Ability));

/** A bounded planner cannot silently truncate an unrepresentable rule profile. */
export class CompatibilityLimitError extends CompatibilityContractError {
    constructor(readonly fields: readonly LabelChoiceField[], readonly limit: number) {
        super(`Compatibility group exceeds ${limit} assignments: ${fields.map(fieldKey).join(', ')}`);
        this.name = 'CompatibilityLimitError';
    }
}

const fail = (message: string): never => { throw new CompatibilityContractError(message); };
const fieldKey = (field: LabelChoiceField): string => JSON.stringify([field.owner, field.field]);
const dependencyKey = (dependency: LabelDependency): string =>
    JSON.stringify([dependency.scope, dependency.label]);
const compare = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;
const canonical = (labels: readonly string[]): string[] => [...new Set(labels)].sort(compare);
const record = (value: unknown, description: string): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${description} must be an object`);
    return value as Record<string, unknown>;
};
const text = (value: unknown, description: string): string => {
    if (typeof value !== 'string' || value.length === 0) fail(`${description} must be a nonempty string`);
    return value as string;
};
const strings = (value: unknown, description: string): string[] => {
    if (!Array.isArray(value)) fail(`${description} must be an array`);
    return (value as unknown[]).map((entry, index) => text(entry, `${description}[${index}]`));
};
const keys = (value: Record<string, unknown>, allowed: readonly string[], description: string): void => {
    const unknown = Object.keys(value).filter(key => !allowed.includes(key));
    if (unknown.length) fail(`${description} has unknown fields: ${unknown.join(', ')}`);
};

function identityFrom(value: unknown): GenerationPlanIdentity {
    const item = record(value, 'Plan identity');
    keys(item, ['targetId', 'generatorId', 'viewId'], 'Plan identity');
    return {
        targetId: text(item.targetId, 'targetId'),
        generatorId: text(item.generatorId, 'generatorId'),
        viewId: text(item.viewId, 'viewId')
    };
}

function fieldFrom(value: unknown): LabelChoiceField {
    const item = record(value, 'Choice field');
    if (item.owner !== 'generator' && item.owner !== 'view') fail('Choice owner must be generator or view');
    return {owner: item.owner as LabelChoiceField['owner'], field: text(item.field, 'Choice field name')};
}

function normalizeDomains(value: unknown): LabelChoiceDomain[] {
    if (!Array.isArray(value)) fail('Choice domains must be an array');
    const found = new Set<string>();
    return (value as unknown[]).map(raw => {
        const item = record(raw, 'Choice domain');
        keys(item, ['owner', 'field', 'alternatives'], 'Choice domain');
        const field = fieldFrom(item);
        if (found.has(fieldKey(field))) fail(`Duplicate choice domain ${fieldKey(field)}`);
        found.add(fieldKey(field));
        if (!Array.isArray(item.alternatives)) fail('Choice alternatives must be an array');
        const ids = new Set<string>();
        const alternatives = (item.alternatives as unknown[]).map(rawAlternative => {
            const alternative = record(rawAlternative, 'Choice alternative');
            keys(alternative, ['id', 'labels', 'priority'], 'Choice alternative');
            const id = text(alternative.id, 'Alternative ID');
            if (ids.has(id)) fail(`Duplicate alternative ${id} in ${fieldKey(field)}`);
            ids.add(id);
            const priority = alternative.priority ?? 0;
            if (typeof priority !== 'number' || !Number.isFinite(priority)) fail('Alternative priority must be finite');
            return {id, labels: canonical(strings(alternative.labels, 'Alternative labels')), priority: priority as number};
        }).sort((left, right) => compare(left.id, right.id));
        return {...field, alternatives};
    }).sort((left, right) => compare(fieldKey(left), fieldKey(right)));
}

/** Validates declarations without invoking any predicate or inspecting implementations. */
export function validateCompatibilityRules(
    rules: readonly CompatibilityRule<any>[],
    owner: 'generator' | 'view'
): void {
    if (!Array.isArray(rules)) fail('Compatibility rules must be an array');
    if (owner !== 'generator' && owner !== 'view') fail('Rule owner must be generator or view');
    const ids = new Set<string>();
    for (const raw of rules) {
        const rule = record(raw, 'Compatibility rule');
        keys(rule, ['id', 'description', 'dependencies', 'predicate', 'targetPolicy'], 'Compatibility rule');
        const id = text(rule.id, 'Rule ID');
        if (ids.has(id)) fail(`Duplicate ${owner} rule ID ${id}`);
        ids.add(id);
        if (rule.description !== undefined) text(rule.description, `Description for rule ${id}`);
        if (typeof rule.predicate !== 'function') fail(`Rule ${id} must declare a predicate`);
        let policyLabels: string[] | undefined;
        if (rule.targetPolicy !== undefined) {
            const policy = record(rule.targetPolicy, `Target policy for rule ${id}`);
            keys(policy, ['kind', 'labels'], `Target policy for rule ${id}`);
            if (policy.kind !== 'require' && policy.kind !== 'reject') fail(`Invalid target policy kind for rule ${id}`);
            policyLabels = canonical(strings(policy.labels, 'Target policy labels'));
            if (!Array.isArray(rule.dependencies)) fail(`Target policy ${id} must declare its target dependencies`);
        }
        if (rule.dependencies === undefined) continue;
        if (!Array.isArray(rule.dependencies)) fail(`Dependencies for rule ${id} must be an array`);
        const dependencies = new Set<string>();
        for (const rawDependency of rule.dependencies as unknown[]) {
            const dependency = record(rawDependency, `Dependency for rule ${id}`);
            keys(dependency, ['scope', 'label'], `Dependency for rule ${id}`);
            if (!scopes.includes(dependency.scope as LabelScope)
                || (owner === 'generator' && dependency.scope === 'view')) {
                fail(`Invalid dependency scope ${String(dependency.scope)} for ${owner} rule ${id}`);
            }
            const label = text(dependency.label, 'Dependency label');
            if (owner === 'generator' && abilityLabels.has(label)) {
                fail(`Generator rule ${id} cannot depend on learner Ability ${label}`);
            }
            const key = dependencyKey({scope: dependency.scope as LabelScope, label});
            if (dependencies.has(key)) fail(`Duplicate dependency in rule ${id}: ${key}`);
            dependencies.add(key);
        }
        if (policyLabels && (dependencies.size !== policyLabels.length
            || policyLabels.some(label => !dependencies.has(dependencyKey({scope: 'target', label}))))) {
            fail(`Target policy ${id} dependencies must match its target labels`);
        }
    }
}

type ScopeLabels = Record<LabelScope, readonly string[]>;
type ScopeCounts = Record<LabelScope, Map<string, number>>;
interface Context {
    exact: ScopeCounts;
    capabilities: ScopeCounts;
}
type DomainPostings = Record<'generator' | 'view', Map<string, number[]>>;
interface DomainIndex {
    queries: DomainPostings;
    coverage: DomainPostings;
    constantCoverage: Set<string>;
}
interface Constraint {
    fields: number[];
    ruleId?: string;
    label?: string;
    evaluate(context: Context): boolean;
}

const scopeHas = (context: Context, dependency: LabelDependency): boolean =>
    (context.capabilities[dependency.scope].get(dependency.label) ?? 0) > 0;
const scopeExact = (context: Context, dependency: LabelDependency): boolean =>
    (context.exact[dependency.scope].get(dependency.label) ?? 0) > 0;

function updateContext(context: Context, scope: LabelScope, labels: readonly string[], delta: number, work: CompatibilityPlanningWork): void {
    const add = (counts: Map<string, number>, label: string): void => {
        work.contextLabelVisits++;
        const count = (counts.get(label) ?? 0) + delta;
        if (count === 0) counts.delete(label);
        else counts.set(label, count);
    };
    for (const label of labels) {
        add(context.exact[scope], label);
        for (const ancestor of getCapabilityAncestors(label)) add(context.capabilities[scope], ancestor);
    }
}

/** Build variable-field postings once; immutable contributions never connect groups. */
function indexDomains(domains: readonly LabelChoiceDomain[], base: ScopeLabels, work: CompatibilityPlanningWork): DomainIndex {
    const index: DomainIndex = {
        queries: {generator: new Map(), view: new Map()},
        coverage: {generator: new Map(), view: new Map()},
        constantCoverage: new Set()
    };
    const invariantExact = {generator: new Set(base.generator), view: new Set(base.view)};
    const invariantCapabilities = {generator: new Set<string>(), view: new Set<string>()};
    for (const owner of ['generator', 'view'] as const) for (const label of base[owner]) {
        for (const ancestor of getCapabilityAncestors(label)) {
            work.labelIndexVisits++;
            invariantCapabilities[owner].add(ancestor);
            index.constantCoverage.add(ancestor);
        }
    }
    const add = (postings: DomainPostings, owner: 'generator' | 'view', label: string, field: number): void => {
        let fields = postings[owner].get(label);
        if (!fields) postings[owner].set(label, fields = []);
        fields.push(field);
    };
    domains.forEach((domain, field) => {
        const exactCounts = new Map<string, number>();
        const capabilityCounts = new Map<string, number>();
        for (const alternative of domain.alternatives) {
            const alternativeCapabilities = new Set<string>();
            for (const label of alternative.labels) {
                work.labelIndexVisits++;
                exactCounts.set(label, (exactCounts.get(label) ?? 0) + 1);
                for (const ancestor of getCapabilityAncestors(label)) {
                    work.labelIndexVisits++;
                    alternativeCapabilities.add(ancestor);
                }
            }
            for (const label of alternativeCapabilities) capabilityCounts.set(label, (capabilityCounts.get(label) ?? 0) + 1);
        }
        for (const [label, count] of capabilityCounts) {
            if (count === domain.alternatives.length) index.constantCoverage.add(label);
            const varyingCapability = count < domain.alternatives.length;
            const varyingExact = (exactCounts.get(label) ?? 0) > 0 && exactCounts.get(label) !== domain.alternatives.length;
            if (varyingCapability) add(index.coverage, domain.owner, label, field);
            if ((varyingCapability && !invariantCapabilities[domain.owner].has(label))
                || (varyingExact && !invariantExact[domain.owner].has(label))) add(index.queries, domain.owner, label, field);
        }
    });
    return index;
}

function ruleConstraint(
    rule: CompatibilityRule<any>, owner: 'generator' | 'view', domains: readonly LabelChoiceDomain[],
    index: DomainIndex, work: CompatibilityPlanningWork
): Constraint {
    const dependencies = rule.dependencies as readonly LabelDependency[] | undefined;
    const permitted = new Set(dependencies?.map(dependencyKey));
    const fields = dependencies === undefined
        ? domains.flatMap((domain, field) => owner === 'generator' && domain.owner === 'view' ? [] : [field])
        : [...new Set(dependencies.flatMap(dependency => {
            if (dependency.scope === 'target') return [];
            const fields = index.queries[dependency.scope].get(dependency.label) ?? [];
            work.dependencyFieldVisits += fields.length;
            return fields;
        }))].sort((left, right) => left - right);
    const cache = new Map<string, boolean>();
    return {
        fields,
        ruleId: `${owner}:${rule.id}`,
        evaluate(context) {
            const projection = dependencies === undefined
                ? [canonical([...context.exact.target.keys()]), canonical([...context.exact.generator.keys()]),
                    ...(owner === 'view' ? [canonical([...context.exact.view.keys()])] : [])]
                : dependencies.map(dependency => [scopeHas(context, dependency), scopeExact(context, dependency)]);
            const cacheKey = JSON.stringify(projection);
            if (cache.has(cacheKey)) {
                work.projectionCacheHits++;
                return cache.get(cacheKey)!;
            }
            const query = (scope: LabelScope, label: string, exact: boolean): boolean => {
                if (!scopes.includes(scope) || (owner === 'generator' && scope === 'view')) {
                    fail(`Rule ${owner}:${rule.id} queried forbidden scope ${String(scope)}`);
                }
                text(label, `Query label for rule ${rule.id}`);
                if (owner === 'generator' && abilityLabels.has(label)) {
                    fail(`Generator rule ${rule.id} cannot query learner Ability ${label}`);
                }
                const dependency = {scope, label};
                if (dependencies !== undefined && !permitted.has(dependencyKey(dependency))) {
                    fail(`Rule ${owner}:${rule.id} queried undeclared dependency ${dependencyKey(dependency)}`);
                }
                return exact ? scopeExact(context, dependency) : scopeHas(context, dependency);
            };
            const facade: CompatibilityQueries = Object.freeze({
                has: (scope: LabelScope, label: string) => query(scope, label, false),
                exact: (scope: LabelScope, label: string) => query(scope, label, true)
            });
            work.predicateEvaluations++;
            let result: unknown;
            try {
                result = rule.predicate(facade);
            } catch (error) {
                if (error instanceof CompatibilityContractError) throw error;
                throw new CompatibilityContractError(`Rule ${owner}:${rule.id} threw during compatibility evaluation`, {cause: error});
            }
            if (typeof result !== 'boolean') fail(`Rule ${owner}:${rule.id} must return a boolean`);
            cache.set(cacheKey, result as boolean);
            return result as boolean;
        }
    };
}

function planHash(plan: Omit<GenerationPlan, 'hash'>): string {
    const {inputHash: _inputHash, ...content} = plan;
    return digestIdentity(content);
}

function preferredAssignments(
    assignments: string[][], fields: readonly LabelChoiceDomain[], work: CompatibilityPlanningWork
): string[][] {
    const priorities = fields.map(field => new Map(field.alternatives.map(alternative => [alternative.id, alternative.priority ?? 0])));
    if (priorities.every(values => new Set(values.values()).size <= 1)) return assignments;
    const frontier: {assignment: string[]; scores: number[]}[] = [];
    for (const assignment of assignments) {
        const scores = assignment.map((id, index) => priorities[index].get(id)!);
        let dominated = false;
        for (let index = frontier.length - 1; index >= 0; index--) {
            work.priorityComparisons++;
            const existing = frontier[index].scores;
            if (existing.every((score, offset) => score >= scores[offset])
                && existing.some((score, offset) => score > scores[offset])) {
                dominated = true;
                break;
            }
            if (scores.every((score, offset) => score >= existing[offset])
                && scores.some((score, offset) => score > existing[offset])) frontier.splice(index, 1);
        }
        if (!dominated) frontier.push({assignment, scores});
    }
    return frontier.map(entry => entry.assignment);
}

/**
 * Enumerates only connected dependency groups. Independent fields never enter a
 * global Cartesian product. Every retained row is a complete joint assignment.
 */
export function planCompatibility(input: CompatibilityPlanningInput): CompatibilityPlanningResult {
    const identity = identityFrom(input.identity);
    if (input.inputHash !== undefined) text(input.inputHash, 'Plan inputHash');
    const domains = normalizeDomains(input.fields);
    const base: ScopeLabels = {
        target: canonical(strings(input.targetLabels, 'Target labels')),
        generator: canonical(strings(input.generatorLabels, 'Generator invariant labels')),
        view: canonical(strings(input.viewLabels, 'View invariant labels'))
    };
    const limit = input.maxAssignmentsPerGroup ?? DEFAULT_MAX_COMPATIBILITY_ASSIGNMENTS;
    if (!Number.isSafeInteger(limit) || limit < 1) fail('maxAssignmentsPerGroup must be a positive safe integer');
    const generatorRules = input.generatorRules ?? [];
    const viewRules = input.viewRules ?? [];
    validateCompatibilityRules(generatorRules, 'generator');
    validateCompatibilityRules(viewRules, 'view');
    const work: CompatibilityPlanningWork = {
        domains: domains.length, alternatives: domains.reduce((count, domain) => count + domain.alternatives.length, 0),
        constraints: 0, dependencyGroups: 0, assignmentsVisited: 0, predicateEvaluations: 0,
        projectionCacheHits: 0, retainedAssignments: 0, priorityComparisons: 0,
        labelIndexVisits: 0, dependencyFieldVisits: 0, contextLabelVisits: 0
    };
    const empty = domains.filter(domain => domain.alternatives.length === 0);
    if (empty.length) return {supported: false, reason: 'empty-domain', fields: empty.map(({owner, field}) => ({owner, field})), work};
    const domainIndex = indexDomains(domains, base, work);
    const constraints = [
        ...generatorRules.map(rule => ruleConstraint(rule, 'generator', domains, domainIndex, work)),
        ...viewRules.map(rule => ruleConstraint(rule, 'view', domains, domainIndex, work))
    ];
    const uncovered: string[] = [];
    for (const label of base.target.filter(label => label.startsWith(EDU_PREFIX))) {
        if (domainIndex.constantCoverage.has(label)) continue;
        const fields = [...(domainIndex.coverage.generator.get(label) ?? []), ...(domainIndex.coverage.view.get(label) ?? [])];
        work.dependencyFieldVisits += fields.length;
        if (fields.length === 0) uncovered.push(label);
        else constraints.push({fields, label, evaluate: context =>
            scopeHas(context, {scope: 'generator', label}) || scopeHas(context, {scope: 'view', label})});
    }
    work.constraints = constraints.length;
    if (uncovered.length) return {supported: false, reason: 'uncovered-target', labels: uncovered, work};
    const choices = domains.map(domain => domain.alternatives[0]);
    const context: Context = {
        exact: {target: new Map(), generator: new Map(), view: new Map()},
        capabilities: {target: new Map(), generator: new Map(), view: new Map()}
    };
    for (const scope of scopes) updateContext(context, scope, base[scope], 1, work);
    choices.forEach((choice, index) => updateContext(context, domains[index].owner, choice.labels, 1, work));
    const select = (index: number, alternative: typeof choices[number]): void => {
        if (choices[index] === alternative) return;
        updateContext(context, domains[index].owner, choices[index].labels, -1, work);
        choices[index] = alternative;
        updateContext(context, domains[index].owner, alternative.labels, 1, work);
    };
    const fixedFailures = constraints.filter(constraint => constraint.fields.length === 0 && !constraint.evaluate(context));
    if (fixedFailures.length) return {
        supported: false, reason: 'incompatible-rules', ruleIds: canonical(fixedFailures.flatMap(constraint => constraint.ruleId ? [constraint.ruleId] : [])), work
    };
    const roots = domains.map((_, index) => index);
    const root = (index: number): number => {
        while (roots[index] !== index) {
            roots[index] = roots[roots[index]];
            index = roots[index];
        }
        return index;
    };
    for (const constraint of constraints) {
        for (const field of constraint.fields.slice(1)) roots[root(field)] = root(constraint.fields[0]);
    }
    const connected = new Map<number, number[]>();
    domains.forEach((_, index) => {
        const groupRoot = root(index);
        let fields = connected.get(groupRoot);
        if (!fields) connected.set(groupRoot, fields = []);
        fields.push(index);
    });
    const constraintsByGroup = new Map<number, Constraint[]>();
    for (const constraint of constraints) {
        if (constraint.fields.length === 0) continue;
        const groupRoot = root(constraint.fields[0]);
        let groupConstraints = constraintsByGroup.get(groupRoot);
        if (!groupConstraints) constraintsByGroup.set(groupRoot, groupConstraints = []);
        groupConstraints.push(constraint);
    }
    const groups: GenerationPlanGroup[] = [];
    const retainedDomains = [...domains];
    for (const indices of connected.values()) {
        const relevant = constraintsByGroup.get(root(indices[0])) ?? [];
        if (relevant.length === 0) {
            const index = indices[0];
            const priority = Math.max(...domains[index].alternatives.map(alternative => alternative.priority ?? 0));
            retainedDomains[index] = {...domains[index], alternatives: domains[index].alternatives.filter(alternative => (alternative.priority ?? 0) === priority)};
            continue;
        }
        const fields = indices.map(index => domains[index]);
        work.dependencyGroups++;
        let combinations = 1;
        for (const field of fields) {
            if (combinations > limit / field.alternatives.length) throw new CompatibilityLimitError(fields.map(({owner, field}) => ({owner, field})), limit);
            combinations *= field.alternatives.length;
        }
        const accepted: string[][] = [];
        const failedRules = new Set<string>();
        const failedLabels = new Set<string>();
        const visit = (offset: number): void => {
            if (offset < indices.length) {
                const index = indices[offset];
                for (const alternative of domains[index].alternatives) {
                    select(index, alternative);
                    visit(offset + 1);
                }
                return;
            }
            work.assignmentsVisited++;
            let valid = true;
            for (const constraint of relevant) {
                if (constraint.evaluate(context)) continue;
                valid = false;
                if (constraint.ruleId) failedRules.add(constraint.ruleId);
                if (constraint.label) failedLabels.add(constraint.label);
            }
            if (valid) accepted.push(indices.map(index => choices[index].id));
        };
        visit(0);
        if (!accepted.length) return {
            supported: false, reason: failedRules.size ? 'incompatible-rules' : 'uncovered-target',
            fields: fields.map(({owner, field}) => ({owner, field})), ruleIds: canonical([...failedRules]), labels: canonical([...failedLabels]), work
        };
        const preferred = preferredAssignments(accepted, fields, work);
        work.retainedAssignments += preferred.length;
        const projections = fields.map((_, offset) => new Set(preferred.map(assignment => assignment[offset])));
        indices.forEach((index, offset) => {
            retainedDomains[index] = {...domains[index], alternatives: domains[index].alternatives.filter(alternative => projections[offset].has(alternative.id))};
            select(index, retainedDomains[index].alternatives[0]);
        });
        // A rectangular accepted table contains no remaining correlation.
        if (projections.reduce((product, projection) => product * projection.size, 1) !== preferred.length) {
            groups.push({
                fields: fields.map(({owner, field}) => ({owner, field})),
                assignments: preferred.sort((left, right) => compare(JSON.stringify(left), JSON.stringify(right)))
            });
        }
    }
    const content: Omit<GenerationPlan, 'hash'> = {
        version: GENERATION_PLAN_VERSION, identity,
        ...(input.inputHash === undefined ? {} : {inputHash: input.inputHash}),
        targetLabels: base.target, generatorLabels: base.generator, viewLabels: base.view,
        domains: retainedDomains,
        groups: groups.sort((left, right) => compare(fieldKey(left.fields[0]), fieldKey(right.fields[0])))
    };
    return {supported: true, plan: {...content, hash: planHash(content)}, work};
}

/** Validates canonical serialized content and its hash before cache/replay use. */
export function validateGenerationPlan(value: unknown): GenerationPlan {
    const item = record(value, 'Generation plan');
    keys(item, ['version', 'hash', 'identity', 'inputHash', 'targetLabels', 'generatorLabels', 'viewLabels', 'domains', 'groups'], 'Generation plan');
    if (item.version !== GENERATION_PLAN_VERSION) fail(`Unsupported generation plan version ${String(item.version)}; rebuild matching`);
    const identity = identityFrom(item.identity);
    if (item.inputHash !== undefined) text(item.inputHash, 'Plan inputHash');
    const domains = normalizeDomains(item.domains);
    if (domains.some(domain => domain.alternatives.length === 0)) fail('Generation plan contains an empty domain');
    const byField = new Map(domains.map(domain => [fieldKey(domain), domain]));
    if (!Array.isArray(item.groups)) fail('Generation plan groups must be an array');
    const grouped = new Set<string>();
    const groups = (item.groups as unknown[]).map(rawGroup => {
        const group = record(rawGroup, 'Generation plan group');
        keys(group, ['fields', 'assignments'], 'Generation plan group');
        if (!Array.isArray(group.fields) || group.fields.length === 0) fail('Group fields must be nonempty');
        const fields = (group.fields as unknown[]).map(rawField => {
            const fieldRecord = record(rawField, 'Group field');
            keys(fieldRecord, ['owner', 'field'], 'Group field');
            const field = fieldFrom(fieldRecord);
            const key = fieldKey(field);
            if (!byField.has(key)) fail(`Unknown grouped field ${key}`);
            if (grouped.has(key)) fail(`Field ${key} appears in multiple group positions`);
            grouped.add(key);
            return field;
        });
        if (fields.some((field, index) => index > 0 && compare(fieldKey(fields[index - 1]), fieldKey(field)) >= 0)) fail('Group fields must be canonical');
        if (!Array.isArray(group.assignments) || group.assignments.length === 0) fail('Group assignments must be nonempty');
        const assignments = (group.assignments as unknown[]).map(rawAssignment => {
            const assignment = strings(rawAssignment, 'Group assignment');
            if (assignment.length !== fields.length) fail('Group assignment has the wrong arity');
            assignment.forEach((id, index) => {
                if (!byField.get(fieldKey(fields[index]))!.alternatives.some(alternative => alternative.id === id)) fail(`Unknown selected alternative ${id}`);
            });
            return assignment;
        });
        const canonicalAssignments = canonical(assignments.map(assignment => JSON.stringify(assignment)));
        if (canonicalAssignments.length !== assignments.length || assignments.some((assignment, index) => JSON.stringify(assignment) !== canonicalAssignments[index])) fail('Group assignments must be unique and canonical');
        fields.forEach((field, index) => {
            if (new Set(assignments.map(assignment => assignment[index])).size !== byField.get(fieldKey(field))!.alternatives.length) fail('Grouped domain contains an unused alternative');
        });
        return {fields, assignments};
    });
    const content: Omit<GenerationPlan, 'hash'> = {
        version: GENERATION_PLAN_VERSION, identity,
        ...(item.inputHash === undefined ? {} : {inputHash: item.inputHash as string}),
        targetLabels: canonical(strings(item.targetLabels, 'Target labels')),
        generatorLabels: canonical(strings(item.generatorLabels, 'Generator invariant labels')),
        viewLabels: canonical(strings(item.viewLabels, 'View invariant labels')),
        domains, groups: groups.sort((left, right) => compare(fieldKey(left.fields[0]), fieldKey(right.fields[0])))
    };
    const result = {...content, hash: text(item.hash, 'Plan hash')};
    if (digestIdentity(item) !== digestIdentity(result)) fail('Generation plan must use canonical content');
    if (result.hash !== planHash(content)) fail('Generation plan content hash mismatch; rebuild matching');
    return result;
}

function variantHash(plan: GenerationPlan, choices: readonly SelectedLabelChoice[]): string {
    const domains = new Map(plan.domains.map(domain => [fieldKey(domain), domain]));
    return digestIdentity({
        version: GENERATION_PLAN_VERSION, identity: plan.identity,
        generatorLabels: plan.generatorLabels, viewLabels: plan.viewLabels,
        choices: choices.map(choice => ({
            owner: choice.owner, field: choice.field,
            labels: domains.get(fieldKey(choice))!.alternatives.find(alternative => alternative.id === choice.alternativeId)!.labels
        }))
    });
}

export function validateGenerationSelectionReceipt(planValue: unknown, value: unknown): GenerationSelectionReceipt {
    const plan = validateGenerationPlan(planValue);
    const item = record(value, 'Generation selection receipt');
    keys(item, ['version', 'planHash', 'variantHash', 'choices'], 'Generation selection receipt');
    if (item.version !== GENERATION_PLAN_VERSION) fail('Unsupported selection receipt version');
    if (item.planHash !== plan.hash) fail('Selection receipt belongs to a different generation plan');
    if (!Array.isArray(item.choices) || item.choices.length !== plan.domains.length) fail('Receipt must select every domain exactly once');
    const choices = (item.choices as unknown[]).map((rawChoice, index) => {
        const choice = record(rawChoice, 'Selected choice');
        keys(choice, ['owner', 'field', 'alternativeId'], 'Selected choice');
        const field = fieldFrom(choice);
        if (fieldKey(field) !== fieldKey(plan.domains[index])) fail('Receipt choices must be complete and canonical');
        const alternativeId = text(choice.alternativeId, 'Selected alternative ID');
        if (!plan.domains[index].alternatives.some(alternative => alternative.id === alternativeId)) fail(`Receipt selects unknown alternative ${alternativeId}`);
        return {...field, alternativeId};
    });
    const byField = new Map(choices.map(choice => [fieldKey(choice), choice.alternativeId]));
    for (const group of plan.groups) {
        const selection = group.fields.map(field => byField.get(fieldKey(field))!);
        if (!group.assignments.some(assignment => assignment.every((id, index) => id === selection[index]))) fail('Receipt violates a retained compatibility correlation');
    }
    const expectedHash = variantHash(plan, choices);
    if (item.variantHash !== expectedHash) fail('Selection receipt variant hash mismatch');
    return {version: GENERATION_PLAN_VERSION, planHash: plan.hash, variantHash: expectedHash, choices};
}

/** Binds an existing realized assignment to an admitting plan, without random selection. */
export function createGenerationSelectionReceipt(
    planValue: GenerationPlan, selection: readonly SelectedLabelChoice[]
): GenerationSelectionReceipt {
    const plan = validateGenerationPlan(planValue);
    const choices = [...selection].sort((left, right) => compare(fieldKey(left), fieldKey(right)));
    if (choices.length !== plan.domains.length || choices.some((choice, index) =>
        fieldKey(choice) !== fieldKey(plan.domains[index])
        || !plan.domains[index].alternatives.some(alternative => alternative.id === choice.alternativeId))) {
        fail('Realized assignment is outside this generation plan.');
    }
    return validateGenerationSelectionReceipt(plan, {
        version: GENERATION_PLAN_VERSION, planHash: plan.hash,
        variantHash: variantHash(plan, choices), choices
    });
}

/** Uniform full-assignment selection within each independent retained factor. */
export function sampleGenerationPlan(planValue: GenerationPlan, random: () => number): GenerationSelectionReceipt {
    const plan = validateGenerationPlan(planValue);
    if (typeof random !== 'function') fail('Plan sampling requires a random callback');
    const choose = <T>(values: readonly T[]): T => {
        if (values.length === 1) return values[0];
        const draw = random();
        if (!Number.isFinite(draw) || draw < 0 || draw >= 1) fail('Random callback must return a finite number in [0, 1)');
        return values[Math.floor(draw * values.length)];
    };
    const selected = new Map<string, string>();
    for (const group of plan.groups) {
        const assignment = choose(group.assignments);
        group.fields.forEach((field, index) => selected.set(fieldKey(field), assignment[index]));
    }
    for (const domain of plan.domains) {
        if (!selected.has(fieldKey(domain))) selected.set(fieldKey(domain), choose(domain.alternatives).id);
    }
    const choices = plan.domains.map(({owner, field}) => ({owner, field, alternativeId: selected.get(fieldKey({owner, field}))!}));
    return {version: GENERATION_PLAN_VERSION, planHash: plan.hash, variantHash: variantHash(plan, choices), choices};
}
