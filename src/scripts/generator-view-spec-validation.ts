import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
    extractSchemaLabels,
    findSchemaFallbackContractIssues,
    findSchemaLabelResolutionIssues,
    findSchemaResolutionContractIssues
} from '../lib/utils.ts';
import { getViewToProblemTypeMap, getGeneratorProblemType, isProblemTypeCompatible } from '../lib/type-parser.ts';
import { findLeafModules } from '../lib/module-resolver.ts';
import {
    findRejectedLabelContractIssues,
    findRequiredLabelContractIssues
} from '../lib/spec-contracts.ts';
import {findGeneralLabelDeductionIssues} from '../lib/spec-source-contracts.ts';
import {validateModuleLabelContract} from '../lib/label-contracts.ts';
import {inspectPositiveOwnership} from '../lib/spec-ownership.ts';
import {buildCompatibleModulePairIndex} from '../lib/matching.ts';
import {moduleSchemaExportName, type GeneratorModelDescriptor, type ViewModelDescriptor} from '../lib/model-catalog.ts';
import {createWorkCounters} from '../lib/work-counters.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

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

export async function validateSpecs(options: {generatorsDir?: string; viewsDir?: string} = {}): Promise<boolean> {
    let hasError = false;

    console.log('=== Starting Spec Validation ===');

    const generatorsDir = options.generatorsDir ?? path.resolve(PROJECT_ROOT, 'src/generators');
    const viewsDir = options.viewsDir ?? path.resolve(PROJECT_ROOT, 'src/visuals/views');

    const generatorModules = findLeafModules(generatorsDir);
    const viewModules = findLeafModules(viewsDir);

    const generatorSchemaLabels: Record<string, string[]> = {};
    const generatorGeneralLabels: Record<string, string[]> = {};
    const generatorProblemTypes: Record<string, string> = {};
    const ownershipGenerators: GeneratorModelDescriptor[] = [];
    const ownershipViews: ViewModelDescriptor[] = [];

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
                const schemaName = moduleSchemaExportName(item, 'generator');
                const schema = specModule[schemaName];
                for (const issue of validateModuleLabelContract({...spec, schema}, specPath)) {
                    console.error(issue);
                    hasError = true;
                }
                
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
                    for (const issue of findSchemaLabelResolutionIssues(schema)) {
                        console.error(`❌ [generator:${item}] Schema parameter '${issue.field}' has multiple supported labels but no declared exact, predicate, aggregate, or compositional resolution contract`);
                        hasError = true;
                    }
                    const paramLabels = extractSchemaLabels(schema);
                    generatorSchemaLabels[item] = paramLabels;
                }

                const probType = getGeneratorProblemType(item);
                if (probType) {
                    generatorProblemTypes[item] = probType;
                }
                ownershipGenerators.push({generatorId: item, module: gMod, spec, schema,
                    generalLabels, labels: [...generalLabels, ...extractSchemaLabels(schema ?? {})],
                    problemType: probType});
            } catch (e) {
                console.error(`❌ [generator:${item}] Error validating spec:`, e);
                hasError = true;
            }
        }
    }

    // 2. Validate Views & Detect Duplicate Parameterization
    console.log('\n--- Auditing Views ---');
    const viewToProblemType = getViewToProblemTypeMap();

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
                const schemaName = moduleSchemaExportName(item, 'view');
                const schema = specModule[schemaName];
                for (const issue of validateModuleLabelContract({...spec, schema}, specPath)) {
                    console.error(issue);
                    hasError = true;
                }
                const paramLabels = schema ? extractSchemaLabels(schema) : [];
                const problemType = viewToProblemType[item];
                ownershipViews.push({viewId: item, module: vMod, spec, schema: schema ?? {},
                    generalLabels, supportedLabels: [...generalLabels, ...paramLabels],
                    requiredLabels, rejectedLabels, problemType});
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
                    for (const issue of findSchemaLabelResolutionIssues(schema)) {
                        console.error(`❌ [view:${item}] Schema parameter '${issue.field}' has multiple supported labels but no declared exact, predicate, aggregate, or compositional resolution contract`);
                        hasError = true;
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
                            ...(generatorSchemaLabels[generatorId] || [])
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

            } catch (e) {
                console.error(`❌ [view:${item}] Error validating spec:`, e);
                hasError = true;
            }
        }
    }

    const counters = createWorkCounters();
    const pairIndex = buildCompatibleModulePairIndex(ownershipGenerators, ownershipViews, counters);
    const ownershipIssues = inspectPositiveOwnership({
        modules: [
            ...ownershipGenerators.map(generator => ({role: 'generator' as const,
                module_id: generator.generatorId, generalLabels: generator.generalLabels, schema: generator.schema})),
            ...ownershipViews.map(view => ({role: 'view' as const,
                module_id: view.viewId, generalLabels: view.generalLabels, schema: view.schema}))
        ],
        pairs: pairIndex.orderedPairs.map(pair => ({generatorId: pair.generator.generatorId, viewId: pair.view.viewId})),
        counters
    });
    for (const issue of ownershipIssues) console.error(`❌ ${issue.message}`);
    hasError ||= ownershipIssues.length > 0;
    console.log(`[Work counters] ${JSON.stringify(counters.snapshot())}`);

    if (hasError) {
        console.error('\n❌ Spec validation failed.');
        return false;
    } else {
        console.log('\n✅ Spec validation succeeded! Ability ownership, applicability, overlaps, and parameterization are valid.');
        return true;
    }
}
