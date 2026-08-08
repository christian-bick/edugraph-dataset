import { create } from 'zustand';
import type { CoverageData, MainTab, StandardsTreeData, TaskType } from './types.ts';

interface ExplorerStore {
    standardsMap: StandardsTreeData['standardsMap'];
    gradesTree: StandardsTreeData['tree'];
    coverageData: CoverageData | null;
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
    setActiveGrade: (grade: string) => void;
    toggleDomain: (domain: string) => void;
    setActiveStandard: (standardId: string) => void;
    setActiveTab: (tab: MainTab) => void;
    toggleTaskType: (taskType: TaskType) => void;
    setActiveTask: (taskId: string) => void;
    setSearchQuery: (query: string) => void;
}

const fetchJson = async <T,>(url: string): Promise<T> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
    return response.json() as Promise<T>;
};

export const useExplorerStore = create<ExplorerStore>((set, get) => ({
    standardsMap: {},
    gradesTree: {},
    coverageData: null,
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
        set({ loading: true, error: null });
        try {
            const [treeData, coverageData] = await Promise.all([
                fetchJson<StandardsTreeData>('/coverage/ccss-tree.json'),
                fetchJson<CoverageData>('/coverage/ccss-coverage.json').catch(() => null),
            ]);
            set({
                standardsMap: treeData.standardsMap,
                gradesTree: treeData.tree,
                coverageData,
                loading: false,
            });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to load explorer data.',
                loading: false,
            });
        }
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
