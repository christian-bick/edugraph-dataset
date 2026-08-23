import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {readDatasetSnapshot} from './dataset-store.ts';

export interface CoverageEntry {
    file_name: string;
    tags: string[];
    generator?: string;
    [key: string]: unknown;
}

function readPublishedSplit(datasetDir: string, split: 'train' | 'validation'): CoverageEntry[] {
    const path = resolve(datasetDir, split, 'metadata.jsonl');
    if (!existsSync(path)) return [];
    return readFileSync(path, 'utf-8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => JSON.parse(line) as CoverageEntry);
}

/** Reads coverage rows from either a spec's transactional store or the flat published union. */
export function readCoverageEntries(datasetDir: string, publishedUnion: boolean): CoverageEntry[] {
    if (publishedUnion) {
        return [
            ...readPublishedSplit(datasetDir, 'train'),
            ...readPublishedSplit(datasetDir, 'validation')
        ];
    }
    const snapshot = readDatasetSnapshot(datasetDir);
    return [
        ...snapshot.rows('train'),
        ...snapshot.rows('val')
    ] as unknown as CoverageEntry[];
}
