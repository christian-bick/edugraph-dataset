import { create } from 'zustand';
import { isAssetIndex, type AssetIndex } from '../lib/asset-index.ts';
import type {
    CoverageData,
    CoverageManifest,
    AssetSource,
    MainTab,
    StandardsTreeData,
    TaskType,
} from './types.ts';

interface ExplorerStore {
    standardsMap: StandardsTreeData['standardsMap'];
    gradesTree: StandardsTreeData['tree'];
    coverageData: CoverageData | null;
    coverageManifest: CoverageManifest | null;
    assetIndex: AssetIndex | null;
    releasedAssetIndex: AssetIndex | null;
    assetIndexLoading: boolean;
    assetIndexError: string | null;
    assetSource: AssetSource;
    assetIndexSource: AssetSource | null;
    loading: boolean;
    error: string | null;
    activeGrade: string;
    activeDomain: string | null;
    activeStandardId: string | null;
    activeTab: MainTab;
    activeTaskType: TaskType | null;
    activeTaskId: string | null;
    searchQuery: string;
    searchActive: boolean;
    loadData: () => Promise<void>;
    loadReleasedAssetIndex: () => Promise<void>;
    loadAssetIndex: (assetSource?: AssetSource) => Promise<void>;
    setAssetSource: (source: AssetSource) => Promise<void>;
    setActiveGrade: (grade: string) => void;
    toggleDomain: (domain: string) => void;
    setActiveStandard: (standardId: string) => void;
    setActiveTab: (tab: MainTab) => void;
    toggleTaskType: (taskType: TaskType) => void;
    setActiveTask: (taskId: string) => void;
    setSearchQuery: (query: string) => void;
}

const fetchJson = async <T,>(url: string): Promise<T> => {
    const response = await fetch(url, import.meta.env.DEV ? { cache: 'no-store' } : undefined);
    if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
    return response.json() as Promise<T>;
};

const coveragePath = (fileName: string) => `/coverage/preview/${fileName}`;

const assetIndexPath = (assetSource: AssetSource) => assetSource === 'local'
    ? '/dataset/local-asset-index.json'
    : '/dataset/asset-index.json';

export const isLocalExplorerHost = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

const initialAssetSource = (): AssetSource => {
    if (typeof window === 'undefined') return 'released';
    const params = new URLSearchParams(window.location.search);
    return isLocalExplorerHost() && params.get('assets') === 'local' ? 'local' : 'released';
};

const syncAssetSourceUrl = (source: AssetSource) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    if (source === 'local') url.searchParams.set('assets', 'local');
    else url.searchParams.delete('assets');
    window.history.replaceState(null, '', url);
};

const startingAssetSource = initialAssetSource();

export const useExplorerStore = create<ExplorerStore>((set, get) => ({
    standardsMap: {},
    gradesTree: {},
    coverageData: null,
    coverageManifest: null,
    assetIndex: null,
    releasedAssetIndex: null,
    assetIndexLoading: false,
    assetIndexError: null,
    assetSource: startingAssetSource,
    assetIndexSource: null,
    loading: true,
    error: null,
    activeGrade: 'Kindergarten',
    activeDomain: null,
    activeStandardId: null,
    activeTab: 'explorer',
    activeTaskType: null,
    activeTaskId: null,
    searchQuery: '',
    searchActive: false,
    loadData: async () => {
        syncAssetSourceUrl(get().assetSource);
        set({
            loading: true,
            error: null,
            standardsMap: {},
            gradesTree: {},
            coverageData: null,
            coverageManifest: null,
        });
        try {
            const [treeData, coverageData, coverageManifest] = await Promise.all([
                fetchJson<StandardsTreeData>(coveragePath('ccss-tree.json')),
                fetchJson<CoverageData>(coveragePath('ccss-coverage.json')),
                fetchJson<CoverageManifest>(coveragePath('coverage-manifest.json')),
            ]);
            if (coverageManifest.schema_version !== 2) {
                throw new Error(`Unsupported coverage schema: ${coverageManifest.schema_version}`);
            }
            if (coverageManifest.channel !== 'preview') {
                throw new Error(`Expected preview coverage data, received ${coverageManifest.channel}.`);
            }
            set({
                standardsMap: treeData.standardsMap,
                gradesTree: treeData.tree,
                coverageData,
                coverageManifest,
                loading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load explorer data.',
                loading: false,
            });
        }
    },
    loadReleasedAssetIndex: async () => {
        if (get().releasedAssetIndex) return;
        if (get().assetSource === 'released') set({ assetIndexLoading: true, assetIndexError: null });
        try {
            const index = await fetchJson<unknown>(assetIndexPath('released'));
            if (!isAssetIndex(index)) throw new Error('Unsupported or malformed asset-index schema.');
            set({
                releasedAssetIndex: index,
                ...(get().assetSource === 'released' ? {
                    assetIndex: index,
                    assetIndexSource: 'released' as const,
                    assetIndexLoading: false,
                } : {}),
            });
        } catch (error) {
            if (get().assetSource === 'released') {
                set({
                    assetIndexError: error instanceof Error ? error.message : 'Failed to load released samples.',
                    assetIndexLoading: false,
                });
            }
        }
    },
    loadAssetIndex: async requestedSource => {
        const assetSource = requestedSource ?? get().assetSource;
        if (assetSource === 'released') {
            const releasedIndex = get().releasedAssetIndex;
            if (releasedIndex) {
                set({
                    assetIndex: releasedIndex,
                    assetIndexSource: 'released',
                    assetIndexLoading: false,
                    assetIndexError: null,
                });
                return;
            }
            await get().loadReleasedAssetIndex();
            return;
        }
        if (get().assetIndex && get().assetIndexSource === assetSource) return;
        set({ assetIndexLoading: true, assetIndexError: null });
        try {
            const index = await fetchJson<unknown>(assetIndexPath(assetSource));
            if (!isAssetIndex(index)) throw new Error('Unsupported or malformed asset-index schema.');
            if (get().assetSource !== assetSource) return;
            set({ assetIndex: index, assetIndexSource: assetSource, assetIndexLoading: false });
        } catch (error) {
            if (get().assetSource !== assetSource) return;
            set({
                assetIndexError: error instanceof Error ? error.message : 'Failed to load released samples.',
                assetIndexLoading: false,
            });
        }
    },
    setAssetSource: async requestedSource => {
        const assetSource: AssetSource = requestedSource === 'local' && !isLocalExplorerHost()
            ? 'released'
            : requestedSource;
        syncAssetSourceUrl(assetSource);
        const needsAssets = assetSource !== get().assetIndexSource || !get().assetIndex;
        if (!needsAssets) return;

        set({
            assetSource,
            ...(needsAssets ? { assetIndex: null, assetIndexSource: null } : {}),
            assetIndexError: null,
        });
        await get().loadAssetIndex(assetSource);
    },
    setActiveGrade: grade => set({ activeGrade: grade, activeDomain: null, searchActive: false }),
    toggleDomain: domain => set({
        activeDomain: get().activeDomain === domain ? null : domain,
        searchActive: false,
    }),
    setActiveStandard: standardId => set({ activeStandardId: standardId }),
    setActiveTab: tab => set({ activeTab: tab, searchActive: tab === 'explorer' ? false : get().searchActive }),
    toggleTaskType: taskType => set({
        activeTaskType: get().activeTaskType === taskType ? null : taskType,
    }),
    setActiveTask: taskId => set({ activeTaskId: taskId }),
    setSearchQuery: query => set({ searchQuery: query, searchActive: query.trim().length > 0 }),
}));
