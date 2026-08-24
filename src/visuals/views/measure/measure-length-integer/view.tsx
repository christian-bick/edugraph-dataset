import {createRoot} from 'react-dom/client';
import {MeasureLengthCore} from '../measure-length/view.tsx';
import {MeasureLengthIntegerViewSchema} from './spec.ts';
import {withConfig} from '../../withConfig.tsx';

const MeasureLengthIntegerCore = ({payload}: {payload: any}) =>
    <MeasureLengthCore isReverse={false} payload={payload} />;

export const MeasureLengthInteger = withConfig(MeasureLengthIntegerViewSchema, MeasureLengthIntegerCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: any) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) {
            root = createRoot(container);
        }
        root.render(<MeasureLengthInteger payload={payload} />);
    }
};
