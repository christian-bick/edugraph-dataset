import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useExplorerStore } from './store.ts';
import type { AssetIndex } from '../lib/asset-index.ts';

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

const assetIndex: AssetIndex = {
    schema_version: 1,
    generated_at: '2026-08-10T00:00:00.000Z',
    dataset: { repository: 'owner/dataset', revision: 'v1' },
    label_sets: [],
};

const jsonResponse = (data: unknown) => ({
    ok: true,
    json: async () => data,
}) as Response;

const previewManifest = {
    schema_version: 2,
    channel: 'preview',
    source_ref: 'main',
    source_sha: '07590c32396405e',
    generated_at: '2026-08-10T00:00:00.000Z',
    ontology_version: 'v0.11.1',
};

describe('standards explorer data and sample sources', () => {
    beforeEach(() => {
        useExplorerStore.setState({
            standardsMap: {},
            gradesTree: {},
            coverageData: null,
            coverageManifest: null,
            assetIndex: null,
            releasedAssetIndex: null,
            assetIndexLoading: false,
            assetIndexError: null,
            assetSource: 'released',
            assetIndexSource: null,
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

    it('always loads the deployed main coverage snapshot', async () => {
        const fetchMock = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
            const url = String(input);
            if (url.endsWith('ccss-tree.json')) return jsonResponse(treeData);
            if (url.endsWith('ccss-coverage.json')) return jsonResponse(coverageData);
            return jsonResponse(previewManifest);
        });
        vi.stubGlobal('fetch', fetchMock);

        await useExplorerStore.getState().loadData();

        expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
            '/coverage/preview/ccss-tree.json',
            '/coverage/preview/ccss-coverage.json',
            '/coverage/preview/coverage-manifest.json',
        ]);
        expect(fetchMock.mock.calls.every(([, init]) => init?.cache === 'no-store')).toBe(true);
        expect(useExplorerStore.getState().coverageManifest?.source_ref).toBe('main');
    });

    it('loads and retains the released index as the readiness baseline', async () => {
        const fetchMock = vi.fn(async () => jsonResponse(assetIndex));
        vi.stubGlobal('fetch', fetchMock);

        await useExplorerStore.getState().loadReleasedAssetIndex();
        await useExplorerStore.getState().loadReleasedAssetIndex();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith('/dataset/asset-index.json', { cache: 'no-store' });
        expect(useExplorerStore.getState()).toMatchObject({
            releasedAssetIndex: assetIndex,
            assetIndex,
            assetIndexSource: 'released',
            assetIndexLoading: false,
            assetIndexError: null,
        });
    });

    it('treats an unavailable released index as a nonfatal sample failure', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 }) as Response));

        await useExplorerStore.getState().loadReleasedAssetIndex();

        expect(useExplorerStore.getState()).toMatchObject({
            releasedAssetIndex: null,
            assetIndex: null,
            assetIndexLoading: false,
            assetIndexError: 'Request failed (404): /dataset/asset-index.json',
            error: null,
        });
    });

    it('switches only the active sample index on a local host', async () => {
        const localWindow = {
            location: new URL('http://localhost:5173/standards-explorer.html?view=preview'),
            history: {
                replaceState: (_state: unknown, _unused: string, url: URL) => {
                    localWindow.location = new URL(url);
                },
            },
        };
        vi.stubGlobal('window', localWindow);
        useExplorerStore.setState({
            releasedAssetIndex: assetIndex,
            assetIndex,
            assetIndexSource: 'released',
            coverageData,
        });
        const localIndex = { ...assetIndex, generated_at: 'local' };
        const fetchMock = vi.fn(async () => jsonResponse(localIndex));
        vi.stubGlobal('fetch', fetchMock);

        await useExplorerStore.getState().setAssetSource('local');

        expect(useExplorerStore.getState()).toMatchObject({
            coverageData,
            releasedAssetIndex: assetIndex,
            assetIndex: localIndex,
            assetSource: 'local',
            assetIndexSource: 'local',
        });
        expect(fetchMock).toHaveBeenCalledWith('/dataset/local-asset-index.json', { cache: 'no-store' });
        expect(new URLSearchParams(window.location.search).get('assets')).toBe('local');
        expect(new URLSearchParams(window.location.search).has('view')).toBe(false);

        await useExplorerStore.getState().setAssetSource('released');

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(useExplorerStore.getState()).toMatchObject({
            releasedAssetIndex: assetIndex,
            assetIndex,
            assetSource: 'released',
            assetIndexSource: 'released',
        });
        expect(new URLSearchParams(window.location.search).has('assets')).toBe(false);
    });

    it('rejects the local asset choice on non-local hosts', async () => {
        const remoteWindow = {
            location: new URL('https://coverage.edugraph.io/standards-explorer.html?assets=local&view=preview'),
            history: {
                replaceState: (_state: unknown, _unused: string, url: URL) => {
                    remoteWindow.location = new URL(url);
                },
            },
        };
        vi.stubGlobal('window', remoteWindow);
        useExplorerStore.setState({
            releasedAssetIndex: assetIndex,
            assetIndex,
            assetIndexSource: 'released',
        });

        await useExplorerStore.getState().setAssetSource('local');

        expect(useExplorerStore.getState().assetSource).toBe('released');
        expect(new URLSearchParams(window.location.search).has('assets')).toBe(false);
        expect(new URLSearchParams(window.location.search).has('view')).toBe(false);
    });
});
