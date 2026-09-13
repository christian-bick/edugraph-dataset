import {normalizeAndValidateSpec} from './spec-validator.ts';
import {loadSpecTodos} from './spec-catalog.ts';
import {labelContractIndex, validateTargetLabelContract} from './label-contracts.ts';
import {findGeneratorsWithoutTestPath,
    type GeneratorCatalogEntry, type ViewCatalogEntry} from './generation.ts';
import {matchTargetsDelta, matchingPolicyInputHash} from './matching.ts';
import {readDatasetManifest, datasetOntologyProvenanceHash} from './dataset-manifest.ts';
import {datasetDirForSpec, datasetOutDir} from './dataset-paths.ts';
import {DEPENDENCY_GRAPH_SCHEMA_VERSION, DEPENDENCY_PLANNER_EPOCH} from './dependency-planner.ts';

export function readStandardsMatchingGraph(projectRoot: string, specName: string) {
    const manifest = readDatasetManifest(datasetOutDir(projectRoot, datasetDirForSpec(specName)));
    const graph = manifest?.dependency_graph;
    return manifest?.spec === specName && graph?.complete
        && graph.schema_version === DEPENDENCY_GRAPH_SCHEMA_VERSION
        && graph.planner_epoch === DEPENDENCY_PLANNER_EPOCH
        && manifest.ontology_provenance_hash === datasetOntologyProvenanceHash(projectRoot)
        ? graph : null;
}

/** Shared mandatory standards gate for dedicated, full, affected and CI commands. */
export async function validateStandardContracts(specName: string,
    generators: GeneratorCatalogEntry[], views: ViewCatalogEntry[], specRoot?: string,
    affectedProjectRoot?: string) {
    const [result, todos] = await Promise.all([
        normalizeAndValidateSpec(specName, specRoot),
        loadSpecTodos(specName, specRoot)
    ]);
    for (const target of result.targets) {
        result.errors.push(...validateTargetLabelContract(target.labels, `${specName}:${target.id}`));
    }
    for (const target of todos.implementationTodos) {
        result.errors.push(...labelContractIndex.validate(target.labels, `${specName}:implementationTodos:${target.id}`));
    }
    if (result.errors.length) return result;
    const matching = matchTargetsDelta({targets: result.targets, generatorCatalog: generators,
        viewCatalog: views, specName, policyHash: matchingPolicyInputHash(),
        previousGraph: affectedProjectRoot ? readStandardsMatchingGraph(affectedProjectRoot, specName) : null});
    const matched = new Set(matching.tuples.map(tuple => tuple.target.id));
    for (const target of result.targets.filter(target => !matched.has(target.id))) {
        result.errors.push(`TSPEC-9 ${specName}:${target.id}: active target has no compatible generator/view path.`);
    }
    if (specName === 'test') {
        for (const generator of findGeneratorsWithoutTestPath(result.targets, generators, views, 10, matching.tuples)) {
            result.errors.push(`TSPEC-12 test: generator '${generator}' has no generatable target/view path.`);
        }
    }
    return result;
}
