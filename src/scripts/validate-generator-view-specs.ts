import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { capabilitySatisfies } from '../lib/ontology.ts';
import {
    extractSchemaLabels,
    findSchemaFallbackContractIssues,
    findSchemaResolutionContractIssues
} from '../lib/utils.ts';
import { getViewToProblemTypeMap, getGeneratorProblemType, isProblemTypeCompatible } from '../lib/type-parser.ts';
import { findLeafModules } from '../lib/module-resolver.ts';
import {
    findAbilityLabels,
    findCrossRoleAreaOverlaps,
    findRejectedLabelContractIssues,
    findRequiredLabelContractIssues
} from '../lib/spec-contracts.ts';
import {findGeneralLabelDeductionIssues} from '../lib/spec-source-contracts.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

const camelCase = (str: string) => str.replace(/-([a-z])/g, g => g[1].toUpperCase());

function checkGeneralLabelDeductions(kind: string, item: string, specPath: string): boolean {
    const issues = findGeneralLabelDeductionIssues(fs.readFileSync(specPath, 'utf8'), specPath);
    for (const issue of issues) {
        console.error(
            `❌ [${kind}:${item}] SPEC-10 violation at spec.ts:${issue.line}:${issue.column}: `
            + 'deductCompatible may declare supported capabilities in a schema, but not invariant generalLabels'
        );
    }
    return issues.length > 0;
}

/**
 * A generalLabels list must not contain a label together with one of its
 * specialization ancestors: the ancestor already covers every target label the
 * specialization covers, so the pair is either redundant or (worse) an
 * over-claim smuggled in via the broad label.
 */
