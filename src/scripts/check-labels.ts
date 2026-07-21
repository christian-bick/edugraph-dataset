import fs from 'fs';
import path from 'path';
import { Area, Scope, Ability } from 'edugraph-ts';
import { isCompatibleConcept } from '../lib/ontology.ts';
import { extractSchemaLabels } from '../lib/utils.ts';

const enums = { Area, Scope, Ability };

function getEnumString(match: string): string | null {
    const [prefix, key] = match.split('.');
    const targetEnum = enums[prefix as keyof typeof enums] as Record<string, string> | undefined;
    if (targetEnum && targetEnum[key]) {
        return targetEnum[key];
    }
    return null;
}

const camelCase = (str: string) => str.replace(/-([a-z])/g, g => g[1].toUpperCase());

async function checkLabels() {
    const issues: { file: string, type: string, used: string, supported: string[], usedEnum: string }[] = [];

    async function checkDir(dir: string, type: 'generator' | 'view') {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const itemPath = path.join(dir, item);
            if (fs.statSync(itemPath).isDirectory()) {
                const targetFile = type === 'generator' ? 'generator.ts' : 'view.tsx';
                const targetPath = path.join(itemPath, targetFile);
                const specPath = path.join(itemPath, 'spec.ts');

                if (fs.existsSync(targetPath) && fs.existsSync(specPath)) {
                    // Extract used labels
                    const content = fs.readFileSync(targetPath, 'utf8');
                    const regex = /(Area|Scope|Ability)\.[A-Za-z0-9]+/g;
                    let matches = content.match(regex) || [];
                    
                    // Filter unique enum references
                    const uniqueMatches = Array.from(new Set(matches));

                    if (uniqueMatches.length > 0) {
                        try {
                            const specModule = await import(specPath);
                            const spec = specModule.spec;
                            const modulePrefix = camelCase(item[0].toUpperCase() + item.slice(1));
                            const schemaName = type === 'generator' ? `${modulePrefix}GeneratorSchema` : `${modulePrefix}ViewSchema`;
                            const schema = specModule[schemaName];
                            
                            const schemaLabels = schema ? extractSchemaLabels(schema) : [];
                            const generalLabels = Array.from(new Set([
                                ...(spec?.generalLabels || []),
                                ...schemaLabels
                            ]));

                            for (const usedEnumName of uniqueMatches) {
                                const used = getEnumString(usedEnumName);
                                if (!used) continue;

                                const isSupported = generalLabels.some((supported: string) => 
                                    isCompatibleConcept(used, supported)
                                );

                                if (!isSupported) {
                                    issues.push({
                                        file: targetPath,
                                        type,
                                        usedEnum: usedEnumName,
                                        used,
                                        supported: generalLabels
                                    });
                                }
                            }
                        } catch (e) {
                            console.error(`Error loading spec ${specPath}:`, e);
                        }
                    }
                }
            }
        }
    }

    const generatorsDir = path.resolve(__dirname, '../generators');
    const viewsDir = path.resolve(__dirname, '../visuals/views');

    await checkDir(generatorsDir, 'generator');
    await checkDir(viewsDir, 'view');

    if (issues.length > 0) {
        console.log(JSON.stringify(issues, null, 2));
    } else {
        console.log("ALL GOOD");
    }
}

checkLabels().catch(console.error);
