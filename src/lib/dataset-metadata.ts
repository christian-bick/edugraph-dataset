import type {GenerationPlan, GenerationSelectionReceipt} from '../types/compatibility.ts';
import type {GenerationReplay, PreparedViewConfiguration} from '../types/generation-plan.ts';

/** Serializable metadata shared by the dataset pipeline and the asset explorer. */
export interface TargetAssociation {
    spec: string;
    target_id: string;
    generation_plan_hash?: string;
    generation_plan?: GenerationPlan;
    selection?: GenerationSelectionReceipt;
}

export interface MetadataRow {
    file_name: string;
    sample_key: string;
    spec: string;
    target_id: string;
    generator: string;
    view: string;
    mode: string;
    instance: number;
    /** Mathematical payload identity, independent of presentation. */
    content_fingerprint: string;
    /** Rendered-task identity: mathematical payload plus resolved view config. */
    task_fingerprint: string;
    /** Additional target permutations represented by the same physical sample. */
    target_associations?: TargetAssociation[];
    /** Shortened ontology labels, as written by the pipeline. */
    labels?: string[];
    generation_plan_hash?: string;
    generation_plan?: GenerationPlan;
    generation_replay?: GenerationReplay;
    prepared_view?: PreparedViewConfiguration;
    [key: string]: unknown;
}

/** Returns the primary target and every deduplicated target associated with a physical row. */
export function rowTargetAssociations(row: MetadataRow): TargetAssociation[] {
    const associationKey = ({spec, target_id}: TargetAssociation): string => `${spec}\0${target_id}`;
    const associations = new Map<string, TargetAssociation>();
    const primary: TargetAssociation = {spec: row.spec, target_id: row.target_id,
        ...(row.generation_plan ? {generation_plan_hash: row.generation_plan.hash,
            generation_plan: row.generation_plan, selection: row.generation_replay?.selection} : {})};
    associations.set(associationKey(primary), primary);
    for (const association of row.target_associations ?? []) {
        associations.set(associationKey(association), association);
    }
    return [...associations.values()].sort((left, right) =>
        left.spec.localeCompare(right.spec) || left.target_id.localeCompare(right.target_id));
}
