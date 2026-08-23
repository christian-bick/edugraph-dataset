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

export interface SourceFileIdentity extends ContentDigest {
    path: string;
}

export interface SourceContentIndexStats {
    directories_read: number;
    files_read: number;
    bytes_read: number;
}

/**
 * Request-local source index. Overlapping path sets reuse directory discovery
 * and file digests, so a source byte is read at most once per build plan.
 */
export class SourceContentIndex {
    private readonly filesByPath = new Map<string, string[]>();
    private readonly digestsByFile = new Map<string, ContentDigest>();
    private readonly statsValue: SourceContentIndexStats = {
        directories_read: 0,
        files_read: 0,
        bytes_read: 0
    };

    constructor(private readonly projectRoot: string) {}

    private filesBelow(path: string): string[] {
        const absolutePath = resolve(path);
        const cached = this.filesByPath.get(absolutePath);
        if (cached) return cached;
        if (!existsSync(absolutePath)) {
            this.filesByPath.set(absolutePath, []);
            return [];
        }
        if (!statSync(absolutePath).isDirectory()) {
            const files = [absolutePath];
            this.filesByPath.set(absolutePath, files);
            return files;
        }

        this.statsValue.directories_read++;
        const files = readdirSync(absolutePath, {withFileTypes: true})
            .flatMap(entry => this.filesBelow(resolve(absolutePath, entry.name)));
        this.filesByPath.set(absolutePath, files);
        return files;
    }

    private digest(path: string): ContentDigest {
        const cached = this.digestsByFile.get(path);
        if (cached) return cached;
        const content = readFileSync(path);
        const digest = digestContent(content);
        this.digestsByFile.set(path, digest);
        this.statsValue.files_read++;
        this.statsValue.bytes_read += content.byteLength;
        return digest;
    }

    identities(
        paths: readonly string[],
        options: HashSourceFilesOptions = {}
    ): SourceFileIdentity[] {
        const include = options.include ?? (() => true);
        const byRelativePath = new Map<string, string>();
        for (const file of paths.flatMap(path => this.filesBelow(path))) {
            if (!include(file)) continue;
            byRelativePath.set(relative(this.projectRoot, file).replaceAll('\\', '/'), file);
        }
        return radixSortUtf8([...byRelativePath.keys()]).map(path => ({
            path,
            ...this.digest(byRelativePath.get(path)!)
        }));
    }

    hash(paths: readonly string[], options: HashSourceFilesOptions = {}): string {
        const hash = createHash('sha256');
        for (const identity of this.identities(paths, options)) {
            hash.update(identity.path);
            hash.update('\0');
            hash.update(identity.sha256);
            hash.update('\0');
        }
        return hash.digest('hex');
    }

    stats(): Readonly<SourceContentIndexStats> {
        return {...this.statsValue};
    }
}

/** Hashes a file set by normalized relative path and bytes in deterministic linear order. */
export function hashSourceFiles(
    projectRoot: string,
    paths: readonly string[],
    options: HashSourceFilesOptions = {}
): string {
    return new SourceContentIndex(projectRoot).hash(paths, options);
}

export function digestIdentity(value: unknown): string {
    return digestContent(JSON.stringify(value)).sha256;
}
