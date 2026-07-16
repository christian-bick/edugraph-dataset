import fs from 'fs';
import path from 'path';
import { Area, Scope, Ability } from 'edugraph-ts';
import { isCompatibleConcept } from '../lib/ontology.ts';

const enums = { Area, Scope, Ability };

function getEnumString(match: string): string | null {
    const [prefix, key] = match.split('.');
    if (enums[prefix as keyof typeof enums] && enums[prefix as keyof typeof enums][key as any]) {
        return enums[prefix as keyof typeof enums][key as any] as unknown as string;
    }
    return null;
}

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
                            const supportedLabels = spec?.supportedLabels || [];

                            for (const usedEnumName of uniqueMatches) {
                                const used = getEnumString(usedEnumName);
                                if (!used) continue;

                                const isSupported = supportedLabels.some((supported: string) => 
                                    isCompatibleConcept(used, supported)
                                );

                                if (!isSupported) {
                                    issues.push({
                                        file: targetPath,
                                        type,
                                        usedEnum: usedEnumName,
                                        used,
                                        supported: supportedLabels
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
