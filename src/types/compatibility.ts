/** Semantic scopes deliberately expose no foreign configuration parameter names. */
export type LabelScope = 'target' | 'generator' | 'view';
export type GeneratorLabelScope = Exclude<LabelScope, 'view'>;

export interface LabelDependency<TScope extends LabelScope = LabelScope> {
    readonly scope: TScope;
    readonly label: string;
}

export interface CompatibilityQueries<TScope extends LabelScope = LabelScope> {
    /** Equality or ontology specialization, in the capability-to-request direction. */
    has(scope: TScope, label: string): boolean;
    exact(scope: TScope, label: string): boolean;
}

export interface CompatibilityRule<TScope extends LabelScope = LabelScope> {
    readonly id: string;
    readonly description?: string;
    /** Omission conservatively depends on all permitted scopes; [] means no queries. */
    readonly dependencies?: readonly LabelDependency<TScope>[];
    readonly predicate: (labels: CompatibilityQueries<TScope>) => boolean;
    /** Helper-authored audit metadata; never provides capabilities or adds a matching stage. */
    readonly targetPolicy?: {readonly kind: 'require' | 'reject'; readonly labels: readonly string[]};
}

export type GeneratorCompatibilityRule = CompatibilityRule<GeneratorLabelScope>;
export type ViewCompatibilityRule = CompatibilityRule;

export interface LabelChoiceField {
    readonly owner: 'generator' | 'view';
    readonly field: string;
}

export interface LabelChoiceAlternative {
    readonly id: string;
    readonly labels: readonly string[];
    /** Higher preferences win only when a feasible assignment dominates another. */
    readonly priority?: number;
}

export interface LabelChoiceDomain extends LabelChoiceField {
    readonly alternatives: readonly LabelChoiceAlternative[];
}

export interface GenerationPlanIdentity {
    readonly targetId: string;
    readonly generatorId: string;
    readonly viewId: string;
}

export interface GenerationPlanGroup {
    readonly fields: readonly LabelChoiceField[];
    /** Complete accepted assignments, with alternative IDs in fields order. */
    readonly assignments: readonly (readonly string[])[];
}

/** Serializable metadata only. Ungrouped domains are independent choices. */
export interface GenerationPlan {
    readonly version: 1;
    readonly hash: string;
    readonly identity: GenerationPlanIdentity;
    /** Source/ontology identity is distinct from the admissible-space content hash. */
    readonly inputHash?: string;
    readonly targetLabels: readonly string[];
    readonly generatorLabels: readonly string[];
    readonly viewLabels: readonly string[];
    readonly domains: readonly LabelChoiceDomain[];
    readonly groups: readonly GenerationPlanGroup[];
}

export interface SelectedLabelChoice extends LabelChoiceField {
    readonly alternativeId: string;
}

export interface GenerationSelectionReceipt {
    readonly version: 1;
    readonly planHash: string;
    readonly variantHash: string;
    readonly choices: readonly SelectedLabelChoice[];
}

export interface CompatibilityPlanningWork {
    domains: number;
    alternatives: number;
    constraints: number;
    dependencyGroups: number;
    assignmentsVisited: number;
    predicateEvaluations: number;
    projectionCacheHits: number;
    retainedAssignments: number;
    priorityComparisons: number;
    labelIndexVisits: number;
    dependencyFieldVisits: number;
    contextLabelVisits: number;
}

export interface CompatibilityPlanningInput {
    readonly identity: GenerationPlanIdentity;
    readonly inputHash?: string;
    readonly targetLabels: readonly string[];
    readonly generatorLabels: readonly string[];
    readonly viewLabels: readonly string[];
    readonly fields: readonly LabelChoiceDomain[];
    readonly generatorRules?: readonly GeneratorCompatibilityRule[];
    readonly viewRules?: readonly ViewCompatibilityRule[];
    /** Fail explicitly if a connected group exceeds this finite profile. */
    readonly maxAssignmentsPerGroup?: number;
}

export type CompatibilityPlanningResult =
    | {supported: true; plan: GenerationPlan; work: CompatibilityPlanningWork}
    | {
        supported: false;
        reason: 'empty-domain' | 'uncovered-target' | 'incompatible-rules';
        fields?: readonly LabelChoiceField[];
        labels?: readonly string[];
        ruleIds?: readonly string[];
        work: CompatibilityPlanningWork;
    };
