import { Test, TestingModule } from '@nestjs/testing';
import { ValidationService } from './validation.service';
import { FileService } from '@/domain/file/file.service';
import { mockDeep } from 'jest-mock-extended';
import { BadRequestException } from '@nestjs/common';
import { ValidateFileDto } from './dtos/validate-file.dto';
import { ValidateBlockDto } from './dtos/validate-block.dto';
import { PRISMA_SERVICE, PrismaService } from '@/common/databases/prisma.service';

describe('ValidationService', () => {
  let service: ValidationService;
  // let fileService: DeepMockProxy<FileService>;
  let mockFileDto: ValidateFileDto;
  let mockBlockDto: ValidateBlockDto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidationService,
        FileService,
        {
          provide: PRISMA_SERVICE,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    })
      .overrideProvider(FileService)
      .useValue(mockDeep<FileService>())
      .compile();

    service = module.get<ValidationService>(ValidationService);
    // fileService = module.get(FileService);

    mockFileDto = {
      uuid: 'mock-file-uuid-1',
      source: 'block',
      sourceUuid: 'mock-block-uuid-1',
    };
    mockBlockDto = {
      uuid: 'mock-block-uuid-1',
      type: 'text',
      latitude: 8.1414,
      longitude: -74.3538,
    };
  });

  describe('validateLookupArea()', () => {
    it('두 지점의 최소 거리가 10km 이하인 경우 예외를 발생하지 않는다.', () => {
      const mockNearbyPostDto = {
        latitudeMin: 36.651,
        latitudeMax: 36.667,
        longitudeMin: 127.512,
        longitudeMax: 127.535,
      };

      expect(() => service.validateLookupArea(mockNearbyPostDto)).not.toThrow();
    });

    it('영역(두 지점)의 최소 거리가 10km 초과인 경우, BadRequestException을 발생시킨다.', () => {
      const mockNearbyPostDto = {
        latitudeMin: 36.614,
        latitudeMax: 36.667,
        longitudeMin: 127.424,
        longitudeMax: 127.535,
      };

      expect(() => service.validateLookupArea(mockNearbyPostDto)).toThrow(
        new BadRequestException(`The lookup areas is too large (10km Limit)`),
      );
    });
  });

  describe('validateBlocks()', () => {
    it('텍스트 타입에 위도 및 경도 값이 포함된 경우 BadRequestException을 발생시킨다', async () => {
      await expect(service.validateBlocks([mockBlockDto], [mockFileDto])).rejects.toThrow(
        new BadRequestException('Latitude and longitude should not be provided for text type'),
      );
    });

    it('미디어 타입에 위도 및 경도 값이 없는 경우 BadRequestException을 발생시킨다', async () => {
      mockBlockDto.type = 'media';
      delete mockBlockDto.latitude;
      delete mockBlockDto.longitude;

      await expect(service.validateBlocks([mockBlockDto], [mockFileDto])).rejects.toThrow(
        new BadRequestException('Latitude and longitude should be provided for media type'),
      );
    });

    it('텍스트 타입에 연관된 파일이 있는 경우 BadRequestException을 발생시킨다', async () => {
      mockBlockDto.type = 'text';
      delete mockBlockDto.latitude;
      delete mockBlockDto.longitude;

      await expect(service.validateBlocks([mockBlockDto], [mockFileDto])).rejects.toThrow(
        new BadRequestException('File block must not have media file'),
      );
    });

    it('미디어 타입에 연관된 파일이 없는 경우 BadRequestException을 발생시킨다', async () => {
      mockBlockDto.type = 'media';
      mockBlockDto.latitude = 8.1414;
      mockBlockDto.longitude = -74.3538;
      mockFileDto.sourceUuid = 'not-exist-block-uuid';

      await expect(service.validateBlocks([mockBlockDto], [mockFileDto])).rejects.toThrow(
        new BadRequestException('Media Block must have at least one files'),
      );
    });
  });
});
