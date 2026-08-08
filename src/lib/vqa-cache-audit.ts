import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import type { VqaCacheEntry } from './vqa-cache.ts';

export type VqaCacheAuditIssueKind =
    | 'duplicate'
    | 'failing'
    | 'malformed'
    | 'missing'
    | 'obsolete-module'
    | 'stale';

export interface VqaCacheAuditIssue {
    kind: VqaCacheAuditIssueKind;
    message: string;
}

export interface ExpectedVqaCacheRecord {
    moduleName: string;
    validationCacheKey: string;
    sampleKey: string;
}

interface CacheModuleSnapshot {
    moduleName: string;
    entries: Map<string, VqaCacheEntry>;
    issues: VqaCacheAuditIssue[];
}

export interface VqaCacheAuditResult {
    expected: number;
    passed: number;
    issues: VqaCacheAuditIssue[];
    counts: Record<VqaCacheAuditIssueKind, number>;
}

function emptyCounts(): Record<VqaCacheAuditIssueKind, number> {
    return {
        duplicate: 0,
        failing: 0,
        malformed: 0,
        missing: 0,
        'obsolete-module': 0,
        stale: 0
    };
}

function isCacheEntry(value: unknown): value is VqaCacheEntry {
    if (!value || typeof value !== 'object') return false;
    const entry = value as Partial<VqaCacheEntry>;
    return typeof entry.validation_cache_key === 'string'
        && entry.validation_cache_key.length > 0
        && typeof entry.generator === 'string'
        && typeof entry.sample_key === 'string'
        && typeof entry.evaluation?.pass === 'boolean';
}

function readModuleSnapshot(path: string): CacheModuleSnapshot {
    const moduleName = basename(path, '.jsonl');
    const entries = new Map<string, VqaCacheEntry>();
    const issues: VqaCacheAuditIssue[] = [];
    const lines = readFileSync(path, 'utf-8').split('\n');

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index].trim();
        if (!line) continue;
        let value: unknown;
        try {
            value = JSON.parse(line);
        } catch {
            issues.push({
                kind: 'malformed',
                message: `${moduleName}.jsonl:${index + 1} is not valid JSON.`
            });
            continue;
        }
        if (!isCacheEntry(value)) {
            issues.push({
                kind: 'malformed',
                message: `${moduleName}.jsonl:${index + 1} is not a valid VQA cache record.`
            });
            continue;
        }
        if (value.generator !== moduleName) {
            issues.push({
                kind: 'malformed',
                message: `${moduleName}.jsonl:${index + 1} declares generator "${value.generator}".`
            });
        }
        if (entries.has(value.validation_cache_key)) {
            issues.push({
                kind: 'duplicate',
                message: `${moduleName}.jsonl contains duplicate cache key ${value.validation_cache_key}.`
            });
        } else {
            entries.set(value.validation_cache_key, value);
        }
    }
    return { moduleName, entries, issues };
}

/** Read-only exact-set audit of the committed cache for one generated dataset. */
export function auditVqaCache(
    datasetCacheDir: string,
    expectedRecords: readonly ExpectedVqaCacheRecord[]
): VqaCacheAuditResult {
    const expectedByModule = new Map<string, Map<string, ExpectedVqaCacheRecord[]>>();
    for (const expected of expectedRecords) {
        if (!expectedByModule.has(expected.moduleName)) expectedByModule.set(expected.moduleName, new Map());
        const byKey = expectedByModule.get(expected.moduleName)!;
        if (!byKey.has(expected.validationCacheKey)) byKey.set(expected.validationCacheKey, []);
        byKey.get(expected.validationCacheKey)!.push(expected);
    }

    const snapshots = existsSync(datasetCacheDir)
        ? readdirSync(datasetCacheDir, { withFileTypes: true })
            .filter(entry => entry.isFile() && entry.name.endsWith('.jsonl'))
            .map(entry => readModuleSnapshot(resolve(datasetCacheDir, entry.name)))
        : [];
    const snapshotsByModule = new Map(snapshots.map(snapshot => [snapshot.moduleName, snapshot]));
    const issues = snapshots.flatMap(snapshot => snapshot.issues);
    let passed = 0;

    for (const [moduleName, expectedByKey] of expectedByModule) {
        const snapshot = snapshotsByModule.get(moduleName);
        for (const [key, records] of expectedByKey) {
            const cached = snapshot?.entries.get(key);
            if (!cached) {
                issues.push({
                    kind: 'missing',
                    message: `${moduleName} is missing a passing cache record for ${records.map(r => r.sampleKey).join(', ')}.`
                });
            } else if (!cached.evaluation.pass) {
                issues.push({
                    kind: 'failing',
                    message: `${moduleName} has a failing cache record for ${records.map(r => r.sampleKey).join(', ')}.`
                });
            } else {
                passed += records.length;
            }
        }
        for (const key of snapshot?.entries.keys() ?? []) {
            if (!expectedByKey.has(key)) {
                issues.push({ kind: 'stale', message: `${moduleName} contains stale cache key ${key}.` });
            }
        }
    }

    for (const snapshot of snapshots) {
        if (!expectedByModule.has(snapshot.moduleName)) {
            issues.push({
                kind: 'obsolete-module',
                message: `${snapshot.moduleName}.jsonl does not correspond to any generated module.`
            });
        }
    }

    const counts = emptyCounts();
    for (const issue of issues) counts[issue.kind]++;
    return { expected: expectedRecords.length, passed, issues, counts };
}

