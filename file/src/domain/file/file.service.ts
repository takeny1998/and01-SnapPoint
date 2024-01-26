import { Injectable } from '@nestjs/common';
import { CreateFileDto } from '@/domain/file/dtos/create-file.dto';
import { PrismaService } from '@/common/datasources/prisma.service';
import { FindAttachFileDto } from './dtos/find-attach-files.dto';
import { ModifyAttachFileDto } from './dtos/modify-attach-file.dto';
import { AttachFileDto } from './dtos/attach-file.dto';

@Injectable()
export class FileService {
  constructor(private readonly prisma: PrismaService) {}

  async createFile(dto: CreateFileDto) {
    return this.prisma.file.create({ data: dto });
  }

  async findFilesByIds(uuids: string[]) {
    return this.prisma.file.findMany({
      where: { uuid: { in: uuids }, isDeleted: false },
    });
  }

  async findAttachFiles(dtos: FindAttachFileDto[]) {
    return this.prisma.file.findMany({
      where: { OR: dtos, isDeleted: false },
    });
  }

  async attachFiles(dtos: AttachFileDto[]) {
    const attachPromises = dtos.map(({ uuid, source, sourceUuid }) =>
      this.prisma.file.update({
        where: { uuid },
        data: { source, sourceUuid },
      }),
    );

    return Promise.all(attachPromises);
  }

  async processFile(uuid: string) {
    return this.prisma.file.update({
      where: { uuid, isDeleted: false },
      data: { isProcessed: true },
    });
  }

  async modifyAttachFiles(dto: ModifyAttachFileDto) {
    const { sourceUuids, uuids } = dto;

    // 1. 해당되는 첨부 파일을 soft delete 한다.
    await this.prisma.file.updateMany({
      where: { sourceUuid: { in: sourceUuids } },
      data: { isDeleted: true },
    });

    // 2. 파일을 모두 업데이트한다.
    this.prisma.file.updateMany({
      where: { uuid: { in: uuids } },
      data: { isDeleted: false },
    });

    return this.prisma.file.findMany({
      where: { uuid: { in: uuids }, isDeleted: false },
    });
  }

  async deleteAttachFiles(sourceUuid: string): Promise<void> {
    await this.prisma.file.updateMany({
      where: { sourceUuid, isDeleted: false },
      data: { isDeleted: true },
    });
  }
}
