import { CriteriaTypeEnum } from '../../database/enums/criteria-type.enum';
import { IBaseEntity } from './base-entity.interface';
import { ISubCriteria } from './sub-criteria-entity.entity';

export interface ICriteria extends IBaseEntity {
  id: number;
  name: string;
  weight: number;
  type: CriteriaTypeEnum;
  subCriteria: ISubCriteria[];
}
