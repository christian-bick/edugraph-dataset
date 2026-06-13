import {describe, it, expect, vi, afterEach} from 'vitest';
import {generateConfigs, generatePdfs} from './generate-pdf.ts';

// Mock external dependencies
vi.mock('fs', async () => {
    const actual = await vi.importActual('fs');
    return {
        ...actual,
        existsSync: vi.fn().mockReturnValue(false),
        mkdirSync: vi.fn(),
        rmSync: vi.fn(),
        writeFileSync: vi.fn(),
    };
});

vi.mock('puppeteer', () => ({
    default: {
        launch: vi.fn().mockResolvedValue({
            newPage: vi.fn().mockResolvedValue({
                goto: vi.fn(),
                pdf: vi.fn(),
                screenshot: vi.fn(),
                content: vi.fn().mockResolvedValue('<html>Mock Content</html>'),
                $$: vi.fn().mockResolvedValue([
                    {screenshot: vi.fn()},
                    {screenshot: vi.fn()},
                ]),
                evaluate: vi.fn(),
            }),
            close: vi.fn(),
        }),
    },
}));

vi.mock('child_process', () => ({
    execSync: vi.fn().mockReturnValue('mock-git-hash'),
}));

const mockGenerator = {
    generatePermutations: () => [
        {params: {a: 1}},
        {params: {a: 2}},
    ],
    generateName: (params: any) => `mock-name-a-${params.a}`,
    generateLabels: (params: any) => ({mockLabel: params.a}),
};

describe('generate-pdf/generateConfigs', () => {
    it('should generate correct configurations', () => {
        const configs = generateConfigs('test-module', mockGenerator);
        expect(configs).toHaveLength(2);
        expect(configs[0].questionDoc).toBe('test-module_mock-name-a-1_view-Q.pdf');
    });
});

describe('generatePdfs', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should run the full generation process', async () => {
        // Arrange
        const mockLoadConfig = vi.fn().mockResolvedValue(mockGenerator);
        // Set args for the test module, excluding the script path itself

        const fs = await import('fs');
        const puppeteer = (await import('puppeteer')).default;

        // Act
        await generatePdfs('test-module', {loadConfig: mockLoadConfig});

        // Assert
        expect(mockLoadConfig).toHaveBeenCalledWith('test-module');
        expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('out'), {recursive: true});
        expect(puppeteer.launch).toHaveBeenCalled();
        const page = await (await puppeteer.launch()).newPage();
        expect(page.goto).toHaveBeenCalledTimes(2);
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        const writeFileSyncCall = (fs.writeFileSync as any).mock.calls[0];
        expect(writeFileSyncCall[0]).toContain('meta.json');
    });

    it('should throw an error if duplicate filenames are generated', async () => {
        // Arrange
        const mockDuplicateGenerator = {
            generatePermutations: () => [{params: {a: 1}}, {params: {a: 2}}],
            generateName: () => 'duplicate-name',
            generateLabels: () => ({}),
        };
        const mockLoadConfig = vi.fn().mockResolvedValue(mockDuplicateGenerator);

        // Act & Assert
        await expect(generatePdfs('test-module', {loadConfig: mockLoadConfig}))
            .rejects.toThrow('Duplicate filename detected in the same run: test-module_duplicate-name_view-Q.pdf');
    });
});
