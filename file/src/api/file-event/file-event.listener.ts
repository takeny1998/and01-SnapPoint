import { AttachFileDto } from '@/domain/file/dtos/attach-file.dto';
import { FindAttachFileDto } from '@/domain/file/dtos/find-attach-files.dto';
import { ModifyAttachFileDto } from '@/domain/file/dtos/modify-attach-file.dto';
import { FileService } from '@/domain/file/file.service';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class FileEventListener {
  constructor(private readonly fileService: FileService) {}

  @MessagePattern({ cmd: 'files.attached.find' })
  async findAttachFiles(@Payload() dtos: FindAttachFileDto[]) {
    return this.fileService.findAttachFiles(dtos);
  }

  @MessagePattern({ cmd: 'files.attach' })
  async attachFiles(@Payload() dtos: AttachFileDto[]) {
    return this.fileService.attachFiles(dtos);
  }

  @MessagePattern({ cmd: 'files.attached.delete' })
  async deleteAttachFiles(@Payload() sourceUuids: string[]) {
    return this.fileService.deleteAttachFiles(sourceUuids);
  }

  @MessagePattern({ cmd: 'files.find' })
  async findFilesByIds(@Payload() uuid: string[]) {
    return this.fileService.findFilesByIds(uuid);
  }

  @MessagePattern({ cmd: 'files.process' })
  async processFile(@Payload() uuid: string) {
    return this.fileService.processFile(uuid);
  }

  @MessagePattern({ cmd: 'files.attached.modify' })
  async modifyAttachFiles(@Payload() dto: ModifyAttachFileDto) {
    return this.fileService.modifyAttachFiles(dto);
  }
}
