import { UserPayload } from '@/common/guards/user-payload.interface';
import { FileService } from '@/domain/file/file.service';
import { UploadService } from '@/upload/upload.service';
import { Injectable } from '@nestjs/common';
import { UploadedFileDto } from './dto/uploaded-file.dto';

@Injectable()
export class FileApiService {
  constructor(
    private readonly uploadService: UploadService,
    private readonly fileService: FileService,
  ) {}

  async uploadImage(file: Express.Multer.File, user: UserPayload) {
    const uploadedFile = await this.uploadService.uploadFile(file);
    const { uuid: userUuid } = user;

    const createdFile = await this.fileService.createFile({
      ...uploadedFile,
      userUuid,
    });

    return UploadedFileDto.of(createdFile);
  }

  async startUploadVideo() {}
}
