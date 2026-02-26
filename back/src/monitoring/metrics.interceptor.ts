import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  httpRequestsTotal,
  httpRequestDuration,
  httpErrorsTotal,
} from './metrics.controller';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    // Normalise la route : /feed/123 → /feed/:id pour éviter la prolifération de labels
    const route = this.normalizeRoute(req.route?.path ?? req.url);

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse();
          const statusCode = String(res.statusCode);
          const durationSeconds = (Date.now() - startTime) / 1000;

          httpRequestsTotal.inc({ method, route, status_code: statusCode });
          httpRequestDuration.observe(
            { method, route, status_code: statusCode },
            durationSeconds,
          );

          if (res.statusCode >= 400) {
            httpErrorsTotal.inc({ method, route, status_code: statusCode });
          }
        },
        error: (err) => {
          const statusCode = String(err.status ?? 500);
          const durationSeconds = (Date.now() - startTime) / 1000;

          httpRequestsTotal.inc({ method, route, status_code: statusCode });
          httpRequestDuration.observe(
            { method, route, status_code: statusCode },
            durationSeconds,
          );
          httpErrorsTotal.inc({ method, route, status_code: statusCode });
        },
      }),
    );
  }

  private normalizeRoute(url: string): string {
    if (!url) return 'unknown';
    // Remplace les segments numériques et UUIDs par des paramètres génériques
    return url
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .split('?')[0]; // Retire les query params
  }
}
