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

const jsonResponse = (data: unknown) => ({
    ok: true,
    json: async () => data,
}) as Response;

const assetIndex: AssetIndex = {
    schema_version: 1,
    generated_at: '2026-08-10T00:00:00.000Z',
    dataset: { repository: 'owner/dataset', revision: 'v1' },
    label_sets: [],
};

describe('standards explorer data views', () => {
    beforeEach(() => {
        useExplorerStore.setState({
            standardsMap: {},
            gradesTree: {},
            coverageData: null,
            coverageManifest: null,
            assetIndex: null,
            assetIndexLoading: false,
            assetIndexError: null,
            assetSource: 'released',
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
        const fetchMock = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
            const url = String(input);
            if (url.endsWith('ccss-tree.json')) return jsonResponse(treeData);
            if (url.endsWith('ccss-coverage.json')) return jsonResponse(coverageData);
            return jsonResponse({
                schema_version: 2,
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
        expect(fetchMock.mock.calls.every(([, init]) => init?.cache === 'no-store')).toBe(true);
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
                schema_version: 2,
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

    it('loads the released asset index once and preserves it across data views', async () => {
        const fetchMock = vi.fn(async () => jsonResponse(assetIndex));
        vi.stubGlobal('fetch', fetchMock);

        await useExplorerStore.getState().loadAssetIndex();
        await useExplorerStore.getState().loadAssetIndex();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith('/dataset/asset-index.json', { cache: 'no-store' });
        expect(useExplorerStore.getState()).toMatchObject({
            assetIndex,
            assetIndexLoading: false,
            assetIndexError: null,
        });
    });

    it('treats an unavailable asset index as a nonfatal enhancement failure', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 }) as Response));

        await useExplorerStore.getState().loadAssetIndex();

        expect(useExplorerStore.getState()).toMatchObject({
            assetIndex: null,
            assetIndexLoading: false,
            assetIndexError: 'Request failed (404): /dataset/asset-index.json',
            error: null,
        });
    });

    it('stores the local asset choice in the URL on a local host', () => {
        const localWindow = {
            location: new URL('http://localhost:5173/standards-explorer.html?view=preview'),
            history: {
                replaceState: (_state: unknown, _unused: string, url: URL) => {
                    localWindow.location = new URL(url);
                },
            },
        };
        vi.stubGlobal('window', localWindow);

        useExplorerStore.getState().setAssetSource('local');

        expect(useExplorerStore.getState().assetSource).toBe('local');
        expect(new URLSearchParams(window.location.search).get('assets')).toBe('local');

        useExplorerStore.getState().setAssetSource('released');
        expect(useExplorerStore.getState().assetSource).toBe('released');
        expect(new URLSearchParams(window.location.search).has('assets')).toBe(false);
    });

    it('rejects the local asset choice on non-local hosts', () => {
        const remoteWindow = {
            location: new URL('https://coverage.edugraph.io/standards-explorer.html?assets=local'),
            history: {
                replaceState: (_state: unknown, _unused: string, url: URL) => {
                    remoteWindow.location = new URL(url);
                },
            },
        };
        vi.stubGlobal('window', remoteWindow);

        useExplorerStore.getState().setAssetSource('local');

        expect(useExplorerStore.getState().assetSource).toBe('released');
        expect(new URLSearchParams(window.location.search).has('assets')).toBe(false);
    });
});
