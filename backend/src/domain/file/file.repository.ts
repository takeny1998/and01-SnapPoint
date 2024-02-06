import { PRISMA_SERVICE, PrismaService } from '@/common/databases/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import { File, Prisma } from '@prisma/client';

@Injectable()
export class FileRepository {
  constructor(@Inject(PRISMA_SERVICE) private readonly prisma: PrismaService) {}

  async createFile(data: Prisma.FileCreateInput) {
    return this.prisma.file.create({ data });
  }

  async createFiles(data: Prisma.FileCreateManyInput) {
    return this.prisma.file.createMany({ data });
  }

  async findFile(fileWhereUniqueInput: Prisma.FileWhereUniqueInput): Promise<File | null> {
    return this.prisma.file.findUnique({
      where: { ...fileWhereUniqueInput, isDeleted: false },
    });
  }

  async findFiles(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.FileWhereUniqueInput;
    where?: Prisma.FileWhereInput;
    orderBy?: Prisma.FileOrderByWithRelationInput;
  }): Promise<File[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.file.findMany({
      skip,
      take,
      cursor,
      where: { ...where, isDeleted: false },
      orderBy,
    });
  }

  async updateFile(params: { where: Prisma.FileWhereUniqueInput; data: Prisma.FileUpdateInput }) {
    const { data, where } = params;
    return this.prisma.file.update({
      data,
      where,
    });
  }

  async deleteFile(where: Prisma.FileWhereUniqueInput): Promise<File> {
    return this.prisma.file.update({
      data: { isDeleted: true },
      where,
    });
  }

  async deleteFiles(where: Prisma.FileWhereInput) {
    return this.prisma.file.updateMany({
      data: { isDeleted: true },
      where,
    });
  }
}