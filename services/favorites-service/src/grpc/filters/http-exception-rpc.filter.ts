import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { httpExceptionToRpcException } from '@findnmeet/utils';
import { Observable } from 'rxjs';

@Catch(HttpException)
export class HttpExceptionRpcFilter implements ExceptionFilter<HttpException> {
  catch(error: HttpException, _host: ArgumentsHost): Observable<never> {
    return httpExceptionToRpcException(error);
  }
}
