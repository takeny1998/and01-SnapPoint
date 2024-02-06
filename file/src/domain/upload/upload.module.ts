import { Module } from '@nestjs/common';
import { BucketService } from '@/domain/upload/storages/bucket.service';
import { UploadService } from '@/domain/upload/upload.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [UploadService, BucketService, ConfigService],
  exports: [UploadService],
})
export class UploadModule {}
