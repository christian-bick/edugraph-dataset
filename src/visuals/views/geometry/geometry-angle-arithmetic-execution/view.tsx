import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {AngleArithmeticView} from '../angle-arithmetic-view.tsx';
import {GeometryAngleArithmeticExecutionViewConfig, GeometryAngleArithmeticExecutionViewSchema} from './spec.ts';
import '../../../../tailwind.css';
const VIEW_ID = 'geometry-angle-arithmetic-execution';
interface CoreProps {config: GeometryAngleArithmeticExecutionViewConfig; payload: ViewRenderPayload<'geometry-angle-arithmetic-execution'>}
const Core = ({payload}: CoreProps) => <AngleArithmeticView payload={payload} task="solve-unknown-whole" viewId={VIEW_ID} />;
export const GeometryAngleArithmeticExecution = withConfig(GeometryAngleArithmeticExecutionViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'geometry-angle-arithmetic-execution'>) => {
    const container = document.getElementById('view'); if (!container) return;
    if (!root) root = createRoot(container); root.render(<GeometryAngleArithmeticExecution payload={payload} />);
};
