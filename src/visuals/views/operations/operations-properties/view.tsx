import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ArithmeticPropertiesCompletion} from '../arithmetic-properties-view.tsx';
import {OperationsPropertiesViewConfig, OperationsPropertiesViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsPropertiesViewConfig;
    payload: ViewRenderPayload<'operations-properties'>;
}

const OperationsPropertiesCore = ({payload}: CoreProps) => (
    <ArithmeticPropertiesCompletion data={payload.problem.data} isSolutionView={payload.isSolutionView} />
);

export const OperationsProperties = withConfig(OperationsPropertiesViewSchema, OperationsPropertiesCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'operations-properties'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsProperties payload={payload} />);
};
