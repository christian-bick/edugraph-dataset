import { createHash } from 'crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

export interface VqaCacheEntry {
    validation_cache_key: string;
    input_cache_key?: string;
    file_name: string;
    target_key_hash?: string;
    image_sha256: string;
    checklist_hash: string;
    validated_at: string;
    evaluation: {
        pass: boolean;
        reasoning: string;
        general_checks?: {
            no_overlaps: boolean;
            no_placeholders: boolean;
            sane_padding: boolean;
        };
        coloring_pass?: boolean;
        layout_pass?: boolean;
    };
}

export function computeChecklistHash(checklistPaths: string[]): string {
    const hash = createHash('sha256');
    for (const p of checklistPaths) {
        if (existsSync(p)) {
            hash.update(readFileSync(p, 'utf-8'));
            hash.update('\n---\n');
        }
    }
    return hash.digest('hex').slice(0, 16);
}

export function computeImageSha256(imageBufferOrPath: Buffer | string): string {
    const buffer = typeof imageBufferOrPath === 'string'
        ? readFileSync(imageBufferOrPath)
        : imageBufferOrPath;
    return createHash('sha256').update(buffer).digest('hex');
}

export function computeValidationCacheKey(
    imageSha256: string,
    checklistHash: string
): string {
    const rawKey = `${imageSha256}:${checklistHash}`;
    return createHash('sha256').update(rawKey).digest('hex');
}

/** Legacy alias for computeValidationCacheKey */
export function computeVqaCacheKey(
    _targetKeyHash: string,
    imageSha256: string,
    checklistHash: string
): string {
    return computeValidationCacheKey(imageSha256, checklistHash);
}

export function computeInputCacheKey(
    generatorId: string,
    viewId: string,
    mode: string,
    targetLabels: string[],
    instance: number
): string {
    const sortedLabels = [...targetLabels].sort().join(',');
    const rawKey = `${generatorId}#${viewId}#mode:${mode}#${sortedLabels}#inst:${instance}`;
    return createHash('sha256').update(rawKey).digest('hex');
}

export class VqaCacheManager {
    private cacheMap = new Map<string, VqaCacheEntry>();
    private cacheFilePath: string;

    constructor(baseCacheDir: string, datasetFolderName: string, moduleName: string) {
        const cacheDir = resolve(baseCacheDir, datasetFolderName);
        if (!existsSync(cacheDir)) {
            mkdirSync(cacheDir, { recursive: true });
        }
        this.cacheFilePath = resolve(cacheDir, `${moduleName}.jsonl`);
        this.load();
    }

    private load() {
        if (!existsSync(this.cacheFilePath)) return;
        try {
            const content = readFileSync(this.cacheFilePath, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim().length > 0);
            for (const line of lines) {
                const entry = JSON.parse(line);
                const key = entry.validation_cache_key || entry.cache_key;
                if (entry && key) {
                    entry.validation_cache_key = key;
                    this.cacheMap.set(key, entry);
                }
            }
        } catch (err) {
            console.warn(`Failed to load VQA cache from ${this.cacheFilePath}:`, err);
        }
    }

    public get(cacheKey: string): VqaCacheEntry | undefined {
        return this.cacheMap.get(cacheKey);
    }

    public set(entry: VqaCacheEntry): void {
        const key = entry.validation_cache_key;
        const isNewOrUpdated = !this.cacheMap.has(key) ||
            JSON.stringify(this.cacheMap.get(key)) !== JSON.stringify(entry);

        this.cacheMap.set(key, entry);

        if (isNewOrUpdated) {
            appendFileSync(this.cacheFilePath, JSON.stringify(entry) + '\n', 'utf-8');
        }
    }

    public prune(activeCacheKeys: Set<string>): number {
        let prunedCount = 0;
        for (const key of Array.from(this.cacheMap.keys())) {
            if (!activeCacheKeys.has(key)) {
                this.cacheMap.delete(key);
                prunedCount++;
            }
        }
        if (prunedCount > 0) {
            this.save();
        }
        return prunedCount;
    }

    public save(): void {
        const sortedEntries = Array.from(this.cacheMap.values()).sort((a, b) =>
            a.validation_cache_key.localeCompare(b.validation_cache_key)
        );
        const lines = sortedEntries.map(e => JSON.stringify(e)).join('\n') + (sortedEntries.length > 0 ? '\n' : '');
        writeFileSync(this.cacheFilePath, lines, 'utf-8');
    }

    public get size(): number {
        return this.cacheMap.size;
    }
}
