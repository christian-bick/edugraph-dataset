import {resolve} from 'node:path';
import {Scope} from 'edugraph-ts';
import {beforeAll, describe, expect, it, vi} from 'vitest';
import {spec as gradeFourTargets} from '../spec/ccss/grade-04.ts';
import {buildAssetIndex, missingTargetAssetEvidence, publishedLabelsCoverRequested, targetLookupKey} from './asset-index.ts';
import {validateGenerationSelectionReceipt} from './compatibility.ts';
import type {MetadataRow} from './dataset-metadata.ts';
import {loadGeneratorCatalog, loadViewCatalog, type GeneratorCatalogEntry, type ViewCatalogEntry} from './generation.ts';
import {generateModuleSamples} from './generation-orchestration.ts';
import {matchTargets} from './matching.ts';
import {bindingsForSelection} from './planned-generation.ts';
import {shortenLabel} from './utils.ts';

const moduleId = 'shape-classify-attributes';
let generator: GeneratorCatalogEntry;
let view: ViewCatalogEntry;

beforeAll(async () => {
    const [generators, views] = await Promise.all([
        loadGeneratorCatalog(undefined, undefined, new Map([[moduleId,
            resolve('src/generators/shape/shape-classify-attributes/generator.ts')]])),
        loadViewCatalog(undefined, undefined, new Map([[moduleId,
            resolve('src/visuals/views/shape/shape-classify-attributes/view.tsx')]]))
    ]);
    [generator] = generators;
    [view] = views;
}, 60_000);

describe('Grade 4 shape classification asset associations', () => {
    it.each([
        ['ce415298', 'classify-line-relations~de328e3a'],
        ['e9178e52', 'classify-line-relations~f9f6aed4'],
        ['0800aa71', 'classify-angle-size~e71f1a71'],
        ['16bafa93', 'classify-angle-size~01ffd3a5'],
        ['b359f251', 'classify-angle-size~9764bcf9']
    ])('retains exact asset evidence when recognition %s represents %s', (recognitionHash, classificationSuffix) => {
        const recognitionId = `4.G.A.1-identify-geometric-primitives~${recognitionHash}`;
        const classificationId = `4.G.A.2-${classificationSuffix}`;
        const targets = [recognitionId, classificationId].map(id => {
            const target = gradeFourTargets.find(candidate => candidate.id === id);
            if (!target) throw new Error(`Missing production regression target: ${id}`);
            return target;
        });
        const {tuples} = matchTargets(targets, [generator], [view]);
        expect(tuples.map(tuple => tuple.target.id)).toEqual([recognitionId, classificationId]);
        const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const samples = (() => {
            try {
                return generateModuleSamples(generator, new Map([[view.viewId, view]]), tuples,
                    'train', new Map(), new Map());
            } finally {
                warning.mockRestore();
            }
        })();

        // One physical question/solution pair serves both exact target permutations.
        expect(samples).toHaveLength(2);
        const question = samples.find(sample => sample.identity.mode === 'question')!;
        expect(question.identity.targetId).toBe(recognitionId);
        expect(question.associatedTargetIds).toEqual(new Set([classificationId]));
        expect(question.problem.labels).toContain(Scope.ShapeAttributes);
        expect(question.plan.domains.some(domain => domain.field === 'shapeAttributes')).toBe(false);
        const associationPlan = question.associatedPlans.get(classificationId)!;
        const associationReceipt = question.associatedSelections.get(classificationId)!;
        expect(validateGenerationSelectionReceipt(associationPlan, associationReceipt)).toEqual(associationReceipt);
        expect(bindingsForSelection(associationPlan, associationReceipt))
            .toEqual(bindingsForSelection(question.plan, question.replay.selection));
        expect(publishedLabelsCoverRequested(question.problem.labels, targets[1].labels)).toBe(true);

        const rows: MetadataRow[] = samples.map(sample => ({
            file_name: sample.fileName, sample_key: sample.sampleKey, spec: 'ccss',
            target_id: sample.identity.targetId, generator: moduleId, view: moduleId,
            mode: sample.identity.mode, instance: sample.identity.instanceIdx,
            content_fingerprint: sample.contentFingerprint, task_fingerprint: sample.taskFingerprint,
            labels: sample.problem.labels.map(shortenLabel),
            generation_plan_hash: sample.plan.hash, generation_plan: sample.plan,
            generation_replay: sample.replay, prepared_view: sample.preparedView,
            target_associations: [...sample.associatedTargetIds].map(targetId => ({
                spec: 'ccss', target_id: targetId,
                generation_plan_hash: sample.associatedPlans.get(targetId)!.hash,
                generation_plan: sample.associatedPlans.get(targetId)!,
                selection: sample.associatedSelections.get(targetId)!
            }))
        }));
        const persistedRows = JSON.parse(JSON.stringify(rows)) as MetadataRow[];
        const index = buildAssetIndex({
            rows: persistedRows.map(row => ({split: 'train', row})),
            targetLabels: new Map(targets.map(target => [targetLookupKey('ccss', target.id), target.labels])),
            repository: 'owner/regression', revision: 'regression', generatedAt: 'fixed'
        });
        expect(missingTargetAssetEvidence(index, targets)).toEqual([]);
        expect(index.label_sets).toHaveLength(2);
        expect(new Set(index.label_sets.flatMap(group => group.samples.map(sample => sample.file_name))).size)
            .toBe(2);
    });
});
