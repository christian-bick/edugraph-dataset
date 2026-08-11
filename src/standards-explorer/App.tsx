import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    calculateStats,
    filterTasks,
    findReleasedSamples,
    findReleasedSamplesForLabelSets,
    getClusters,
    getCoverageKind,
    getDomains,
    getLabelSets,
    getSearchCoverageKind,
    intersectLabels,
    releasedSampleUrl,
    searchStandards,
    type CoverageKind,
} from './model.ts';
import { useExplorerStore } from './store.ts';
import type {
    BacklogTask,
    StandardCoverage,
    StandardNode,
    TaskType,
    TreeStandard,
} from './types.ts';
import type { AssetIndex, ReleasedAssetSample } from '../lib/asset-index.ts';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
    <i aria-hidden="true" className={`fa-solid ${name} ${className}`} />
);

const coverageStyles: Record<CoverageKind, {
    label: string;
    icon: string;
    badge: string;
    card: string;
    selectedCard: string;
    subCard: string;
    selectedSubCard: string;
    detailLabel: string;
    detailBadge: string;
}> = {
    analysis: {
        label: 'Analysis',
        icon: 'fa-magnifying-glass',
        badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        card: 'border-sky-500/30 hover:border-sky-500/50 bg-sky-50 hover:bg-sky-100/70',
        selectedCard: 'border-slate-500 ring-1 ring-slate-400/30 bg-sky-50',
        subCard: 'border-sky-500/20 hover:border-sky-500/40 bg-sky-50 hover:bg-sky-100/70',
        selectedSubCard: 'border-slate-500 bg-sky-50 ring-1 ring-slate-400/30',
        detailLabel: 'ANALYSIS NEEDED',
        detailBadge: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    beyond: {
        label: 'Beyond Scope',
        icon: 'fa-ban',
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        card: 'border-purple-500/30 hover:border-purple-500/50 bg-purple-50 hover:bg-purple-100/70',
        selectedCard: 'border-slate-500 ring-1 ring-slate-400/30 bg-purple-50',
        subCard: 'border-purple-500/20 hover:border-purple-500/40 bg-purple-50 hover:bg-purple-100/70',
        selectedSubCard: 'border-slate-500 bg-purple-50 ring-1 ring-slate-400/30',
        detailLabel: 'BEYOND SCOPE',
        detailBadge: 'bg-purple-50 text-purple-800 border-purple-200',
    },
    ontology: {
        label: 'Ontology',
        icon: 'fa-circle-xmark',
        badge: 'bg-red-500/10 text-red-400 border-red-500/20',
        card: 'border-red-500/30 hover:border-red-500/50 bg-red-50 hover:bg-red-100/70',
        selectedCard: 'border-slate-500 ring-1 ring-slate-400/30 bg-red-50',
        subCard: 'border-red-500/20 hover:border-red-500/40 bg-red-50 hover:bg-red-100/70',
        selectedSubCard: 'border-slate-500 bg-red-50 ring-1 ring-slate-400/30',
        detailLabel: 'MISSING ONTOLOGY',
        detailBadge: 'bg-red-50 text-red-800 border-red-200',
    },
    partial: {
        label: 'Partial Scope',
        icon: 'fa-circle-half-stroke',
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        card: 'border-purple-500/30 hover:border-purple-500/50 bg-purple-50 hover:bg-purple-100/70',
        selectedCard: 'border-slate-500 ring-1 ring-slate-400/30 bg-purple-50',
        subCard: 'border-purple-500/20 hover:border-purple-500/40 bg-purple-50 hover:bg-purple-100/70',
        selectedSubCard: 'border-slate-500 bg-purple-50 ring-1 ring-slate-400/30',
        detailLabel: 'PARTIAL SCOPE',
        detailBadge: 'bg-purple-50 text-purple-800 border-purple-200',
    },
    covered: {
        label: 'Covered',
        icon: 'fa-circle-check',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        card: 'border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-50 hover:bg-emerald-100/70',
        selectedCard: 'border-slate-500 ring-1 ring-slate-400/30 bg-emerald-50',
        subCard: 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-50 hover:bg-emerald-100/70',
        selectedSubCard: 'border-slate-500 bg-emerald-50 ring-1 ring-slate-400/30',
        detailLabel: 'COVERED',
        detailBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    implementation: {
        label: 'Implementation',
        icon: 'fa-triangle-exclamation',
        badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        card: 'border-orange-500/30 hover:border-orange-500/50 bg-orange-50 hover:bg-orange-100/70',
        selectedCard: 'border-slate-500 ring-1 ring-slate-400/30 bg-orange-50',
        subCard: 'border-orange-500/20 hover:border-orange-500/40 bg-orange-50 hover:bg-orange-100/70',
        selectedSubCard: 'border-slate-500 bg-orange-50 ring-1 ring-slate-400/30',
        detailLabel: 'MISSING IMPLEMENTATION',
        detailBadge: 'bg-orange-50 text-orange-800 border-orange-200',
    },
};

const taskStyles: Record<TaskType, { label: string; icon: string; color: string; detail: string }> = {
    DATASET_ENRICHMENT: {
        label: 'Implementation',
        icon: 'fa-triangle-exclamation',
        color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        detail: 'bg-orange-500/10 border-orange-500/20 text-orange-300',
    },
    ONTOLOGY_EXTENSION: {
        label: 'Ontology',
        icon: 'fa-circle-xmark',
        color: 'bg-red-500/10 text-red-400 border-red-500/20',
        detail: 'bg-red-500/10 border-red-500/20 text-red-300',
    },
    ANALYSIS: {
        label: 'ANALYSIS',
        icon: 'fa-magnifying-glass',
        color: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
        detail: 'bg-sky-500/10 border-sky-500/20 text-sky-300',
    },
};

const EMPTY_TASKS: BacklogTask[] = [];

function Header() {
    const coverageData = useExplorerStore(state => state.coverageData);
    const coverageManifest = useExplorerStore(state => state.coverageManifest);
    const dataView = useExplorerStore(state => state.dataView);
    const loading = useExplorerStore(state => state.loading);
    const setDataView = useExplorerStore(state => state.setDataView);
    const standardsMap = useExplorerStore(state => state.standardsMap);
    const stats = calculateStats(coverageData);
    if (!coverageData) {
        stats.leafStandards = Object.values(standardsMap)
            .filter(standard => standard.level.toLowerCase() === 'standard').length;
    }
    const items = [
        { label: 'Dataset Coverage:', value: stats.coverage, color: 'text-emerald-400' },
        { label: 'Missing Implementation:', value: stats.missingImplementation, color: 'text-orange-400' },
        { label: 'Missing Ontology:', value: stats.missingOntology, color: 'text-red-400' },
        { label: 'Analysis Needed:', value: stats.analysisNeeded, color: 'text-sky-400' },
        { label: 'Leaf Standards:', value: stats.leafStandards, color: 'text-indigo-400' },
    ];

    return (
        <header className="explorer-header shrink-0">
            <div className="explorer-header-left">
                <div className="explorer-brand">
                    <img src="/favicon.png" alt="EduGraph logo" />
                    <h1 className="explorer-brand-title">EduGraph Coverage</h1>
                </div>
                <div className="explorer-standard-selector">
                    <span>Common Core Standards</span>
                </div>
                <div className="explorer-data-view" aria-label="Coverage data view">
                    {(['latest', 'preview'] as const).map(view => (
                        <button
                            key={view}
                            type="button"
                            aria-pressed={dataView === view}
                            disabled={loading}
                            onClick={() => void setDataView(view)}
                            className={dataView === view ? 'is-active' : ''}
                        >
                            {view === 'latest' ? 'Latest' : 'Preview'}
                        </button>
                    ))}
                </div>
                {coverageManifest && (
                    <span className="explorer-data-ref" title={coverageManifest.source_sha}>
                        {dataView === 'latest'
                            ? coverageManifest.source_ref
                            : coverageManifest.source_sha.slice(0, 7)}
                    </span>
                )}
            </div>
            <div className="explorer-metrics">
                {items.map(item => (
                    <div key={item.label} className="explorer-metric">
                        <span className="explorer-metric-label">{item.label.replace(':', '')}</span>
                        <span className={`${item.color} explorer-metric-value`}>{item.value}</span>
                    </div>
                ))}
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
                <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-2 px-1 py-1.5 bg-slate-950/90 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/40">
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
                                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold shadow-sm'
                                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                                }`}
                            >
                                <span className="flex items-center gap-2.5 font-medium">
                                    <Icon name={taskStyles[filter.id].icon} className={filter.iconColor} />
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

function CoverageBadge({ coverage, small = false, search = false }: { coverage: StandardCoverage; small?: boolean; search?: boolean }) {
    const style = coverageStyles[search ? getSearchCoverageKind(coverage) : getCoverageKind(coverage)];
    return (
        <span className={`${small ? 'px-1.5 text-[8px]' : 'px-2 text-[9px]'} py-0.5 rounded leading-none font-semibold border ${style.badge}`}>
            <Icon name={style.icon} className="mr-0.5" /> {style.label}
        </span>
    );
}

function StandardCard({ standard, nested = false, search = false }: {
    standard: TreeStandard | Omit<TreeStandard, 'subStandards'> | StandardNode;
    nested?: boolean;
    search?: boolean;
}) {
    const coverage = useExplorerStore(state => state.coverageData?.coverage[standard.id]);
    const activeStandardId = useExplorerStore(state => state.activeStandardId);
    const setActiveStandard = useExplorerStore(state => state.setActiveStandard);
    const selected = activeStandardId === standard.id;
    const kind = coverage ? (search ? getSearchCoverageKind(coverage) : getCoverageKind(coverage)) : null;
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
            className={`${nested ? 'p-2.5 rounded-md gap-1.5' : 'p-3.5 rounded-lg gap-2.5'} border transition-all duration-150 cursor-pointer focus:outline-none flex flex-col ${statusClass}`}
        >
            <div className={`flex items-${nested ? 'center' : 'start'} justify-between gap-3`}>
                <span className={`${nested ? 'text-[11px] font-semibold' : 'text-xs font-bold'} font-mono text-slate-300`}>{standard.id}</span>
                {coverage && <CoverageBadge coverage={coverage} small={nested} search={search} />}
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
            <section key={cluster.id} className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-sm">
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
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4 shadow-sm">
            <div className="space-y-3">
                {matches.map(standard => <StandardCard key={standard.id} standard={standard} search />)}
            </div>
        </section>
    );
}

function TaskCard({ task }: { task: BacklogTask }) {
    const activeTaskId = useExplorerStore(state => state.activeTaskId);
    const setActiveTask = useExplorerStore(state => state.setActiveTask);
    const style = taskStyles[task.type];
    const selected = activeTaskId === task.id;

    return (
        <article
            role="button"
            tabIndex={0}
            onClick={() => setActiveTask(task.id)}
            onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') setActiveTask(task.id);
            }}
            className={`bg-slate-900/40 border rounded-xl p-5 space-y-4 shadow-sm transition-all hover:bg-slate-900/60 cursor-pointer focus:outline-none ${
                selected ? 'border-slate-500 ring-1 ring-slate-400/30 bg-slate-900/40' : 'border-slate-800/80'
            }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-slate-400">{task.cluster_id}</span>
                        <span className="text-xs text-slate-600">|</span>
                        <span className="text-xs text-slate-500 font-medium">{task.cluster_description}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{task.title}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] border font-bold ${style.color}`}>{style.label}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{task.description}</p>
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

    const header = activeTab === 'backlog'
        ? {
            crumbs: `TASK BACKLOG > ${activeGrade.toUpperCase()}`,
            title: `${activeGrade} Pedagogical Task Backlog`,
            description: 'Backlog of missing generators, views, ontology definitions, or domain analysis tasks grouped by Cluster.',
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
                    crumbs: `CCSS > ${activeGrade}`,
                    title: `${activeGrade} Standards Overview`,
                    description: `Showing all clusters and standards for ${activeGrade}. Tap a domain on the left to filter.`,
                };

    return (
        <main className="flex-1 flex flex-col min-h-0 bg-slate-950 overflow-y-auto border-r border-slate-800 p-6">
            <div className="mb-4">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">{header.crumbs}</div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">{header.title}</h2>
                <p className="text-sm text-slate-400 mt-1">{header.description}</p>
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
    if (coverage.beyond_scope.length > 0) {
        return (
            <div className="text-xs text-purple-800 bg-purple-50 border border-purple-200 rounded-md p-2.5 leading-relaxed mt-1">
                {coverage.beyond_scope.map(item => <div key={item.title}><strong>{item.title}:</strong> {item.description}</div>)}
            </div>
        );
    }
    if (!coverage.ontology_covered || coverage.ontology_todos.length > 0) {
        return coverage.ontology_todos.length > 0 ? (
            <div className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-md p-2.5 leading-relaxed mt-1">
                {coverage.ontology_todos.map(todo => <div key={todo.title}><strong>{todo.title}:</strong> {todo.description}</div>)}
            </div>
        ) : null;
    }
    const explanations = [...new Set(coverage.implementation_todos.map(todo => todo.explanation).filter(Boolean))];
    return explanations.length > 0 ? (
        <div className="text-xs text-orange-800 bg-orange-50 border border-orange-200 rounded-md p-2.5 leading-relaxed mt-1">
            <div className="flex items-start gap-2">
                <Icon name="fa-triangle-exclamation" className="text-orange-600 mt-0.5 shrink-0 text-[11px]" />
                <div>{explanations.map(explanation => <div key={explanation}>{explanation}</div>)}</div>
            </div>
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
            aria-label="Released sample preview"
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
                            src={releasedSampleUrl(index, sample)}
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
                <footer className="flex w-full shrink-0 flex-wrap gap-2 border-t border-black/10 bg-white/60 px-6 py-4 text-left">
                    <ConceptBadges coverage={coverage} labels={labels} emptyText="No labels" size="large" />
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
                className="flex size-8 shrink-0 self-center items-center justify-center rounded-md border border-[#cbd5e1] bg-white text-[#475569] transition-colors hover:border-[#94a3b8] hover:text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-sky-500"
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
    const commonSamples = findReleasedSamplesForLabelSets(assetIndex, coverage.competencies);
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
                        {assetIndex && (
                            <ReleasedSampleLauncher
                                index={assetIndex}
                                standard={standard}
                                coverage={coverage}
                                labels={intersection}
                                samples={commonSamples}
                                ariaLabel="Preview released samples for common labels"
                            />
                        )}
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
                                    ariaLabel={`Preview released samples for permutation ${index + 1}`}
                                />
                            )}
                        </div>
                    ))}
                    {coverage.implementation_todos.map(todo => (
                        <div key={todo.id} className="p-2 rounded-md bg-orange-50 border border-orange-200">
                            <div className="flex flex-wrap gap-1.5">
                                <ConceptBadges coverage={coverage} labels={todo.labels.filter(label => !intersection.includes(label))} emptyText="Only common labels" />
                            </div>
                        </div>
                    ))}
                    {assetIndexLoading && (
                        <div className="text-[10px] text-slate-500 italic">Loading released samples…</div>
                    )}
                    {assetIndexError && (
                        <div className="text-[10px] text-slate-500">Released samples unavailable: {assetIndexError}</div>
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
        <div className="p-6 bg-slate-900/60 flex flex-col gap-4">
            <div>
                <h3 className="text-base font-semibold text-slate-100 leading-snug">
                    {standard?.id ?? 'Select a standard'}
                </h3>
                <p className="text-sm font-normal text-slate-600 mt-2 leading-relaxed">
                    {standard?.description ?? 'Select a standard from the list to display details.'}
                </p>
            </div>
            {standard && coverage && <MappingDetails coverage={coverage} standard={standard} />}
        </div>
    );
}

function MappingDetails({ coverage, standard }: { coverage: StandardCoverage; standard: StandardNode }) {
    const kind = getCoverageKind(coverage);
    const style = coverageStyles[kind];
    const showModule = (kind === 'partial' || kind === 'covered') && coverage.generator_module;

    return (
        <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2.5 text-xs">
            <span className="text-slate-500 block font-semibold text-[11px]">Mapping Status</span>
            <div className="flex items-center gap-1.5">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border ${style.detailBadge}`}>{style.detailLabel}</span>
                {showModule && (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-orange-50 text-orange-800 border border-orange-200">
                        {coverage.generator_module?.toUpperCase()}
                    </span>
                )}
            </div>
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
            <div className="p-6 bg-slate-900/60 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                    <span className="px-2.5 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded text-[10px] font-mono font-bold tracking-wider">DATASET_ENRICHMENT</span>
                    <span className="text-xs text-slate-500 font-mono">task-generator-K.CC.B</span>
                </div>
                <div>
                    <h3 className="text-base font-semibold text-slate-100 leading-snug">Task Title</h3>
                    <p className="text-xs text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">Task description...</p>
                </div>
                <div className="border-t border-slate-800/80 pt-3 text-xs">
                    <span className="text-slate-500 block mb-1.5">Affected Standards</span>
                </div>
            </div>
        );
    }

    const style = taskStyles[task.type];
    return (
        <div className="p-6 bg-slate-900/60 flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <span className={`px-2.5 py-0.5 border rounded text-[10px] font-mono font-bold tracking-wider ${style.detail}`}>{style.label}</span>
                <span className="text-xs text-slate-500 font-mono">{task.id}</span>
            </div>
            <div>
                <h3 className="text-base font-semibold text-slate-100 leading-snug">{task.title}</h3>
                <p className="text-xs text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">{task.description}</p>
            </div>
            <div className="border-t border-slate-800/80 pt-3 text-xs">
                <span className="text-slate-500 block mb-1.5">Affected Standards</span>
                <div className="flex flex-wrap gap-1.5">
                    {task.standards.map(standard => (
                        <span key={standard} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded font-mono text-[9px] text-slate-400">{standard}</span>
                    ))}
                </div>
            </div>
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
    const loadAssetIndex = useExplorerStore(state => state.loadAssetIndex);
    const loading = useExplorerStore(state => state.loading);
    const error = useExplorerStore(state => state.error);

    useEffect(() => {
        void loadData();
        void loadAssetIndex();
    }, [loadAssetIndex, loadData]);

    return (
        <div className="bg-slate-950 text-slate-100 font-sans h-screen flex flex-col overflow-hidden">
            <Header />
            <div className={`flex-1 flex flex-col lg:flex-row min-h-0 w-full overflow-hidden ${loading ? 'opacity-30' : ''}`}>
                <SidePanel />
                {error ? (
                    <main className="flex-1 bg-slate-950 p-6 text-sm text-red-300">Failed to load dynamically fetched CCSS explorer data: {error}</main>
                ) : (
                    <CenterPanel />
                )}
                <DetailsPanel />
            </div>
        </div>
    );
}
