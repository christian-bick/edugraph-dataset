import type {CompetencyTarget} from '../types/ml-engine.ts';
import type {GeneratorSpec} from '../types/generator-spec.ts';
import type {ViewSpec} from '../types/view-spec.ts';
import type {ConfigSchema} from '../types/schema.ts';
import type {CompatibilityPlanningResult} from '../types/compatibility.ts';
import {planCompatibility} from './compatibility.ts';
import {normalizeSchemaChoices} from './schema-choices.ts';

export interface GeneratorChoiceModel {
    generatorId: string;
    generalLabels: readonly string[];
    schema?: ConfigSchema;
    spec: GeneratorSpec;
}

export interface ViewChoiceModel {
    viewId: string;
    generalLabels: readonly string[];
    schema: ConfigSchema;
    spec: ViewSpec;
}

/**
 * Plans the label stage after strict payload-family and positive capability matching.
 * The caller owns the complete source/ontology identity used for persistent reuse.
 * This adapter does not import generator or renderer implementations.
 */
export function planModelCompatibility(
    target: CompetencyTarget, generator: GeneratorChoiceModel, view: ViewChoiceModel,
    inputHash?: string
): CompatibilityPlanningResult {
    return planCompatibility({
        identity: {targetId: target.id, generatorId: generator.generatorId, viewId: view.viewId},
        inputHash,
        targetLabels: target.labels,
        generatorLabels: generator.generalLabels,
        viewLabels: view.generalLabels,
        fields: [
            ...normalizeSchemaChoices(generator.schema ?? {}, target.labels, 'generator'),
            ...normalizeSchemaChoices(view.schema, target.labels, 'view')
        ],
        generatorRules: generator.spec.compatibility,
        viewRules: view.spec.compatibility
    });
}
