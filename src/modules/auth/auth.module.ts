import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthJwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';

@Module({
  providers: [AuthJwtStrategy, AuthService],
  imports: [UserModule],
  exports: [AuthService],
})
export class AuthModule {}