function checkRedundantGeneralLabels(kind: string, item: string, generalLabels: string[]): boolean {
    let hasError = false;
    for (const a of generalLabels) {
        for (const b of generalLabels) {
            if (a !== b && capabilitySatisfies(a, b)) {
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
                if (checkGeneralLabelDeductions('generator', item, specPath)) {
                    hasError = true;
                }
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
                const generalAbilities = findAbilityLabels(generalLabels);
                if (generalAbilities.length > 0) {
                    console.error(`❌ [generator:${item}] Ability labels belong exclusively to views: ${generalAbilities.join(', ')}`);
                    hasError = true;
                }
                const modulePrefix = camelCase(item[0].toUpperCase() + item.slice(1));
                const schemaName = `${modulePrefix}GeneratorSchema`;
                const schema = specModule[schemaName];
                
                if (schema) {
                    for (const issue of findSchemaResolutionContractIssues(schema)) {
                        const detail = issue.kind === 'empty-supported-labels'
                            ? 'has no supported capability labels'
                            : 'uses an unmarked function-only resolver; wrap ontology-neutral seeded choices with ontologyNeutral()';
                        console.error(`❌ [generator:${item}] Schema parameter '${issue.field}' ${detail}`);
                        hasError = true;
                    }
                    for (const issue of findSchemaFallbackContractIssues(schema)) {
                        console.error(`❌ [generator:${item}] Schema parameter '${issue.field}' cannot resolve supported fallback '${issue.label}' (${issue.reason})`);
                        hasError = true;
                    }
                    const paramLabels = extractSchemaLabels(schema);
                    generatorSchemas[item] = { schema, paramLabels };

                    const parameterAbilities = findAbilityLabels(paramLabels);
                    if (parameterAbilities.length > 0) {
                        console.error(`❌ [generator:${item}] Ability labels belong exclusively to views: ${parameterAbilities.join(', ')}`);
                        hasError = true;
                    }
                    
                    // Self overlap check
                    for (const p of paramLabels) {
                        for (const g of generalLabels) {
                            if (capabilitySatisfies(p, g) || capabilitySatisfies(g, p)) {
                                console.error(`❌ [generator:${item}] Overlap detected: Schema parameter label '${p}' overlaps with general label '${g}' (specialization relationship exists)`);
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
                if (checkGeneralLabelDeductions('view', item, specPath)) {
                    hasError = true;
                }
                const fileUrl = pathToFileURL(specPath).href;
                const specModule = await import(fileUrl);
                const spec = specModule.spec;
                if (!spec) {
                    console.error(`❌ [view:${item}] Missing 'spec' export in spec.ts`);
                    hasError = true;
                    continue;
                }

                const generalLabels = spec.generalLabels || [];
                const requiredLabels = spec.requiredLabels || [];
                const rejectedLabels = spec.rejectedLabels || [];
                if (checkRedundantGeneralLabels('view', item, generalLabels)) {
                    hasError = true;
                }
                const modulePrefix = camelCase(item[0].toUpperCase() + item.slice(1));
                const schemaName = `${modulePrefix}ViewSchema`;
                const schema = specModule[schemaName];
                const paramLabels = schema ? extractSchemaLabels(schema) : [];
                const problemType = viewToProblemType[item];
                const matchingGenIds = problemType
                    ? Object.keys(generatorProblemTypes).filter(
                        genId => isProblemTypeCompatible(generatorProblemTypes[genId], problemType)
                    )
                    : [];
                
                if (schema) {
                    for (const issue of findSchemaResolutionContractIssues(schema)) {
                        const detail = issue.kind === 'empty-supported-labels'
                            ? 'has no supported capability labels'
                            : 'uses an unmarked function-only resolver; wrap ontology-neutral seeded choices with ontologyNeutral()';
                        console.error(`❌ [view:${item}] Schema parameter '${issue.field}' ${detail}`);
                        hasError = true;
                    }
                    for (const issue of findSchemaFallbackContractIssues(schema)) {
                        console.error(`❌ [view:${item}] Schema parameter '${issue.field}' cannot resolve supported fallback '${issue.label}' (${issue.reason})`);
                        hasError = true;
                    }
                    viewSchemas[item] = { schema, paramLabels };

                    // Self overlap check
                    for (const p of paramLabels) {
                        for (const g of generalLabels) {
                            if (capabilitySatisfies(p, g) || capabilitySatisfies(g, p)) {
                                console.error(`❌ [view:${item}] Overlap detected: Schema parameter label '${p}' overlaps with general label '${g}' (specialization relationship exists)`);
                                hasError = true;
                            }
                        }
                    }

                    // Duplicate Parameterization Check
                    if (problemType) {
                        for (const genId of matchingGenIds) {
                            const genSchemaData = generatorSchemas[genId];
                            if (genSchemaData) {
                                for (const v of paramLabels) {
                                    for (const g of genSchemaData.paramLabels) {
                                        if (capabilitySatisfies(v, g)
                                            || capabilitySatisfies(g, v)) {
                                            console.error(`❌ [view:${item}] Duplicate parameterization: View parameter label '${v}' overlaps with Generator '${genId}' parameter label '${g}' (specialization relationship exists)`);
                                            hasError = true;
                                        }
                                    }
                                }
                            }
                            const areaOverlaps = findCrossRoleAreaOverlaps({
                                generatorLabels: generatorGeneralLabels[genId] || [],
                                viewLabels: paramLabels
                            });
                            for (const overlap of areaOverlaps) {
                                console.error(`❌ [view:${item}] Cross-role Area refinement: View schema label '${overlap.viewLabel}' overlaps invariant Area '${overlap.generatorLabel}' of matching generator '${genId}'; contextual refinements of one Area belong in Scope`);
                                hasError = true;
                            }
                        }
                    }
                }

                const requiredLabelIssues = findRequiredLabelContractIssues({
                    requiredLabels,
                    viewSupportedLabels: [...generalLabels, ...paramLabels],
                    rejectedLabels,
                    compatibleGenerators: matchingGenIds.map(generatorId => ({
                        generatorId,
                        supportedLabels: [
                            ...(generatorGeneralLabels[generatorId] || []),
                            ...(generatorSchemas[generatorId]?.paramLabels || [])
                        ]
                    }))
                });
                for (const issue of requiredLabelIssues) {
                    if (issue.kind === 'required-and-rejected-label') {
                        console.error(`❌ [view:${item}] Required label '${issue.label}' is also rejected, making the view contract impossible`);
                    } else if (issue.kind === 'no-compatible-generator') {
                        console.error(`❌ [view:${item}] requiredLabels cannot be evaluated because the view has no compatible generator`);
                    } else {
                        console.error(`❌ [view:${item}] Required label '${issue.label}' is not supported by compatible pair '${issue.generatorId}#${item}'`);
                    }
                    hasError = true;
                }

                const rejectedLabelIssues = findRejectedLabelContractIssues({
                    rejectedLabels
                });
                for (const issue of rejectedLabelIssues) {
                    console.error(`❌ [view:${item}] Rejected label '${issue.label}' is an Ability; rejectedLabels may only express stable, complete exclusion boundaries`);
                    hasError = true;
                }

                // Double Declaration Check: a view generalLabel that overlaps any
                // label of a same-problem-type generator (generalLabels or schema)
                // re-declares generator-owned capability. Since matching accepts a
                // target label when the generator OR the view supports it, such a
                // label lets the pair match targets the generator cannot satisfy.
                if (problemType) {
                    for (const genId of matchingGenIds) {
                        const genLabels = [
                            ...(generatorGeneralLabels[genId] || []),
                            ...(generatorSchemas[genId]?.paramLabels || [])
                        ];
                        for (const v of generalLabels) {
                            for (const g of genLabels) {
                                if (capabilitySatisfies(v, g) || capabilitySatisfies(g, v)) {
                                    console.error(`❌ [view:${item}] Double declaration: View general label '${v}' overlaps label '${g}' of matching generator '${genId}' (specialization relationship exists)`);
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
        console.log('\n✅ Spec validation succeeded! Ability ownership, applicability, overlaps, and parameterization are valid.');
    }
}

validateSpecs().catch(err => {
    console.error(err);
    process.exit(1);
});
