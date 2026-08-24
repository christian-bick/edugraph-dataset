import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { selectCoverageAssetIndex, useExplorerStore } from './store.ts';
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
    schema_version: 4,
    channel: 'preview',
    source_ref: 'main',
    source_sha: '07590c32396405e',
    generated_at: '2026-08-10T00:00:00.000Z',
    ontology_version: 'v0.11.1',
    core_input_key: 'a'.repeat(64),
    inputs: {
        schema_version: 3,
        producer_epoch: 'standards-coverage-v3',
        repository: {
            ref: 'main',
            sha: '07590c32396405e',
            content_sha256: 'b'.repeat(64),
        },
        standards: {
            path: 'public/coverage/ccss-tree.json',
            sha256: 'd'.repeat(64),
            bytes: 46,
        },
        ontology: {
            package: 'edugraph-ts',
            version: 'v0.11.1',
            dependency: 'https://example.test/edugraph-ts.tgz',
            resolved: 'https://example.test/edugraph-ts.tgz',
            integrity: 'sha512-exact',
            semantic_usage_sha256: 'e'.repeat(64),
        },
        selection: {
            grade: null,
            exclude_high_school: false,
            known_assets_sha256: null,
        },
    },
};

const releaseManifest = {
    schema_version: 2,
    channel: 'latest',
    source_ref: 'v0.21.0-01',
    source_sha: '5489ebca38b05225d03996a728f16f577d0f2912',
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
            dataView: 'latest',
            assetSource: 'released',
            assetIndexSource: null,
            localSnapshotAvailable: false,
            localSnapshotRefreshing: false,
            localSnapshotProgress: null,
            localSnapshotGeneratedAt: null,
            localSnapshotAssetCount: 0,
            localSnapshotError: null,
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

    it('uses only the index loaded for the selected coverage source', () => {
        useExplorerStore.setState({
            assetIndex,
            assetSource: 'local',
            assetIndexSource: 'released',
        });
        expect(selectCoverageAssetIndex(useExplorerStore.getState())).toBeNull();

        useExplorerStore.setState({assetIndexSource: 'local'});
        expect(selectCoverageAssetIndex(useExplorerStore.getState())).toBe(assetIndex);
    });

    it('loads the released coverage snapshot by default in production', async () => {
        const remoteWindow = {
            location: new URL('https://coverage.edugraph.io/'),
            history: {replaceState: vi.fn()},
        };
        vi.stubGlobal('window', remoteWindow);
        const fetchMock = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
            const url = String(input);
            if (url.endsWith('ccss-tree.json')) return jsonResponse(treeData);
            if (url.endsWith('ccss-coverage.json')) return jsonResponse(coverageData);
            return jsonResponse(releaseManifest);
        });
        vi.stubGlobal('fetch', fetchMock);

        await useExplorerStore.getState().loadData();

        expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
            '/coverage/latest/ccss-tree.json',
            '/coverage/latest/ccss-coverage.json',
            '/coverage/latest/coverage-manifest.json',
        ]);
        expect(fetchMock.mock.calls.every(([, init]) => init?.cache === 'no-store')).toBe(true);
        expect(useExplorerStore.getState()).toMatchObject({
            dataView: 'latest',
            coverageManifest: releaseManifest,
        });
    });

    it('switches production coverage to the deployed main preview', async () => {
        const remoteWindow = {
            location: new URL('https://coverage.edugraph.io/'),
            history: {
                replaceState: (_state: unknown, _unused: string, url: URL) => {
                    remoteWindow.location = new URL(url);
                },
            },
        };
        vi.stubGlobal('window', remoteWindow);
        useExplorerStore.setState({coverageData});
        const fetchMock = vi.fn(async (input: string | URL | Request) => {
            const url = String(input);
            if (url.endsWith('ccss-tree.json')) return jsonResponse(treeData);
            if (url.endsWith('ccss-coverage.json')) return jsonResponse(coverageData);
            return jsonResponse(url.includes('/latest/') ? releaseManifest : previewManifest);
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
            coverageManifest: previewManifest,
        });
        expect(new URLSearchParams(window.location.search).get('view')).toBe('preview');

        await useExplorerStore.getState().setDataView('latest');

        expect(fetchMock.mock.calls.slice(3).map(([url]) => String(url))).toEqual([
            '/coverage/latest/ccss-tree.json',
            '/coverage/latest/ccss-coverage.json',
            '/coverage/latest/coverage-manifest.json',
        ]);
        expect(useExplorerStore.getState()).toMatchObject({
            dataView: 'latest',
            coverageManifest: releaseManifest,
        });
        expect(new URLSearchParams(window.location.search).has('view')).toBe(false);
    });

    it('accepts the current manifest schema for the next release', async () => {
        const nextReleaseManifest = {
            ...previewManifest,
            channel: 'latest',
            source_ref: 'v0.22.1-01',
            inputs: {
                ...previewManifest.inputs,
                repository: {
                    ...previewManifest.inputs.repository,
                    ref: 'v0.22.1-01',
                },
            },
        };
        const fetchMock = vi.fn(async (input: string | URL | Request) => {
            const url = String(input);
            if (url.endsWith('ccss-tree.json')) return jsonResponse(treeData);
            if (url.endsWith('ccss-coverage.json')) return jsonResponse(coverageData);
            return jsonResponse(nextReleaseManifest);
        });
        vi.stubGlobal('fetch', fetchMock);

        await useExplorerStore.getState().loadData('latest');

        expect(useExplorerStore.getState()).toMatchObject({
            error: null,
            coverageManifest: nextReleaseManifest,
        });
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
            location: new URL('http://localhost:5173/?view=preview'),
            history: {
                replaceState: (_state: unknown, _unused: string, url: URL) => {
                    localWindow.location = new URL(url);
                },
            },
        };
        vi.stubGlobal('window', localWindow);
        useExplorerStore.setState({
            dataView: 'preview',
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
        expect(selectCoverageAssetIndex(useExplorerStore.getState())).toBe(localIndex);
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
        expect(selectCoverageAssetIndex(useExplorerStore.getState())).toBe(assetIndex);
        expect(new URLSearchParams(window.location.search).has('assets')).toBe(false);
    });

    it('rejects the local asset choice on non-local hosts', async () => {
        const remoteWindow = {
            location: new URL('https://coverage.edugraph.io/?assets=local&view=preview'),
            history: {
                replaceState: (_state: unknown, _unused: string, url: URL) => {
                    remoteWindow.location = new URL(url);
                },
            },
        };
        vi.stubGlobal('window', remoteWindow);
        useExplorerStore.setState({
            dataView: 'preview',
            releasedAssetIndex: assetIndex,
            assetIndex,
            assetIndexSource: 'released',
        });

        await useExplorerStore.getState().setAssetSource('local');

        expect(useExplorerStore.getState().assetSource).toBe('released');
        expect(new URLSearchParams(window.location.search).has('assets')).toBe(false);
        expect(new URLSearchParams(window.location.search).get('view')).toBe('preview');
    });

    it('refreshes an immutable local snapshot before reloading local data', async () => {
        const localWindow = {
            location: new URL('http://localhost:5173/?assets=local'),
            history: {replaceState: vi.fn()},
        };
        vi.stubGlobal('window', localWindow);
        useExplorerStore.setState({assetSource: 'local', dataView: 'preview'});
        const refreshedIndex = {...assetIndex, generated_at: '2026-08-16T12:00:00.000Z'};
        const fetchMock = vi.fn(async (input: string | URL | Request) => {
            const url = String(input);
            if (url.endsWith('/refresh')) return new Response([
                JSON.stringify({type: 'progress', message: 'Indexing generated samples…'}),
                JSON.stringify({type: 'progress', message: 'Publishing local snapshot…'}),
                JSON.stringify({
                    type: 'result',
                    generated_at: '2026-08-16T12:00:00.000Z',
                    asset_count: 42,
                }),
                '',
            ].join('\n'), {
                status: 200,
                headers: {'Content-Type': 'application/x-ndjson'},
            });
            if (url.endsWith('ccss-tree.json')) return jsonResponse(treeData);
            if (url.endsWith('ccss-coverage.json')) return jsonResponse(coverageData);
            if (url.endsWith('coverage-manifest.json')) return jsonResponse(previewManifest);
            return jsonResponse(refreshedIndex);
        });
        vi.stubGlobal('fetch', fetchMock);

        await useExplorerStore.getState().refreshLocalSnapshot();

        expect(fetchMock).toHaveBeenCalledWith('/__edugraph/local-snapshot/refresh', {
            cache: 'no-store',
            method: 'POST',
        });
        expect(useExplorerStore.getState()).toMatchObject({
            localSnapshotAvailable: true,
            localSnapshotRefreshing: false,
            localSnapshotAssetCount: 42,
            localSnapshotProgress: 'Loading refreshed explorer data…',
            assetIndex: refreshedIndex,
            assetIndexSource: 'local',
        });
    });
});
