import { Module } from '@nestjs/common';
import { TiptapService } from './tiptap.service';
import { TiptapController } from './tiptap.controller';

@Module({
  providers: [TiptapService],
  controllers: [TiptapController]
})
export class TiptapModule {}
