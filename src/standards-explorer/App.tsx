import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    calculateStats,
    filterTasks,
    findReleasedSamples,
    getClusters,
    getCoverageKind,
    getCoverageModules,
    getDomains,
    getLabelSets,
    getSearchCoverageKind,
    getScopeKind,
    intersectLabels,
    sampleAssetUrl,
    searchStandards,
    type CoverageKind,
} from './model.ts';
import { isLocalExplorerHost, useExplorerStore } from './store.ts';
import type {
    BacklogTask,
    Implementation,
    ModuleImplementation,
    OntologyPackage,
    StandardCoverage,
    StandardNode,
    TaskType,
    TreeStandard,
} from './types.ts';
import type { AssetIndex, ReleasedAssetSample } from '../lib/asset-index.ts';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
    <i aria-hidden="true" className={`fa-solid ${name} ${className}`} />
);

interface StatusStyle {
    label: string;
    icon: string;
    badge: string;
}

const coverageStyles: Record<CoverageKind, StatusStyle & {
    card: string;
    selectedCard: string;
    subCard: string;
    selectedSubCard: string;
}> = {
    analysis: {
        label: 'Analysis',
        icon: 'fa-magnifying-glass',
        badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        card: 'border-sky-500/30 hover:border-sky-500/50 bg-sky-50 hover:bg-sky-100/70',
        selectedCard: 'border-slate-500 ring-1 ring-slate-400/30 bg-sky-50',
        subCard: 'border-sky-500/20 hover:border-sky-500/40 bg-sky-50 hover:bg-sky-100/70',
        selectedSubCard: 'border-slate-500 bg-sky-50 ring-1 ring-slate-400/30',
    },
    beyond: {
        label: 'Beyond Scope',
        icon: 'fa-ban',
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        card: 'border-purple-500/30 hover:border-purple-500/50 bg-purple-50 hover:bg-purple-100/70',
        selectedCard: 'border-slate-500 ring-1 ring-slate-400/30 bg-purple-50',
        subCard: 'border-purple-500/20 hover:border-purple-500/40 bg-purple-50 hover:bg-purple-100/70',
        selectedSubCard: 'border-slate-500 bg-purple-50 ring-1 ring-slate-400/30',
    },
    ontology: {
        label: 'Ontology',
        icon: 'fa-circle-xmark',
        badge: 'bg-red-500/10 text-red-400 border-red-500/20',
        card: 'border-red-500/30 hover:border-red-500/50 bg-red-50 hover:bg-red-100/70',
        selectedCard: 'border-slate-500 ring-1 ring-slate-400/30 bg-red-50',
        subCard: 'border-red-500/20 hover:border-red-500/40 bg-red-50 hover:bg-red-100/70',
        selectedSubCard: 'border-slate-500 bg-red-50 ring-1 ring-slate-400/30',
    },
    partial: {
        label: 'Partially Covered',
        icon: 'fa-triangle-exclamation',
        badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        card: 'border-orange-500/30 hover:border-orange-500/50 bg-orange-50 hover:bg-orange-100/70',
        selectedCard: 'border-slate-500 ring-1 ring-slate-400/30 bg-orange-50',
        subCard: 'border-orange-500/20 hover:border-orange-500/40 bg-orange-50 hover:bg-orange-100/70',
        selectedSubCard: 'border-slate-500 bg-orange-50 ring-1 ring-slate-400/30',
    },
    released: {
        label: 'Released',
        icon: 'fa-circle-check',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        card: 'border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-50 hover:bg-emerald-100/70',
        selectedCard: 'border-slate-500 ring-1 ring-slate-400/30 bg-emerald-50',
        subCard: 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100/70',
        selectedSubCard: 'border-slate-500 bg-emerald-50 ring-1 ring-slate-400/30',
    },
    ready: {
        label: 'Ready',
        icon: 'fa-hourglass-half',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        card: 'border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-50 hover:bg-emerald-100/70',
        selectedCard: 'border-slate-500 ring-1 ring-slate-400/30 bg-emerald-50',
        subCard: 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100/70',
        selectedSubCard: 'border-slate-500 bg-emerald-50 ring-1 ring-slate-400/30',
    },
    implementation: {
        label: 'Implementation',
        icon: 'fa-triangle-exclamation',
        badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        card: 'border-orange-500/30 hover:border-orange-500/50 bg-orange-50 hover:bg-orange-100/70',
        selectedCard: 'border-slate-500 ring-1 ring-slate-400/30 bg-orange-50',
        subCard: 'border-orange-500/20 hover:border-orange-500/40 bg-orange-50 hover:bg-orange-100/70',
        selectedSubCard: 'border-slate-500 bg-orange-50 ring-1 ring-slate-400/30',
    },
};

const partialScopeStyle = {
    label: 'Partially In Scope',
    icon: 'fa-circle-half-stroke',
    badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
};

const taskStyles: Record<TaskType, { coverageKind: CoverageKind; accent: string }> = {
    DATASET_ENRICHMENT: {
        coverageKind: 'implementation',
        accent: 'border-orange-500/30',
    },
    ONTOLOGY_EXTENSION: {
        coverageKind: 'ontology',
        accent: 'border-red-500/30',
    },
    ANALYSIS: {
        coverageKind: 'analysis',
        accent: 'border-sky-500/30',
    },
};

const EMPTY_TASKS: BacklogTask[] = [];

const strategyStyles = {
    reuse: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    expand: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    new: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
} as const;

interface TaskDescriptionItem {
    id: string;
    description: string;
}

function splitTaskDescription(description: string): {
    summary: string;
    detailLabel?: string;
    details: TaskDescriptionItem[];
} {
    const sections = [
        { marker: '\nTargets:\n', label: 'Targets' },
        { marker: ' Details:\n', label: 'Details' },
    ];
    const section = sections.find(candidate => description.includes(candidate.marker));
    if (!section) return { summary: description, details: [] };

    const [summary, detailText = ''] = description.split(section.marker, 2);
    const details = detailText
        .split('\n')
        .map(line => line.replace(/^\s*-\s*/, '').trim())
        .filter(Boolean)
        .map(line => {
            const separator = line.indexOf(':');
            return separator === -1
                ? { id: line, description: '' }
                : { id: line.slice(0, separator).trim(), description: line.slice(separator + 1).trim() };
        });

    return { summary: summary.trim(), detailLabel: section.label, details };
}

