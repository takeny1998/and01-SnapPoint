import { UserPayload } from '@/common/guards/user-payload.interface';
import { FileService } from '@/domain/file/file.service';
import { UploadService } from '@/upload/upload.service';
import { Injectable } from '@nestjs/common';
import { UploadedFileDto } from './dto/uploaded-file.dto';
import { randomUUID } from 'crypto';

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

  async startUploadVideo() {}
}
