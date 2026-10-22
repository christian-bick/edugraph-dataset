import {createRoot} from 'react-dom/client';
import {isAlgebraCovariationProblem} from '../../../../generators/algebra/algebra-covariation-helpers.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {AlgebraCovariationBody} from '../algebra-covariation-view.tsx';
import {AlgebraCovariationTableGraphViewSchema, type AlgebraCovariationTableGraphViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'algebra-covariation-table-graph';
export const AlgebraCovariationTableGraphCore = ({payload}: {config: AlgebraCovariationTableGraphViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    // selectedRelations and calculation work can validly be empty; the total guard checks them.
    validateProblemData(VIEW_ID, data, ['kind', 'input', 'output', 'context', 'equation', 'lawProof', 'domainImage', 'table', 'graph']);
    if (!isAlgebraCovariationProblem(data)) throw new ViewValidationError(VIEW_ID, 'The quantity law, full-domain witnesses or table/graph correspondences are inconsistent.');
    return <AlgebraCovariationBody data={data} task="construct" isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const AlgebraCovariationTableGraph = withConfig(AlgebraCovariationTableGraphViewSchema, AlgebraCovariationTableGraphCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<AlgebraCovariationTableGraph payload={payload} />);
};
