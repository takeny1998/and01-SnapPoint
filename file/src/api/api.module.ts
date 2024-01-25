import { Module } from '@nestjs/common';
import { UploadModule } from '@/upload/upload.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FileApiController } from './file-api/file-api.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FileModule } from '@/domain/file/file.module';
import { FileApiService } from './file-api/file-api.service';
import { FileEventListener } from './file-event/file-event.listener';

@Module({
  imports: [
    UploadModule,
    FileModule,
    ClientsModule.registerAsync([
      {
        name: 'MEDIA_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.getOrThrow<string>('RMQ_HOST')],
            queue: configService.getOrThrow<string>('RMQ_MEDIA_QUEUE'),
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [FileApiController, FileEventListener],
  providers: [FileApiService],
})
export class ApiModule {}
