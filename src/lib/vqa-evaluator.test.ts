import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getChecklistPaths, initVqaModel, resolveTreeChecklists, evaluateSampleVqa } from './vqa-evaluator.ts';
import { resolve } from 'path';
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'fs';
import { VqaCacheManager } from './vqa-cache.ts';

// Mock @google/generative-ai
const mockGenerateContent = vi.fn();
vi.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: class {
            constructor(public apiKey: string) {}
            getGenerativeModel() {
                return {
                    generateContent: mockGenerateContent
                };
            }
        },
        SchemaType: {
            OBJECT: 'OBJECT',
            ARRAY: 'ARRAY',
            BOOLEAN: 'BOOLEAN',
            STRING: 'STRING'
        }
    };
});

describe('vqa-evaluator', () => {
    const tmpDir = resolve(__dirname, '../../temp/vqa-test');
    const tmpImgPath = resolve(tmpDir, 'test-sample.png');
    const tmpCacheDir = resolve(tmpDir, 'cache');

    beforeEach(() => {
        vi.clearAllMocks();
        if (existsSync(tmpDir)) {
            rmSync(tmpDir, { recursive: true, force: true });
        }
        mkdirSync(tmpDir, { recursive: true });
        writeFileSync(tmpImgPath, Buffer.from('fake-png-data'));
    });

    it('resolves checklist paths for generators and views', () => {
        const paths = getChecklistPaths('arithmetic-ops-pairs', 'operations-vertical');
        expect(paths.length).toBeGreaterThan(0);
        expect(paths.some(p => p.includes('checklist.md'))).toBe(true);
    });

    it('returns empty checklist list for non-existent module paths', () => {
        const rootDir = resolve(__dirname, 'non-existent-dir');
        const paths = resolveTreeChecklists(rootDir, 'fake-module');
        expect(paths).toEqual([]);
    });

    it('returns null when initializing VQA model without an API key', () => {
        const model = initVqaModel('');
        expect(model).toBeNull();
    });

    it('returns model when initializing VQA model with explicit API key', () => {
        const model = initVqaModel('fake-key');
        expect(model).not.toBeNull();
    });

    it('returns null when evaluateSampleVqa image does not exist', async () => {
        const result = await evaluateSampleVqa({
            imagePath: resolve(tmpDir, 'non-existent.png'),
            sampleKey: 'test#gen#view#train#question#inst:0',
            targetId: 'test',
            generatorId: 'gen',
            viewId: 'view',
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
            response: {
                text: () => JSON.stringify({
                    pass: true,
                    general_checks: {
                        no_overlaps: true,
                        no_placeholders: true,
                        sane_padding: true
                    },
                    label_checks: [{
                        label: 'NumbersWithZero',
                        verdict: 'defendable',
                        evidence: 'A zero is visible.'
                    }],
                    reasoning: 'looks good'
                })
            }
        });

        const cacheManager = new VqaCacheManager(tmpCacheDir, 'dataset-test', 'gen');

        const result = await evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'test#gen#view#train#question#inst:0',
            targetId: 'test',
            generatorId: 'gen',
            viewId: 'view',
            modeName: 'question',
            instanceIdx: 0,
            attempt: 1,
            seed: 123,
            fileName: 'test-sample.png',
            labels: ['NumbersWithZero'],
            apiKey: 'test-api-key',
            cacheManager
        });

        expect(result).not.toBeNull();
        expect(result?.isLiveEvaluated).toBe(true);
        expect(result?.entry.evaluation.pass).toBe(true);
        expect(result?.entry.evaluation.reasoning).toBe('');
        expect(result?.entry.evaluation.label_checks[0].verdict).toBe('defendable');
        expect(result?.entry.label_context_hash).toHaveLength(16);
        expect(result?.entry.validation_context_hash).toHaveLength(16);

        const prompt = mockGenerateContent.mock.calls[0][0][0] as string;
        expect(prompt).toContain('NumbersWithZero: Involves zero as a number.');
        expect(prompt).toContain('uncertainty passes validation');

        // Second evaluation should return from cache without calling Gemini again
        const cachedResult = await evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'test#gen#view#train#question#inst:0',
            targetId: 'test',
            generatorId: 'gen',
            viewId: 'view',
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
    });

    it('returns null if no API key is provided and cache misses', async () => {
        const result = await evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'test2#gen#view#train#question#inst:0',
            targetId: 'test2',
            generatorId: 'gen',
            viewId: 'view',
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

    it('passes uncertain label judgements', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            response: {
                text: () => JSON.stringify({
                    pass: true,
                    general_checks: {
                        no_overlaps: true,
                        no_placeholders: true,
                        sane_padding: true
                    },
                    label_checks: [{
                        label: 'NumbersWithZero',
                        verdict: 'uncertain',
                        evidence: 'The value may be implied.'
                    }],
                    reasoning: ''
                })
            }
        });

        const result = await evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'uncertain#gen#view#train#question#inst:0',
            targetId: 'uncertain',
            generatorId: 'gen',
            viewId: 'view',
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
            response: {
                text: () => JSON.stringify({
                    pass: true,
                    general_checks: {
                        no_overlaps: true,
                        no_placeholders: true,
                        sane_padding: true
                    },
                    label_checks: [{
                        label: 'NumbersWithZero',
                        verdict: 'not_defendable',
                        evidence: 'No zero is present.'
                    }],
                    reasoning: ''
                })
            }
        });

        const result = await evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'rejected#gen#view#train#question#inst:0',
            targetId: 'rejected',
            generatorId: 'gen',
            viewId: 'view',
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

    it('rejects responses that omit an expected label check', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            response: {
                text: () => JSON.stringify({
                    pass: true,
                    general_checks: {
                        no_overlaps: true,
                        no_placeholders: true,
                        sane_padding: true
                    },
                    label_checks: [],
                    reasoning: ''
                })
            }
        });

        await expect(evaluateSampleVqa({
            imagePath: tmpImgPath,
            sampleKey: 'missing#gen#view#train#question#inst:0',
            targetId: 'missing',
            generatorId: 'gen',
            viewId: 'view',
            modeName: 'question',
            instanceIdx: 0,
            attempt: 1,
            seed: 123,
            fileName: 'test-sample.png',
            labels: ['NumbersWithZero'],
            apiKey: 'test-api-key'
        })).rejects.toThrow('expected label checks for [NumbersWithZero]');
    });
});
