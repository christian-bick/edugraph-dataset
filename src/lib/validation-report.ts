import { isAbsolute, resolve } from 'node:path';

export interface ValidationReportScope {
    generator?: string;
    view?: string;
    reportPath?: string;
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

    const datasetDir = resolve(projectRoot, 'out', datasetFolderName);
    if (!scope.generator && !scope.view) {
        return resolve(datasetDir, 'validation-report.md');
    }

    const parts = [
        scope.generator ? `generator=${sanitizeScopePart(scope.generator)}` : null,
        scope.view ? `view=${sanitizeScopePart(scope.view)}` : null
    ].filter((part): part is string => part !== null);
    return resolve(datasetDir, 'validation-reports', `${parts.join('__')}.md`);
}

export function validationFailed(
    counts: { failed: number; uncached: number },
    reportOnly: boolean
): boolean {
    return !reportOnly && (counts.failed > 0 || counts.uncached > 0);
}

