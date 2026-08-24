import {createRoot} from 'react-dom/client';
import {MeasureLengthCore} from '../measure-length/view.tsx';
import {MeasureLengthDecimalDrawingViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';

const MeasureLengthDecimalDrawingCore = ({payload}: {payload: any}) =>
    <MeasureLengthCore isReverse={true} payload={payload} />;

export const MeasureLengthDecimalDrawing = withConfig(
    MeasureLengthDecimalDrawingViewSchema,
    MeasureLengthDecimalDrawingCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: any) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<MeasureLengthDecimalDrawing payload={payload} />);
    }
};
