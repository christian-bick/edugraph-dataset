import { CompetencyTarget, GeneratorInput } from "../types/ml-engine.ts";

/**
 * Maps a builder's permutations to competency targets with indexed ids
 * (e.g. `K.CC.B.5-how-many-0`, `K.CC.B.5-how-many-1`, ...).
 */
export function toTargets(idPrefix: string, builder: DatasetPermutationBuilder): CompetencyTarget[] {
    return builder.build().map((p, i) => ({
        id: `${idPrefix}-${i}`,
        labels: p.labels,
        constraints: p.constraints
    }));
}

export default class DatasetPermutationBuilder {
    private permutations: GeneratorInput[] = [{ labels: [], constraints: {} }];

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
     * Adds a fixed set of constraints to all current permutations.
     */
    addConstraints(constraints: Record<string, any>): this {
        for (const p of this.permutations) {
            p.constraints = { ...p.constraints, ...constraints };
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
                    labels: [...new Set([...p.labels, ...variantLabels])],
                    constraints: { ...p.constraints }
                });
            }
        }
        this.permutations = newPermutations;
        return this;
    }

    /**
     * Creates a cross-product of the current permutations with a technical constraint variant.
     */
    applyConstraintVariants(key: string, values: any[]): this {
        const newPermutations: GeneratorInput[] = [];
        for (const p of this.permutations) {
            for (const value of values) {
                newPermutations.push({
                    labels: [...p.labels],
                    constraints: { ...p.constraints, [key]: value }
                });
            }
        }
        this.permutations = newPermutations;
        return this;
    }

    /**
     * Creates a cross-product with a range for technical constraints.
     */
    applyConstraintRange(keys: string[], range: [number, number]): this {
        const newPermutations: GeneratorInput[] = [];
        if (range[0] > range[1]) return this;

        for (const p of this.permutations) {
            for (let i = range[0]; i <= range[1]; i++) {
                const rangeConstraints: Record<string, any> = {};
                for (const key of keys) {
                    rangeConstraints[key] = i;
                }
                newPermutations.push({
                    labels: [...p.labels],
                    constraints: { ...p.constraints, ...rangeConstraints }
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
