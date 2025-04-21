import { PageOptionsDto } from '@/common/dto/cursor-pagination/page-options.dto';
import { StringFieldOptional } from '@/decorators/field.decorators';

export class LecturerPaginationReqQuery extends PageOptionsDto {
  @StringFieldOptional()
  search: string;

  @StringFieldOptional()
  prodi: string;

  @StringFieldOptional()
  tipe_pembimbing: string;
}
