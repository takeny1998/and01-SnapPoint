import { Module } from '@nestjs/common';
import { PostApiController } from '@/api/post-api/post-api.controller';
import { PostApiService } from '@/api/post-api/post-api.service';
import { ValidationService } from './validation/validation.service';
import { PostService } from '@/domain/post/post.service';
import { TransformationService } from './transformation/transformation.service';
import { AuthController } from '@/api/auth/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@/common/strategies/auth.jwt.strategy';
import { UserService } from '@/domain/user/user.service';
import { AuthService } from './auth/auth.service';
import { RedisCacheModule } from '@/common/redis/redis-cache.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BlockModule } from '@/domain/block/block.module';
import { HttpModule } from '@nestjs/axios';
import { SummarizationService } from './summarization/summarization.service';
import { UtilityModule } from '@/common/utility/utility.module';
import { TokenModule } from '@/domain/token/token.module';
import { FileModule } from '@/domain/file/file.module';
import { SummarizationListner } from './summarization/summarization.listener';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'SUMMARY_CLIENT',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RMQ_HOST')],
            queue: configService.getOrThrow<string>('RMQ_SUMMARY_QUEUE'),
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),

    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    }),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow('JWT_ACCESS_EXPIRATION_TIME'),
        },
      }),
      inject: [ConfigService],
    }),
    RedisCacheModule,
    BlockModule,
    HttpModule,
    UtilityModule,
    TokenModule,
    FileModule,
  ],
  controllers: [PostApiController, AuthController, SummarizationListner],
  providers: [
    PostApiService,
    ValidationService,
    PostService,
    TransformationService,
    ConfigService,
    AuthService,
    UserService,
    JwtStrategy,
    SummarizationService,
  ],
})
export class ApiModule {}
