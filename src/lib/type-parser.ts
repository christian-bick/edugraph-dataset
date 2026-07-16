import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const PROJECT_ROOT = 'c:/Users/silen/Documents/EduGraph/edugraph-content';

export function getViewToProblemTypeMap(): Record<string, string> {
    const problemsPath = resolve(PROJECT_ROOT, 'src', 'types', 'problems.ts');
    if (!existsSync(problemsPath)) {
        return {};
    }
    const content = readFileSync(problemsPath, 'utf8');
    const interfaceMatch = content.match(/export\s+interface\s+ViewTypeMap\s*\{([\s\S]*?)\}/);
    if (!interfaceMatch) {
        return {};
    }
    const block = interfaceMatch[1];
    const map: Record<string, string> = {};
    const lines = block.split('\n');
    const regex = /['"]([^'"]+)['"]\s*:\s*(\w+)/;
    for (const line of lines) {
        const m = line.match(regex);
        if (m) {
            map[m[1]] = m[2];
        }
    }
    return map;
}

export function getGeneratorProblemType(genId: string): string | null {
    const genPath = resolve(PROJECT_ROOT, 'src', 'generators', genId, 'generator.ts');
    if (!existsSync(genPath)) {
        return null;
    }
    const content = readFileSync(genPath, 'utf8');
    const match = content.match(/implements\s+ProblemGenerator<(\w+)>/);
    return match ? match[1] : null;
}
