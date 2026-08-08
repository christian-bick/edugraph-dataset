import { resolve } from 'node:path';

function planSegment(value: string, label: string): string {
    const segment = value.trim();
    if (!/^[a-zA-Z0-9._-]+$/.test(segment) || segment === '.' || segment === '..') {
        throw new Error(`${label} must contain only letters, numbers, dots, underscores, or hyphens.`);
    }
    return segment;
}

export interface SpecPlanPaths {
    directory: string;
    plan: string;
    matchingBefore: string;
    matchingAfter: string;
    matchingDiff: string;
    targetDistinctness: string;
}

export function specPlanPaths(projectRoot: string, specName: string, planName: string): SpecPlanPaths {
    const spec = planSegment(specName, 'Spec name');
    const plan = planSegment(planName, 'Plan name');
    const directory = resolve(projectRoot, 'temp', 'spec-plans', spec, plan);
    return {
        directory,
        plan: resolve(directory, 'plan.md'),
        matchingBefore: resolve(directory, 'matching-before.json'),
        matchingAfter: resolve(directory, 'matching-after.json'),
        matchingDiff: resolve(directory, 'matching-diff.md'),
        targetDistinctness: resolve(directory, 'target-distinctness.md')
    };
}
