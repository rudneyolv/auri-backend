import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AuthJwtPayload } from '../types/jwt.types';
import { User } from 'src/modules/user/entities/user.entity';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class AuthJwtStrategy extends PassportStrategy(
  Strategy,
  'supabase-jwt',
) {
  constructor(private readonly userService: UserService) {
    const supabaseSecret = process.env.SUPABASE_JWT_SECRET;

    if (!supabaseSecret) {
      throw new InternalServerErrorException(
        'A variável de ambiente SUPABASE_JWT_SECRET precisa ser configurada.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: supabaseSecret,
    });
  }

  async validate(payload: AuthJwtPayload): Promise<User> {
    const user = await this.userService.findOneByOrFail({
      auth_id: payload.sub,
    });

    return user;
  }
}
