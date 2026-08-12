export type TaskType = 'DATASET_ENRICHMENT' | 'ONTOLOGY_EXTENSION' | 'ANALYSIS';
export type MainTab = 'explorer' | 'backlog';
export type DataView = 'latest' | 'preview';
export type AssetSource = 'released' | 'local';

export interface CoverageManifest {
    schema_version: number;
    channel: DataView;
    source_ref: string;
    source_sha: string;
    generated_at: string;
    ontology_version: string;
}

export interface StandardNode {
    id: string;
    description: string;
    source?: string;
    level: string;
    cluster_type?: string;
    aspects: string[];
    parent?: string;
    children?: string[];
    connections?: Record<string, string[]>;
    modeling: boolean;
}

export interface TreeStandard {
    id: string;
    description: string;
    aspects: string[];
    modeling: boolean;
    subStandards: Omit<TreeStandard, 'subStandards'>[];
}

export interface Cluster {
    id: string;
    description: string;
    cluster_type: string;
    standards: TreeStandard[];
}

export interface Domain {
    id: string;
    name: string;
    clusters: Cluster[];
}

export interface DomainGroup {
    description: string;
    domains: Record<string, Domain>;
}

export type GradesTree = Record<string, Record<string, DomainGroup>>;

export interface StandardsTreeData {
    tree: GradesTree;
    standardsMap: Record<string, StandardNode>;
}

export interface ImplementationTodo {
    id: string;
    labels: string[];
    explanation: string;
    implementation: Implementation;
}

export type ImplementationStrategy = 'reuse' | 'expand' | 'new';

export interface ModuleImplementation {
    module: string;
    strategy: ImplementationStrategy;
}

export interface Implementation {
    id: string;
    description: string;
    generators: ModuleImplementation[];
    views: ModuleImplementation[];
}

export interface NamedTodo {
    title: string;
    description: string;
}

export interface StandardCoverage {
    id: string;
    spec_covered: boolean;
    ontology_covered: boolean;
    competencies: string[][];
    implementation_todos: ImplementationTodo[];
    ontology_todos: NamedTodo[];
    beyond_scope: NamedTodo[];
    fully_beyond_scope: boolean;
    partially_beyond_scope: boolean;
    matched_areas: string[];
    matched_scopes: string[];
    matched_abilities: string[];
    reasoning: string;
    suggested_task: NamedTodo | null;
    dataset_covered: boolean;
    generator_module: string | null;
    cluster_id: string;
}

export interface CoverageMetadata {
    generated_at: string;
    ontology_version: string;
    total_leaves_scanned: number;
    spec_covered_count: number;
    covered_count: number;
    missing_generator_count: number;
    missing_ontology_count: number;
    analysis_needed_count: number;
    beyond_scope_count: number;
    fully_beyond_scope_count: number;
}

export interface BacklogTask {
    id: string;
    type: TaskType;
    cluster_id: string;
    cluster_description: string;
    title: string;
    description: string;
    standards: string[];
    implementation?: Implementation;
}

export interface CoverageData {
    metadata: CoverageMetadata;
    coverage: Record<string, StandardCoverage>;
    tasks: BacklogTask[];
}

export interface ExplorerData {
    gradesTree: GradesTree;
    standardsMap: Record<string, StandardNode>;
    coverageData: CoverageData | null;
    coverageManifest: CoverageManifest | null;
}
