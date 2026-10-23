import {createRoot} from 'react-dom/client';
import {isNumericalDataProblem} from '../../../../generators/statistics/numerical-data-helpers.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {DataContextBody} from '../data-context-view.tsx';
import {DataAttributeDescriptionViewSchema, type DataAttributeDescriptionViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'data-attribute-description';
export const DataAttributeDescriptionCore = ({payload}: {config: DataAttributeDescriptionViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    // The complete guard owns nullable/empty evidence and the full mathematical family.
    validateProblemData(VIEW_ID, data, ['kind', 'study', 'records', 'summary', 'frequencies', 'plots', 'shapeFacts', 'relations']);
    if (!isNumericalDataProblem(data)) throw new ViewValidationError(VIEW_ID, 'The source records or mathematical evidence are inconsistent.');
    return <DataContextBody data={data} task="attribute-description" isSolutionView={payload.isSolutionView} />;
};
export const DataAttributeDescription = withConfig(DataAttributeDescriptionViewSchema, DataAttributeDescriptionCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view'); if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<DataAttributeDescription payload={payload} />);
};
