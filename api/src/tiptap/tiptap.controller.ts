import { Controller, Get } from '@nestjs/common';
import { TiptapService } from './tiptap.service';

@Controller('tiptap')
export class TiptapController {
  constructor(private readonly tiptap: TiptapService) {}

  @Get('token')
  getToken() {
    const token = this.tiptap.generateToken();
    return { token };
  }
}
