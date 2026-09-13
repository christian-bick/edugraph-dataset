import {validateSpecs} from './generator-view-spec-validation.ts';

validateSpecs().then(valid => {
    process.exitCode = valid ? 0 : 1;
}).catch(error => {
    console.error(error);
    process.exitCode = 1;
});
