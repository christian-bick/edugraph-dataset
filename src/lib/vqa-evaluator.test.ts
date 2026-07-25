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
            apiKey: 'test-api-key',
            cacheManager
        });

        expect(result).not.toBeNull();
        expect(result?.isLiveEvaluated).toBe(true);
        expect(result?.entry.evaluation.pass).toBe(true);
        expect(result?.entry.evaluation.reasoning).toBe('');

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
            apiKey: ''
        });
        expect(result).toBeNull();
    });
});
