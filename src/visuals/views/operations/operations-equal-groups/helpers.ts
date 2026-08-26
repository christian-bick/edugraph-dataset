import {EqualGroupsOperation} from '../../../../types/problems.ts';

export function equalGroupTitle(
    operation: EqualGroupsOperation,
    groupIndex: number,
    isSolutionView: boolean
): string {
    return operation === 'quotative-division' && !isSolutionView
        ? 'Group'
        : `Group ${groupIndex + 1}`;
}
