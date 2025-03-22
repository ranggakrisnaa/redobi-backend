import { Uuid } from '@/common/types/common.type';
import { ISession } from '@/database/interface-model/session-entity.interface';

export class LogoutResDto {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  static toPlainLogout(dto: LogoutResDto): Partial<ISession> {
    return {
      id: dto.id,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
    };
  }
}
