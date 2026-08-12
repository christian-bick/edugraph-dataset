import { create } from 'zustand';
import { isAssetIndex, type AssetIndex } from '../lib/asset-index.ts';
import type {
    CoverageData,
    CoverageManifest,
    AssetSource,
    DataView,
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
    assetIndexLoading: boolean;
    assetIndexError: string | null;
    assetSource: AssetSource;
    dataView: DataView;
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
    loadData: (dataView?: DataView) => Promise<void>;
    loadAssetIndex: () => Promise<void>;
    setDataView: (dataView: DataView) => Promise<void>;
    setAssetSource: (assetSource: AssetSource) => void;
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

const coveragePath = (dataView: DataView, fileName: string) =>
    `/coverage/${dataView}/${fileName}`;

const initialDataView = (): DataView => {
    if (typeof window === 'undefined') return 'latest';
    return new URLSearchParams(window.location.search).get('view') === 'preview'
        ? 'preview'
        : 'latest';
};

export const isLocalExplorerHost = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

const initialAssetSource = (): AssetSource => {
    if (!isLocalExplorerHost()) return 'released';
    return new URLSearchParams(window.location.search).get('assets') === 'local'
        ? 'local'
        : 'released';
};

const syncDataViewUrl = (dataView: DataView) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (dataView === 'preview') url.searchParams.set('view', 'preview');
    else url.searchParams.delete('view');
    window.history.replaceState(null, '', url);
};

const syncAssetSourceUrl = (assetSource: AssetSource) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (assetSource === 'local') url.searchParams.set('assets', 'local');
    else url.searchParams.delete('assets');
    window.history.replaceState(null, '', url);
};

export const useExplorerStore = create<ExplorerStore>((set, get) => ({
    standardsMap: {},
    gradesTree: {},
    coverageData: null,
    coverageManifest: null,
    assetIndex: null,
    assetIndexLoading: false,
    assetIndexError: null,
    assetSource: initialAssetSource(),
    dataView: initialDataView(),
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
    loadData: async (requestedView) => {
        const dataView = requestedView ?? get().dataView;
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
                fetchJson<StandardsTreeData>(coveragePath(dataView, 'ccss-tree.json')),
                fetchJson<CoverageData>(coveragePath(dataView, 'ccss-coverage.json')),
                fetchJson<CoverageManifest>(coveragePath(dataView, 'coverage-manifest.json')),
            ]);
            if (coverageManifest.schema_version !== 2) {
                throw new Error(`Unsupported coverage schema: ${coverageManifest.schema_version}`);
            }
            if (coverageManifest.channel !== dataView) {
                throw new Error(`Expected ${dataView} coverage data, received ${coverageManifest.channel}.`);
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
    loadAssetIndex: async () => {
        if (get().assetIndex || get().assetIndexLoading) return;
        set({ assetIndexLoading: true, assetIndexError: null });
        try {
            const index = await fetchJson<unknown>('/dataset/asset-index.json');
            if (!isAssetIndex(index)) throw new Error('Unsupported or malformed asset-index schema.');
            set({ assetIndex: index, assetIndexLoading: false });
        } catch (error) {
            set({
                assetIndexError: error instanceof Error ? error.message : 'Failed to load released samples.',
                assetIndexLoading: false,
            });
        }
    },
    setDataView: async dataView => {
        if (dataView === get().dataView && get().coverageData) return;
        syncDataViewUrl(dataView);
        set({
            dataView,
            activeDomain: null,
            activeStandardId: null,
            activeTaskId: null,
            searchQuery: '',
            searchActive: false,
        });
        await get().loadData(dataView);
    },
    setAssetSource: assetSource => {
        const safeSource = assetSource === 'local' && isLocalExplorerHost()
            ? 'local'
            : 'released';
        syncAssetSourceUrl(safeSource);
        set({ assetSource: safeSource });
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
