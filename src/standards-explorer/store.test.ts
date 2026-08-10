import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useExplorerStore } from './store.ts';

const treeData = {
    tree: { Kindergarten: {} },
    standardsMap: {},
};

const coverageData = {
    metadata: {
        generated_at: '2026-08-10T00:00:00.000Z',
        ontology_version: 'v0.11.1',
        total_leaves_scanned: 0,
        spec_covered_count: 0,
        covered_count: 0,
        missing_generator_count: 0,
        missing_ontology_count: 0,
        analysis_needed_count: 0,
        beyond_scope_count: 0,
        fully_beyond_scope_count: 0,
    },
    coverage: {},
    tasks: [],
};

const jsonResponse = (data: unknown) => ({
    ok: true,
    json: async () => data,
}) as Response;

describe('standards explorer data views', () => {
    beforeEach(() => {
        useExplorerStore.setState({
            standardsMap: {},
            gradesTree: {},
            coverageData: null,
            coverageManifest: null,
            dataView: 'latest',
            loading: true,
            error: null,
            activeDomain: null,
            activeStandardId: null,
            activeTaskId: null,
            searchQuery: '',
            searchActive: false,
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('loads Latest by default from the same-origin release snapshot', async () => {
        const fetchMock = vi.fn(async (input: string | URL | Request) => {
            const url = String(input);
            if (url.endsWith('ccss-tree.json')) return jsonResponse(treeData);
            if (url.endsWith('ccss-coverage.json')) return jsonResponse(coverageData);
            return jsonResponse({
                schema_version: 1,
                channel: 'latest',
                source_ref: 'v0.11.1-01',
                source_sha: '5683072165da15c',
                generated_at: '2026-08-10T00:00:00.000Z',
                ontology_version: 'v0.11.1',
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        await useExplorerStore.getState().loadData();

        expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
            '/coverage/latest/ccss-tree.json',
            '/coverage/latest/ccss-coverage.json',
            '/coverage/latest/coverage-manifest.json',
        ]);
        expect(useExplorerStore.getState().coverageManifest?.source_ref).toBe('v0.11.1-01');
    });

    it('switches to Preview and clears snapshot-specific selection state', async () => {
        useExplorerStore.setState({
            activeDomain: 'K.CC',
            activeStandardId: 'K.CC.A.1',
            searchQuery: 'count',
            searchActive: true,
        });
        const fetchMock = vi.fn(async (input: string | URL | Request) => {
            const url = String(input);
            if (url.endsWith('ccss-tree.json')) return jsonResponse(treeData);
            if (url.endsWith('ccss-coverage.json')) return jsonResponse(coverageData);
            return jsonResponse({
                schema_version: 1,
                channel: 'preview',
                source_ref: 'main',
                source_sha: '07590c32396405e',
                generated_at: '2026-08-10T00:00:00.000Z',
                ontology_version: 'v0.11.1',
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        await useExplorerStore.getState().setDataView('preview');

        expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
            '/coverage/preview/ccss-tree.json',
            '/coverage/preview/ccss-coverage.json',
            '/coverage/preview/coverage-manifest.json',
        ]);
        expect(useExplorerStore.getState()).toMatchObject({
            dataView: 'preview',
            activeDomain: null,
            activeStandardId: null,
            searchQuery: '',
            searchActive: false,
        });
    });
});
