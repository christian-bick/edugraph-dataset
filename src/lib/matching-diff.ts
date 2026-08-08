import { CompetencyTarget } from '../types/ml-engine.ts';
import { GeneratorMatchInfo, matchTargets, ViewMatchInfo } from './generation.ts';
import { shortenLabel } from './utils.ts';

export const MATCHING_SNAPSHOT_SCHEMA_VERSION = 1;

export interface TargetMatchingSnapshot {
    disposition: MatchingDisposition;
    labels: string[];
    pairs: string[];
}

export type MatchingDisposition = 'spec' | 'implementationTodo';

export interface MatchingTargetInput {
    target: CompetencyTarget;
    disposition: MatchingDisposition;
}

export interface MatchingSnapshot {
    schema_version: number;
    spec: string;
    targets: Record<string, TargetMatchingSnapshot>;
}

export interface MatchingDiff {
    addedTargets: string[];
    removedTargets: string[];
    changedLabels: string[];
    changedDispositions: string[];
    addedPairs: string[];
    removedPairs: string[];
}

function pairKey(generatorId: string, viewId: string): string {
    return `${generatorId}#${viewId}`;
}

export function createMatchingSnapshot(
    specName: string,
    targetInputs: MatchingTargetInput[],
    generators: GeneratorMatchInfo[],
    views: ViewMatchInfo[]
): MatchingSnapshot {
    const targetIds = new Set<string>();
    for (const input of targetInputs) {
        if (targetIds.has(input.target.id)) {
            throw new Error(`Target "${input.target.id}" appears in more than one matching disposition.`);
        }
        targetIds.add(input.target.id);
    }
    const targets = targetInputs.map(input => input.target);
    const dispositionById = new Map(targetInputs.map(input => [input.target.id, input.disposition]));
    const pairsByTarget = new Map<string, string[]>();
    for (const tuple of matchTargets(targets, generators, views).tuples) {
        if (!pairsByTarget.has(tuple.target.id)) pairsByTarget.set(tuple.target.id, []);
        pairsByTarget.get(tuple.target.id)!.push(pairKey(tuple.generatorId, tuple.viewId));
    }

    const entries = [...targets]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(target => [target.id, {
            disposition: dispositionById.get(target.id)!,
            labels: [...new Set(target.labels)].sort(),
            pairs: [...new Set(pairsByTarget.get(target.id) ?? [])].sort()
        }] as const);
    return {
        schema_version: MATCHING_SNAPSHOT_SCHEMA_VERSION,
        spec: specName,
        targets: Object.fromEntries(entries)
    };
}

export function diffMatchingSnapshots(before: MatchingSnapshot, after: MatchingSnapshot): MatchingDiff {
    if (before.schema_version !== MATCHING_SNAPSHOT_SCHEMA_VERSION
        || after.schema_version !== MATCHING_SNAPSHOT_SCHEMA_VERSION) {
        throw new Error(`Unsupported matching snapshot schema; expected ${MATCHING_SNAPSHOT_SCHEMA_VERSION}.`);
    }
    if (before.spec !== after.spec) {
        throw new Error(`Cannot compare matching snapshots for "${before.spec}" and "${after.spec}".`);
    }

    const beforeIds = new Set(Object.keys(before.targets));
    const afterIds = new Set(Object.keys(after.targets));
    const addedTargets = [...afterIds].filter(id => !beforeIds.has(id)).sort();
    const removedTargets = [...beforeIds].filter(id => !afterIds.has(id)).sort();
    const changedLabels: string[] = [];
    const changedDispositions: string[] = [];
    const addedPairs: string[] = [];
    const removedPairs: string[] = [];

    for (const id of [...beforeIds].filter(id => afterIds.has(id)).sort()) {
        const previous = before.targets[id];
        const current = after.targets[id];
        if (JSON.stringify(previous.labels) !== JSON.stringify(current.labels)) changedLabels.push(id);
        if (previous.disposition !== current.disposition) changedDispositions.push(id);
        const previousPairs = new Set(previous.pairs);
        const currentPairs = new Set(current.pairs);
        for (const pair of currentPairs) if (!previousPairs.has(pair)) addedPairs.push(`${id} -> ${pair}`);
        for (const pair of previousPairs) if (!currentPairs.has(pair)) removedPairs.push(`${id} -> ${pair}`);
    }

    for (const id of addedTargets) {
        for (const pair of after.targets[id].pairs) addedPairs.push(`${id} -> ${pair}`);
    }
    for (const id of removedTargets) {
        for (const pair of before.targets[id].pairs) removedPairs.push(`${id} -> ${pair}`);
    }

    return {
        addedTargets,
        removedTargets,
        changedLabels,
        changedDispositions,
        addedPairs: addedPairs.sort(),
        removedPairs: removedPairs.sort()
    };
}

function section(title: string, items: string[], render: (item: string) => string = item => `- ${item}`): string {
    return `## ${title} (${items.length})\n\n${items.length > 0 ? items.map(render).join('\n') : '_None._'}\n`;
}

export function renderMatchingDiffMarkdown(
    before: MatchingSnapshot,
    after: MatchingSnapshot,
    diff: MatchingDiff
): string {
    const renderTarget = (id: string, snapshot: MatchingSnapshot) => {
        const target = snapshot.targets[id];
        const labels = target.labels.map(shortenLabel).join(', ');
        return `- \`${id}\` (${target.disposition}) — ${target.pairs.length} pair(s); [${labels}]`;
    };
    const activeWithoutMatches = Object.entries(after.targets)
        .filter(([, target]) => target.disposition === 'spec' && target.pairs.length === 0)
        .map(([id]) => id)
        .sort();
    const todosWithMatches = Object.entries(after.targets)
        .filter(([, target]) => target.disposition === 'implementationTodo' && target.pairs.length > 0)
        .map(([id]) => id)
        .sort();
    return [
        `# Matching Diff: ${after.spec}`,
        '',
        'This report is advisory. Review every added and removed semantic generator-view pair.',
        '',
        '## Summary',
        '',
        `- Targets: ${Object.keys(before.targets).length} → ${Object.keys(after.targets).length}`,
        `- Added pairs: ${diff.addedPairs.length}`,
        `- Removed pairs: ${diff.removedPairs.length}`,
        `- Changed dispositions: ${diff.changedDispositions.length}`,
        '',
        section('Added targets', diff.addedTargets, id => renderTarget(id, after)),
        section('Removed targets', diff.removedTargets, id => renderTarget(id, before)),
        section('Targets with changed labels but stable IDs', diff.changedLabels),
        section(
            'Changed dispositions',
            diff.changedDispositions,
            id => `- \`${id}\`: ${before.targets[id].disposition} → ${after.targets[id].disposition}`
        ),
        section('Added semantic pairs', diff.addedPairs, item => `- \`${item}\``),
        section('Removed semantic pairs', diff.removedPairs, item => `- \`${item}\``),
        section('Active targets without matches', activeWithoutMatches, id => renderTarget(id, after)),
        section('Implementation TODOs that now match', todosWithMatches, id => renderTarget(id, after))
    ].join('\n');
}
