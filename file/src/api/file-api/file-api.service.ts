import { UserPayload } from '@/common/guards/user-payload.interface';
import { FileService } from '@/domain/file/file.service';
import { UploadService } from '@/domain/upload/upload.service';
import { Injectable } from '@nestjs/common';
import { UploadedFileDto } from './dto/uploaded-file.dto';
import { randomUUID } from 'crypto';
import { UploadFileURLDto } from './dto/upload-file-url.dto';
import { UploadFileEndDto } from '@/domain/upload/dtos/upload-file-end.dto';
import { UploadFileAbortDto } from '@/domain/upload/dtos/upload-file-abort.dto';

@Injectable()
export class FileApiService {
  constructor(
    private readonly uploadService: UploadService,
    private readonly fileService: FileService,
  ) {}

  async uploadImage(file: Express.Multer.File, user: UserPayload) {
    const uuid = randomUUID();

    const uploadedFile = await this.uploadService.uploadFile({ uuid, file });
    const { uuid: userUuid } = user;

    const createdFile = await this.fileService.createFile({
      ...uploadedFile,
      userUuid,
    });

    return UploadedFileDto.of(createdFile);
  }

  async startUploadVideo(contentType: string) {
    const uuid = randomUUID();

    return this.uploadService.startMultipartUpload({
      uuid,
      contentType,
    });
  }

  async getUploadVideoUrl(dto: UploadFileURLDto) {
    return this.uploadService.getMultipartUploadUrl(dto);
  }

  async completeUploadVideo(dto: UploadFileEndDto, user: UserPayload) {
    const uploadedVideo = await this.uploadService.completeMultipartUpload(dto);
    const { uuid: userUuid } = user;

    const createdFile = await this.fileService.createFile({
      ...uploadedVideo,
      userUuid,
    });

    return UploadedFileDto.of(createdFile);
  }

  async abortMultipartUpload(dto: UploadFileAbortDto) {
    return this.uploadService.abortMultipartUpload(dto);
  }
}
