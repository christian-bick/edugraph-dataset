/** Declarative annotation obligations; these never contribute generation capabilities. */
export const dependencyEvidenceIds = ['numericTask', 'arithmeticOperands', 'fractionValues',
    'decimalRepresentation', 'quantityReferenceFrames', 'writtenExplanation'] as const;
export type DependencyEvidenceId = typeof dependencyEvidenceIds[number];

export type DependencyTrigger = {readonly family: string} | {readonly evidence: DependencyEvidenceId}
    | {readonly any: readonly DependencyTrigger[]};

export type DependencyFacet = ({readonly root: string} | {readonly labels: readonly string[]})
    & {readonly check?: 'presence-only'};

export interface LabelDependencyGraph {
    readonly version: 1;
    readonly context: {readonly allAreasWithin: readonly string[]; readonly requireArea: true};
    readonly facets: Readonly<Record<string, DependencyFacet>>;
    readonly rules: readonly {
        readonly id: string;
        readonly when: DependencyTrigger;
        readonly assess: readonly string[];
    }[];
    /** Only reviewed, mutually exclusive claims belong here; families are not exactly-one. */
    readonly conflicts?: readonly {
        readonly id: string;
        readonly facet: string;
        readonly labels: readonly string[];
    }[];
}

/** Absent means an adapter established absence; an unavailable adapter is unresolved. */
export interface DependencyTriggerEvidence {
    readonly status: 'present' | 'absent' | 'unresolved';
    readonly reason: string;
    readonly references: readonly string[];
}

export interface DependencyFacetEvidence {
    readonly status: 'applicable' | 'not_applicable' | 'unresolved';
    /** All expected labels are independent claims, not alternative choices. */
    readonly expectedLabels?: readonly string[];
    readonly reason: string;
    readonly references: readonly string[];
}

export interface LabelDependencyEvidence {
    readonly triggers: Partial<Readonly<Record<DependencyEvidenceId, DependencyTriggerEvidence>>>;
    readonly facets: Readonly<Record<string, DependencyFacetEvidence>>;
    readonly adapter: string;
}

export interface DependencyAssessment {
    readonly ruleId: string;
    readonly facet: string;
    readonly status: 'satisfied' | 'missing' | 'not_applicable' | 'unresolved';
    readonly labels: readonly string[];
    readonly expectedLabels: readonly string[];
    readonly missingLabels: readonly string[];
    readonly reason: string;
    readonly references: readonly string[];
}

export interface DependencyTriggerResult {
    readonly ruleId: string;
    readonly status: 'present' | 'absent' | 'unresolved';
    readonly labels: readonly string[];
    readonly evidence: readonly DependencyEvidenceId[];
}

export interface DependencyConflict {
    readonly ruleId: string;
    readonly facet: string;
    readonly labels: readonly string[];
    readonly reason: string;
}

export interface LabelDependencyEvaluation {
    readonly context: {
        readonly status: 'eligible' | 'outside_policy_scope' | 'invalid_context';
        readonly areas: readonly string[];
        readonly outsideAreas: readonly string[];
    };
    readonly errors: readonly string[];
    readonly triggers: readonly DependencyTriggerResult[];
    readonly assessments: readonly DependencyAssessment[];
    /** Separate diagnostics: evidence never suppresses annotation completeness findings. */
    readonly evidenceTriggers?: readonly DependencyTriggerResult[];
    readonly evidenceAssessments?: readonly DependencyAssessment[];
    readonly evidenceErrors?: readonly string[];
    readonly conflicts?: readonly DependencyConflict[];
}
