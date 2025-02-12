import { SuccessDto } from '@/common/dto/success.dto';
import { CustomSuccessResponseEnum } from '@/common/enums/custom-success-response.enum.';
import { RequestMethodEnum } from '@/common/enums/request-method.enum';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class SuccessResponseFilter<T> implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const method = request.method;
    const statusCode = response.statusCode || HttpStatus.OK;
    console.log(exception);

    let customMessage: string;
    switch (method) {
      case RequestMethodEnum.GET:
        customMessage = CustomSuccessResponseEnum.CUSTOM_MESSAGE_GET;
        break;
      case RequestMethodEnum.POST:
        customMessage = CustomSuccessResponseEnum.CUSTOM_MESSAGE_POST;
        break;
      case RequestMethodEnum.PUT:
        customMessage = CustomSuccessResponseEnum.CUSTOM_MESSAGE_PUT;
        break;
      case RequestMethodEnum.DELETE:
        customMessage = CustomSuccessResponseEnum.CUSTOM_MESSAGE_DELETE;
        break;
      default:
        customMessage = CustomSuccessResponseEnum.CUSTOM_MESSAGE_DEFAULT;
        break;
    }

    const successResponse = {
      timestamp: new Date().toISOString(),
      statusCode,
      message: customMessage,
      data: exception as T,
    } as SuccessDto<T>;

    response.status(statusCode).json(successResponse);
  }
}
