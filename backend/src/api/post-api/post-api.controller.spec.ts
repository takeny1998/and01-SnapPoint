import { Test, TestingModule } from '@nestjs/testing';
import { PostApiController } from './post-api.controller';
import { PostApiService } from './post-api.service';
import { BlockService } from '@/domain/block/block.service';
import { PostService } from '@/domain/post/post.service';
import { ValidationService } from '../validation/validation.service';
import { TransformationService } from '../transformation/transformation.service';
import { RedisCacheService } from '@/common/redis/redis-cache.service';
import { mockDeep } from 'jest-mock-extended';
import { UserService } from '@/domain/user/user.service';
import { ClientProxy } from '@nestjs/microservices';

describe('PostApiController', () => {
  let controller: PostApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostApiController],
      providers: [
        PostApiService,
        PostService,
        BlockService,
        UserService,
        ValidationService,
        TransformationService,
        RedisCacheService,
        {
          provide: 'SUMMARY_SERVICE',
          useValue: mockDeep<ClientProxy>(),
        },
        {
          provide: 'FILE_SERVICE',
          useValue: mockDeep<ClientProxy>(),
        },
      ],
    })
      .overrideProvider(PostService)
      .useValue(mockDeep<PostService>())
      .overrideProvider(BlockService)
      .useValue(mockDeep<BlockService>())
      .overrideProvider(UserService)
      .useValue(mockDeep<UserService>())
      .overrideProvider(RedisCacheService)
      .useValue(mockDeep<RedisCacheService>())
      .overrideProvider(ValidationService)
      .useValue(mockDeep<ValidationService>())
      .overrideProvider(TransformationService)
      .useValue(mockDeep<TransformationService>())
      .compile();

    controller = module.get<PostApiController>(PostApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
