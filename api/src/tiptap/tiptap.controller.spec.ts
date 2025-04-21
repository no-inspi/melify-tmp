import { Test, TestingModule } from '@nestjs/testing';
import { TiptapController } from './tiptap.controller';

describe('TiptapController', () => {
  let controller: TiptapController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiptapController],
    }).compile();

    controller = module.get<TiptapController>(TiptapController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
