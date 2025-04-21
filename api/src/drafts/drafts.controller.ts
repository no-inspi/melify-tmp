import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { DraftsService } from './drafts.service';
import { AuthService } from '../auth/auth.service';

@Controller('drafts')
export class DraftsController {
  constructor(
    private readonly draftsService: DraftsService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  async createDraft(@Body() draftData: any, @Req() req: any): Promise<any> {
    return this.draftsService.createDraft(req.oauth2Client, draftData);
  }

  @Put(':id')
  async updateDraft(
    @Param('id') draftId: string,
    @Body() draftData: any,
    @Req() req: any,
  ): Promise<any> {
    return this.draftsService.updateDraft(req.oauth2Client, draftId, draftData);
  }

  @Delete(':id')
  async deleteDraft(
    @Param('id') draftId: string,
    @Req() req: any,
  ): Promise<any> {
    return this.draftsService.deleteDraft(req, draftId);
  }
}
