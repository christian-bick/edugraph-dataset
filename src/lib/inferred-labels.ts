import type {ModuleSpec, AnyModuleSpec} from '../types/module-spec.ts';
import type {ConfigFromSchema, ConfigSchema} from '../types/schema.ts';
import {labelContractIndex, ResolvedLabelContractError, validateInferredLabelDeclarations} from './label-contracts.ts';
import {withoutRandomness} from './random.ts';
import {inspectPositiveOwnership} from './spec-ownership.ts';

/** Inference contract failures bypass mathematical retries and fallback publication. */
export class InferredLabelContractError extends ResolvedLabelContractError {}

/** Check actual role declarations before either owner's inference or value resolution. */
export function assertInferredPairOwnership(input: {
    generatorSpec?: AnyModuleSpec;
    viewSpec?: AnyModuleSpec;
    generatorSchema: ConfigSchema;
    viewSchema: ConfigSchema;
}): void {
    const {generatorSpec, viewSpec, generatorSchema, viewSchema} = input;
    const declarationErrors = [
        ...validateInferredLabelDeclarations(generatorSpec?.inferredLabels, 'generator'),
        ...validateInferredLabelDeclarations(viewSpec?.inferredLabels, 'view')
    ];
    if (declarationErrors.length) throw new InferredLabelContractError(declarationErrors.join('\n'));
    if (!generatorSpec?.inferredLabels?.length && !viewSpec?.inferredLabels?.length) return;
    const issues = inspectPositiveOwnership({modules: [
        {role: 'generator', module_id: 'generator', generalLabels: generatorSpec?.generalLabels ?? [],
            schema: generatorSchema, inferredLabels: generatorSpec?.inferredLabels},
        {role: 'view', module_id: 'view', generalLabels: viewSpec?.generalLabels ?? [],
            schema: viewSchema, inferredLabels: viewSpec?.inferredLabels}
    ], pairs: [{generatorId: 'generator', viewId: 'view'}]});
    if (issues.length) throw new InferredLabelContractError(issues.map(issue => issue.message).join('\n'));
}

/** Snapshot only plain configuration data, and detect attempted writes even when caught. */
function readonlyConfiguration(value: unknown, violation: () => never, ancestors = new Set<object>()): unknown {
    if (value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value)) return value;
    if (typeof value !== 'object' || ancestors.has(value)) throw new Error('Inference configuration must be acyclic plain data.');
    if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) {
        throw new Error('Inference configuration must contain only plain objects and arrays.');
    }
    const next = new Set(ancestors).add(value);
    const copy: Record<string, unknown> | unknown[] = Array.isArray(value) ? new Array(value.length) : {};
    for (const key of Object.keys(value)) {
        const property = Object.getOwnPropertyDescriptor(value, key)!;
        if (!('value' in property)) throw new Error('Inference configuration cannot contain accessors.');
        Object.defineProperty(copy, key, {value: readonlyConfiguration(property.value, violation, next),
            enumerable: true, configurable: true, writable: true});
    }
    return new Proxy(copy, {set: violation, deleteProperty: violation, defineProperty: violation, setPrototypeOf: violation,
        preventExtensions: violation});
}

/** Resolve independent, authored annotation rules from complete configuration, never from a draw. */
export function resolveInferredLabels<TSchema extends ConfigSchema>(input: {
    spec?: ModuleSpec<TSchema>;
    schema: TSchema;
    config: ConfigFromSchema<TSchema>;
    labels: readonly string[];
    owner: 'generator' | 'view';
}): string[] {
    const {spec, schema, config, labels, owner} = input;
    if (spec?.inferredLabels === undefined) return [...new Set(labels)];
    const fail = (message: string): never => {throw new InferredLabelContractError(`${owner} inferredLabels: ${message}`);};
    const declarationErrors = validateInferredLabelDeclarations(spec.inferredLabels, owner);
    if (declarationErrors.length) fail(declarationErrors.join('\n'));
    const ownership = inspectPositiveOwnership({modules: [{role: owner, module_id: owner,
        generalLabels: spec.generalLabels, schema, inferredLabels: spec.inferredLabels}], pairs: []});
    if (ownership.length) fail(ownership.map(issue => issue.message).join('\n'));
    if (!spec.inferredLabels.length) return [...new Set(labels)];
    if (!config || typeof config !== 'object' || Array.isArray(config)) fail('Configuration must be a complete object.');
    const missing = Object.keys(schema).filter(field => !Object.hasOwn(config, field));
    if (missing.length) fail(`Configuration is unresolved: ${missing.join(', ')}.`);
    let mutationAttempted = false;
    const mutation = (): never => {mutationAttempted = true; return fail('Configuration mutation is forbidden.');};
    try {
        const snapshot = readonlyConfiguration(config, mutation) as Parameters<NonNullable<typeof spec.inferredLabels>[number]['infer']>[0];
        const additions: string[] = [];
        for (const [index, rule] of spec.inferredLabels.entries()) {
            if (rule.infer.constructor.name === 'AsyncFunction') fail(`Rule ${index} must be synchronous.`);
            const result = withoutRandomness(() => rule.infer(snapshot));
            if (mutationAttempted) fail('Configuration mutation was attempted.');
            if (!Array.isArray(result) || result.some(label => typeof label !== 'string')) fail(`Rule ${index} must return a label array.`);
            for (const label of result) {
                if (!rule.produces.includes(label)) fail(`Rule ${index} returned undeclared label '${label}'.`);
            }
            const errors = labelContractIndex.validate(result, `${owner}.inferredLabels[${index}]`);
            if (errors.length) fail(errors.join('\n'));
            additions.push(...result);
        }
        return [...new Set([...labels, ...additions])];
    } catch (error) {
        if (error instanceof InferredLabelContractError) throw error;
        return fail(error instanceof Error ? error.message : String(error));
    }
}
