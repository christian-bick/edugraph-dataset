import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { findLeafModules } from './module-resolver.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..', '..');
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
    const generatorsDir = resolve(PROJECT_ROOT, 'src', 'generators');
    const leafModules = findLeafModules(generatorsDir);
    const leaf = leafModules.find(m => m.id === genId || m.relativePath === genId);
    if (!leaf) {
        return null;
    }
    const genPath = resolve(leaf.absolutePath, 'generator.ts');
    if (!existsSync(genPath)) {
        return null;
    }
    const content = readFileSync(genPath, 'utf8');
    const match = content.match(/implements\s+ProblemGenerator<([^>]+)>/);
    return match ? match[1].split(',')[0].trim() : null;
}

/**
 * Returns whether a view payload type accepts a generator payload type.
 * Besides exact matches, this recognizes named unions declared in problems.ts,
 * allowing selected views to share a broader contract while generators retain
 * precise payload types.
 */
export function isProblemTypeCompatible(generatorType: string, viewType: string): boolean {
    if (generatorType === viewType) return true;

    const problemsPath = resolve(PROJECT_ROOT, 'src', 'types', 'problems.ts');
    if (!existsSync(problemsPath)) return false;

    const content = readFileSync(problemsPath, 'utf8');
    const unionPattern = /export\s+type\s+(\w+)\s*=\s*((?:\w+\s*\|\s*)+\w+)\s*;/g;
    for (const match of content.matchAll(unionPattern)) {
        if (match[1] !== viewType) continue;
        return match[2].split('|').map(member => member.trim()).includes(generatorType);
    }

    return false;
}
