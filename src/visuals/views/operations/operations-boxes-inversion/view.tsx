import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {ArithmeticBoxesView} from '../arithmetic-boxes-view.tsx';
import {
    OperationsBoxesInversionViewConfig,
    OperationsBoxesInversionViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsBoxesInversionViewConfig;
    payload: ViewRenderPayload<'operations-boxes-inversion'>;
}

const Core = ({payload}: CoreProps) => (
    <ArithmeticBoxesView invertProcedure payload={payload} />
);

export const OperationsBoxesInversion = withConfig(OperationsBoxesInversionViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'operations-boxes-inversion'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<OperationsBoxesInversion payload={payload} />);
};
