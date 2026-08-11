import {
    CompetencyTarget,
    GeneratorInput,
    Implementation,
    ImplementationStrategy,
    ImplementationTodo,
    ModuleImplementation
} from "../types/ml-engine.ts";
import { labelSetHash } from "./utils.ts";

/**
 * Maps a builder's permutations to competency targets with content-derived
 * ids: `<idPrefix>~<labelSetHash>` (e.g. `K.CC.B.5-how-many~a3f91c2e`).
 * Because the suffix hashes the permutation's own label set instead of its
 * position, inserting, reordering or removing variants in a builder never
 * changes the id — and thus the seeds and cached samples — of the untouched
 * permutations. Two permutations with identical label sets would collide on
 * the same id; spec validation flags that as a duplicate-ID error.
 */
export function toTargets(idPrefix: string, builder: DatasetPermutationBuilder, explanation?: string): CompetencyTarget[] {
    return builder.build().map(p => ({
        id: `${idPrefix}~${labelSetHash(p.labels)}`,
        labels: p.labels,
        ...(explanation ? { explanation } : {})
    }));
}

const IMPLEMENTATION_STRATEGIES = new Set<ImplementationStrategy>(['reuse', 'expand', 'new']);

function normalizeModules(
    implementationId: string,
    role: 'generator' | 'view',
    modules: readonly ModuleImplementation[]
): ModuleImplementation[] {
    if (!Array.isArray(modules) || modules.length === 0) {
        throw new Error(`Implementation "${implementationId}" must declare at least one ${role}.`);
    }

    const normalized = modules.map(({ module, strategy }) => {
        const normalizedModule = module.trim();
        if (normalizedModule === '') {
            throw new Error(`Implementation "${implementationId}" has an empty ${role} module.`);
        }
        if (!IMPLEMENTATION_STRATEGIES.has(strategy)) {
            throw new Error(
                `Implementation "${implementationId}" ${role} "${normalizedModule}" has invalid strategy "${strategy}".`
            );
        }
        return { module: normalizedModule, strategy };
    });

    if (new Set(normalized.map(item => item.module)).size !== normalized.length) {
        throw new Error(`Implementation "${implementationId}" declares a duplicate ${role} module.`);
    }
    return normalized;
}

/** Defines one reviewed implementation package independently of its target permutations. */
export function defineImplementation(implementation: Implementation): Implementation {
    const id = implementation.id.trim();
    const description = implementation.description.trim();
    if (id === '') throw new Error('Implementation id must not be empty.');
    if (description === '') throw new Error(`Implementation "${id}" description must not be empty.`);

    return {
        id,
        description,
        generators: normalizeModules(id, 'generator', implementation.generators),
        views: normalizeModules(id, 'view', implementation.views)
    };
}

/** Maps a competency builder to target TODOs that reference one implementation package. */
export function toImplementationTodos(
    idPrefix: string,
    builder: DatasetPermutationBuilder,
    implementation: Implementation,
    explanation?: string
): ImplementationTodo[] {
    return toTargets(idPrefix, builder, explanation).map(target => ({ ...target, implementation }));
}

export default class DatasetPermutationBuilder {
    private permutations: GeneratorInput[] = [{ labels: [] }];

    /**
     * Adds a fixed set of labels to all current permutations.
     */
    addLabels(labels: string[]): this {
        for (const p of this.permutations) {
            p.labels = [...new Set([...p.labels, ...labels])];
        }
        return this;
    }

    /**
     * Creates a cross-product of the current permutations with alternative label groups.
     * Labels within one group are conjunctive; successive calls multiply dimensions.
     * e.g. .applyLabelVariants([[Area.Addition], [Area.Subtraction]])
     */
    applyLabelVariants(variants: string[][]): this {
        const newPermutations: GeneratorInput[] = [];
        for (const p of this.permutations) {
            for (const variantLabels of variants) {
                newPermutations.push({
                    labels: [...new Set([...p.labels, ...variantLabels])]
                });
            }
        }
        this.permutations = newPermutations;
        return this;
    }

    /**
     * Returns the final list of GeneratorInputs.
     */
    build(): GeneratorInput[] {
        return this.permutations;
    }
}
