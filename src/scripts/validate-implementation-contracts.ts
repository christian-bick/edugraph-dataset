import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getCliOption} from '../lib/cli.ts';
import {findLeafModules} from '../lib/module-resolver.ts';
import {loadGeneratorModelCatalog} from '../lib/model-catalog.ts';
import {inspectModuleImplementations} from '../lib/implementation-audit.ts';

const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));

async function main(): Promise<void> {
    const files = getCliOption(process.argv.slice(2), 'files');
    const changed = files?.split(',').filter(Boolean) ?? [];
    const implementationFiles = changed.filter(file => /\.(?:ts|tsx)$/.test(file)
        && (file.replaceAll('\\', '/').startsWith('src/generators/')
            || file.replaceAll('\\', '/').startsWith('src/visuals/')));
    const directOnly = implementationFiles.length > 0
        && implementationFiles.every(file => /\/(?:generator\.ts|view\.tsx)$/.test(file.replaceAll('\\', '/')));
    const directPaths = new Set(implementationFiles.map(file => resolve(projectRoot, file)));
    const allGenerators = findLeafModules(resolve(projectRoot, 'src/generators'));
    const allViews = findLeafModules(resolve(projectRoot, 'src/visuals/views'));
    const generators = directOnly ? allGenerators.filter(module =>
        directPaths.has(resolve(module.absolutePath, 'generator.ts'))) : allGenerators;
    const views = directOnly ? allViews.filter(module =>
        directPaths.has(resolve(module.absolutePath, 'view.tsx'))) : allViews;
    const generatorEntries = directOnly ? new Map(generators.map(module =>
        [module.id, resolve(module.absolutePath, 'spec.ts')])) : undefined;
    const descriptors = await loadGeneratorModelCatalog(undefined, undefined, generatorEntries);
    const issues = inspectModuleImplementations(projectRoot, {
        generators, views,
        generatorSchemaSizes: new Map(descriptors.map(entry =>
            [entry.generatorId, Object.keys(entry.schema ?? {}).length])),
        changedFiles: files ? changed : undefined
    });
    for (const issue of issues) {
        const diagnostic = `[${issue.role}:${issue.module_id}] ${issue.rule} `
            + `${issue.file}:${issue.line}:${issue.column}: ${issue.message}`;
        if (issue.severity === 'review') console.warn(`⚠️ ${diagnostic}`);
        else console.error(`❌ ${diagnostic}`);
    }
    if (issues.some(issue => issue.severity !== 'review')) process.exitCode = 1;
    else console.log(`✅ Implementation source contracts valid (${issues.length} review signals).`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
