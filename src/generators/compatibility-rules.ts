import type {GeneratorCompatibilityRule, GeneratorLabelScope} from '../types/compatibility.ts';

type LabelSelection = (label: string) => boolean;

const labelRule = (
    id: string, scope: GeneratorLabelScope, dependencies: readonly string[],
    predicate: (selected: LabelSelection) => boolean
): GeneratorCompatibilityRule => ({
    id,
    dependencies: [...new Set(dependencies)].map(label => ({scope, label})),
    predicate: labels => predicate(label => labels.exact(scope, label))
});

/** Config guards use the exact semantic alternatives declared by the generator schema. */
export const generatorLabelRule = (
    id: string, dependencies: readonly string[], predicate: (selected: LabelSelection) => boolean
): GeneratorCompatibilityRule => labelRule(id, 'generator', dependencies, predicate);

/** Original-request guards are reserved for resolver behavior that explicitly reads the target. */
export const targetLabelRule = (
    id: string, dependencies: readonly string[], predicate: (selected: LabelSelection) => boolean
): GeneratorCompatibilityRule => labelRule(id, 'target', dependencies, predicate);
