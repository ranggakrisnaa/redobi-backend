import { SuccessDto } from '@/common/dto/success.dto';
import { RequestMethodEnum } from '@/database/enums/request-method.enum';
import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SuccessResponseInterceptor<T>
  implements NestInterceptor<T, SuccessDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessDto<T>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    return next.handle().pipe(
      map(({ message, ...rest }) => ({
        timestamp: new Date().toISOString(),
        statusCode:
          method === RequestMethodEnum.POST
            ? HttpStatus.CREATED
            : HttpStatus.OK,
        message: message,
        data: rest.data,
        pagination: rest.pagination,
      })),
    );
  }
}
