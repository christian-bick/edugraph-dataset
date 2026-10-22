import {createRoot} from 'react-dom/client';
import {isAlgebraicInequalityProblem} from '../../../../generators/algebra/algebra-statement-helpers.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {AlgebraInequalityNumberlineBody} from '../algebra-statement-view.tsx';
import {AlgebraInequalityNumberlineViewSchema, type AlgebraInequalityNumberlineViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'algebra-inequality-numberline';
export const AlgebraInequalityNumberlineCore = ({payload}: {config: AlgebraInequalityNumberlineViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    // ambientChecks may validly be empty; the complete guard validates that required array.
    validateProblemData(VIEW_ID, data, ['kind', 'variable', 'ambientDomain', 'statement', 'candidateUniverse', 'assignment', 'candidateChecks', 'restrictedSolutions', 'ambientSolution', 'solutionCardinality', 'context', 'bound', 'solutionLine']);
    if (!(isAlgebraicInequalityProblem(data))) throw new ViewValidationError(VIEW_ID, 'The statement, domain, assignments or complete solution witnesses are inconsistent.');
    return <AlgebraInequalityNumberlineBody data={data} isSolutionView={payload.isSolutionView} seed={payload.seed} />;
};
export const AlgebraInequalityNumberline = withConfig(AlgebraInequalityNumberlineViewSchema, AlgebraInequalityNumberlineCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<AlgebraInequalityNumberline payload={payload} />);
};

