import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import type { AuthenticatedUser } from './current-user.decorator';

const readMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class ReadOnlyGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      method: string;
      user?: AuthenticatedUser;
    }>();

    if (request.user?.role === 'VIEWER' && !readMethods.has(request.method)) {
      throw new ForbiddenException('Usuário de consulta não pode alterar dados');
    }

    return true;
  }
}
