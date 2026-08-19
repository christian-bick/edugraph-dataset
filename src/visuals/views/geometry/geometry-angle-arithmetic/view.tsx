import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {AngleArithmeticView} from '../angle-arithmetic-view.tsx';
import {GeometryAngleArithmeticViewConfig, GeometryAngleArithmeticViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'geometry-angle-arithmetic';
interface CoreProps {config: GeometryAngleArithmeticViewConfig; payload: ViewRenderPayload<'geometry-angle-arithmetic'>}
const Core = ({payload}: CoreProps) => <AngleArithmeticView payload={payload} task="explain-angle-addition" viewId={VIEW_ID} />;
export const GeometryAngleArithmetic = withConfig(GeometryAngleArithmeticViewSchema, Core);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'geometry-angle-arithmetic'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<GeometryAngleArithmetic payload={payload} />);
};
