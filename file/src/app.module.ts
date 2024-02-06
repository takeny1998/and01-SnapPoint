import { Global, Module } from '@nestjs/common';
import { UploadModule } from './domain/upload/upload.module';
import { ApiModule } from './api/api.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@/common/strategies/jwt.strategy';
import { HealthModule } from './common/health/health.module';
import { PrismaService } from './common/datasources/prisma.service';
import { FileModule } from './domain/file/file.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
    }),
    UploadModule,
    ApiModule,
    PassportModule,
    FileModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '60s' },
      }),
      inject: [ConfigService],
    }),
    HealthModule,
  ],
  controllers: [],
  providers: [JwtStrategy, PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
