import { Module } from '@nestjs/common';
import { AuthJwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';

@Module({
  providers: [AuthJwtStrategy],
  imports: [UserModule],
})
export class AuthModule {}
