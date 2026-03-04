import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/modules/user/entities/user.entity';

type AuthInfo = Error | { message?: string } | string | undefined;

@Injectable()
export class JwtAuthGuard extends AuthGuard('supabase-jwt') {
  handleRequest<TUser = User>(
    err: unknown,
    user: unknown,
    info?: AuthInfo,
  ): TUser {
    if (err || !user) {
      if (info) {
        const message =
          typeof info === 'string'
            ? info
            : info instanceof Error
              ? info.message
              : info.message;

        console.error('JWT auth failure:', message ?? info);
      }

      throw err instanceof Error
        ? err
        : new UnauthorizedException(
            'Voce nao tem permissao para acessar este recurso.',
          );
    }

    return user as TUser;
  }
}
