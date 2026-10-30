import {bundledContext} from 'edugraph-ts/generated';
import {RELATION_IRIS, type OntologyContext} from 'edugraph-ts/core';
import {labelDependencies} from '../validation/label-dependencies.ts';
import type {
    DependencyAssessment, DependencyFacet, DependencyTrigger, DependencyTriggerResult,
    LabelDependencyEvaluation, LabelDependencyGraph
} from '../types/label-dependencies.ts';
import {digestIdentity} from './content-identity.ts';

const AREA_DIMENSION = 'http://edugraph.io/edu#Area';
const EVALUATOR_VERSION = 6;
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
    knownKeys(graph, ['version', 'context', 'facets', 'rules', 'conflicts', 'exclusions'], 'graph');
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
        if (keys.length !== 1) fail('trigger needs exactly one selector.');
        if ('family' in trigger) {
            if (!nonempty(trigger.family) || !Object.hasOwn(graph.facets, trigger.family)) fail(`unknown trigger family '${trigger.family}'.`);
        } else if ('any' in trigger || 'all' in trigger) {
            const selector = 'any' in trigger ? 'any' : 'all';
            const children = 'any' in trigger ? trigger.any : trigger.all;
            if (!Array.isArray(children) || !children.length) fail(`${selector} trigger needs nonempty alternatives.`);
            for (const child of children) validateTrigger(child);
        } else if ('areaWithin' in trigger) {
            const within = trigger.areaWithin;
            const root = typeof within === 'string' ? within : within?.root;
            const validateArea = (label: unknown) => {
                validateDescriptor(label, 'trigger Area root', false);
                if (!context.lookupDescriptor(label as string)!.dimensions.includes(AREA_DIMENSION)) {
                    fail(`trigger root '${label}' is not an Area.`);
                }
            };
            validateArea(root);
            if (typeof within !== 'string') {
                if (!object(within)) fail('areaWithin trigger needs an Area root.');
                knownKeys(within, ['root', 'ignore'], 'areaWithin trigger');
                if (within.ignore !== undefined) {
                    if (!Array.isArray(within.ignore) || !within.ignore.length) fail('areaWithin ignore needs nonempty Area roots.');
                    for (const ignored of within.ignore) validateArea(ignored);
                }
            }
        } else if ('familyWithin' in trigger) {
            const within = trigger.familyWithin;
            if (!object(within)) fail('familyWithin trigger needs a family and root.');
            knownKeys(within, ['family', 'root', 'ignore'], 'familyWithin trigger');
            if (!nonempty(within.family) || !Object.hasOwn(graph.facets, within.family)) {
                fail(`unknown trigger family '${within.family}'.`);
            }
            validateDescriptor(within.root, 'familyWithin root', false);
            if (within.ignore !== undefined) {
                if (!Array.isArray(within.ignore) || !within.ignore.length) fail('familyWithin ignore needs nonempty roots.');
                for (const root of within.ignore) validateDescriptor(root, 'familyWithin ignored root', false);
            }
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
    if (graph.conflicts !== undefined && !Array.isArray(graph.conflicts)) fail('conflicts must be an array.');
    for (const conflict of graph.conflicts ?? []) {
        if (!object(conflict) || !nonempty(conflict.id)) fail('conflicts need nonempty IDs.');
        knownKeys(conflict, ['id', 'facet', 'labels'], `conflict '${conflict.id}'`);
        if (ids.has(conflict.id)) fail(`duplicate rule '${conflict.id}'.`);
        ids.add(conflict.id);
        if (!nonempty(conflict.facet) || !Object.hasOwn(graph.facets, conflict.facet)) {
            fail(`conflict '${conflict.id}' names an unknown facet.`);
        }
        if (!Array.isArray(conflict.labels) || ordered(conflict.labels).length < 2) {
            fail(`conflict '${conflict.id}' needs at least two distinct labels.`);
        }
        for (const label of conflict.labels) validateDescriptor(label, `conflict '${conflict.id}' label`, true);
        const facet = graph.facets[conflict.facet];
        for (const label of conflict.labels) {
            const ancestors = new Set([label, ...context.traverse(label, 'root' in facet
                ? RELATION_IRIS.structures : RELATION_IRIS.specializes)]);
            if ('root' in facet ? !ancestors.has(facet.root) : !facet.labels.some(candidate => ancestors.has(candidate))) {
                fail(`conflict '${conflict.id}' label '${label}' does not belong to its facet.`);
            }
        }
    }
    if (graph.exclusions !== undefined && !Array.isArray(graph.exclusions)) fail('exclusions must be an array.');
    for (const exclusion of graph.exclusions ?? []) {
        if (!object(exclusion) || !nonempty(exclusion.id)) fail('exclusions need nonempty IDs.');
        knownKeys(exclusion, ['id', 'when', 'facets'], `exclusion '${exclusion.id}'`);
        if (ids.has(exclusion.id)) fail(`duplicate rule '${exclusion.id}'.`);
        ids.add(exclusion.id);
        validateTrigger(exclusion.when);
        if (!Array.isArray(exclusion.facets) || !exclusion.facets.length) fail(`exclusion '${exclusion.id}' needs facets.`);
        for (const facet of exclusion.facets) {
            if (!Object.hasOwn(graph.facets, facet)) fail(`exclusion '${exclusion.id}' names an unknown facet.`);
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
    const conflictRules = [...graph.conflicts ?? []].map(rule => ({...rule, labels: ordered(rule.labels)}))
        .sort((left, right) => compare(left.id, right.id));
    const exclusionRules = [...graph.exclusions ?? []].sort((left, right) => compare(left.id, right.id));
    const normalizeTrigger = (trigger: DependencyTrigger): unknown => {
        if ('any' in trigger || 'all' in trigger) {
            const selector = 'any' in trigger ? 'any' : 'all';
            const children = 'any' in trigger ? trigger.any : trigger.all;
            return {[selector]: children.map(normalizeTrigger)
                .sort((left, right) => compare(JSON.stringify(left), JSON.stringify(right)))};
        }
        if ('familyWithin' in trigger) return {familyWithin: {
            family: trigger.familyWithin.family, root: trigger.familyWithin.root,
            ...(trigger.familyWithin.ignore ? {ignore: ordered(trigger.familyWithin.ignore)} : {})
        }};
        if ('areaWithin' in trigger && typeof trigger.areaWithin !== 'string') return {areaWithin: {
            root: trigger.areaWithin.root,
            ...(trigger.areaWithin.ignore ? {ignore: ordered(trigger.areaWithin.ignore)} : {})
        }};
        return trigger;
    };
    const triggerRoots = (trigger: DependencyTrigger): string[] => 'areaWithin' in trigger
        ? typeof trigger.areaWithin === 'string' ? [trigger.areaWithin] : [trigger.areaWithin.root, ...trigger.areaWithin.ignore ?? []]
        : 'familyWithin' in trigger ? [trigger.familyWithin.root, ...trigger.familyWithin.ignore ?? []]
            : 'any' in trigger ? trigger.any.flatMap(triggerRoots)
                : 'all' in trigger ? trigger.all.flatMap(triggerRoots) : [];
    const relevant = new Set([...areaLabels, ...graph.context.allAreasWithin,
        ...[...families.values()].flatMap(labels => [...labels]),
        ...Object.values(graph.facets).flatMap(facet => 'root' in facet ? [facet.root] : [...facet.labels]),
        ...[...rules, ...exclusionRules].flatMap(rule => triggerRoots(rule.when))]);
    const policyHash = digestIdentity({
        evaluatorVersion: EVALUATOR_VERSION,
        graph: {
            version: graph.version,
            context: {allAreasWithin: ordered(graph.context.allAreasWithin), requireArea: true},
            facets: Object.keys(graph.facets).sort().map(name => {
                const facet = graph.facets[name];
                return {name, selector: 'root' in facet ? {root: facet.root} : {labels: ordered(facet.labels)},
                    check: facet.check ?? 'annotation-presence'};
            }),
            rules: rules.map(rule => ({id: rule.id, when: normalizeTrigger(rule.when), assess: ordered(rule.assess)})),
            conflicts: conflictRules.map(rule => ({id: rule.id, facet: rule.facet, labels: ordered(rule.labels)})),
            exclusions: exclusionRules.map(rule => ({id: rule.id, when: normalizeTrigger(rule.when), facets: ordered(rule.facets)}))
        },
        ontology: ordered([...relevant]).map(label => ({
            descriptor: context.lookupDescriptor(label),
            assertions: [...context.authoredAssertions(label)].sort((left, right) => compare(JSON.stringify(left), JSON.stringify(right))),
            eligibility: context.inspectLabel(label),
            ancestry: ordered([...ancestry.get(label)!]),
            capabilities: ordered([...capabilityAncestors.get(label)!])
        }))
    });

    const evaluate = (inputLabels: readonly string[], resolvedAreas: readonly string[] = []): LabelDependencyEvaluation => {
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
        if (status === 'invalid_context') return {context: resultContext, errors: ordered(errors), triggers: [], assessments: [], conflicts: []};
        const selected = new Map([...families].map(([name, members]) => [name, labels.filter(label => members.has(label))]));

        const triggerResult = (trigger: DependencyTrigger): Omit<DependencyTriggerResult, 'ruleId'> => {
            if ('family' in trigger) {
                const found = selected.get(trigger.family)!;
                return {status: found.length ? 'present' : 'absent', labels: found};
            }
            if ('areaWithin' in trigger) {
                const within = trigger.areaWithin;
                const root = typeof within === 'string' ? within : within.root;
                const ignore = typeof within === 'string' ? [] : within.ignore ?? [];
                const found = areas.filter(area => ancestry.get(area)!.has(root)
                    && !ignore.some(ignored => ancestry.get(area)!.has(ignored)));
                return {status: found.length ? 'present' : 'absent', labels: found};
            }
            if ('familyWithin' in trigger) {
                const {family, root, ignore = []} = trigger.familyWithin;
                const found = selected.get(family)!.filter(label => !ignore.some(ignored => ancestry.get(label)!.has(ignored)));
                return {status: found.length && found.every(label => ancestry.get(label)!.has(root)) ? 'present' : 'absent',
                    labels: found};
            }
            const children = ('any' in trigger ? trigger.any : trigger.all).map(triggerResult);
            return {
                status: ('any' in trigger ? children.some(child => child.status === 'present')
                    : children.every(child => child.status === 'present')) ? 'present' : 'absent',
                labels: ordered(children.flatMap(child => child.labels))
            };
        };

        const activeExclusions = exclusionRules.filter(rule => triggerResult(rule.when).status === 'present');
        const excludedFacets = new Set(activeExclusions.flatMap(rule => rule.facets));
        const exclusionConflicts = activeExclusions.flatMap(rule => ordered(rule.facets).flatMap(facet => {
            const current = selected.get(facet)!;
            return current.length ? [{ruleId: rule.id, facet, labels: current,
                reason: 'This annotation family is excluded in the resolved Area context.'}] : [];
        }));
        if (status === 'outside_policy_scope') return {context: resultContext, errors: [], triggers: [], assessments: [], conflicts: exclusionConflicts};

        const assessAnnotation = (ruleId: string, facet: string): DependencyAssessment => {
            const current = selected.get(facet)!;
            return {ruleId, facet, labels: current,
                status: current.length ? 'satisfied' : 'missing',
                reason: graph.facets[facet].check === 'presence-only'
                    ? current.length ? 'Range facet is present under existing semantics; no bounds were calculated.'
                        : 'Missing range facet under existing semantics; no replacement bounds were calculated.'
                    : current.length ? 'A label from the required annotation family is present.'
                        : 'No label from the required annotation family is present.'};
        };
        const triggers = rules.map(rule => ({ruleId: rule.id, ...triggerResult(rule.when)}));
        const assessments = triggers.flatMap((trigger, index) => trigger.status === 'present'
            ? ordered(rules[index].assess).filter(facet => !excludedFacets.has(facet))
                .map(facet => assessAnnotation(trigger.ruleId, facet)) : []);
        const conflicts = conflictRules.flatMap(rule => {
            const choices = rule.labels.filter(candidate => selected.get(rule.facet)!.some(label => capabilityAncestors.get(label)!.has(candidate)));
            return choices.length < 2 ? [] : [{ruleId: rule.id, facet: rule.facet,
                labels: selected.get(rule.facet)!.filter(label => choices.some(candidate => capabilityAncestors.get(label)!.has(candidate))),
                reason: 'Mutually exclusive annotation claims are present together.'}];
        });
        return {context: resultContext, errors: ordered(errors), triggers, assessments, conflicts: [...conflicts, ...exclusionConflicts]};
    };
    return {policyHash, evaluate};
}
