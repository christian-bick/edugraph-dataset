import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildVqaPromptParts, buildVqaSampleProvenance, refreshCachedVqaProvenance, getChecklistPaths, initVqaClient, resolveViewChecklistPaths, evaluateSampleVqa as evaluateWithRecipe, type EvaluateSampleVqaInput } from './vqa-evaluator.ts';
import { resolve } from 'path';
import { writeFileSync, mkdirSync, existsSync, readFileSync, rmSync } from 'fs';
import { VqaCacheManager, type VqaCacheEntry } from './vqa-cache.ts';
import { findLeafModules } from './module-resolver.ts';
import {planCompatibility, sampleGenerationPlan} from './compatibility.ts';
import {computeSampleSeed} from './generation.ts';
import {readSampleReplayRecord} from './sample-replay.ts';

function preparedInput(input: Omit<EvaluateSampleVqaInput, 'generationPlan' | 'generationReplay'>): EvaluateSampleVqaInput {
    const parts = input.sampleKey.split('#');
    parts[2] = input.viewId;
    const sampleKey = parts.join('#');
    const result = planCompatibility({identity: {targetId: input.targetId, generatorId: input.generatorId, viewId: input.viewId},
        targetLabels: [], generatorLabels: [], viewLabels: [], fields: []});
    if (!result.supported) throw new Error('Invalid VQA test plan');
    const seed = computeSampleSeed(sampleKey, input.attempt);
    return {...input, sampleKey, seed, generationPlan: result.plan, generationReplay: {version: 1,
        sampleKey, seed, attempt: input.attempt, selection: sampleGenerationPlan(result.plan, () => 0)}};
}

const evaluateSampleVqa = (input: Omit<EvaluateSampleVqaInput, 'generationPlan' | 'generationReplay'>) => evaluateWithRecipe(preparedInput(input));

// Mock @google/genai
const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: class {
            models = {
                generateContent: mockGenerateContent
            };

            constructor(public options: { apiKey: string }) {}
        }
    };
});

