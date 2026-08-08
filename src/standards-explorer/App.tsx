import { useEffect } from 'react';
import {
    calculateStats,
    filterTasks,
    getClusters,
    getCoverageKind,
    getDomains,
    getLabelSets,
    getSearchCoverageKind,
    intersectLabels,
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
        card: 'border-sky-500/30 hover:border-sky-500/50 bg-sky-500/5',
        selectedCard: 'border-indigo-500 ring-1 ring-indigo-500/50 bg-sky-500/5',
        subCard: 'border-sky-500/20 hover:border-sky-500/40 bg-sky-500/5',
        selectedSubCard: 'border-indigo-500 bg-sky-500/10 ring-1 ring-indigo-500/50',
        detailLabel: 'ANALYSIS NEEDED',
        detailBadge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    },
    beyond: {
        label: 'Beyond Scope',
        icon: 'fa-ban',
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        card: 'border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5',
        selectedCard: 'border-indigo-500 ring-1 ring-indigo-500/50 bg-purple-500/5',
        subCard: 'border-purple-500/20 hover:border-purple-500/40 bg-purple-500/5',
        selectedSubCard: 'border-indigo-500 bg-purple-500/10 ring-1 ring-indigo-500/50',
        detailLabel: 'BEYOND SCOPE',
        detailBadge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    },
    ontology: {
        label: 'Ontology',
        icon: 'fa-circle-xmark',
        badge: 'bg-red-500/10 text-red-400 border-red-500/20',
        card: 'border-red-500/30 hover:border-red-500/50 bg-red-500/5',
        selectedCard: 'border-indigo-500 ring-1 ring-indigo-500/50 bg-red-500/5',
        subCard: 'border-red-500/20 hover:border-red-500/40 bg-red-500/5',
        selectedSubCard: 'border-indigo-500 bg-red-500/10 ring-1 ring-indigo-500/50',
        detailLabel: 'MISSING ONTOLOGY',
        detailBadge: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
    partial: {
        label: 'Partial Scope',
        icon: 'fa-circle-half-stroke',
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
        card: 'border-purple-500/30 hover:border-purple-500/50 bg-purple-500/5',
        selectedCard: 'border-indigo-500 ring-1 ring-indigo-500/50 bg-purple-500/5',
        subCard: 'border-purple-500/20 hover:border-purple-500/40 bg-purple-500/5',
        selectedSubCard: 'border-indigo-500 bg-purple-500/10 ring-1 ring-indigo-500/50',
        detailLabel: 'PARTIAL SCOPE',
        detailBadge: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
    },
    covered: {
        label: 'Covered',
        icon: 'fa-circle-check',
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        card: 'border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/5',
        selectedCard: 'border-indigo-500 ring-1 ring-indigo-500/50 bg-emerald-500/5',
        subCard: 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/5',
        selectedSubCard: 'border-indigo-500 bg-emerald-500/10 ring-1 ring-indigo-500/50',
        detailLabel: 'COVERED',
        detailBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    implementation: {
        label: 'Implementation',
        icon: 'fa-triangle-exclamation',
        badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        card: 'border-orange-500/30 hover:border-orange-500/50 bg-orange-500/5',
        selectedCard: 'border-indigo-500 ring-1 ring-indigo-500/50 bg-orange-500/5',
        subCard: 'border-orange-500/20 hover:border-orange-500/40 bg-orange-500/5',
        selectedSubCard: 'border-indigo-500 bg-orange-500/10 ring-1 ring-indigo-500/50',
        detailLabel: 'MISSING IMPLEMENTATION',
        detailBadge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    },
};

const taskStyles: Record<TaskType, { label: string; icon: string; color: string; detail: string }> = {
    DATASET_ENRICHMENT: {
        label: 'DATASET ENRICHMENT (GENERATOR/VIEW)',
        icon: 'fa-triangle-exclamation',
        color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        detail: 'bg-orange-500/10 border-orange-500/20 text-orange-300',
    },
    ONTOLOGY_EXTENSION: {
        label: 'ONTOLOGY EXTENSION',
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
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2.5 rounded-lg text-white shadow-lg shadow-indigo-600/30">
                    <Icon name="fa-graduation-cap" className="text-2xl" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">Common Core Standards Explorer</h1>
                    <p className="text-xs text-slate-400">Structured interactive task list for mathematical pedagogical modeling</p>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                {items.map(item => (
                    <div key={item.label} className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-md">
                        <span className="text-slate-400 font-medium">{item.label}</span>
                        <span className={`${item.color} font-semibold ml-1`}>{item.value}</span>
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
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/15 font-bold'
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
                                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-semibold shadow-sm'
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
            ? 'border-indigo-500 bg-slate-900 text-white'
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
            ? style?.selectedSubCard ?? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/30'
            : style?.subCard ?? 'border-slate-800/40 hover:border-slate-700 bg-slate-900/10'
        : selected
            ? style?.selectedCard ?? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-indigo-500/5'
            : style?.card ?? 'border-slate-800/60 hover:border-slate-700';
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
            className={`${nested ? 'p-2.5 rounded-md gap-1.5' : 'p-3.5 rounded-lg bg-slate-950/60 hover:bg-slate-900/60 gap-2.5'} border transition-all duration-150 cursor-pointer focus:outline-none flex flex-col ${statusClass}`}
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
                        <span className="px-2 py-0.5 bg-slate-800 border border-slate-700/60 text-slate-400 rounded text-[9px] font-mono tracking-wider">CLUSTER</span>
                        <h3 className="text-sm font-semibold text-slate-200 mt-1.5 leading-snug">{cluster.id}: {cluster.description}</h3>
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
                selected ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-indigo-500/5' : 'border-slate-800/80'
            }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-slate-400">{task.cluster_id}</span>
                        <span className="text-xs text-slate-600">|</span>
                        <span className="text-xs text-slate-500 font-medium">{task.cluster_description}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{task.title}</h3>
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
                <div className="text-xs uppercase tracking-wider text-indigo-400 font-semibold mb-1">{header.crumbs}</div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">{header.title}</h2>
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
    if (coverage.matched_areas.includes(label)) return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
    if (coverage.matched_scopes.includes(label)) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    if (coverage.matched_abilities.includes(label)) return 'bg-blue-500/10 text-blue-300 border-blue-500/30';
    return 'bg-slate-900 text-slate-300 border-slate-800';
};

function ConceptBadges({ coverage, labels, emptyText }: { coverage: StandardCoverage; labels: string[]; emptyText: string }) {
    if (labels.length === 0) return <span className="text-[9px] text-slate-500 italic">{emptyText}</span>;
    return <>
        {labels.map(label => (
            <span
                key={label}
                title={label}
                className={`px-1.5 py-0.5 rounded border font-mono text-[9px] inline-block m-0.5 ${getConceptBadgeStyle(coverage, label)}`}
            >
                {label.split('/').at(-1)}
            </span>
        ))}
    </>;
}

function MappingExplanation({ coverage }: { coverage: StandardCoverage }) {
    if (!coverage.spec_covered) {
        return (
            <div className="text-xs text-sky-300 bg-sky-950/40 border border-sky-500/30 rounded-md p-2.5 leading-relaxed mt-1">
                <div className="flex items-start gap-2">
                    <Icon name="fa-magnifying-glass" className="text-sky-400 mt-0.5 shrink-0 text-[11px]" />
                    <div><strong>Analysis Needed:</strong> Spec file not yet created for this grade/cluster. Domain analysis required to define target competencies.</div>
                </div>
            </div>
        );
    }
    if (coverage.beyond_scope.length > 0) {
        return (
            <div className="text-xs text-purple-200 bg-purple-950/40 border border-purple-500/30 rounded-md p-2.5 leading-relaxed mt-1">
                <div className="flex items-start gap-2">
                    <Icon name="fa-ban" className="text-purple-300 mt-0.5 shrink-0 text-[11px]" />
                    <div>{coverage.beyond_scope.map(item => <div key={item.title}><strong>{item.title}:</strong> {item.description}</div>)}</div>
                </div>
            </div>
        );
    }
    if (!coverage.ontology_covered || coverage.ontology_todos.length > 0) {
        return coverage.ontology_todos.length > 0 ? (
            <div className="text-xs text-red-300 bg-red-950/40 border border-red-500/30 rounded-md p-2.5 leading-relaxed mt-1">
                <div className="flex items-start gap-2">
                    <Icon name="fa-circle-xmark" className="text-red-400 mt-0.5 shrink-0 text-[11px]" />
                    <div>{coverage.ontology_todos.map(todo => <div key={todo.title}><strong>{todo.title}:</strong> {todo.description}</div>)}</div>
                </div>
            </div>
        ) : null;
    }
    const explanations = [...new Set(coverage.implementation_todos.map(todo => todo.explanation).filter(Boolean))];
    return explanations.length > 0 ? (
        <div className="text-xs text-orange-300 bg-orange-950/40 border border-orange-500/30 rounded-md p-2.5 leading-relaxed mt-1">
            <div className="flex items-start gap-2">
                <Icon name="fa-triangle-exclamation" className="text-orange-400 mt-0.5 shrink-0 text-[11px]" />
                <div>{explanations.map(explanation => <div key={explanation}>{explanation}</div>)}</div>
            </div>
        </div>
    ) : null;
}

function CompetencyBreakdown({ coverage }: { coverage: StandardCoverage }) {
    const labelSets = getLabelSets(coverage);
    const intersection = intersectLabels(labelSets);
    const hasContent = labelSets.length > 0 || coverage.ontology_todos.length > 0 || coverage.beyond_scope.length > 0;

    if (!hasContent) return <span className="text-slate-500 italic text-[10px]">No competency permutations defined</span>;

    return (
        <div className="space-y-2 pt-1 border-t border-slate-800/80 mt-1">
            {intersection.length > 0 && (
                <div className="p-2 rounded bg-slate-950/80 border border-slate-800 space-y-1 mb-2">
                    <div className="text-[9px] font-mono text-slate-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Common Concepts</span>
                        <span className="text-[8px] px-1 py-0.5 bg-slate-800 text-slate-400 rounded">{intersection.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-0.5"><ConceptBadges coverage={coverage} labels={intersection} emptyText="" /></div>
                </div>
            )}
            {coverage.competencies.map((permutation, index) => (
                <div key={`competency-${index}`} className="p-2 rounded bg-slate-950/60 border border-slate-800/60">
                    <div className="flex flex-wrap gap-0.5">
                        <ConceptBadges coverage={coverage} labels={permutation.filter(label => !intersection.includes(label))} emptyText="Identical to common concepts" />
                    </div>
                </div>
            ))}
            {coverage.implementation_todos.map(todo => (
                <div key={todo.id} className="p-2 rounded bg-orange-950/10 border border-orange-500/20">
                    <div className="flex flex-wrap gap-0.5">
                        <ConceptBadges coverage={coverage} labels={todo.labels.filter(label => !intersection.includes(label))} emptyText="Identical to common concepts" />
                    </div>
                </div>
            ))}
            {coverage.ontology_todos.map(todo => (
                <div key={todo.title} className="p-2 rounded bg-red-950/20 border border-red-500/30 space-y-1">
                    <div className="text-[9px] font-mono text-red-400 font-semibold flex items-center justify-between">
                        <span>{todo.title}</span>
                        <span className="text-[8px] px-1 py-0.5 bg-red-500/10 border border-red-500/20 rounded">ONTOLOGY TODO</span>
                    </div>
                    <p className="text-[10px] text-red-300/80 italic leading-snug">{todo.description}</p>
                </div>
            ))}
            {coverage.beyond_scope.map(item => (
                <div key={item.title} className="p-2 rounded bg-purple-950/20 border border-purple-500/30 space-y-1">
                    <div className="text-[9px] font-mono text-purple-300 font-semibold flex items-center justify-between">
                        <span>{item.title}</span>
                        <span className="text-[8px] px-1 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded">BEYOND SCOPE</span>
                    </div>
                    <p className="text-[10px] text-purple-200/80 italic leading-snug">{item.description}</p>
                </div>
            ))}
        </div>
    );
}

function StandardDetails() {
    const standardId = useExplorerStore(state => state.activeStandardId);
    const standard = useExplorerStore(state => standardId ? state.standardsMap[standardId] : null);
    const coverage = useExplorerStore(state => standardId ? state.coverageData?.coverage[standardId] : undefined);

    return (
        <div className="p-6 bg-slate-900/60 flex flex-col gap-4">
            <div className="flex items-start justify-between">
                <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded text-[10px] font-mono font-bold tracking-wider">
                    {standard?.level.toUpperCase() ?? 'STANDARD'}
                </span>
                <span className="text-xs text-slate-500 font-mono">{standard?.id ?? 'K.CC.A.1'}</span>
            </div>
            <div>
                <h3 className="text-base font-semibold text-white leading-snug">
                    {standard?.description ?? 'Select a standard from the list to display details.'}
                </h3>
            </div>
            {standard && coverage && <MappingDetails coverage={coverage} />}
        </div>
    );
}

function MappingDetails({ coverage }: { coverage: StandardCoverage }) {
    const kind = getCoverageKind(coverage);
    const style = coverageStyles[kind];
    const showModule = (kind === 'partial' || kind === 'covered') && coverage.generator_module;

    return (
        <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-2.5 text-xs">
            <span className="text-slate-500 block font-semibold text-[11px]">Mapping Status</span>
            <div className="flex items-center gap-1.5">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border ${style.detailBadge}`}>{style.detailLabel}</span>
                {showModule && (
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {coverage.generator_module?.toUpperCase()}
                    </span>
                )}
            </div>
            <MappingExplanation coverage={coverage} />
            <CompetencyBreakdown coverage={coverage} />
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
                    <h3 className="text-base font-semibold text-white leading-snug">Task Title</h3>
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
                <span className={`px-2.5 py-0.5 border rounded text-[10px] font-mono font-bold tracking-wider ${style.detail}`}>{task.type}</span>
                <span className="text-xs text-slate-500 font-mono">{task.id}</span>
            </div>
            <div>
                <h3 className="text-base font-semibold text-white leading-snug">{task.title}</h3>
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
    const loading = useExplorerStore(state => state.loading);
    const error = useExplorerStore(state => state.error);

    useEffect(() => {
        void loadData();
    }, [loadData]);

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
