import { CompetencyTarget, GeneratorInput } from "../types/ml-engine.ts";

/**
 * Maps a builder's permutations to competency targets with indexed ids
 * (e.g. `K.CC.B.5-how-many-0`, `K.CC.B.5-how-many-1`, ...).
 */
export function toTargets(idPrefix: string, builder: DatasetPermutationBuilder, explanation?: string): CompetencyTarget[] {
    return builder.build().map((p, i) => ({
        id: `${idPrefix}-${i}`,
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
     * Creates a cross-product of the current permutations with a set of mutually exclusive labels.
     * e.g. .applyLabelVariants([Area.Add, Area.Sub])
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
