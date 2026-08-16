import { isAbsolute, resolve } from 'node:path';

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
