import {createRoot} from 'react-dom/client';
import {isAlgebraExpressionEquivalenceProblem} from '../../../../generators/algebra/algebra-equivalence-helpers.ts';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {AlgebraEquivalenceJudgeBody} from '../algebra-equivalence-view.tsx';
import {AlgebraExpressionEquivalenceJudgeViewSchema, type AlgebraExpressionEquivalenceJudgeViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'algebra-expression-equivalence-judge';
export const AlgebraExpressionEquivalenceJudgeCore = ({payload}: {config: AlgebraExpressionEquivalenceJudgeViewConfig; payload: ViewRenderPayload<typeof VIEW_ID>}) => {
    const data = payload.problem.data;
    validateProblemData(VIEW_ID, data, ['kind', 'domain', 'expressions', 'validIdentity', 'comparison']);
    if (!isAlgebraExpressionEquivalenceProblem(data)) throw new ViewValidationError(VIEW_ID, 'The common domain, affine identity, rewrite or candidate comparison is inconsistent.');
    return <AlgebraEquivalenceJudgeBody data={data} isSolutionView={payload.isSolutionView} />;
};
export const AlgebraExpressionEquivalenceJudge = withConfig(AlgebraExpressionEquivalenceJudgeViewSchema, AlgebraExpressionEquivalenceJudgeCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<AlgebraExpressionEquivalenceJudge payload={payload} />);
};
