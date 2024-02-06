import { FileService } from '@/domain/file/file.service';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PostService } from '@/domain/post/post.service';
import { BlockService } from '@/domain/block/block.service';
import { ValidationService } from '@/api/validation/validation.service';
import { PostDto } from '@/domain/post/dtos/post.dto';
import { Block, File, Post } from '@prisma/client';
import { TransformationService } from '@/api/transformation/transformation.service';
import { FindNearbyPostQuery } from './dtos/find-nearby-post.query.dto';
import { RedisCacheService } from '@/common/redis/redis-cache.service';
import { FindBlocksByPostDto } from '@/domain/block/dtos/find-blocks-by-post.dto';
import { UserService } from '@/domain/user/user.service';
import { Transactional } from '@takeny1998/nestjs-prisma-transactional';
import { WritePostDto } from './dtos/post/write-post.dto';
import { ModifyPostDto } from './dtos/post/modify-post.dto';
import { UserPayload } from '@/common/guards/user-payload.interface';

@Injectable()
export class PostApiService {
  constructor(
    private readonly postService: PostService,
    private readonly blockService: BlockService,
    private readonly userService: UserService,
    private readonly validation: ValidationService,
    private readonly transform: TransformationService,
    private readonly redisService: RedisCacheService,
    private readonly fileService: FileService,
  ) {}

  async findEntireBlocksWithPost(posts: Post[]): Promise<Block[][]> {
    const keys = posts.map((post) => `block:${post.uuid}`);
    const entireBlocks = await this.redisService.mget<Block[]>(
      keys,
      (value) => JSON.parse(value),
      async (keys) => {
        const dtos: FindBlocksByPostDto[] = keys.map((key) => {
          const uuid = key.substring('block:'.length);
          return { postUuid: uuid };
        });
        const entireBlocks = await this.blockService.findBlocksByPosts(dtos);

        const blockByUuid = {};

        entireBlocks.forEach((block) => {
          const { postUuid } = block;
          if (!postUuid) {
            throw new InternalServerErrorException();
          }
          if (!blockByUuid[postUuid]) {
            blockByUuid[postUuid] = [];
          }
          blockByUuid[postUuid].push(block);
        });

        const resultArray = dtos.map((dto) => {
          if (!blockByUuid[dto.postUuid]) {
            return [];
          }
          return blockByUuid[dto.postUuid];
        });
        return resultArray;
      },
    );

    if (!entireBlocks) {
      throw new NotFoundException('존재하는 데이터가 없습니다.');
    }

    return entireBlocks;
  }

  async findEntireFilesWithBlocks(blocks: Block[]) {
    const keys = blocks.map((block) => `file:${block.uuid}`);
    const entireFiles = await this.redisService.mget<File>(
      keys,
      (value) => JSON.parse(value),
      async (keys) => {
        const sourceUuids = keys.map((key) => key.substring('file:'.length));

        const findFiles = await this.fileService.findAttachFiles({ source: 'block', sourceUuids });

        const fileByUuid = {};

        findFiles.forEach((file) => {
          const { sourceUuid } = file;
          if (!sourceUuid) {
            throw new InternalServerErrorException();
          }
          if (!fileByUuid[sourceUuid]) {
            fileByUuid[sourceUuid] = [];
          }
          fileByUuid[sourceUuid].push(file);
        });

        return sourceUuids.map((sourceUuid) => {
          if (!fileByUuid[sourceUuid]) return [];
          return fileByUuid[sourceUuid];
        });
      },
    );

    if (!entireFiles) {
      throw new NotFoundException('존재하는 데이터가 없습니다.');
    }

    return entireFiles;
  }

  async findNearbyPost(findNearbyPostQuery: FindNearbyPostQuery) {
    const findNearbyPostDto = this.transform.toNearbyPostDtoFromQuery(findNearbyPostQuery);

    // 올바른 위치인지 게시글을 검증한다.
    this.validation.validateLookupArea(findNearbyPostDto);

    // 1. 현 위치 주변의 블록을 찾는다.
    const blocks = await this.blockService.findBlocksByArea(findNearbyPostDto);

    // 2. 블록과 연관된 게시글 정보를 찾는다.
    const blockPostUuids = blocks.map((block) => ({ uuid: block.postUuid }));
    const posts = await this.postService.findPosts({ where: { OR: blockPostUuids } });

    const userUuids = posts.map((post) => ({ uuid: post.userUuid }));
    const users = await this.userService.findUsersByIds(userUuids);

    // 3. 게시글과 연관된 모든 블록을 찾는다.
    const entireBlocks = ([] as Block[]).concat(...(await this.findEntireBlocksWithPost(posts)));
    // 4. 블록과 연관된 모든 파일을 찾는다.
    const entireFiles = ([] as File[]).concat(...(await this.findEntireFilesWithBlocks(entireBlocks)));

    return this.transform.assemblePosts(posts, users, entireBlocks, entireFiles);
  }