describe('vqa-evaluator', () => {
    const tmpDir = resolve(__dirname, '../../temp/vqa-test');
    const tmpImgPath = resolve(tmpDir, 'test-sample.png');
    const tmpCacheDir = resolve(tmpDir, 'cache');
    const testViewId = 'operations-vertical';

    beforeEach(() => {
        vi.clearAllMocks();
        if (existsSync(tmpDir)) {
            rmSync(tmpDir, { recursive: true, force: true });
        }
        mkdirSync(tmpDir, { recursive: true });
        writeFileSync(tmpImgPath, Buffer.from('fake-png-data'));
    });

    it('resolves exactly the global and leaf checklist for a view', () => {
        const paths = getChecklistPaths('operations-vertical');
        expect(paths).toHaveLength(2);
        expect(paths[0]).toMatch(/views[\\/]checklist\.md$/);
        expect(paths[1]).toMatch(/operations[\\/]operations-vertical[\\/]checklist\.md$/);
    });

    it('has a resolvable checklist for every discovered view', () => {
        const viewsRoot = resolve(__dirname, '../visuals/views');
        const views = findLeafModules(viewsRoot);

        expect(views.length).toBeGreaterThan(0);
        for (const view of views) {
            const paths = resolveViewChecklistPaths(viewsRoot, view.id);
            expect(paths).toHaveLength(2);
            const leafChecklist = readFileSync(paths[1], 'utf-8');
            expect(leafChecklist).toMatch(/^- \*\*Identity:\*\*/);
            expect(leafChecklist).not.toMatch(/^#/m);
        }
    });

    it('separates system instructions from labels and the concatenated checklists', () => {
        const prompt = buildVqaPromptParts({
            modeName: 'question',
            labelDefinitions: [{
                iri: 'http://edugraph.io/edu/NumbersWithZero',
                label: 'NumbersWithZero',
                definition: 'Involves zero as a number.'
            }],
            globalChecklist: '## Global rules\n\n- Global criterion.',
            viewChecklist: '- **Identity:** View criterion.\n- **Modes:** Mode criterion.'
        });

        expect(prompt.systemInstruction).toContain('senior Visual QA engineer');
        expect(prompt.systemInstruction).not.toContain('Global criterion');
        expect(prompt.userPrompt).not.toContain('senior Visual QA engineer');
        expect(prompt.userPrompt).toMatch(/^Mode: Question Mode/);
        expect(prompt.userPrompt).toContain('## Ontology labels');
        expect(prompt.userPrompt).toContain('NumbersWithZero: Involves zero as a number.');
        expect(prompt.userPrompt).toContain('## View-specific checklist\n\n- **Identity:** View criterion.');
        expect(prompt.userPrompt).toContain('## Global rules\n\n- Global criterion.');
        expect(prompt.userPrompt.indexOf('## View-specific checklist'))
            .toBeLessThan(prompt.userPrompt.indexOf('## Global rules'));
        expect(prompt.userPrompt).not.toContain('Generator:');
        expect(prompt.userPrompt).not.toContain('View:');
        expect(prompt.userPrompt).not.toContain('Part 1');
        expect(prompt.userPrompt).not.toContain('<global-checklist>');
    });

    it('rejects a missing global view checklist', () => {
        const viewsRoot = resolve(tmpDir, 'views');
        mkdirSync(resolve(viewsRoot, 'category', 'sample-view'), { recursive: true });
        writeFileSync(resolve(viewsRoot, 'category', 'sample-view', 'spec.ts'), 'export const spec = {};');
        writeFileSync(resolve(viewsRoot, 'category', 'sample-view', 'checklist.md'), '# Sample');

        expect(() => resolveViewChecklistPaths(viewsRoot, 'sample-view'))
            .toThrow('Missing global view checklist');
    });

    it('rejects a missing leaf view checklist', () => {
        const viewsRoot = resolve(tmpDir, 'views');
        mkdirSync(resolve(viewsRoot, 'category', 'sample-view'), { recursive: true });
        writeFileSync(resolve(viewsRoot, 'checklist.md'), '# Global');
        writeFileSync(resolve(viewsRoot, 'category', 'sample-view', 'spec.ts'), 'export const spec = {};');

        expect(() => resolveViewChecklistPaths(viewsRoot, 'sample-view'))
            .toThrow('Missing checklist for view "sample-view"');
    });

    it('rejects an unknown view', () => {
        const viewsRoot = resolve(tmpDir, 'views');
        mkdirSync(viewsRoot, { recursive: true });
        writeFileSync(resolve(viewsRoot, 'checklist.md'), '# Global');

        expect(() => resolveViewChecklistPaths(viewsRoot, 'fake-view'))
            .toThrow('Cannot resolve checklist for unknown view: fake-view');
    });

    it('returns null when initializing the VQA client without an API key', () => {
        const client = initVqaClient('');
        expect(client).toBeNull();
    });

    it('returns a client when initializing VQA with an explicit API key', () => {
        const client = initVqaClient('fake-key');
        expect(client).not.toBeNull();
    });

    it('returns null when evaluateSampleVqa image does not exist', async () => {
        const result = await evaluateSampleVqa({
            imagePath: resolve(tmpDir, 'non-existent.png'),
            sampleKey: 'test#gen#view#train#question#inst:0',
            targetId: 'test',
            generatorId: 'gen',
            viewId: testViewId,
            modeName: 'question',
            instanceIdx: 0,
            attempt: 1,
            seed: 123,
            fileName: 'non-existent.png',
            labels: ['NumbersWithZero'],
            apiKey: 'fake-key'
        });
        expect(result).toBeNull();
    });

    it('evaluates a sample with mocked Gemini VQA response and updates cache', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                pass: true,
                general_checks: {
                    no_overlaps: true,
                    no_placeholders: true,
                    sane_padding: true,
                    task_identifiable: true,
                    mode_valid: true,
                    text_minimal: true,
                    math_coherent: true
                },
                label_checks: [{
                    label: 'NumbersWithZero',
                    verdict: 'defendable',
                    evidence: 'A zero is visible.'
                }],
                reasoning: 'looks good'
            })
        });

        const cacheManager = new VqaCacheManager(tmpCacheDir, 'dataset-test', 'gen');
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        const result = await evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'test#gen#view#train#question#inst:0',
            targetId: 'test',
            generatorId: 'gen',
            viewId: testViewId,
            modeName: 'question',
            instanceIdx: 0,
            attempt: 1,
            seed: 123,
            fileName: 'test-sample.png',
            labels: ['NumbersWithZero'],
            apiKey: 'test-api-key',
            cacheManager,
            logPrompt: true
        });

        expect(result).not.toBeNull();
        expect(result?.isLiveEvaluated).toBe(true);
        expect(result?.entry.evaluation.pass).toBe(true);
        expect(result?.entry.evaluation.reasoning).toBe('');
        expect(result?.entry.evaluation.label_checks[0].verdict).toBe('defendable');
        expect(result?.entry.label_context_hash).toHaveLength(16);
        expect(result?.entry.validation_context_hash).toHaveLength(16);

        const request = mockGenerateContent.mock.calls[0][0];
        const prompt = request.contents[0] as string;
        expect(request.config.systemInstruction).toContain('senior Visual QA engineer');
        expect(request.config.systemInstruction).not.toContain('Global Visual QA Checklist');
        expect(prompt).toContain('## View-specific checklist');
        expect(prompt).toContain('A vertical arithmetic equation presents all operands and makes the result the single visible unknown.');
        expect(prompt).toContain('## Global Visual QA Checklist');
        expect(prompt).toContain('NumbersWithZero: Involves zero as a number.');
        expect(prompt).not.toContain('Generator:');
        expect(prompt).not.toContain('View:');
        expect(prompt).not.toContain('sections below are concatenated');
        expect(prompt).not.toContain('<global-checklist>');
        expect(prompt).not.toContain('# Vertical Operations');
        const centralChecklist = readFileSync(getChecklistPaths(testViewId)[0], 'utf-8');
        expect(centralChecklist).toContain('`defendable`');
        expect(centralChecklist).toContain('`not_defendable`');
        expect(centralChecklist).toContain('`defendable` and `uncertain` pass; `not_defendable` fails.');
        expect(prompt).not.toContain('For every ontology label, judge whether');
        expect(request.model).toBe('gemini-3.5-flash');
        expect(request.config.responseMimeType).toBe('application/json');
        expect(request.config.responseJsonSchema.properties.label_checks.type).toBe('array');
        expect(request.contents[1].inlineData.mimeType).toBe('image/png');
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--- SYSTEM INSTRUCTION ---'));
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('--- USER PROMPT ---'));
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('test#gen#operations-vertical#train#question#inst:0'));
        logSpy.mockRestore();

        // Second evaluation should return from cache without calling Gemini again
        const cachedResult = await evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'test#gen#view#train#question#inst:0',
            targetId: 'test',
            generatorId: 'gen',
            viewId: testViewId,
            modeName: 'question',
            instanceIdx: 0,
            attempt: 1,
            seed: 123,
            fileName: 'test-sample.png',
            labels: ['NumbersWithZero'],
            apiKey: 'test-api-key',
            cacheManager
        });

        expect(cachedResult?.isLiveEvaluated).toBe(false);
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        expect(result?.entry.generation_plan?.hash).toBe(result?.entry.generation_plan_hash);
        expect(result?.entry.generation_replay?.selection.planHash).toBe(result?.entry.generation_plan_hash);
        expect(cachedResult?.entry.generation_replay).toEqual(result?.entry.generation_replay);
        expect(new VqaCacheManager(tmpCacheDir, 'dataset-test', 'gen').entries()[0].generation_replay).toEqual(result?.entry.generation_replay);

        // The visual verdict is content-addressed; provenance belongs to the
        // current artifact even when the same pixels were validated before.
        const reusedForAnotherTarget = await evaluateSampleVqa({
            imagePath: tmpImgPath, sampleKey: 'another#gen#view#train#question#inst:0',
            targetId: 'another', generatorId: 'gen', viewId: testViewId, modeName: 'question',
            instanceIdx: 0, attempt: 2, seed: 123, fileName: 'test-sample.png',
            labels: ['NumbersWithZero'], apiKey: 'test-api-key', cacheManager
        });
        expect(reusedForAnotherTarget?.isLiveEvaluated).toBe(false);
        expect(reusedForAnotherTarget?.entry.target_id).toBe('another');
        expect(reusedForAnotherTarget?.entry.generation_plan?.identity.targetId).toBe('another');
        expect(reusedForAnotherTarget?.entry.generation_replay?.attempt).toBe(2);
        expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    });

    it('returns null if no API key is provided and cache misses', async () => {
        const result = await evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'test2#gen#view#train#question#inst:0',
            targetId: 'test2',
            generatorId: 'gen',
            viewId: testViewId,
            modeName: 'question',
            instanceIdx: 0,
            attempt: 1,
            seed: 123,
            fileName: 'test-sample.png',
            labels: ['NumbersWithZero'],
            apiKey: ''
        });
        expect(result).toBeNull();
    });

    it('rejects a Gemini response without text', async () => {
        mockGenerateContent.mockResolvedValueOnce({text: undefined});

        await expect(evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'empty#gen#view#train#question#inst:0',
            targetId: 'empty',
            generatorId: 'gen',
            viewId: testViewId,
            modeName: 'question',
            instanceIdx: 0,
            attempt: 1,
            seed: 123,
            fileName: 'test-sample.png',
            labels: ['NumbersWithZero'],
            apiKey: 'test-api-key'
        })).rejects.toThrow('Gemini returned no text');
    });

    it('passes uncertain label judgements', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                pass: true,
                general_checks: {
                    no_overlaps: true,
                    no_placeholders: true,
                    sane_padding: true,
                    task_identifiable: true,
                    mode_valid: true,
                    text_minimal: true,
                    math_coherent: true
                },
                label_checks: [{
                    label: 'NumbersWithZero',
                    verdict: 'uncertain',
                    evidence: 'The value may be implied.'
                }],
                reasoning: ''
            })
        });

        const result = await evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'uncertain#gen#view#train#question#inst:0',
            targetId: 'uncertain',
            generatorId: 'gen',
            viewId: testViewId,
            modeName: 'question',
            instanceIdx: 0,
            attempt: 1,
            seed: 123,
            fileName: 'test-sample.png',
            labels: ['NumbersWithZero'],
            apiKey: 'test-api-key'
        });

        expect(result?.entry.evaluation.pass).toBe(true);
        expect(result?.entry.evaluation.label_checks[0].verdict).toBe('uncertain');
    });

    it('forces a failure when a label is not defendable', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                pass: true,
                general_checks: {
                    no_overlaps: true,
                    no_placeholders: true,
                    sane_padding: true,
                    task_identifiable: true,
                    mode_valid: true,
                    text_minimal: true,
                    math_coherent: true
                },
                label_checks: [{
                    label: 'NumbersWithZero',
                    verdict: 'not_defendable',
                    evidence: 'No zero is present.'
                }],
                reasoning: ''
            })
        });

        const result = await evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'rejected#gen#view#train#question#inst:0',
            targetId: 'rejected',
            generatorId: 'gen',
            viewId: testViewId,
            modeName: 'question',
            instanceIdx: 0,
            attempt: 1,
            seed: 123,
            fileName: 'test-sample.png',
            labels: ['NumbersWithZero'],
            apiKey: 'test-api-key'
        });

        expect(result?.entry.evaluation.pass).toBe(false);
        expect(result?.entry.evaluation.reasoning).toContain('NumbersWithZero: No zero is present.');
    });

    it('forces a failure when a central visual check fails', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                pass: true,
                general_checks: {
                    no_overlaps: true,
                    no_placeholders: true,
                    sane_padding: true,
                    task_identifiable: false,
                    mode_valid: true,
                    text_minimal: true,
                    math_coherent: true
                },
                label_checks: [{
                    label: 'NumbersWithZero',
                    verdict: 'defendable',
                    evidence: 'A zero is visible.'
                }],
                reasoning: ''
            })
        });

        const result = await evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'unidentifiable#gen#view#train#question#inst:0',
            targetId: 'unidentifiable',
            generatorId: 'gen',
            viewId: testViewId,
            modeName: 'question',
            instanceIdx: 0,
            attempt: 1,
            seed: 123,
            fileName: 'test-sample.png',
            labels: ['NumbersWithZero'],
            apiKey: 'test-api-key'
        });

        expect(result?.entry.evaluation.pass).toBe(false);
        expect(result?.entry.evaluation.reasoning).toContain('task_identifiable');
    });

    it('rejects responses that omit an expected label check', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                pass: true,
                general_checks: {
                    no_overlaps: true,
                    no_placeholders: true,
                    sane_padding: true,
                    task_identifiable: true,
                    mode_valid: true,
                    text_minimal: true,
                    math_coherent: true
                },
                label_checks: [],
                reasoning: ''
            })
        });

        await expect(evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'missing#gen#view#train#question#inst:0',
            targetId: 'missing',
            generatorId: 'gen',
            viewId: testViewId,
            modeName: 'question',
            instanceIdx: 0,
            attempt: 1,
            seed: 123,
            fileName: 'test-sample.png',
            labels: ['NumbersWithZero'],
            apiKey: 'test-api-key'
        })).rejects.toThrow('expected label checks for [NumbersWithZero]');
    });

    it('rejects invalid recorded provenance before making a validation request', async () => {
        const input = preparedInput({imagePath: tmpImgPath, sampleKey: 'test#gen#view#train#question#inst:0',
            targetId: 'test', generatorId: 'gen', viewId: testViewId, modeName: 'question',
            instanceIdx: 0, attempt: 1, seed: 123, fileName: 'test-sample.png', labels: ['NumbersWithZero'], apiKey: 'test-api-key'});
        await expect(evaluateWithRecipe({...input, generationReplay: {...input.generationReplay, seed: 7}}))
            .rejects.toThrow(/seed\/attempt/);
        await expect(evaluateWithRecipe({...input, modeName: 'solution'})).rejects.toThrow(/structural identity/);
        expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it.each(['missing', 'stale'] as const)('refreshes a %s cached recipe without re-evaluating its verdict', recipeState => {
        const current = preparedInput({imagePath: tmpImgPath, sampleKey: 'test#gen#view#train#question#inst:0',
            targetId: 'test', generatorId: 'gen', viewId: testViewId, modeName: 'question',
            instanceIdx: 0, attempt: 2, seed: 123, fileName: 'current.png', labels: []});
        const previous = preparedInput({...current, targetId: 'old', sampleKey: 'old#gen#view#train#question#inst:0', attempt: 1});
        const cached: VqaCacheEntry = {
            ...buildVqaSampleProvenance(previous), validation_cache_key: 'same-image-and-context',
            image_sha256: 'unchanged-pixels', checklist_hash: 'same-checklist', label_context_hash: 'same-labels',
            validation_context_hash: 'same-context', validation_policy_hash: 'same-policy', validated_at: '2026-09-24T00:00:00Z',
            evaluation: {pass: true, reasoning: '', label_checks: []}
        };
        if (recipeState === 'missing') {
            delete cached.generation_plan;
            delete cached.generation_plan_hash;
            delete cached.generation_replay;
        }
        const manager = new VqaCacheManager(tmpCacheDir, 'dataset-test', 'gen');
        manager.set(cached);
        manager.save();
        const originalBytes = readFileSync(resolve(tmpCacheDir, 'dataset-test/gen.jsonl'), 'utf8');
        const refreshed = refreshCachedVqaProvenance(cached, current);
        expect(readFileSync(resolve(tmpCacheDir, 'dataset-test/gen.jsonl'), 'utf8')).toBe(originalBytes);
        expect(refreshed.evaluation).toBe(cached.evaluation);
        for (const key of ['validation_cache_key', 'image_sha256', 'checklist_hash', 'label_context_hash',
            'validation_context_hash', 'validation_policy_hash', 'validated_at'] as const) {
            expect(refreshed[key]).toBe(cached[key]);
        }
        expect(refreshed.sample_key).toBe(current.sampleKey);
        expect(refreshed.generation_plan).toEqual(current.generationPlan);
        expect(refreshed.generation_plan_hash).toBe(current.generationPlan.hash);
        expect(refreshed.generation_replay).toEqual(current.generationReplay);
        manager.set(refreshed);
        manager.save();
        const saved = new VqaCacheManager(tmpCacheDir, 'dataset-test', 'gen').entries()[0];
        expect(readSampleReplayRecord(current.sampleKey, saved).replay).toEqual(current.generationReplay);
        expect(saved.evaluation.pass).toBe(true);
        expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it('rejects invalid authoritative cache-refresh metadata without changing the cached record', () => {
        const current = preparedInput({imagePath: tmpImgPath, sampleKey: 'test#gen#view#train#question#inst:0',
            targetId: 'test', generatorId: 'gen', viewId: testViewId, modeName: 'question',
            instanceIdx: 0, attempt: 2, seed: 123, fileName: 'current.png', labels: []});
        const cached: VqaCacheEntry = {
            ...buildVqaSampleProvenance(current), validation_cache_key: 'same-image-and-context',
            image_sha256: 'unchanged-pixels', checklist_hash: 'same-checklist', label_context_hash: 'same-labels',
            validation_context_hash: 'same-context', validation_policy_hash: 'same-policy', validated_at: '2026-09-24T00:00:00Z',
            evaluation: {pass: true, reasoning: '', label_checks: []}
        };
        const manager = new VqaCacheManager(tmpCacheDir, 'dataset-test', 'gen');
        manager.set(cached);
        manager.save();
        const originalBytes = readFileSync(resolve(tmpCacheDir, 'dataset-test/gen.jsonl'), 'utf8');
        for (const invalid of [
            {...current, generationReplay: undefined as any},
            {...current, generationReplay: {...current.generationReplay, seed: 7}},
            {...current, generationPlanHash: 'corrupt-authoritative-plan-hash'},
            {...current, targetId: 'wrong-target'}
        ]) {
            expect(() => manager.set(refreshCachedVqaProvenance(cached, invalid))).toThrow();
        }
        expect(manager.get(cached.validation_cache_key)).toBe(cached);
        expect(readFileSync(resolve(tmpCacheDir, 'dataset-test/gen.jsonl'), 'utf8')).toBe(originalBytes);
        expect(mockGenerateContent).not.toHaveBeenCalled();
    });
});
