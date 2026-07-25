import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { isSubConceptOf } from '../lib/ontology.ts';
import { extractSchemaLabels } from '../lib/utils.ts';
import { getViewToProblemTypeMap, getGeneratorProblemType } from '../lib/type-parser.ts';
import { findLeafModules } from '../lib/module-resolver.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const camelCase = (str: string) => str.replace(/-([a-z])/g, g => g[1].toUpperCase());

/**
 * A generalLabels list must not contain a label together with one of its
 * taxonomic ancestors: the ancestor already covers every target label the
 * specialization covers, so the pair is either redundant or (worse) an
 * over-claim smuggled in via the broad label.
 */
function checkRedundantGeneralLabels(kind: string, item: string, generalLabels: string[]): boolean {
    let hasError = false;
    for (const a of generalLabels) {
        for (const b of generalLabels) {
            if (a !== b && isSubConceptOf(a, b)) {
                console.error(`❌ [${kind}:${item}] Redundant declaration: general label '${a}' is a specialization of general label '${b}' — declare only one of them`);
                hasError = true;
            }
        }
    }
    return hasError;
}

async function validateSpecs() {
    let hasError = false;

    console.log('=== Starting Spec Validation ===');

    const generatorsDir = path.resolve(PROJECT_ROOT, 'src/generators');
    const viewsDir = path.resolve(PROJECT_ROOT, 'src/visuals/views');

    const generatorModules = findLeafModules(generatorsDir);
    const viewModules = findLeafModules(viewsDir);

    const generatorSchemas: Record<string, { schema: any; paramLabels: string[] }> = {};
    const generatorGeneralLabels: Record<string, string[]> = {};
    const generatorProblemTypes: Record<string, string> = {};

    // 1. Validate Generators & Collect Schemas/Problem Types
    console.log('\n--- Auditing Generators ---');
    for (const gMod of generatorModules) {
        const item = gMod.id;
        const specPath = path.join(gMod.absolutePath, 'spec.ts');
        if (fs.existsSync(specPath)) {
            try {
                const fileUrl = pathToFileURL(specPath).href;
                const specModule = await import(fileUrl);
                const spec = specModule.spec;
                if (!spec) {
                    console.error(`❌ [generator:${item}] Missing 'spec' export in spec.ts`);
                    hasError = true;
                    continue;
                }

                const generalLabels = spec.generalLabels || [];
                generatorGeneralLabels[item] = generalLabels;
                if (checkRedundantGeneralLabels('generator', item, generalLabels)) {
                    hasError = true;
                }
                const modulePrefix = camelCase(item[0].toUpperCase() + item.slice(1));
                const schemaName = `${modulePrefix}GeneratorSchema`;
                const schema = specModule[schemaName];
                
                if (schema) {
                    const paramLabels = extractSchemaLabels(schema);
                    generatorSchemas[item] = { schema, paramLabels };
                    
                    // Self overlap check
                    for (const p of paramLabels) {
                        for (const g of generalLabels) {
                            if (isSubConceptOf(p, g) || isSubConceptOf(g, p)) {
                                console.error(`❌ [generator:${item}] Overlap detected: Schema parameter label '${p}' overlaps with general label '${g}' (taxonomic ancestor relationship exists)`);
                                hasError = true;
                            }
                        }
                    }
                }

                const probType = getGeneratorProblemType(item);
                if (probType) {
                    generatorProblemTypes[item] = probType;
                }
            } catch (e) {
                console.error(`❌ [generator:${item}] Error validating spec:`, e);
                hasError = true;
            }
        }
    }

    // 2. Validate Views & Detect Duplicate Parameterization
    console.log('\n--- Auditing Views ---');
    const viewToProblemType = getViewToProblemTypeMap();
    const viewSchemas: Record<string, { schema: any; paramLabels: string[] }> = {};

    for (const vMod of viewModules) {
        const item = vMod.id;
        const specPath = path.join(vMod.absolutePath, 'spec.ts');
        if (fs.existsSync(specPath)) {
            try {
                const fileUrl = pathToFileURL(specPath).href;
                const specModule = await import(fileUrl);
                const spec = specModule.spec;
                if (!spec) {
                    console.error(`❌ [view:${item}] Missing 'spec' export in spec.ts`);
                    hasError = true;
                    continue;
                }

                const generalLabels = spec.generalLabels || [];
                if (checkRedundantGeneralLabels('view', item, generalLabels)) {
                    hasError = true;
                }
                const modulePrefix = camelCase(item[0].toUpperCase() + item.slice(1));
                const schemaName = `${modulePrefix}ViewSchema`;
                const schema = specModule[schemaName];
                
                if (schema) {
                    const paramLabels = extractSchemaLabels(schema);
                    viewSchemas[item] = { schema, paramLabels };

                    // Self overlap check
                    for (const p of paramLabels) {
                        for (const g of generalLabels) {
                            if (isSubConceptOf(p, g) || isSubConceptOf(g, p)) {
                                console.error(`❌ [view:${item}] Overlap detected: Schema parameter label '${p}' overlaps with general label '${g}' (taxonomic ancestor relationship exists)`);
                                hasError = true;
                            }
                        }
                    }

                    // Duplicate Parameterization Check
                    const viewProblemType = viewToProblemType[item];
                    if (viewProblemType) {
                        // Find matching generators
                        const matchingGenIds = Object.keys(generatorProblemTypes).filter(
                            genId => generatorProblemTypes[genId] === viewProblemType
                        );

                        for (const genId of matchingGenIds) {
                            const genSchemaData = generatorSchemas[genId];
                            if (genSchemaData) {
                                for (const v of paramLabels) {
                                    for (const g of genSchemaData.paramLabels) {
                                        if (isSubConceptOf(v, g) || isSubConceptOf(g, v)) {
                                            console.error(`❌ [view:${item}] Duplicate parameterization: View parameter label '${v}' overlaps with Generator '${genId}' parameter label '${g}' (ancestor relationship exists)`);
                                            hasError = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Double Declaration Check: a view generalLabel that overlaps any
                // label of a same-problem-type generator (generalLabels or schema)
                // re-declares generator-owned capability. Since matching accepts a
                // target label when the generator OR the view supports it, such a
                // label lets the pair match targets the generator cannot satisfy.
                const problemType = viewToProblemType[item];
                if (problemType) {
                    const matchingGenIds = Object.keys(generatorProblemTypes).filter(
                        genId => generatorProblemTypes[genId] === problemType
                    );
                    for (const genId of matchingGenIds) {
                        const genLabels = [
                            ...(generatorGeneralLabels[genId] || []),
                            ...(generatorSchemas[genId]?.paramLabels || [])
                        ];
                        for (const v of generalLabels) {
                            for (const g of genLabels) {
                                if (isSubConceptOf(v, g) || isSubConceptOf(g, v)) {
                                    console.error(`❌ [view:${item}] Double declaration: View general label '${v}' overlaps label '${g}' of matching generator '${genId}' (ancestor relationship exists)`);
                                    hasError = true;
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                console.error(`❌ [view:${item}] Error validating spec:`, e);
                hasError = true;
            }
        }
    }

    if (hasError) {
        console.error('\n❌ Spec validation failed.');
        process.exit(1);
    } else {
        console.log('\n✅ Spec validation succeeded! No generalLabels / parameter overlaps or duplicate parameterizations detected.');
    }
}

validateSpecs().catch(err => {
    console.error(err);
    process.exit(1);
});
