import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/modules/user/entities/user.entity'; // Importe sua entidade

@Injectable()
export class JwtAuthGuard extends AuthGuard('auth-jwt') {
  handleRequest<TUser = User>(err: any, user: any): TUser {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Você não tem permissão para acessar este recurso.',
        )
      );
    }

    // Agora o TS sabe que estamos retornando algo que satisfaz TUser (User)
    return user as TUser;
  }
}
