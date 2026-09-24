import type {GenerationPlan, GenerationSelectionReceipt} from '../types/compatibility.ts';
import type {ConfigSchema} from '../types/schema.ts';
import type {ProblemGenerator, ResolvedProblemStub} from '../types/ml-engine.ts';
import type {GenerationReplay, PreparedViewConfiguration} from '../types/generation-plan.ts';
import {CompatibilityContractError, createGenerationSelectionReceipt, sampleGenerationPlan, validateGenerationPlan,
    validateGenerationSelectionReceipt} from './compatibility.ts';
import {resolveSchemaChoices, type SchemaChoiceSelection} from './schema-choices.ts';
import {getRandomState, random, setRandomState, setSeed} from './random.ts';

export interface PlannedGenerationDraw {
    stub: ResolvedProblemStub | null;
    view: PreparedViewConfiguration;
    replay: GenerationReplay;
    labels: string[];
}

/** Converts a checked joint receipt to private, owner-local field bindings. */
export function bindingsForSelection(plan: GenerationPlan, selection: GenerationSelectionReceipt): {
    generator: SchemaChoiceSelection; view: SchemaChoiceSelection
} {
    validateGenerationSelectionReceipt(plan, selection);
    const domains = new Map(plan.domains.map(domain => [JSON.stringify([domain.owner, domain.field]), domain]));
    const bindings: {generator: Record<string, readonly string[]>; view: Record<string, readonly string[]>} = {generator: {}, view: {}};
    for (const choice of selection.choices) {
        const domain = domains.get(JSON.stringify([choice.owner, choice.field]))!;
        bindings[choice.owner][choice.field] = domain.alternatives.find(alternative => alternative.id === choice.alternativeId)!.labels;
    }
    return bindings;
}

/** Resolves both configurations before generating any data; no payload participates in eligibility. */
export function resolvePlannedConfigurations(input: {
    generatorSchema: ConfigSchema;
    viewSchema: ConfigSchema;
    plan: GenerationPlan;
    sampleKey: string;
    attempt: number;
    seed: number;
    replay?: GenerationReplay;
}) {
    const {generatorSchema, viewSchema, sampleKey, attempt, seed} = input;
    const plan = validateGenerationPlan(input.plan);
    const keyParts = sampleKey.split('#');
    if (keyParts.length !== 6 || keyParts[0] !== plan.identity.targetId
        || keyParts[1] !== plan.identity.generatorId || keyParts[2] !== plan.identity.viewId) {
        throw new CompatibilityContractError('Generation plan does not belong to this sample slot.');
    }
    if (!Number.isSafeInteger(attempt) || attempt < 1 || !Number.isSafeInteger(seed) || seed < 0) {
        throw new CompatibilityContractError('A planned draw requires a valid attempt and seed.');
    }
    const replay = input.replay;
    if (replay && (replay.version !== 1 || replay.sampleKey !== sampleKey
        || replay.attempt !== attempt || replay.seed !== seed)) {
        throw new CompatibilityContractError('Recorded generation origin does not match the requested draw.');
    }
    // Choice entropy is separate from mathematical and presentation entropy. A
    // changed choice count must not consume a different number of operand draws.
    setSeed(`label-variant:${seed}`);
    const selection = replay?.selection ?? sampleGenerationPlan(plan, random);
    const bindings = bindingsForSelection(plan, selection);
    setSeed(seed);
    const viewConfig = resolveSchemaChoices(viewSchema, plan.targetLabels, bindings.view);
    const view: PreparedViewConfiguration = {
        version: 1, viewId: plan.identity.viewId, planHash: plan.hash, variantHash: selection.variantHash,
        config: viewConfig.config, labels: viewConfig.resolvedLabels, randomState: getRandomState()
    };
    setSeed(seed);
    const generatorConfig = resolveSchemaChoices(generatorSchema, plan.targetLabels, bindings.generator);
    return {
        generatorConfig: generatorConfig.config,
        generatorLabels: generatorConfig.resolvedLabels,
        generatorRandomState: getRandomState(),
        view,
        labels: [...new Set([...plan.generatorLabels, ...generatorConfig.resolvedLabels,
            ...plan.viewLabels, ...viewConfig.resolvedLabels])].sort(),
        replay: {version: 1 as const, sampleKey, attempt, seed, selection}
    };
}

export function generatePlannedDraw(input: {
    generator: ProblemGenerator;
    viewSchema: ConfigSchema;
    plan: GenerationPlan;
    sampleKey: string;
    attempt: number;
    seed: number;
    replay?: GenerationReplay;
}): PlannedGenerationDraw {
    const resolved = resolvePlannedConfigurations({...input, generatorSchema: input.generator.schema});
    setRandomState(resolved.generatorRandomState);
    const stub = input.generator.generate(resolved.generatorConfig);
    return {stub: stub ? {...stub, labels: resolved.generatorLabels} : null,
        view: resolved.view, labels: resolved.labels, replay: resolved.replay};
}

/** A deduplicated artifact may represent another target only with the same realized bindings. */
export function selectionAdmittedByPlan(
    plan: GenerationPlan, sourcePlan: GenerationPlan, sourceSelection: GenerationSelectionReceipt
): GenerationSelectionReceipt | null {
    validateGenerationPlan(plan);
    if (plan.identity.generatorId !== sourcePlan.identity.generatorId || plan.identity.viewId !== sourcePlan.identity.viewId
        || JSON.stringify(plan.generatorLabels) !== JSON.stringify(sourcePlan.generatorLabels)
        || JSON.stringify(plan.viewLabels) !== JSON.stringify(sourcePlan.viewLabels)) return null;
    const sourceBindings = bindingsForSelection(sourcePlan, sourceSelection);
    const byField = new Map(sourcePlan.domains.map(domain => [JSON.stringify([domain.owner, domain.field]), domain]));
    const choices = plan.domains.map(domain => {
        if (!byField.has(JSON.stringify([domain.owner, domain.field]))) return null;
        const labels = sourceBindings[domain.owner][domain.field];
        const alternative = domain.alternatives.find(item => JSON.stringify(item.labels) === JSON.stringify(labels));
        return alternative ? {owner: domain.owner, field: domain.field, alternativeId: alternative.id} : null;
    });
    if (choices.some(choice => choice === null) || choices.length !== sourceSelection.choices.length) return null;
    try {
        return createGenerationSelectionReceipt(plan, choices.filter(choice => choice !== null));
    } catch (error) {
        if (error instanceof CompatibilityContractError) return null;
        throw error;
    }
}
