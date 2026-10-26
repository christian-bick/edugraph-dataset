import {bundledContext} from 'edugraph-ts/generated';
import {RELATION_IRIS, type OntologyContext} from 'edugraph-ts/core';
import {labelDependencies} from '../validation/label-dependencies.ts';
import {dependencyEvidenceIds} from '../types/label-dependencies.ts';
import type {
    DependencyAssessment, DependencyFacet, DependencyTrigger, DependencyTriggerResult,
    DependencyEvidenceId, LabelDependencyEvidence, LabelDependencyEvaluation, LabelDependencyGraph
} from '../types/label-dependencies.ts';
import {digestIdentity} from './content-identity.ts';

const AREA_DIMENSION = 'http://edugraph.io/edu#Area';
const EVALUATOR_VERSION = 1;
const ordered = (values: readonly string[]): string[] => [...new Set(values)].sort();
const fail = (message: string): never => {throw new Error(`Label dependency graph: ${message}`);};
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const object = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
const knownKeys = (value: object, allowed: readonly string[], location: string): void => {
    const unknown = Object.keys(value).filter(key => !allowed.includes(key));
    if (unknown.length) fail(`${location} has unknown fields: ${unknown.join(', ')}.`);
};

/** Reject malformed authored contracts before any sample is assessed. */
export function validateLabelDependencyGraph(graph: LabelDependencyGraph, context: OntologyContext = bundledContext): void {
    if (!object(graph) || graph.version !== 1) fail('unsupported version.');
    knownKeys(graph, ['version', 'context', 'facets', 'rules'], 'graph');
    if (!object(graph.context) || graph.context.requireArea !== true
        || !Array.isArray(graph.context.allAreasWithin) || !graph.context.allAreasWithin.length) {
        fail('context requires nonempty Area roots and requireArea: true.');
    }
    knownKeys(graph.context, ['allAreasWithin', 'requireArea'], 'context');
    const validateDescriptor = (label: unknown, location: string, eligible: boolean): void => {
        if (!nonempty(label)) fail(`${location} must name a descriptor.`);
        const descriptor = context.lookupDescriptor(label as string);
        if (!descriptor) fail(`${location} names unknown descriptor '${label}'.`);
        if (eligible && !context.isLabelEligible(label as string)) fail(`${location} names ineligible descriptor '${label}'.`);
    };
    for (const root of graph.context.allAreasWithin) {
        validateDescriptor(root, 'context root', false);
        if (!context.lookupDescriptor(root)!.dimensions.includes(AREA_DIMENSION)) fail(`context root '${root}' is not an Area.`);
    }
    if (!object(graph.facets) || !Object.keys(graph.facets).length) fail('facets must be a nonempty object.');
    for (const [name, facet] of Object.entries(graph.facets)) {
        if (!nonempty(name) || !object(facet)) fail('facets must have nonempty names and object selectors.');
        knownKeys(facet, ['root', 'labels', 'check'], `facet '${name}'`);
        if (('root' in facet) === ('labels' in facet)) fail(`facet '${name}' needs exactly one root or label selector.`);
        if (facet.check !== undefined && facet.check !== 'presence-only') fail(`facet '${name}' has unknown check.`);
        if ('root' in facet) validateDescriptor(facet.root, `facet '${name}' root`, false);
        else {
            if (!Array.isArray(facet.labels) || !facet.labels.length) fail(`facet '${name}' needs nonempty labels.`);
            for (const label of facet.labels) validateDescriptor(label, `facet '${name}' label`, true);
        }
    }
    const path = new Set<object>();
    const validateTrigger = (trigger: DependencyTrigger): void => {
        if (!object(trigger)) fail('trigger must be an object.');
        if (path.has(trigger)) fail('cyclic trigger expression.');
        path.add(trigger);
        const keys = Object.keys(trigger);
        if (keys.length !== 1) fail('trigger needs exactly one family, evidence, or any selector.');
        if ('family' in trigger) {
            if (!nonempty(trigger.family) || !Object.hasOwn(graph.facets, trigger.family)) fail(`unknown trigger family '${trigger.family}'.`);
        } else if ('evidence' in trigger) {
            if (!dependencyEvidenceIds.includes(trigger.evidence)) fail(`unknown evidence identifier '${trigger.evidence}'.`);
        } else if ('any' in trigger) {
            if (!Array.isArray(trigger.any) || !trigger.any.length) fail('any trigger needs nonempty alternatives.');
            for (const child of trigger.any) validateTrigger(child);
        } else fail(`unknown trigger selector '${keys[0]}'.`);
        path.delete(trigger);
    };
    if (!Array.isArray(graph.rules)) fail('rules must be an array.');
    const ids = new Set<string>();
    for (const rule of graph.rules) {
        if (!object(rule) || !nonempty(rule.id)) fail('rules need nonempty IDs.');
        knownKeys(rule, ['id', 'when', 'assess'], `rule '${rule.id}'`);
        if (ids.has(rule.id)) fail(`duplicate rule '${rule.id}'.`);
        ids.add(rule.id);
        validateTrigger(rule.when);
        if (!Array.isArray(rule.assess) || !rule.assess.length) fail(`rule '${rule.id}' needs assessment facets.`);
        for (const facet of rule.assess) {
            if (!Object.hasOwn(graph.facets, facet)) fail(`rule '${rule.id}' assesses unknown facet '${facet}'.`);
        }
    }
}

