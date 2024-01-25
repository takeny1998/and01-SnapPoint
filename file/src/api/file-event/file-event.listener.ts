import { AttachFileDto } from '@/domain/file/dtos/attach-file.dto';
import { FindAttachFileDto } from '@/domain/file/dtos/find-attach-files.dto';
import { FileService } from '@/domain/file/file.service';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class FileEventListener {
  constructor(private readonly fileService: FileService) {}

  @MessagePattern({ cmd: 'files.find.attached' })
  async findAttachFiles(@Payload() dtos: FindAttachFileDto[]) {
    return await this.fileService.findAttachFiles(dtos);
  }

  @MessagePattern({ cmd: 'files.attach' })
  async attachFiles(@Payload() dtos: AttachFileDto[]) {
    return this.fileService.attachFiles(dtos);
  }

  @MessagePattern({ cmd: 'files.delete.attached' })
  async deleteAttachFiles(@Payload() sourceUuid: string) {
    return this.fileService.deleteAttachFiles(sourceUuid);
  }

  @MessagePattern({ cmd: 'files.find.ids' })
  async findFilesByIds(@Payload() uuid: string[]) {
    return this.fileService.findFilesByIds(uuid);
  }

  @MessagePattern({ cmd: 'files.process' })
  async processFile(@Payload() uuid: string) {
    return this.fileService.processFile(uuid);
  }
}
