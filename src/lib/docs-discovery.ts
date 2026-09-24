import {existsSync, lstatSync, readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

const CONSUMER_FILES = ['DOCS.md', 'AGENTS.md', 'README.md'];

/** Discover authored Markdown once; symlinks are not followed into other trees. */
export function collectDocumentation(projectRoot: string): Map<string, string> {
    const files = new Map<string, string>();
    const read = (path: string) => files.set(path, readFileSync(join(projectRoot, path), 'utf8'));
    const visit = (directory: string): void => {
        const absolute = join(projectRoot, directory);
        if (!existsSync(absolute) || !lstatSync(absolute).isDirectory()) return;
        const entries = readdirSync(absolute, {withFileTypes: true})
            .sort((left, right) => left.name.localeCompare(right.name));
        for (const entry of entries) {
            const path = `${directory}/${entry.name}`;
            if (entry.isDirectory()) visit(path);
            else if (entry.isFile() && /\.md$/i.test(entry.name)) read(path);
        }
    };

    visit('docs');
    for (const path of CONSUMER_FILES) {
        if (existsSync(join(projectRoot, path))) read(path);
    }
    visit('.agents/skills');
    return files;
}
