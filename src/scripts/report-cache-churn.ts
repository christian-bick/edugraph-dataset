import { execFileSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { VqaCacheEntry } from '../lib/vqa-cache.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');

/**
 * Compares the working-tree VQA cache against a git ref (default HEAD) by
 * joining entries on their structural sample_key. Rows whose identity is
 * unchanged but whose image hash differs are exactly the invalidations that
 * should not happen when the change was unrelated — a non-empty
 * "identity unchanged, image changed" list after an unrelated change is a
 * determinism regression.
 */

interface ChurnStats {
    stable: number;
    renderChanged: string[];
    attemptShifted: string[];
    seedSchemeChanged: string[];
    added: number;
    removed: number;
    legacy: number;
}

function parseEntries(content: string): Map<string, VqaCacheEntry> {
    const map = new Map<string, VqaCacheEntry>();
    let legacy = 0;
    for (const line of content.split('\n')) {
        if (!line.trim()) continue;
        try {
            const entry: VqaCacheEntry = JSON.parse(line);
            if (entry.sample_key) {
                map.set(entry.sample_key, entry);
            } else {
                legacy++;
            }
        } catch {
            // Ignore malformed lines
        }
    }
    (map as any).legacyCount = legacy;
    return map;
}

function gitShow(ref: string, relPath: string): string {
    try {
        return execFileSync('git', ['show', `${ref}:${relPath}`], {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
            maxBuffer: 64 * 1024 * 1024,
            stdio: ['ignore', 'pipe', 'ignore']
        });
    } catch {
        return '';
    }
}

function gitListCacheFiles(ref: string, relDir: string): string[] {
    try {
        const output = execFileSync('git', ['ls-tree', '-r', '--name-only', ref, relDir], {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'ignore']
        });
        return output.split('\n').filter(f => f.endsWith('.jsonl'));
    } catch {
        return [];
    }
}

function main() {
    const args = process.argv.slice(2);
    let datasetParam = process.env.npm_config_dataset || (args.find(a => a.includes('dataset='))?.split('dataset=')[1]);
    let ref = process.env.npm_config_ref || (args.find(a => a.includes('ref='))?.split('ref=')[1]) || 'HEAD';

    let datasetFolderName = 'dataset';
    if (datasetParam) {
        datasetFolderName = datasetParam.startsWith('dataset-') ? datasetParam : `dataset-${datasetParam}`;
        if (datasetParam === 'default' || datasetParam === 'dataset') {
            datasetFolderName = 'dataset';
        }
    }

    const relDir = `cache/vqa-validation/${datasetFolderName}`;
    const absDir = resolve(PROJECT_ROOT, relDir);

    console.log(`--- VQA Cache Churn Report [${datasetFolderName}] vs ${ref} ---\n`);

    const currentFiles = existsSync(absDir)
        ? readdirSync(absDir).filter(f => f.endsWith('.jsonl')).map(f => `${relDir}/${f}`)
        : [];
    const refFiles = gitListCacheFiles(ref, relDir);
    const allFiles = Array.from(new Set([...currentFiles, ...refFiles])).sort();

    if (allFiles.length === 0) {
        console.log('No cache files found in working tree or ref.');
        return;
    }

    const totals: ChurnStats = { stable: 0, renderChanged: [], attemptShifted: [], seedSchemeChanged: [], added: 0, removed: 0, legacy: 0 };

    for (const relPath of allFiles) {
        const moduleName = relPath.split('/').pop()!.replace('.jsonl', '');
        const absPath = resolve(PROJECT_ROOT, relPath);
        const currentContent = existsSync(absPath) ? readFileSync(absPath, 'utf-8') : '';
        const refContent = gitShow(ref, relPath);

        const current = parseEntries(currentContent);
        const previous = parseEntries(refContent);
        const legacy = ((current as any).legacyCount || 0) + ((previous as any).legacyCount || 0);
        totals.legacy += legacy;

        const stats: ChurnStats = { stable: 0, renderChanged: [], attemptShifted: [], seedSchemeChanged: [], added: 0, removed: 0, legacy };

        for (const [sampleKey, entry] of current.entries()) {
            const prev = previous.get(sampleKey);
            if (!prev) {
                stats.added++;
                continue;
            }
            if (prev.image_sha256 === entry.image_sha256) {
                stats.stable++;
            } else if (prev.attempt !== entry.attempt) {
                stats.attemptShifted.push(sampleKey);
            } else if (prev.seed !== entry.seed) {
                stats.seedSchemeChanged.push(sampleKey);
            } else {
                stats.renderChanged.push(sampleKey);
            }
        }
        for (const sampleKey of previous.keys()) {
            if (!current.has(sampleKey)) stats.removed++;
        }

        const churned = stats.renderChanged.length + stats.attemptShifted.length + stats.seedSchemeChanged.length;
        if (churned > 0 || stats.added > 0 || stats.removed > 0) {
            console.log(`[${moduleName}] stable: ${stats.stable}, changed: ${churned}, added: ${stats.added}, removed: ${stats.removed}`);
            for (const key of stats.renderChanged) {
                console.log(`    🖼️  image changed (same seed & attempt — code/render change): ${key}`);
            }
            for (const key of stats.attemptShifted) {
                console.log(`    🔀 attempt shifted (collision or generator behavior change): ${key}`);
            }
            for (const key of stats.seedSchemeChanged) {
                console.log(`    ⚠️  seed changed for same identity (seed scheme change!): ${key}`);
            }
        }

        totals.stable += stats.stable;
        totals.renderChanged.push(...stats.renderChanged);
        totals.attemptShifted.push(...stats.attemptShifted);
        totals.seedSchemeChanged.push(...stats.seedSchemeChanged);
        totals.added += stats.added;
        totals.removed += stats.removed;
    }

    const totalChurn = totals.renderChanged.length + totals.attemptShifted.length + totals.seedSchemeChanged.length;
    console.log(`\n--- Totals ---`);
    console.log(`Stable (identity + image unchanged): ${totals.stable}`);
    console.log(`Image changed, same identity:        ${totalChurn}`);
    console.log(`  of which render/code changes:      ${totals.renderChanged.length}`);
    console.log(`  of which attempt shifts:           ${totals.attemptShifted.length}`);
    console.log(`  of which seed scheme changes:      ${totals.seedSchemeChanged.length}`);
    console.log(`Added identities:                    ${totals.added}`);
    console.log(`Removed identities:                  ${totals.removed}`);
    if (totals.legacy > 0) {
        console.log(`Legacy entries without sample_key:   ${totals.legacy} (not comparable)`);
    }
    if (totalChurn === 0) {
        console.log(`\n✅ No identity-preserving image churn detected.`);
    } else {
        console.log(`\nℹ️ Review the changed identities above: if your change should not have affected them, this is a determinism regression.`);
    }
}

main();
