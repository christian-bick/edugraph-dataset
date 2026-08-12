import {random} from '../../../lib/random.ts';
import {AbstractProblem,ProblemGenerator,ProblemStub} from '../../../types/ml-engine.ts';
import {MeasurementLengthDifferenceProblem} from '../../../types/problems.ts';
import {MeasurementLengthDifferenceGeneratorConfig,MeasurementLengthDifferenceGeneratorSchema} from './spec.ts';
export class MeasurementLengthDifferenceGenerator implements ProblemGenerator<MeasurementLengthDifferenceProblem,MeasurementLengthDifferenceGeneratorConfig>{
 type:AbstractProblem['type']='measurement';schema=MeasurementLengthDifferenceGeneratorSchema;
 generate(_config:MeasurementLengthDifferenceGeneratorConfig):ProblemStub<MeasurementLengthDifferenceProblem>{const lengthB=5+Math.floor(random()*11);const difference=2+Math.floor(random()*8);return{data:{lengthA:lengthB+difference,lengthB,difference,unit:'cm'}};}
}
