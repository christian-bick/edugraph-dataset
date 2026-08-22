import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveOntologyProvenance} from '../lib/coverage-identity.ts';
import {
    buildOntologySemanticSnapshot,
    diffOntologySemantics,
    ontologySemanticProvenanceMatches,
    readOntologySemanticSnapshot,
    readStandardsSemanticSnapshot,
    standardsSemanticProvenanceMatches
} from '../lib/external-semantics.ts';
import {readPinnedStandardsProvenance} from '../lib/standards-source.ts';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function main(): Promise<void> {
    const issues: string[] = [];
    const standards = readStandardsSemanticSnapshot(projectRoot);
    const standardsProvenance = readPinnedStandardsProvenance(projectRoot);
    if (!standards) issues.push('The committed CCSS semantic snapshot is missing.');
    else if (!standardsSemanticProvenanceMatches(standards, standardsProvenance)) {
        issues.push('The CCSS semantic snapshot does not match config/external-sources.json.');
    }

    const ontology = readOntologySemanticSnapshot(projectRoot);
    const ontologyProvenance = resolveOntologyProvenance(projectRoot);
    if (!ontology) issues.push('The committed ontology semantic snapshot is missing.');
    else {
        if (!ontologySemanticProvenanceMatches(ontology, ontologyProvenance)) {
            issues.push('The ontology semantic snapshot does not match the pinned package provenance.');
        }
        const current = buildOntologySemanticSnapshot({provenance: ontologyProvenance});
        const delta = diffOntologySemantics(ontology, current);
        if (delta.entities.added.length > 0
            || delta.entities.changed.length > 0
            || delta.entities.removed.length > 0
            || delta.relations.added.length > 0
            || delta.relations.changed.length > 0
            || delta.relations.removed.length > 0) {
            issues.push('The installed ontology semantics differ from the committed ontology semantic snapshot.');
        }
        if (!ontology.usages?.ccss) issues.push('The ontology semantic snapshot has no CCSS usage closure.');
    }

    if (issues.length > 0) {
        for (const issue of issues) console.error(`❌ ${issue}`);
        console.error('External updates remain ignored until the corresponding explicit update command is applied.');
        process.exitCode = 1;
        return;
    }
    console.log(
        `✅ External semantic baselines verified: ${Object.keys(standards!.records).length} CCSS records, `
        + `${Object.keys(ontology!.entities).length} ontology entities, `
        + `${Object.keys(ontology!.relations).length} ontology relations.`
    );
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});