/** One indexed, ontology-bound evaluator. It neither executes generators nor alters labels. */
export function createLabelDependencyEvaluator(
    graph: LabelDependencyGraph = labelDependencies,
    context: OntologyContext = bundledContext
) {
    validateLabelDependencyGraph(graph, context);
    graph = structuredClone(graph);
    const descriptors = context.descriptors();
    const ancestry = new Map(descriptors.map(record => [record.iri,
        new Set([record.iri, ...context.traverse(record.iri, RELATION_IRIS.structures)])]));
    const capabilityAncestors = new Map(descriptors.map(record => [record.iri,
        new Set([record.iri, ...context.traverse(record.iri, RELATION_IRIS.specializes)])]));
    const eligible = new Set(descriptors.filter(record => context.isLabelEligible(record.iri)).map(record => record.iri));
    const areaLabels = new Set(descriptors.filter(record => record.dimensions.includes(AREA_DIMENSION)).map(record => record.iri));
    const facetContains = (facet: DependencyFacet, label: string): boolean => eligible.has(label)
        && ('root' in facet ? ancestry.get(label)!.has(facet.root)
            : facet.labels.some(candidate => capabilityAncestors.get(label)!.has(candidate)));
    const families = new Map(Object.entries(graph.facets).map(([name, facet]) => [name,
        new Set(descriptors.filter(record => facetContains(facet, record.iri)).map(record => record.iri))]));
    const compare = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;
    const rules = [...graph.rules].sort((left, right) => compare(left.id, right.id));
    const normalizeTrigger = (trigger: DependencyTrigger): unknown => 'any' in trigger
        ? {any: trigger.any.map(normalizeTrigger).sort((left, right) => compare(JSON.stringify(left), JSON.stringify(right)))}
        : trigger;
    const relevant = new Set([...areaLabels, ...graph.context.allAreasWithin,
        ...[...families.values()].flatMap(labels => [...labels]),
        ...Object.values(graph.facets).flatMap(facet => 'root' in facet ? [facet.root] : [...facet.labels])]);
    const policyHash = digestIdentity({
        evaluatorVersion: EVALUATOR_VERSION,
        graph: {
            version: graph.version,
            context: {allAreasWithin: ordered(graph.context.allAreasWithin), requireArea: true},
            facets: Object.keys(graph.facets).sort().map(name => {
                const facet = graph.facets[name];
                return {name, selector: 'root' in facet ? {root: facet.root} : {labels: ordered(facet.labels)},
                    check: facet.check ?? 'evidence'};
            }),
            rules: rules.map(rule => ({id: rule.id, when: normalizeTrigger(rule.when), assess: ordered(rule.assess)}))
        },
        ontology: ordered([...relevant]).map(label => ({
            descriptor: context.lookupDescriptor(label),
            assertions: [...context.authoredAssertions(label)].sort((left, right) => compare(JSON.stringify(left), JSON.stringify(right))),
            eligibility: context.inspectLabel(label),
            ancestry: ordered([...ancestry.get(label)!]),
            capabilities: ordered([...capabilityAncestors.get(label)!])
        }))
    });

    const evaluate = (inputLabels: readonly string[], evidence?: LabelDependencyEvidence,
        resolvedAreas: readonly string[] = []): LabelDependencyEvaluation => {
        const labels = ordered(inputLabels);
        const contextLabels = ordered([...labels, ...resolvedAreas]);
        const errors = contextLabels.flatMap(label => !context.lookupDescriptor(label) ? [`Unknown descriptor '${label}'.`]
            : !eligible.has(label) ? [`Ineligible descriptor '${label}'.`] : []);
        for (const label of resolvedAreas) {
            if (eligible.has(label) && !areaLabels.has(label)) errors.push(`Resolved context label '${label}' is not an Area.`);
        }
        const areas = contextLabels.filter(label => areaLabels.has(label));
        const outsideAreas = areas.filter(label => !graph.context.allAreasWithin.some(root => ancestry.get(label)!.has(root)));
        if (!areas.length) errors.push('At least one resolved Area is required.');
        const status = errors.length ? 'invalid_context' : outsideAreas.length ? 'outside_policy_scope' : 'eligible';
        const resultContext = {status, areas, outsideAreas} as LabelDependencyEvaluation['context'];
        if (status !== 'eligible') return {context: resultContext, errors: ordered(errors), triggers: [], assessments: []};
        const selected = new Map([...families].map(([name, members]) => [name, labels.filter(label => members.has(label))]));

        const triggerResult = (trigger: DependencyTrigger): Omit<DependencyTriggerResult, 'ruleId'> => {
            if ('family' in trigger) {
                const found = selected.get(trigger.family)!;
                return {status: found.length ? 'present' : 'absent', labels: found, evidence: []};
            }
            if ('evidence' in trigger) {
                const witness = evidence?.triggers[trigger.evidence];
                return {status: witness && nonempty(witness.reason) && witness.references.length
                    ? witness.status : 'unresolved', labels: [], evidence: [trigger.evidence]};
            }
            const children = trigger.any.map(triggerResult);
            return {
                status: children.some(child => child.status === 'present') ? 'present'
                    : children.some(child => child.status === 'unresolved') ? 'unresolved' : 'absent',
                labels: ordered(children.flatMap(child => child.labels)),
                evidence: ordered(children.flatMap(child => child.evidence)) as DependencyEvidenceId[]
            };
        };

        const assess = (ruleId: string, facet: string): DependencyAssessment => {
            const current = selected.get(facet)!;
            const definition = graph.facets[facet];
            const witness = evidence?.facets[facet];
            const expected = ordered(witness?.expectedLabels ?? []);
            const base = {ruleId, facet, labels: current, expectedLabels: expected, missingLabels: [] as string[],
                references: ordered(witness?.references ?? [])};
            const unresolved = (reason: string): DependencyAssessment => ({...base, status: 'unresolved', reason});
            if (witness?.status === 'not_applicable') {
                if (!nonempty(witness.reason) || !witness.references.length) return unresolved('Inapplicability needs a reason and evidence references.');
                if (current.length || expected.length) {
                    errors.push(`${ruleId}/${facet}: inapplicability conflicts with supplied or expected labels.`);
                    return unresolved('Inapplicability conflicts with supplied or expected labels.');
                }
                return {...base, status: 'not_applicable', reason: witness.reason};
            }
            if (definition.check === 'presence-only') return {...base, expectedLabels: [],
                status: current.length ? 'satisfied' : 'missing',
                reason: current.length ? 'Range facet is present under existing semantics; no bounds were calculated.'
                    : 'Missing range facet under existing semantics; no replacement bounds were calculated.'};
            if (!witness) return unresolved('No evidence adapter assessed this facet.');
            if (witness.status === 'unresolved') return unresolved(witness.reason);
            if (!nonempty(witness.reason) || !witness.references.length) return unresolved('Applicability needs a reason and evidence references.');
            const invalid = expected.filter(label => !facetContains(definition, label));
            if (invalid.length) {
                errors.push(`${ruleId}/${facet}: expected labels are unknown, ineligible, or outside the facet: ${invalid.join(', ')}.`);
                return unresolved('Expected labels do not belong to this facet.');
            }
            const missingLabels = expected.filter(expectedLabel => !current.some(label => capabilityAncestors.get(label)!.has(expectedLabel)));
            return {...base, missingLabels, status: missingLabels.length || !current.length ? 'missing' : 'satisfied', reason: witness.reason};
        };

        const triggers = rules.map(rule => ({ruleId: rule.id, ...triggerResult(rule.when)}));
        const assessments = triggers.flatMap((trigger, index) => trigger.status === 'present'
            ? ordered(rules[index].assess).map(facet => assess(trigger.ruleId, facet)) : []);
        return {context: resultContext, errors: ordered(errors), triggers, assessments};
    };
    return {policyHash, evaluate};
}
