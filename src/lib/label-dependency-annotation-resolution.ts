import type {GenerationPlan} from '../types/compatibility.ts';
import type {AnyModuleSpec} from '../types/module-spec.ts';
import type {ConfigSchema} from '../types/schema.ts';
import type {DependencyAuditSelection} from './label-dependency-audit.ts';
import {assertInferredPairOwnership, resolveInferredLabels} from './inferred-labels.ts';
import {validateInferredLabelDeclarations} from './label-contracts.ts';
import {resolveStaticSchemaChoices} from './static-schema-resolution.ts';

type Owner = 'generator' | 'view';
type Model = {schema?: ConfigSchema; spec?: AnyModuleSpec};
const ordered = (labels: readonly string[]) => [...new Set(labels)].sort();
const message = (error: unknown) => error instanceof Error ? error.message : String(error);

export type DependencyAuditAnnotationResolution =
    | {status: 'not_required'}
    | {status: 'pending'; owners: {owner: Owner; fields: string[]; reason: string}[]}
    | {status: 'invalid'; reason: string}
    | {status: 'exhaustive'; outcome: {
        parentSelectionId: string;
        configurations: Partial<Record<Owner, Record<string, unknown>>>;
        inferredLabels: string[];
        labels: string[];
    }};

/** Proves singleton configuration outcomes; advertised outputs never become annotations. */
export function resolveDependencyAuditAnnotation(input: {
    id: string; plan: GenerationPlan; selection: DependencyAuditSelection;
    generator?: Model; view?: Model;
}): {labels: string[]; declaredLabels?: string[]; annotationResolution: DependencyAuditAnnotationResolution; issues?: string[]} {
    const declaredLabels = ordered(input.selection.labels);
    try {
        for (const owner of ['generator', 'view'] as const) {
            const errors = validateInferredLabelDeclarations(input[owner]?.spec?.inferredLabels, owner);
            if (errors.length) throw new Error(errors.join('\n'));
        }
        const active = (['generator', 'view'] as const).filter(owner => input[owner]?.spec?.inferredLabels?.length);
        if (!active.length) return {labels: declaredLabels, annotationResolution: {status: 'not_required'}};
        assertInferredPairOwnership({generatorSpec: input.generator?.spec, viewSpec: input.view?.spec,
            generatorSchema: input.generator?.schema ?? {}, viewSchema: input.view?.schema ?? {}});
        const resolutions = active.map(owner => {
            const schema = input[owner]!.schema ?? {};
            const bindings = Object.fromEntries(input.selection.choices.filter(choice => choice.owner === owner).map(choice => {
                const domain = input.plan.domains.find(item => item.owner === owner && item.field === choice.field)!;
                return [choice.field, domain.alternatives.find(alternative => alternative.id === choice.alternativeId)!.labels];
            }));
            return {owner, schema, resolved: resolveStaticSchemaChoices(schema, input.plan.targetLabels, bindings)};
        });
        const pending = resolutions.flatMap(({owner, resolved}) => resolved.status === 'pending'
            ? [{owner, fields: resolved.fields, reason: resolved.reason}] : []);
        if (pending.length) return {labels: declaredLabels, declaredLabels,
            annotationResolution: {status: 'pending', owners: pending}};
        const configurations: Partial<Record<Owner, Record<string, unknown>>> = {};
        const additions: string[] = [];
        for (const {owner, schema, resolved} of resolutions) {
            if (resolved.status !== 'resolved') throw new Error('Unresolved configuration reached exhaustive inference.');
            configurations[owner] = structuredClone(resolved.config);
            const invariantLabels = owner === 'generator' ? input.plan.generatorLabels : input.plan.viewLabels;
            const ownerLabels = [...invariantLabels, ...resolved.resolvedLabels];
            additions.push(...resolveInferredLabels({spec: input[owner]!.spec, schema, config: resolved.config,
                labels: ownerLabels, owner}));
        }
        const labels = ordered([...declaredLabels, ...additions]);
        return {labels, declaredLabels, annotationResolution: {status: 'exhaustive', outcome: {
            parentSelectionId: input.id, configurations, labels,
            inferredLabels: labels.filter(label => !declaredLabels.includes(label))
        }}};
    } catch (error) {
        const reason = message(error);
        return {labels: declaredLabels, declaredLabels, annotationResolution: {status: 'invalid', reason}, issues: [reason]};
    }
}
