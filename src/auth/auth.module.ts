import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { auth } from './auth.config';

@Module({
  imports: [BetterAuthModule.forRoot(auth)],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}