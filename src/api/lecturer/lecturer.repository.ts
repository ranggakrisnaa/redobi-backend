import { LecturerEntity } from '@/database/entities/lecturer.entity';
import { ILecturer } from '@/database/interface-model/lecturer-entity.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class LecturerRepository extends Repository<LecturerEntity> {
  constructor(
    @InjectRepository(LecturerEntity)
    private readonly repo: Repository<LecturerEntity>,
  ) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async bulkCreate(data: ILecturer[]): Promise<ILecturer[]> {
    if (!data.length) {
      return [];
    }

    const lecturers = this.repo.create(data);
    return await this.repo.save(lecturers);
  }
}
