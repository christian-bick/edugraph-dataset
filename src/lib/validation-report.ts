import { isAbsolute, resolve } from 'node:path';
import type {VqaCacheEntry} from './vqa-cache.ts';
import {isPendingVqaReview} from './vqa-review.ts';

export interface ValidationReportScope {
    generator?: string;
    view?: string;
    reportPath?: string;
    generatedAt?: Date;
}

function sanitizeScopePart(value: string): string {
    return value
        .trim()
        .replace(/[\\/]+/g, '-')
        .replace(/[^a-zA-Z0-9._=-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'unknown';
}

export function validationReportPath(
    projectRoot: string,
    datasetFolderName: string,
    scope: ValidationReportScope
): string {
    if (scope.reportPath) {
        return isAbsolute(scope.reportPath)
            ? scope.reportPath
            : resolve(projectRoot, scope.reportPath);
    }

    const parts = [
        scope.generator ? `generator=${sanitizeScopePart(scope.generator)}` : null,
        scope.view ? `view=${sanitizeScopePart(scope.view)}` : null
    ].filter((part): part is string => part !== null);
    const timestamp = (scope.generatedAt ?? new Date()).toISOString().replace(/[:.]/g, '-');
    const scopeName = parts.length > 0 ? parts.join('__') : 'full';
    return resolve(
        projectRoot,
        'temp',
        'validation-reports',
        datasetFolderName,
        `${timestamp}__${scopeName}.md`,
    );
}

export function validationFailed(
    counts: { failed: number; uncached: number },
    reportOnly: boolean
): boolean {
    return !reportOnly && (counts.failed > 0 || counts.uncached > 0);
}

/** Show escalation and uncertainty without treating a passing uncertain label as a defect. */
export function vqaReviewReport(entries: readonly VqaCacheEntry[]): string {
    const reviewed = entries.filter(entry => entry.review);
    const high = reviewed.filter(entry => entry.review!.stages.length === 2);
    const uncertain = entries.flatMap(entry => entry.evaluation.label_checks
        .filter(check => check.verdict === 'uncertain')
        .map(check => ({sample: entry.sample_key, stage: entry.review?.stages.at(-1)?.thinking_level ?? 'Historical', ...check})));
    const cell = (value: string) => value.replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
    return `## Evaluation stages

Counts describe the current cached decisions, including reused records.

| Outcome | Samples |
| --- | ---: |
| LOW passed | ${reviewed.filter(entry => entry.review!.stages[0].evaluation.pass).length} |
| HIGH passed after LOW failure | ${high.filter(entry => entry.evaluation.pass).length} |
| HIGH failed after LOW failure | ${high.filter(entry => !entry.evaluation.pass).length} |
| HIGH pending | ${reviewed.filter(isPendingVqaReview).length} |
| Historical records without stage provenance | ${entries.length - reviewed.length} |
| Final evaluations with uncertain labels | ${entries.filter(entry => entry.evaluation.label_checks.some(check => check.verdict === 'uncertain')).length} |

## Uncertain labels

Uncertain labels retain the existing passing policy; their evidence remains available here.

${uncertain.length === 0 ? 'None.' : `| Sample | Stage | Label | Evidence |
| --- | --- | --- | --- |
${uncertain.map(check => `| ${cell(check.sample)} | ${check.stage} | ${cell(check.label)} | ${cell(check.evidence)} |`).join('\n')}`}
`;
}
