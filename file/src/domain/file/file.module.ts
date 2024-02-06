import { Module } from '@nestjs/common';
import { FileService } from '@/domain/file/file.service';

@Module({
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
