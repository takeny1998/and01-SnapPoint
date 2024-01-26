import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  Inject,
  ParseFilePipeBuilder,
  HttpStatus,
  Get,
  Body,
  Query,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { UploadService } from '@/domain/upload/upload.service';
import { JwtAuthGuard } from '@/common/guards/jwt.guard';
import { UploadFileURLDto } from '@/domain/upload/dtos/upload-file-url.dto';
import { UploadFileEndDto } from '@/domain/upload/dtos/upload-file-end.dto';
import { UploadFileAbortDto } from '@/domain/upload/dtos/upload-file-abort.dto';
import { FileApiService } from './file-api.service';
import { AuthRequest } from '@/common/guards/auth-request.interface';

@ApiTags('files')
@Controller('files')
export class FileApiController {
  constructor(
    private readonly fileApiService: FileApiService,
    private readonly uploadService: UploadService,
    @Inject('MEDIA_SERVICE') private readonly mediaService: ClientProxy,
  ) {}

  @Post('/image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '이미지 업로드 API',
    description: '파일을 서버에 업로드하고, 파일의 정보를 받는다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '업로드할 파일의 바이너리 데이터입니다.',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  async uploadImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 2,
        })
        .addFileTypeValidator({ fileType: 'image/webp' })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @Req() req: AuthRequest,
  ) {
    const uploadedImage = await this.fileApiService.uploadImage(file, req.user);

    this.mediaService.emit(
      { cmd: 'process_image' },
      { uuid: uploadedImage.uuid },
    );

    return uploadedImage;
  }

  @Get('/video-start')
  @ApiOperation({
    summary: '동영상 업로드 시작 API',
    description: '업로드에 필요한 업로드 ID, key를 응답받는다.',
  })
  @ApiQuery({
    name: 'contentType',
    type: 'string',
    required: true,
    description: '최종 저장할 mimeType',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: '업로드에 필요한 key' },
        uploadId: { type: 'string', description: '업로드에 필요한 업로드 ID' },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  async uploadVideo(@Query('contentType') contentType: string) {
    return this.fileApiService.startUploadVideo(contentType);
  }

  @Post('/video-url')
  @ApiOperation({
    summary: '동영상 업로드 URL 발급 API',
    description: '업로드에 필요한 업로드 URL 응답받는다.',
  })
  @ApiBody({
    type: UploadFileURLDto,
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        presignedUrl: {
          type: 'string',
          description:
            '현재 순서의 binary 파일을 전송할 URL, PUT method 사용해야함, ETag는 헤더에서 가져와야함',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  async getUploadVideoUrl(@Body() dto: UploadFileURLDto) {
    return this.fileApiService.getUploadVideoUrl(dto);
  }

  @Post('/video-end')
  @ApiOperation({
    summary: '동영상 업로드 종료 API',
    description: '동영상 업로드를 종료한다.',
  })
  @ApiBody({
    type: UploadFileEndDto,
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        presignedUrl: {
          type: 'string',
          description:
            '현재 순서의 binary 파일을 전송할 URL, PUT method 사용해야함, ETag는 헤더에서 가져와야함',
        },
      },
    },
  })
  @UseGuards(JwtAuthGuard)
  async completeUploadVideo(
    @Body() dto: UploadFileEndDto,
    @Req() req: AuthRequest,
  ) {
    const uploadedVideo = await this.fileApiService.completeUploadVideo(
      dto,
      req.user,
    );

    this.mediaService.emit(
      { cmd: 'video.process' },
      { uuid: uploadedVideo.uuid },
    );

    return uploadedVideo;
  }

  @Post('/video-abort')
  @ApiOperation({
    summary: '동영상 업로드 종료 API',
    description: '동영상 업로드를 취소한다.',
  })
  @ApiBody({
    type: UploadFileAbortDto,
  })
  @UseGuards(JwtAuthGuard)
  async uploadFilePartAbort(@Body() dto: UploadFileAbortDto) {
    return await this.fileApiService.abortMultipartUpload(dto);
  }
}
