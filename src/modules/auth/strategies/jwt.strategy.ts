import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import JwksRsa from 'jwks-rsa';
import { User } from 'src/modules/user/entities/user.entity';
import { UserService } from 'src/modules/user/user.service';
import { AuthJwtPayload } from '../types/jwt.types';

@Injectable()
export class AuthJwtStrategy extends PassportStrategy(
  Strategy,
  'supabase-jwt',
) {
  constructor(private readonly userService: UserService) {
    const supabaseProjectId = process.env.SUPABASE_PROJECT_ID;

    if (!supabaseProjectId) {
      throw new InternalServerErrorException(
        'A variavel de ambiente SUPABASE_PROJECT_ID precisa ser configurada.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['ES256'],
      secretOrKeyProvider: JwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${supabaseProjectId}.supabase.co/auth/v1/.well-known/jwks.json`,
      }),
    });
  }

  async validate(payload: AuthJwtPayload): Promise<User> {
    const user = await this.userService.findOneByOrFail({
      auth_id: payload.sub,
    });

    return user;
  }
}
