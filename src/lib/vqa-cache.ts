import { createHash } from 'crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { definition, type CompetencyDescriptor } from 'edugraph-ts';

const EDUGRAPH_NAMESPACE = 'http://edugraph.io/edu/';

export type VqaLabelVerdict = 'defendable' | 'uncertain' | 'not_defendable';

export interface VqaLabelDefinition {
    iri: string;
    label: string;
    definition: string;
}

export interface VqaLabelCheck {
    label: string;
    verdict: VqaLabelVerdict;
    evidence: string;
}

export interface VqaValidationContext {
    checklistHash: string;
    labelContextHash: string;
    validationContextHash: string;
    validationCacheKey: string;
    labelDefinitions: VqaLabelDefinition[];
}

export interface VqaCacheEntry {
    validation_cache_key: string;
    /** Structural sample identity: targetId#generatorId#viewId#split#mode#inst:N */
    sample_key: string;
    target_id: string;
    generator: string;
    view: string;
    mode: string;
    instance: number;
    /** The winning generation attempt — together with sample_key it determines the seed */
    attempt: number;
    seed: number;
    file_name: string;
    image_sha256: string;
    checklist_hash: string;
    label_context_hash: string;
    validation_context_hash: string;
    validated_at: string;
    evaluation: {
        pass: boolean;
        reasoning: string;
        label_checks: VqaLabelCheck[];
        general_checks?: {
            no_overlaps: boolean;
            no_placeholders: boolean;
            sane_padding: boolean;
            task_identifiable: boolean;
            mode_valid: boolean;
            text_minimal: boolean;
            math_coherent: boolean;
        };
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

export function resolveVqaLabelDefinitions(labels: readonly string[]): VqaLabelDefinition[] {
    const byIri = new Map<string, VqaLabelDefinition>();
    for (const rawLabel of labels) {
        const iri = rawLabel.startsWith(EDUGRAPH_NAMESPACE)
            ? rawLabel
            : `${EDUGRAPH_NAMESPACE}${rawLabel}`;
        const labelDefinition = definition(iri as CompetencyDescriptor);
        if (!labelDefinition) {
            throw new Error(`Cannot visually validate ontology label without a definition: "${rawLabel}"`);
        }
        byIri.set(iri, {
            iri,
            label: iri.slice(EDUGRAPH_NAMESPACE.length),
            definition: labelDefinition
        });
    }
    return [...byIri.values()].sort((a, b) => a.iri.localeCompare(b.iri));
}

export function computeLabelContextHash(labelDefinitions: readonly VqaLabelDefinition[]): string {
    const canonical = labelDefinitions
        .map(({ iri, definition: labelDefinition }) => ({ iri, definition: labelDefinition }))
        .sort((a, b) => a.iri.localeCompare(b.iri));
    return createHash('sha256').update(JSON.stringify(canonical)).digest('hex').slice(0, 16);
}

export function computeValidationContextHash(checklistHash: string, labelContextHash: string): string {
    return createHash('sha256')
        .update(JSON.stringify({ checklistHash, labelContextHash }))
        .digest('hex')
        .slice(0, 16);
}

export function computeImageSha256(imageBufferOrPath: Buffer | string): string {
    const buffer = typeof imageBufferOrPath === 'string'
        ? readFileSync(imageBufferOrPath)
        : imageBufferOrPath;
    return createHash('sha256').update(buffer).digest('hex');
}

export function computeValidationCacheKey(
    imageSha256: string,
    validationContextHash: string
): string {
    const rawKey = `${imageSha256}:${validationContextHash}`;
    return createHash('sha256').update(rawKey).digest('hex');
}

export function buildVqaValidationContext(
    imageSha256: string,
    checklistPaths: string[],
    labels: readonly string[]
): VqaValidationContext {
    const checklistHash = computeChecklistHash(checklistPaths);
    const labelDefinitions = resolveVqaLabelDefinitions(labels);
    const labelContextHash = computeLabelContextHash(labelDefinitions);
    const validationContextHash = computeValidationContextHash(checklistHash, labelContextHash);
    const validationCacheKey = computeValidationCacheKey(imageSha256, validationContextHash);
    return {
        checklistHash,
        labelContextHash,
        validationContextHash,
        validationCacheKey,
        labelDefinitions
    };
}

export function pruneObsoleteVqaCacheFiles(
    datasetCacheDir: string,
    activeModuleNames: ReadonlySet<string>
): string[] {
    if (!existsSync(datasetCacheDir)) return [];
    const removed: string[] = [];
    for (const entry of readdirSync(datasetCacheDir, { withFileTypes: true })) {
        if (!entry.isFile() || !entry.name.endsWith('.jsonl')) continue;
        const moduleName = entry.name.slice(0, -'.jsonl'.length);
        if (activeModuleNames.has(moduleName)) continue;
        rmSync(resolve(datasetCacheDir, entry.name), { force: true });
        removed.push(moduleName);
    }
    return removed.sort();
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
                const entry: VqaCacheEntry = JSON.parse(line);
                if (entry && entry.validation_cache_key) {
                    this.cacheMap.set(entry.validation_cache_key, entry);
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

    public entries(): VqaCacheEntry[] {
        return Array.from(this.cacheMap.values());
    }
}
