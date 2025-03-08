import { ApiProperty } from '@nestjs/swagger';

export class SuccessDto<T> {
  @ApiProperty()
  timestamp: string;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: T;
}
