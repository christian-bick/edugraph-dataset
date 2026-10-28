/** Declarative annotation obligations; these never contribute generation capabilities. */
export type DependencyTrigger = {readonly family: string}
    | {readonly any: readonly DependencyTrigger[]}
    | {readonly all: readonly DependencyTrigger[]}
    | {readonly areaWithin: string}
    /** After ignoring optional structural branches, requires a nonempty family entirely beneath root. */
    | {readonly familyWithin: {
        readonly family: string;
        readonly root: string;
        /** These branches are ignored only for qualification; annotations and assessments are retained. */
        readonly ignore?: readonly string[];
    }};

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

export interface DependencyAssessment {
    readonly ruleId: string;
    readonly facet: string;
    readonly status: 'satisfied' | 'missing';
    readonly labels: readonly string[];
    readonly reason: string;
}

export interface DependencyTriggerResult {
    readonly ruleId: string;
    readonly status: 'present' | 'absent';
    readonly labels: readonly string[];
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
    readonly conflicts: readonly DependencyConflict[];
}
