import {createHash} from 'node:crypto';
import {
    existsSync,
    readFileSync,
    readdirSync,
    statSync
} from 'node:fs';
import {relative, resolve} from 'node:path';

export interface ContentDigest {
    sha256: string;
    bytes: number;
}

export function digestContent(content: string | Buffer): ContentDigest {
    const buffer = typeof content === 'string' ? Buffer.from(content) : content;
    return {
        sha256: createHash('sha256').update(buffer).digest('hex'),
        bytes: buffer.byteLength
    };
}

export function digestFile(path: string): ContentDigest {
    return digestContent(readFileSync(path));
}

/**
 * Deterministically orders UTF-8 strings with bounded-domain radix work. Unlike
 * comparison sorting, work remains proportional to the encoded input length.
 */
export function radixSortUtf8(values: readonly string[]): string[] {
    interface EncodedValue {
        value: string;
        bytes: Buffer;
    }

    const visit = (group: EncodedValue[], offset: number, output: string[]): void => {
        if (group.length === 0) return;
        if (group.length === 1) {
            output.push(group[0].value);
            return;
        }

        const buckets = new Map<number, EncodedValue[]>();
        for (const item of group) {
            const bucket = offset < item.bytes.length ? item.bytes[offset] + 1 : 0;
            const valuesForByte = buckets.get(bucket);
            if (valuesForByte) valuesForByte.push(item);
            else buckets.set(bucket, [item]);
        }

        for (let bucket = 0; bucket <= 256; bucket++) {
            const valuesForByte = buckets.get(bucket);
            if (!valuesForByte) continue;
            if (bucket === 0) output.push(...valuesForByte.map(item => item.value));
            else visit(valuesForByte, offset + 1, output);
        }
    };

    const output: string[] = [];
    visit(values.map(value => ({value, bytes: Buffer.from(value)})), 0, output);
    return output;
}

export interface HashSourceFilesOptions {
    include?: (path: string) => boolean;
}

function sourceFiles(path: string, include: (path: string) => boolean): string[] {
    if (!existsSync(path)) return [];
    if (!statSync(path).isDirectory()) return include(path) ? [path] : [];
    return readdirSync(path, {withFileTypes: true})
        .flatMap(entry => sourceFiles(resolve(path, entry.name), include));
}

/** Hashes a file set by normalized relative path and bytes in deterministic linear order. */
export function hashSourceFiles(
    projectRoot: string,
    paths: readonly string[],
    options: HashSourceFilesOptions = {}
): string {
    const include = options.include ?? (() => true);
    const byRelativePath = new Map<string, string>();
    for (const file of paths.flatMap(path => sourceFiles(path, include))) {
        byRelativePath.set(relative(projectRoot, file).replaceAll('\\', '/'), file);
    }

    const hash = createHash('sha256');
    for (const relativePath of radixSortUtf8([...byRelativePath.keys()])) {
        hash.update(relativePath);
        hash.update('\0');
        hash.update(readFileSync(byRelativePath.get(relativePath)!));
        hash.update('\0');
    }
    return hash.digest('hex');
}

export function digestIdentity(value: unknown): string {
    return digestContent(JSON.stringify(value)).sha256;
}
