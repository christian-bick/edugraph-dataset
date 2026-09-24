import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
    extractSchemaLabels,
    findSchemaFallbackContractIssues,
    findSchemaLabelResolutionIssues,
    findSchemaResolutionContractIssues
} from '../lib/utils.ts';
import { getViewToProblemTypeMap, getGeneratorProblemTypeFromPath } from '../lib/type-parser.ts';
import { findLeafModules } from '../lib/module-resolver.ts';
import {inspectApplicability} from '../lib/spec-contracts.ts';
import {inspectSpecSource} from '../lib/spec-source-contracts.ts';
import {SourceSymbolIndex} from '../lib/source-symbol-index.ts';
import {validateModuleLabelContract} from '../lib/label-contracts.ts';
import {validateCompatibilityRules} from '../lib/compatibility.ts';
import {inspectPositiveOwnership} from '../lib/spec-ownership.ts';
import {buildCompatibleModulePairIndex} from '../lib/matching.ts';
import {moduleSchemaExportName, type GeneratorModelDescriptor, type ViewModelDescriptor} from '../lib/model-catalog.ts';
import {createWorkCounters} from '../lib/work-counters.ts';
import {inspectModuleInventory} from '../lib/module-inventory.ts';
import {inspectModuleImplementations} from '../lib/implementation-audit.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

function checkSourceContracts(kind: string, item: string, specPath: string,
    sourceIndex: SourceSymbolIndex): boolean {
    const issues = inspectSpecSource(fs.readFileSync(specPath, 'utf8'), specPath, sourceIndex);
    for (const issue of issues) {
        const message = `${issue.rule} at ${specPath}:${issue.line}:${issue.column} `
            + `(${issue.field}): ${issue.message}`;
        if (issue.severity === 'review') console.warn(`⚠️ [${kind}:${item}] ${message}`);
        else console.error(`❌ [${kind}:${item}] ${message}`);
    }
    return issues.some(issue => issue.severity !== 'review');
}

export async function validateSpecs(options: {generatorsDir?: string; viewsDir?: string;
    validateInventory?: boolean} = {}): Promise<boolean> {
    let hasError = false;

    console.log('=== Starting Spec Validation ===');

    const generatorsDir = options.generatorsDir ?? path.resolve(PROJECT_ROOT, 'src/generators');
    const viewsDir = options.viewsDir ?? path.resolve(PROJECT_ROOT, 'src/visuals/views');

    const generatorModules = findLeafModules(generatorsDir);
    const viewModules = findLeafModules(viewsDir);

    const validateInventory = options.validateInventory ?? (!options.generatorsDir && !options.viewsDir);
    const inventoryIssues = validateInventory
        ? inspectModuleInventory({generators: generatorModules, views: viewModules,
            viewTypes: getViewToProblemTypeMap(), generatorRoot: generatorsDir}) : [];
    for (const issue of inventoryIssues) console.error(`❌ [${issue.role}:${issue.module_id}] ${issue.rule} ${issue.file}: ${issue.message}`);
    hasError ||= inventoryIssues.length > 0;

    const generators: GeneratorModelDescriptor[] = [];
    const views: ViewModelDescriptor[] = [];
    const sourceIndex = new SourceSymbolIndex();

    // 1. Validate Generators & Collect Schemas/Problem Types
    console.log('\n--- Auditing Generators ---');
    for (const gMod of generatorModules) {
        const item = gMod.id;
        const specPath = path.join(gMod.absolutePath, 'spec.ts');
        if (fs.existsSync(specPath)) {
            try {
                if (checkSourceContracts('generator', item, specPath, sourceIndex)) {
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

                validateCompatibilityRules(spec.compatibility ?? [], 'generator');
                const generalLabels = spec.generalLabels || [];
                const schemaName = moduleSchemaExportName(item, 'generator');
                const schema = specModule[schemaName];
                if (!schema) {
                    console.error(`❌ [generator:${item}] SPEC-G1 missing '${schemaName}' export in spec.ts`);
                    hasError = true;
                }
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
                }

                const probType = getGeneratorProblemTypeFromPath(path.join(gMod.absolutePath, 'generator.ts'));
                generators.push({generatorId: item, module: gMod, spec, schema,
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
                if (checkSourceContracts('view', item, specPath, sourceIndex)) {
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

                validateCompatibilityRules(spec.compatibility ?? [], 'view');
                const generalLabels = spec.generalLabels || [];
                const schemaName = moduleSchemaExportName(item, 'view');
                const schema = specModule[schemaName];
                if (!schema) {
                    console.error(`❌ [view:${item}] SPEC-V1 missing '${schemaName}' export in spec.ts`);
                    hasError = true;
                }
                for (const issue of validateModuleLabelContract({...spec, schema}, specPath)) {
                    console.error(issue);
                    hasError = true;
                }
                const paramLabels = schema ? extractSchemaLabels(schema) : [];
                const problemType = viewToProblemType[item];
                views.push({viewId: item, module: vMod, spec, schema: schema ?? {},
                    generalLabels, supportedLabels: [...generalLabels, ...paramLabels],
                    problemType});
                
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

            } catch (e) {
                console.error(`❌ [view:${item}] Error validating spec:`, e);
                hasError = true;
            }
        }
    }

    if (validateInventory && inventoryIssues.length === 0) {
        const implementationIssues = inspectModuleImplementations(PROJECT_ROOT, {
            generators: generatorModules, views: viewModules,
            generatorSchemaSizes: new Map(generators.map(generator =>
                [generator.generatorId, Object.keys(generator.schema ?? {}).length]))
        });
        for (const issue of implementationIssues) {
            const message = `[${issue.role}:${issue.module_id}] ${issue.rule} ${issue.file}:${issue.line}:${issue.column}: ${issue.message}`;
            if (issue.severity === 'review') console.warn(`⚠️ ${message}`);
            else console.error(`❌ ${message}`);
        }
        hasError ||= implementationIssues.some(issue => issue.severity !== 'review');
    }

    const counters = createWorkCounters();
    const pairIndex = buildCompatibleModulePairIndex(generators, views, counters);
    const ownershipIssues = inspectPositiveOwnership({
        modules: [
            ...generators.map(generator => ({role: 'generator' as const,
                module_id: generator.generatorId, generalLabels: generator.generalLabels, schema: generator.schema})),
            ...views.map(view => ({role: 'view' as const,
                module_id: view.viewId, generalLabels: view.generalLabels, schema: view.schema}))
        ],
        pairs: pairIndex.orderedPairs.map(pair => ({generatorId: pair.generator.generatorId, viewId: pair.view.viewId})),
        counters
    });
    for (const issue of ownershipIssues) console.error(`❌ ${issue.message}`);
    hasError ||= ownershipIssues.length > 0;
    const applicabilityIssues = inspectApplicability({views, pairIndex, counters});
    for (const issue of applicabilityIssues) console.error(`❌ ${issue.message}`);
    hasError ||= applicabilityIssues.length > 0;
    console.log(`[Work counters] ${JSON.stringify(counters.snapshot())}`);

    if (hasError) {
        console.error('\n❌ Spec validation failed.');
        return false;
    } else {
        console.log('\n✅ Spec validation succeeded! Ability ownership, applicability, overlaps, and parameterization are valid.');
        return true;
    }
}
