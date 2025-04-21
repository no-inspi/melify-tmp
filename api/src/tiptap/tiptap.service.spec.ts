import { Test, TestingModule } from '@nestjs/testing';
import { TiptapService } from './tiptap.service';

describe('TiptapService', () => {
  let service: TiptapService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TiptapService],
    }).compile();

    service = module.get<TiptapService>(TiptapService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
