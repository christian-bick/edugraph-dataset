import { CompetencyTarget, GeneratorInput } from "../types/ml-engine.ts";
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