function ModuleImplementationList({
    label,
    modules,
    stacked = false,
}: {
    label: string;
    modules: ModuleImplementation[];
    stacked?: boolean;
}) {
    return (
        <div className={stacked ? 'space-y-1.5' : 'flex items-start gap-2'}>
            <span className={stacked
                ? 'block text-[10px] font-semibold uppercase tracking-wider text-slate-500'
                : 'w-16 shrink-0 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500'}>
                {label}
            </span>
            <div className={stacked ? 'space-y-1.5' : 'flex min-w-0 flex-wrap gap-1.5'}>
                {modules.map(item => (
                    <span
                        key={`${item.strategy}-${item.module}`}
                        className={`${stacked ? 'flex w-full' : 'inline-flex'} items-center overflow-hidden rounded border border-slate-700 bg-slate-950/70 font-mono text-[9px]`}
                    >
                        <span className={`${stacked ? 'flex w-14 shrink-0 items-center justify-center' : 'self-stretch'} border-r px-1.5 py-1 font-bold uppercase ${strategyStyles[item.strategy]}`}>
                            {item.strategy}
                        </span>
                        <span className="min-w-0 break-all px-1.5 py-1 text-slate-300">{item.module}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

function ImplementationDetails({
    implementation,
    showSummary = true,
    boxed = true,
}: {
    implementation: Implementation;
    showSummary?: boolean;
    boxed?: boolean;
}) {
    return (
        <div className={boxed ? 'space-y-2 rounded-md border border-slate-800 bg-slate-950/50 p-2.5' : 'space-y-2'}>
            {showSummary && (
                <div>
                    <div className="font-mono text-[10px] font-semibold text-orange-300">{implementation.id}</div>
                    <div className="mt-0.5 text-[10px] leading-relaxed text-slate-400">{implementation.description}</div>
                </div>
            )}
            <ModuleImplementationList label="Generators" modules={implementation.generators} stacked={!boxed} />
            <ModuleImplementationList label="Views" modules={implementation.views} stacked={!boxed} />
        </div>
    );
}

const ontologyDimensionStyles = {
    Area: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    Scope: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    Ability: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
} as const;

function OntologyDetails({ ontology }: {
    ontology: OntologyPackage;
}) {
    return (
        <div className="space-y-2">
            <div className="space-y-1.5">
                {ontology.changes.map(change => (
                    <div key={change.dimension} className="flex items-start gap-2">
                        <span className={`w-14 shrink-0 rounded border px-1.5 py-1 text-center text-[9px] font-bold uppercase ${ontologyDimensionStyles[change.dimension]}`}>
                            {change.dimension}
                        </span>
                        <div className="flex min-w-0 flex-wrap gap-1.5">
                            {change.entities.map(entity => (
                                <span key={entity} className="rounded border border-slate-700 bg-slate-950/70 px-1.5 py-1 font-mono text-[9px] text-slate-300">
                                    {entity}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Header() {
    const coverageData = useExplorerStore(state => state.coverageData);
    const releasedAssetIndex = useExplorerStore(state => state.releasedAssetIndex);
    const assetSource = useExplorerStore(state => state.assetSource);
    const assetIndexLoading = useExplorerStore(state => state.assetIndexLoading);
    const localSnapshotAvailable = useExplorerStore(state => state.localSnapshotAvailable);
    const localSnapshotRefreshing = useExplorerStore(state => state.localSnapshotRefreshing);
    const localSnapshotGeneratedAt = useExplorerStore(state => state.localSnapshotGeneratedAt);
    const localSnapshotAssetCount = useExplorerStore(state => state.localSnapshotAssetCount);
    const refreshLocalSnapshot = useExplorerStore(state => state.refreshLocalSnapshot);
    const setAssetSource = useExplorerStore(state => state.setAssetSource);
    const standardsMap = useExplorerStore(state => state.standardsMap);
    const stats = calculateStats(coverageData);
    if (!coverageData) {
        stats.leafStandards = Object.values(standardsMap)
            .filter(standard => standard.level.toLowerCase() === 'standard').length;
        stats.coverage = `0% (0/${stats.leafStandards})`;
    }

    return (
        <header className="explorer-header shrink-0">
            <div className="explorer-header-left">
                <div className="explorer-brand">
                    <img src="/favicon.png" alt="EduGraph logo" />
                    <h1 className="explorer-brand-title">EduGraph Coverage</h1>
                </div>
            </div>
            <div className="explorer-header-center">
                <div className="explorer-standard-selector">
                    <span>Common Core Standards</span>
                </div>
            </div>
            <div className="explorer-header-right">
                {assetSource === 'released' && releasedAssetIndex && (
                    <span
                        className="explorer-data-ref"
                        title={`Released dataset ${releasedAssetIndex.dataset.revision}`}
                    >
                        {releasedAssetIndex.dataset.revision}
                    </span>
                )}
                {isLocalExplorerHost() && (
                    <>
                        <button
                            type="button"
                            disabled={localSnapshotRefreshing}
                            onClick={() => void refreshLocalSnapshot()}
                            title={localSnapshotGeneratedAt
                                ? `Local snapshot from ${localSnapshotGeneratedAt} (${localSnapshotAssetCount} images)`
                                : 'Build local coverage and sample data'}
                            className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-slate-200 hover:border-sky-500 disabled:cursor-wait disabled:opacity-60"
                        >
                            {localSnapshotRefreshing ? 'Refreshing local data…' : 'Refresh local data'}
                        </button>
                        <div className="explorer-data-view" aria-label="Sample image source">
                            {(['released', 'local'] as const).map(source => (
                            <button
                                key={source}
                                type="button"
                                aria-pressed={assetSource === source}
                                disabled={assetIndexLoading || (source === 'local' && !localSnapshotAvailable)}
                                onClick={() => void setAssetSource(source)}
                                className={assetSource === source ? 'is-active' : ''}
                            >
                                {source[0].toUpperCase() + source.slice(1)}
                            </button>
                            ))}
                        </div>
                    </>
                )}
                <div className="explorer-metrics">
                    <div className="explorer-metric">
                        <span className="explorer-metric-label">Dataset Coverage</span>
                        <span className="text-emerald-400 explorer-metric-value">{stats.coverage}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

function GradeTabs() {
    const gradesTree = useExplorerStore(state => state.gradesTree);
    const activeGrade = useExplorerStore(state => state.activeGrade);
    const setActiveGrade = useExplorerStore(state => state.setActiveGrade);

    return (
        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 border-b border-slate-800 shrink-0">
            {Object.keys(gradesTree).map(grade => (
                <button
                    key={grade}
                    type="button"
                    onClick={() => setActiveGrade(grade)}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-lg text-center transition-all duration-150 border ${
                        grade === activeGrade
                            ? 'bg-[#fff8f0] border-indigo-500 text-slate-100 shadow-sm font-bold'
                            : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                >
                    {grade}
                </button>
            ))}
        </div>
    );
}

function ExplorerFilters() {
    const activeGrade = useExplorerStore(state => state.activeGrade);
    const activeDomain = useExplorerStore(state => state.activeDomain);
    const gradesTree = useExplorerStore(state => state.gradesTree);
    const searchQuery = useExplorerStore(state => state.searchQuery);
    const setSearchQuery = useExplorerStore(state => state.setSearchQuery);
    const toggleDomain = useExplorerStore(state => state.toggleDomain);
    const domains = getDomains(gradesTree, activeGrade);

    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-slate-800 flex flex-col gap-3">
                <div className="relative">
                    <Icon name="fa-magnifying-glass" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                    <input
                        value={searchQuery}
                        onChange={event => setSearchQuery(event.target.value)}
                        type="text"
                        placeholder="Search standard ID or description..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-2 px-1 py-1.5 sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/40">
                    <span>Filter by Domain</span>
                    {activeDomain && (
                        <button type="button" onClick={() => toggleDomain(activeDomain)} className="text-[9px] text-indigo-400 hover:underline font-mono normal-case">
                            Clear Filter
                        </button>
                    )}
                </div>
                {domains.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-2">No domains found for this grade.</div>
                ) : (
                    <div className="space-y-1.5">
                        {domains.map(domain => {
                            const selected = activeDomain === domain.id;
                            return (
                                <button
                                    key={domain.id}
                                    type="button"
                                    onClick={() => toggleDomain(domain.id)}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-lg border flex items-center justify-between transition-all duration-150 ${
                                        selected
                                            ? 'bg-[#fff8f0] border-indigo-500 text-slate-100 shadow-sm font-bold'
                                            : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                                    }`}
                                >
                                    <span className="flex items-center gap-2 font-mono font-medium">
                                        <Icon name="fa-folder" className={selected ? 'text-indigo-400' : 'text-slate-500'} />
                                        {domain.id}
                                    </span>
                                    {selected && <Icon name="fa-check" className="text-indigo-400 text-[10px]" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function BacklogFilters() {
    const activeTaskType = useExplorerStore(state => state.activeTaskType);
    const toggleTaskType = useExplorerStore(state => state.toggleTaskType);
    const filters: { id: TaskType; name: string; iconColor: string }[] = [
        { id: 'DATASET_ENRICHMENT', name: 'Implementation Tasks', iconColor: 'text-orange-400' },
        { id: 'ONTOLOGY_EXTENSION', name: 'Ontology Tasks', iconColor: 'text-red-400' },
        { id: 'ANALYSIS', name: 'Analysis Tasks', iconColor: 'text-sky-400' },
    ];

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-2 px-1 py-1.5 bg-slate-950/90 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/40">
                    <span>Filter by Task Type</span>
                    {activeTaskType && (
                        <button type="button" onClick={() => toggleTaskType(activeTaskType)} className="text-[9px] text-indigo-400 hover:underline font-mono normal-case">
                            Clear Filter
                        </button>
                    )}
                </div>
                <div className="space-y-1.5">
                    {filters.map(filter => {
                        const selected = activeTaskType === filter.id;
                        return (
                            <button
                                key={filter.id}
                                type="button"
                                onClick={() => toggleTaskType(filter.id)}
                                className={`w-full text-left px-3 py-2.5 text-xs rounded-lg border flex items-center justify-between transition-all duration-150 ${
                                    selected
                                        ? 'bg-[#fff8f0] border-indigo-500 text-slate-100 shadow-sm font-bold'
                                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                                }`}
                            >
                                <span className="flex items-center gap-2.5 font-medium">
                                    <Icon name={coverageStyles[taskStyles[filter.id].coverageKind].icon} className={filter.iconColor} />
                                    {filter.name}
                                </span>
                                {selected && <Icon name="fa-check" className="text-indigo-400 text-[10px]" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function SidePanel() {
    const activeTab = useExplorerStore(state => state.activeTab);
    const setActiveTab = useExplorerStore(state => state.setActiveTab);
    const taskCount = useExplorerStore(state => state.coverageData?.tasks.length ?? 0);

    const tabClass = (selected: boolean) => `flex-1 py-3 text-xs font-semibold uppercase tracking-wider text-center border-b-2 ${
        selected
            ? 'border-indigo-500 bg-[#faf7fa] text-slate-100'
            : 'border-transparent text-slate-400 hover:text-slate-200'
    }`;

    return (
        <aside className="w-full lg:w-96 bg-slate-900/50 border-r border-slate-800 flex flex-col min-h-0 shrink-0">
            <div className="flex border-b border-slate-800 shrink-0">
                <button type="button" onClick={() => setActiveTab('explorer')} className={tabClass(activeTab === 'explorer')}>
                    <Icon name="fa-sitemap" className="mr-1.5" /> Explorer
                </button>
                <button type="button" onClick={() => setActiveTab('backlog')} className={tabClass(activeTab === 'backlog')}>
                    <Icon name="fa-list-check" className="mr-1.5" /> Task Backlog ({taskCount})
                </button>
            </div>
            <GradeTabs />
            {activeTab === 'explorer' ? <ExplorerFilters /> : <BacklogFilters />}
        </aside>
    );
}

function StatusBadge({ style, small = false }: { style: StatusStyle; small?: boolean }) {
    return (
        <span className={`${small ? 'px-1.5 text-[8px]' : 'px-2 text-[9px]'} inline-flex shrink-0 items-center whitespace-nowrap py-0.5 rounded leading-none font-semibold border ${style.badge}`}>
            <Icon name={style.icon} className="mr-0.5" /> {style.label}
        </span>
    );
}

function CoverageBadge({ coverage, small = false, search = false }: { coverage: StandardCoverage; small?: boolean; search?: boolean }) {
    const releasedIndex = useExplorerStore(state => state.releasedAssetIndex);
    const style = coverageStyles[search
        ? getSearchCoverageKind(coverage, releasedIndex)
        : getCoverageKind(coverage, releasedIndex)];
    return <StatusBadge style={style} small={small} />;
}

function TaskStatusBadge({ type, small = false }: { type: TaskType; small?: boolean }) {
    return <StatusBadge style={coverageStyles[taskStyles[type].coverageKind]} small={small} />;
}

function CoverageBadges({ coverage, small = false, search = false }: { coverage: StandardCoverage; small?: boolean; search?: boolean }) {
    const partiallyInScope = getScopeKind(coverage) === 'partially-in-scope';
    return (
        <span className="flex flex-wrap justify-end gap-1">
            <CoverageBadge coverage={coverage} small={small} search={search} />
            {partiallyInScope && (
                <StatusBadge style={partialScopeStyle} small={small} />
            )}
        </span>
    );
}

function CoverageModuleBadges({
    modules,
    size = 'default',
}: {
    modules: ReturnType<typeof getCoverageModules>;
    size?: 'default' | 'large';
}) {
    const sizeClasses = size === 'large'
        ? 'rounded-md border-slate-700/70 px-2 py-1 text-[15px] leading-none text-slate-500'
        : 'rounded border-slate-200/50 px-2.5 py-0.5 text-[10px] text-slate-600';

    return modules.map(module => {
        const kindLabel = module.kind === 'generator' ? 'Generator' : 'View';
        return (
            <span
                key={`${module.kind}-${module.name}`}
                aria-label={`${kindLabel} module: ${module.name}`}
                title={`${kindLabel} module`}
                className={`inline-flex items-center gap-1 border bg-slate-50/70 font-mono font-semibold ${sizeClasses}`}
            >
                <Icon name={module.kind === 'generator' ? 'fa-gear' : 'fa-eye'} className="text-slate-400" />
                {module.name}
            </span>
        );
    });
}

function DetailCoverageBadges({ coverage }: { coverage: StandardCoverage }) {
    const releasedIndex = useExplorerStore(state => state.releasedAssetIndex);
    const style = coverageStyles[getCoverageKind(coverage, releasedIndex)];
    const partiallyInScope = getScopeKind(coverage) === 'partially-in-scope';

    return (
        <span className="flex flex-wrap justify-end gap-1.5">
            <StatusBadge style={style} />
            {partiallyInScope && (
                <StatusBadge style={partialScopeStyle} />
            )}
        </span>
    );
}

function StandardCard({ standard, nested = false, search = false }: {
    standard: TreeStandard | Omit<TreeStandard, 'subStandards'> | StandardNode;
    nested?: boolean;
    search?: boolean;
}) {
    const coverage = useExplorerStore(state => state.coverageData?.coverage[standard.id]);
    const releasedIndex = useExplorerStore(state => state.releasedAssetIndex);
    const activeStandardId = useExplorerStore(state => state.activeStandardId);
    const setActiveStandard = useExplorerStore(state => state.setActiveStandard);
    const selected = activeStandardId === standard.id;
    const kind = coverage
        ? (search ? getSearchCoverageKind(coverage, releasedIndex) : getCoverageKind(coverage, releasedIndex))
        : null;
    const style = kind ? coverageStyles[kind] : null;
    const statusClass = nested
        ? selected
            ? style?.selectedSubCard ?? 'border-slate-500 bg-slate-900/40 ring-1 ring-slate-400/30'
            : style?.subCard ?? 'border-slate-800/40 hover:border-slate-700 bg-slate-900/10'
        : selected
            ? style?.selectedCard ?? 'border-slate-500 ring-1 ring-slate-400/30 bg-slate-900/40'
            : style?.card ?? 'border-slate-800/60 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-900/60';
    const subStandards = 'subStandards' in standard ? standard.subStandards : [];

    return (
        <div
            id={`card-${standard.id.replaceAll('.', '_')}`}
            role="button"
            tabIndex={0}
            onClick={event => {
                event.stopPropagation();
                setActiveStandard(standard.id);
            }}
            onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') setActiveStandard(standard.id);
            }}
            className={`${nested ? 'p-2.5 rounded-md gap-1.5' : 'p-3.5 rounded-lg gap-2.5'} border transition-all duration-150 cursor-pointer focus:outline-none flex flex-col ${selected ? 'shadow-sm' : ''} ${statusClass}`}
        >
            <div className="flex items-center justify-between gap-3">
                <span className={`${nested ? 'text-[11px] font-semibold' : 'text-xs font-bold'} font-mono text-slate-300`}>{standard.id}</span>
                {coverage && <CoverageBadges coverage={coverage} small={nested} search={search} />}
            </div>
            <p className={`${nested ? 'text-[11px] text-slate-400 leading-normal' : 'text-xs text-slate-300 leading-relaxed'}`}>{standard.description}</p>
            {!nested && subStandards.length > 0 && (
                <div className="border-t border-slate-800/40 pt-2.5 mt-1.5 space-y-2">
                    {subStandards.map(subStandard => (
                        <StandardCard key={subStandard.id} standard={subStandard} nested />
                    ))}
                </div>
            )}
        </div>
    );
}

function ClusterList() {
    const gradesTree = useExplorerStore(state => state.gradesTree);
    const activeGrade = useExplorerStore(state => state.activeGrade);
    const activeDomain = useExplorerStore(state => state.activeDomain);
    const clusters = getClusters(gradesTree, activeGrade, activeDomain);

    if (clusters.length === 0) {
        return <div className="text-sm text-slate-500 italic text-center py-6">No clusters found under the selected domain filter.</div>;
    }

    return <>
        {clusters.map(cluster => (
            <section key={cluster.id} className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between border-b border-slate-800/60 pb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-200 leading-snug">{cluster.id}: {cluster.description}</h3>
                    </div>
                </div>
                <div className="space-y-3">
                    {cluster.standards.length === 0
                        ? <div className="text-xs text-slate-500 italic pl-2">No standards in this cluster.</div>
                        : cluster.standards.map(standard => <StandardCard key={standard.id} standard={standard} />)}
                </div>
            </section>
        ))}
    </>;
}

function SearchResults() {
    const standardsMap = useExplorerStore(state => state.standardsMap);
    const searchQuery = useExplorerStore(state => state.searchQuery);
    const matches = searchStandards(standardsMap, searchQuery);

    if (matches.length === 0) {
        return <div className="text-sm text-slate-500 italic text-center py-10">No matching standards found. Try broadening your criteria.</div>;
    }

    return (
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="space-y-3">
                {matches.map(standard => <StandardCard key={standard.id} standard={standard} search />)}
            </div>
        </section>
    );
}

function TaskCard({ task }: { task: BacklogTask }) {
    const activeTaskId = useExplorerStore(state => state.activeTaskId);
    const setActiveTask = useExplorerStore(state => state.setActiveTask);
    const selected = activeTaskId === task.id;
    const summary = splitTaskDescription(task.description).summary;

    return (
        <article
            role="button"
            tabIndex={0}
            onClick={() => setActiveTask(task.id)}
            onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') setActiveTask(task.id);
            }}
            className={`bg-slate-900/40 border rounded-xl p-5 space-y-4 transition-all hover:bg-slate-900/60 cursor-pointer focus:outline-none ${
                selected ? 'border-slate-400/50 bg-slate-900/50 shadow-sm' : 'border-slate-800/80'
            }`}
        >
            <div className="flex items-center justify-between gap-4">
                <h3 className="min-w-0 text-base font-bold text-slate-100">{task.title}</h3>
                <TaskStatusBadge type={task.type} />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{summary}</p>
            <div className="flex flex-wrap gap-1.5 items-center pt-2 border-t border-slate-800/40">
                <span className="text-[10px] text-slate-500 font-semibold mr-1">Standards:</span>
                {task.standards.map(standard => (
                    <span key={standard} className="px-2 py-0.5 bg-slate-950/60 border border-slate-800 rounded font-mono text-[9px] text-slate-400">{standard}</span>
                ))}
            </div>
        </article>
    );
}

function CenterPanel() {
    const activeTab = useExplorerStore(state => state.activeTab);
    const activeGrade = useExplorerStore(state => state.activeGrade);
    const activeDomain = useExplorerStore(state => state.activeDomain);
    const activeTaskType = useExplorerStore(state => state.activeTaskType);
    const searchActive = useExplorerStore(state => state.searchActive);
    const tasks = useExplorerStore(state => state.coverageData?.tasks ?? EMPTY_TASKS);
    const filteredTasks = filterTasks(tasks, activeGrade, activeTaskType);
    const compactHeader = activeTab === 'backlog' || (!searchActive && !activeDomain);

    const header = activeTab === 'backlog'
        ? {
            crumbs: '',
            title: `CCSS ${activeGrade} Backlog`,
            description: '',
        }
        : searchActive
            ? {
                crumbs: 'SEARCH RESULTS',
                title: 'Filtered Search Results',
                description: 'Showing standards matching your query and filter parameters.',
            }
            : activeDomain
                ? {
                    crumbs: `${activeGrade} > Domain ${activeDomain}`,
                    title: `Domain: ${activeDomain}`,
                    description: `Showing standards filtered for domain ${activeDomain} in ${activeGrade}. Tap domain again to unselect.`,
                }
                : {
                    crumbs: '',
                    title: `CCSS ${activeGrade}`,
                    description: '',
                };

    return (
        <main className={`flex-1 flex flex-col min-h-0 bg-slate-950 overflow-y-auto border-r border-slate-800 p-6 ${compactHeader ? 'pt-0' : ''}`}>
            <div className={`mb-4 ${compactHeader ? 'flex h-[42px] shrink-0 items-center' : ''}`}>
                {header.crumbs && (
                    <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">{header.crumbs}</div>
                )}
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">{header.title}</h2>
                {header.description && <p className="text-sm text-slate-400 mt-1">{header.description}</p>}
            </div>
            <div className="space-y-4">
                {activeTab === 'backlog'
                    ? filteredTasks.length > 0
                        ? filteredTasks.map(task => <TaskCard key={task.id} task={task} />)
                        : <div className="text-sm text-slate-500 italic text-center py-6">No tasks match the selected grade and task type filters.</div>
                    : searchActive
                        ? <SearchResults />
                        : <ClusterList />}
            </div>
        </main>
    );
}

const getConceptBadgeStyle = (coverage: StandardCoverage, label: string) => {
    if (coverage.matched_areas.includes(label)) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (coverage.matched_scopes.includes(label)) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (coverage.matched_abilities.includes(label)) return 'bg-sky-50 text-sky-800 border-sky-200';
    return 'bg-slate-900 text-slate-200 border-slate-700';
};

function ConceptBadges({
    coverage,
    labels,
    emptyText,
    size = 'default',
}: {
    coverage: StandardCoverage;
    labels: string[];
    emptyText: string;
    size?: 'default' | 'large';
}) {
    const textSize = size === 'large' ? 'text-[15px]' : 'text-[10px]';
    if (labels.length === 0) return <span className={`${textSize} text-slate-500 italic`}>{emptyText}</span>;
    return <>
        {labels.map(label => (
            <span
                key={label}
                title={label}
                className={`px-2 py-1 rounded-md border font-mono font-semibold ${textSize} leading-none inline-block ${getConceptBadgeStyle(coverage, label)}`}
            >
                {label.split('/').at(-1)}
            </span>
        ))}
    </>;
}

function MappingExplanation({ coverage }: { coverage: StandardCoverage }) {
    const setActiveTab = useExplorerStore(state => state.setActiveTab);
    const setActiveTask = useExplorerStore(state => state.setActiveTask);

    const openImplementationTask = (implementationId: string) => {
        setActiveTask(`task-implementation-${implementationId}`);
        setActiveTab('backlog');
    };
    const openOntologyTask = (ontologyId: string) => {
        setActiveTask(`task-ontology-${ontologyId}`);
        setActiveTab('backlog');
    };

    if (!coverage.spec_covered) {
        return (
            <div className="text-xs text-sky-800 bg-sky-50 border border-sky-200 rounded-md p-2.5 leading-relaxed mt-1">
                <div className="flex items-start gap-2">
                    <Icon name="fa-magnifying-glass" className="text-sky-600 mt-0.5 shrink-0 text-[11px]" />
                    <div><strong>Analysis Needed:</strong> Spec file not yet created for this grade/cluster. Domain analysis required to define target competencies.</div>
                </div>
            </div>
        );
    }
    const implementations = [...new Map(coverage.implementation_todos.map(todo => [
        todo.implementation.id,
        todo.implementation,
    ])).values()];
    const ontologies = [...new Map(coverage.ontology_todos.map(todo => [
        todo.ontology.id,
        todo.ontology,
    ])).values()];
    const hasDetails = coverage.beyond_scope.length > 0
        || coverage.ontology_todos.length > 0
        || implementations.length > 0;

    return hasDetails ? (
        <div className="mt-1 space-y-2">
            {coverage.beyond_scope.length > 0 && (
                <div className="rounded-md border border-purple-200/50 bg-purple-50 p-2.5 text-xs leading-relaxed text-purple-800">
                    {coverage.beyond_scope.map(item => <div key={item.title}><strong>{item.title}:</strong> {item.description}</div>)}
                </div>
            )}
            {ontologies.map(ontology => (
                <button
                    key={ontology.id}
                    type="button"
                    onClick={() => openOntologyTask(ontology.id)}
                    className="group w-full rounded-md border border-red-200 bg-red-50 p-2.5 text-left text-red-900 transition-colors hover:border-red-400 hover:bg-red-100/70 focus:outline-none focus:ring-2 focus:ring-red-400/40"
                >
                    <span className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[10px] font-semibold">{ontology.id}</span>
                        <Icon name="fa-arrow-right" className="text-[10px] text-red-400 transition-colors group-hover:text-red-600" />
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-red-800">{ontology.description}</span>
                    <span className="mt-1.5 block space-y-0.5 border-t border-red-200/70 pt-1.5">
                        {coverage.ontology_todos
                            .filter(todo => todo.ontology.id === ontology.id)
                            .map(todo => (
                                <span key={`${todo.title}-${todo.description}`} className="block text-[10px] leading-relaxed text-red-700">
                                    <strong>{todo.title}:</strong> {todo.description}
                                </span>
                            ))}
                    </span>
                </button>
            ))}
            {implementations.map(implementation => (
                <button
                    key={implementation.id}
                    type="button"
                    onClick={() => openImplementationTask(implementation.id)}
                    className="group w-full rounded-md border border-slate-800 bg-slate-950/50 p-2.5 text-left transition-colors hover:border-orange-500/40 hover:bg-orange-500/5 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                >
                    <span className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[10px] font-semibold text-orange-300">{implementation.id}</span>
                        <Icon name="fa-arrow-right" className="text-[10px] text-slate-500 transition-colors group-hover:text-orange-400" />
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-400">{implementation.description}</span>
                </button>
            ))}
        </div>
    ) : null;
}

function BreakdownHeading({ label }: { label: string }) {
    return (
        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</div>
    );
}

function ReleasedSamplePopover({
    index,
    standard,
    coverage,
    labels,
    samples,
    selectedIndex,
    onSelect,
    onClose,
}: {
    index: AssetIndex;
    standard: StandardNode;
    coverage: StandardCoverage;
    labels: string[];
    samples: ReleasedAssetSample[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onClose: () => void;
}) {
    const assetSource = useExplorerStore(state => state.assetSource);
    const sample = samples[selectedIndex];
    const hasPrevious = selectedIndex > 0;
    const hasNext = selectedIndex < samples.length - 1;

    useEffect(() => {
        const explorerRoot = document.getElementById('standards-explorer-root');
        const wasInert = explorerRoot?.inert ?? false;
        const previousOverflow = document.body.style.overflow;
        if (explorerRoot) explorerRoot.inert = true;
        document.body.style.overflow = 'hidden';

        return () => {
            if (explorerRoot) explorerRoot.inert = wasInert;
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
            if (event.key === 'ArrowLeft' && hasPrevious) onSelect(selectedIndex - 1);
            if (event.key === 'ArrowRight' && hasNext) onSelect(selectedIndex + 1);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [hasNext, hasPrevious, onClose, onSelect, selectedIndex]);

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label="Sample preview"
            onClick={onClose}
        >
            <div
                className="relative flex h-[76vh] min-h-96 w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
                onClick={event => event.stopPropagation()}
            >
                <header className="w-full shrink-0 border-b border-black/10 bg-white/60 px-6 py-5 pr-16 text-left">
                    <h2 className="text-base font-semibold text-[#0f172a]">{standard.id}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-[#475569]">{standard.description}</p>
                </header>
                <button
                    type="button"
                    onClick={onClose}
                    autoFocus
                    className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center bg-transparent text-lg text-[#475569] transition-transform hover:text-[#0f172a] focus:outline-none focus-visible:scale-125 focus-visible:text-[#0f172a]"
                    aria-label="Close image preview"
                >
                    <Icon name="fa-xmark" />
                </button>
                <div className="relative flex min-h-0 w-full flex-1 items-center justify-center px-14 py-6 sm:px-20">
                    <button
                        type="button"
                        disabled={!hasPrevious}
                        onClick={() => onSelect(selectedIndex - 1)}
                        className="absolute left-4 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black text-white shadow-lg hover:bg-[#27272a] focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-default disabled:opacity-30 disabled:hover:bg-black sm:left-5"
                        aria-label="Previous image"
                    >
                        <Icon name="fa-chevron-left" />
                    </button>
                    <div className="flex size-full items-center justify-center p-2 sm:p-4">
                        <img
                            src={sampleAssetUrl(index, sample, assetSource)}
                            alt={`${sample.mode} sample rendered with ${sample.view}`}
                            className="block max-h-full max-w-full rounded-lg bg-white object-contain shadow-xl"
                        />
                    </div>
                    <button
                        type="button"
                        disabled={!hasNext}
                        onClick={() => onSelect(selectedIndex + 1)}
                        className="absolute right-4 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black text-white shadow-lg hover:bg-[#27272a] focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-default disabled:opacity-30 disabled:hover:bg-black sm:right-5"
                        aria-label="Next image"
                    >
                        <Icon name="fa-chevron-right" />
                    </button>
                </div>
                <footer className="flex w-full shrink-0 flex-col items-start gap-3 border-t border-black/10 bg-white/60 px-6 py-4 text-left">
                    <div className="flex flex-wrap gap-2">
                        <ConceptBadges coverage={coverage} labels={labels} emptyText="No labels" size="large" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <CoverageModuleBadges size="large" modules={[
                            { kind: 'generator', name: sample.generator },
                            { kind: 'view', name: sample.view },
                        ]} />
                    </div>
                </footer>
            </div>
        </div>,
        document.body,
    );
}

function ReleasedSampleLauncher({
    index,
    standard,
    coverage,
    labels,
    samples,
    ariaLabel,
}: {
    index: AssetIndex;
    standard: StandardNode;
    coverage: StandardCoverage;
    labels: string[];
    samples: ReleasedAssetSample[];
    ariaLabel: string;
}) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    if (samples.length === 0) return null;

    return (
        <>
            <button
                type="button"
                onClick={() => setSelectedIndex(0)}
                className="flex w-8 shrink-0 self-stretch items-center justify-center rounded-md border border-[#cbd5e1] bg-white text-[#475569] transition-colors hover:border-[#94a3b8] hover:text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-sky-500"
                aria-label={ariaLabel}
                title={ariaLabel}
            >
                <Icon name="fa-image" />
            </button>
            {selectedIndex !== null && (
                <ReleasedSamplePopover
                    index={index}
                    standard={standard}
                    coverage={coverage}
                    labels={labels}
                    samples={samples}
                    selectedIndex={selectedIndex}
                    onSelect={setSelectedIndex}
                    onClose={() => setSelectedIndex(null)}
                />
            )}
        </>
    );
}

function CompetencyBreakdown({ coverage, standard }: { coverage: StandardCoverage; standard: StandardNode }) {
    const assetIndex = useExplorerStore(state => state.assetIndex);
    const assetIndexLoading = useExplorerStore(state => state.assetIndexLoading);
    const assetIndexError = useExplorerStore(state => state.assetIndexError);
    const labelSets = getLabelSets(coverage);
    const intersection = intersectLabels(labelSets);
    const permutationCount = coverage.competencies.length + coverage.implementation_todos.length;
    const hasContent = labelSets.length > 0;

    if (!hasContent) return null;

    return (
        <div className="space-y-3 pt-3 border-t border-slate-800/80 mt-1">
            {labelSets.length > 0 && (
                <div className="space-y-1.5">
                    <BreakdownHeading label="Common Labels" />
                    <div className="flex items-stretch gap-2">
                        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 rounded-md border border-slate-800 bg-slate-950/80 p-2">
                            <ConceptBadges coverage={coverage} labels={intersection} emptyText="No labels shared by every permutation" />
                        </div>
                    </div>
                </div>
            )}
            {permutationCount > 0 && (
                <div className="space-y-1.5">
                    <BreakdownHeading label="Label Permutations" />
                    {coverage.competencies.map((permutation, index) => (
                        <div key={`competency-${index}`} className="flex items-stretch gap-2">
                            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 rounded-md border border-slate-800/60 bg-slate-950/60 p-2">
                                <ConceptBadges coverage={coverage} labels={permutation.filter(label => !intersection.includes(label))} emptyText="Only common labels" />
                            </div>
                            {assetIndex && (
                                <ReleasedSampleLauncher
                                    index={assetIndex}
                                    standard={standard}
                                    coverage={coverage}
                                    labels={permutation}
                                    samples={findReleasedSamples(assetIndex, permutation)}
                                    ariaLabel={`Preview samples for permutation ${index + 1}`}
                                />
                            )}
                        </div>
                    ))}
                    {coverage.implementation_todos.map(todo => (
                        <div key={todo.id} className="rounded-md border border-slate-800/60 bg-slate-950/60 p-2">
                            <div className="flex flex-wrap gap-1.5">
                                <ConceptBadges coverage={coverage} labels={todo.labels.filter(label => !intersection.includes(label))} emptyText="Only common labels" />
                            </div>
                        </div>
                    ))}
                    {assetIndexLoading && (
                        <div className="text-[10px] text-slate-500 italic">Loading samples…</div>
                    )}
                    {assetIndexError && (
                        <div className="text-[10px] text-slate-500">Samples unavailable: {assetIndexError}</div>
                    )}
                </div>
            )}
        </div>
    );
}

function StandardDetails() {
    const standardId = useExplorerStore(state => state.activeStandardId);
    const standard = useExplorerStore(state => standardId ? state.standardsMap[standardId] : null);
    const coverage = useExplorerStore(state => standardId ? state.coverageData?.coverage[standardId] : undefined);

    return (
        <div className="p-6 flex flex-col gap-4">
            <div>
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-100 leading-snug">
                        {standard?.id ?? 'Select a standard'}
                    </h3>
                    {coverage && <DetailCoverageBadges coverage={coverage} />}
                </div>
                <p className="text-sm font-normal text-slate-600 mt-2 leading-relaxed">
                    {standard?.description ?? 'Select a standard from the list to display details.'}
                </p>
            </div>
            {standard && coverage && <MappingDetails coverage={coverage} standard={standard} />}
        </div>
    );
}

function MappingDetails({ coverage, standard }: { coverage: StandardCoverage; standard: StandardNode }) {
    const assetIndex = useExplorerStore(state => state.assetIndex);
    const releasedIndex = useExplorerStore(state => state.releasedAssetIndex);
    const kind = getCoverageKind(coverage, releasedIndex);
    const modules = kind === 'partial' || kind === 'ready' || kind === 'released'
        ? getCoverageModules(coverage, assetIndex)
        : [];

    return (
        <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2.5 text-xs">
            <BreakdownHeading label="Mapping" />
            {modules.length > 0 && (
                <div className="flex flex-wrap gap-1.5 rounded-md border border-slate-800 bg-slate-950/80 p-2">
                    <CoverageModuleBadges modules={modules} />
                </div>
            )}
            <MappingExplanation coverage={coverage} />
            <CompetencyBreakdown coverage={coverage} standard={standard} />
        </div>
    );
}

function TaskDetails() {
    const taskId = useExplorerStore(state => state.activeTaskId);
    const task = useExplorerStore(state => state.coverageData?.tasks.find(item => item.id === taskId));

    if (!task) {
        return (
            <div className="p-6">
                <h3 className="text-base font-semibold text-slate-100">Select a backlog task</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Choose a task from the overview to inspect its targets, involved modules, and affected standards.
                </p>
            </div>
        );
    }

    const style = taskStyles[task.type];
    const description = splitTaskDescription(task.description);
    return (
        <div className="p-6 flex flex-col gap-5">
            <header className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-100 leading-snug">{task.title}</h3>
                <TaskStatusBadge type={task.type} />
            </header>
            <section className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">{description.summary}</p>
                {description.details.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{description.detailLabel}</h4>
                        <div className="space-y-3">
                            {description.details.map(detail => (
                                <div key={`${detail.id}-${detail.description}`} className={`border-l-2 pl-3 ${style.accent}`}>
                                    <div className="break-words font-mono text-[10px] font-semibold leading-relaxed text-slate-200">{detail.id}</div>
                                    {detail.description && (
                                        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{detail.description}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
            {task.implementation && (
                <section className="space-y-3 border-t border-slate-800/80 pt-4">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Involved modules</h4>
                    <ImplementationDetails implementation={task.implementation} showSummary={false} boxed={false} />
                </section>
            )}
            {task.ontology && (
                <section className="space-y-3 border-t border-slate-800/80 pt-4">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ontology changes</h4>
                    <OntologyDetails ontology={task.ontology} />
                </section>
            )}
            <section className="border-t border-slate-800/80 pt-4 text-xs">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Affected standards</h4>
                <div className="flex flex-wrap gap-1.5">
                    {task.standards.map(standard => (
                        <span key={standard} className="mt-2 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-[9px] text-slate-400">{standard}</span>
                    ))}
                </div>
            </section>
        </div>
    );
}

function DetailsPanel() {
    const activeTab = useExplorerStore(state => state.activeTab);
    return (
        <aside className="w-full lg:w-96 bg-slate-900/30 border-l border-slate-800 flex flex-col min-h-0 shrink-0 overflow-y-auto">
            {activeTab === 'explorer' ? <StandardDetails /> : <TaskDetails />}
        </aside>
    );
}

export function App() {
    const loadData = useExplorerStore(state => state.loadData);
    const loadReleasedAssetIndex = useExplorerStore(state => state.loadReleasedAssetIndex);
    const loadAssetIndex = useExplorerStore(state => state.loadAssetIndex);
    const loadLocalSnapshotStatus = useExplorerStore(state => state.loadLocalSnapshotStatus);
    const localSnapshotAvailable = useExplorerStore(state => state.localSnapshotAvailable);
    const localSnapshotRefreshing = useExplorerStore(state => state.localSnapshotRefreshing);
    const localSnapshotError = useExplorerStore(state => state.localSnapshotError);
    const refreshLocalSnapshot = useExplorerStore(state => state.refreshLocalSnapshot);
    const loading = useExplorerStore(state => state.loading);
    const error = useExplorerStore(state => state.error);

    useEffect(() => {
        void (async () => {
            const snapshotReady = await loadLocalSnapshotStatus();
            if (snapshotReady) await loadData();
            await loadReleasedAssetIndex();
            if (snapshotReady && useExplorerStore.getState().assetSource === 'local') {
                await loadAssetIndex('local');
            }
        })();
    }, [loadAssetIndex, loadData, loadLocalSnapshotStatus, loadReleasedAssetIndex]);

    return (
        <div className="bg-slate-950 text-slate-100 font-sans h-screen flex flex-col overflow-hidden">
            <Header />
            <div className={`relative flex-1 flex flex-col lg:flex-row min-h-0 w-full overflow-hidden ${loading ? 'opacity-30' : ''}`}>
                {localSnapshotRefreshing && (
                    <div className="absolute inset-x-0 top-3 z-50 mx-auto w-fit rounded-md border border-sky-500/40 bg-slate-900 px-4 py-2 text-xs text-sky-100 shadow-xl">
                        Building coverage, indexing samples, and snapshotting local images…
                    </div>
                )}
                <SidePanel />
                {isLocalExplorerHost() && !localSnapshotAvailable && !localSnapshotRefreshing ? (
                    <main className="flex flex-1 items-center justify-center bg-slate-950 p-6">
                        <div className="max-w-md rounded-lg border border-slate-800 bg-slate-900/70 p-5 text-center">
                            <h2 className="text-sm font-semibold text-slate-100">Local explorer data needs a snapshot</h2>
                            <p className="mt-2 text-xs leading-5 text-slate-400">
                                Refresh once after generation or spec changes. The explorer serves the immutable snapshot and never reads the live dataset while you browse.
                            </p>
                            {localSnapshotError && <p className="mt-2 text-xs text-rose-300">{localSnapshotError}</p>}
                            <button
                                type="button"
                                onClick={() => void refreshLocalSnapshot()}
                                className="mt-4 rounded-md bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500"
                            >
                                Refresh local data
                            </button>
                        </div>
                    </main>
                ) : error ? (
                    <main className="flex-1 bg-slate-950 p-6 text-sm text-red-300">Failed to load dynamically fetched CCSS explorer data: {error}</main>
                ) : (
                    <CenterPanel />
                )}
                <DetailsPanel />
            </div>
        </div>
    );
}
