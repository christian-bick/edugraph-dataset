import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ArithmeticBoxesView} from '../arithmetic-boxes-view.tsx';
import {OperationsBoxesViewConfig, OperationsBoxesViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsBoxesViewConfig;
    payload: ViewRenderPayload<'operations-boxes'>;
}

const Core = ({payload}: CoreProps) => (
    <ArithmeticBoxesView invertProcedure={false} payload={payload} />
);

export const OperationsBoxes = withConfig(OperationsBoxesViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'operations-boxes'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsBoxes payload={payload} />);
};