  async findPost(uuid: string, detail: boolean = true) {
    // 1. UUID로 게시글을 찾는다.
    const post = await this.postService.findPost({ uuid });

    if (!post) {
      throw new NotFoundException(`Cloud not found post with UUID: ${uuid}`);
    }

    const user = await this.userService.findUserById({ uuid: post.userUuid });

    if (!user) {
      throw new NotFoundException(`Cloud not found User with UUID: ${post.userUuid}`);
    }

    if (!detail) {
      return PostDto.of(post, user);
    }

    // 2. 게시글과 연관된 블록들을 찾는다.
    const blocks = await this.blockService.findBlocksByPost({ postUuid: post.uuid });

    // 3. 블록들과 연관된 파일들을 찾는다.
    const blockUuids = blocks.map(({ uuid }) => uuid);
    const files = await this.fileService.findAttachFiles({ source: 'block', sourceUuids: blockUuids });
    return this.transform.assemblePost(post, user, blocks, files);
  }

  @Transactional()
  async writePost(postDto: WritePostDto, user: UserPayload) {
    // 계층적인 게시글 데이터를 게시글, 블록, 파일로 분할한다.
    const decomposedPostDto = this.transform.decomposePostData(postDto);
    const { post, blocks, files } = decomposedPostDto;

    // 게시글의 블록, 파일을 각각 검사한다.
    await Promise.all([
      this.validation.validateCreateBlocks(blocks, files),
      this.validation.validateFiles(files, user.uuid),
    ]);

    const [createdPost, createdBlocks, createdFiles] = await Promise.all([
      this.postService.createPost(user.uuid, post),
      this.blockService.createBlocks(post.uuid, blocks),
      this.fileService.attachFiles(files),
    ]);

    // Redis 캐시 정보를 삭제한다.
    await this.redisService.del(`block:${post.uuid}`);
    const deleteCacheKeys = blocks.map((block) => `file:${block.uuid}`);
    await this.redisService.del(deleteCacheKeys);

    return this.transform.assemblePost(createdPost, user, createdBlocks, createdFiles);
  }

  @Transactional()
  async modifyPost(uuid: string, postDto: ModifyPostDto, user: UserPayload) {
    const decomposedPostDto = this.transform.decomposePostData(postDto, uuid);
    const { post, blocks, files } = decomposedPostDto;

    await Promise.all([
      this.validation.validatePost({ uuid, userUuid: user.uuid }),
      this.validation.validateModifyBlocks(uuid, blocks, files),
      this.validation.validateFiles(files, user.uuid),
    ]);

    const { attachFiles, deleteFileUuids } = await this.transform.separateFiles(blocks, files);

    const [updatedPost, updatedBlocks] = await Promise.all([
      this.postService.updatePost({ where: { uuid }, data: post }),
      this.blockService.modifyBlocks(uuid, blocks),
      this.fileService.attachFiles(attachFiles),
      this.fileService.deleteFiles(deleteFileUuids),
    ]);

    const findFileDto = { source: 'block', sourceUuids: blocks.map(({ uuid }) => uuid) };
    const updatedFiles = await this.fileService.findAttachFiles(findFileDto);

    await this.redisService.del(`file:${uuid}`);
    await this.redisService.del(`block:${uuid}`);
    const deleteCacheKeys = blocks.map((block) => `file:${block.uuid}`);
    await this.redisService.del(deleteCacheKeys);

    return this.transform.assemblePost(updatedPost, user, updatedBlocks, updatedFiles);
  }

  @Transactional()
  async deletePost(uuid: string, user: UserPayload) {
    await this.validation.validatePost({ uuid, userUuid: user.uuid });

    const deletedPost = await this.postService.deletePost({ uuid });
    const deletedBlocks = await this.blockService.deleteBlocksByPost(uuid);

    const blockUuids = deletedBlocks.map(({ uuid }) => uuid);
    const deletedFiles = await this.fileService.deleteAttachFiles(blockUuids);

    const willDeleteFileKeys = deletedBlocks.map(({ uuid }) => `file:${uuid}`);
    await Promise.all([this.redisService.del(`block:${uuid}`), this.redisService.del(willDeleteFileKeys)]);

    return this.transform.assemblePost(deletedPost, user, deletedBlocks, deletedFiles);
  }
}
