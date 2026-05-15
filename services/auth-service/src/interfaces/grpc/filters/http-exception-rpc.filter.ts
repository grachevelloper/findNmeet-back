import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Observable } from 'rxjs';

import { httpExceptionToRpcException } from './rpc-errors';

@Catch(HttpException)
export class HttpExceptionRpcFilter implements ExceptionFilter<HttpException> {
  catch(error: HttpException, _host: ArgumentsHost): Observable<never> {
    return httpExceptionToRpcException(error);
  }
}
