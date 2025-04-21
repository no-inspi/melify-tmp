import { Controller, Post, Body, Sse } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('answer')
  async generateEmailResponse(@Body('mailId') mailId: string): Promise<any> {
    return this.aiService.generateEmailResponse(mailId);
  }

  @Post('generateCategories')
  async generateCategories(
    @Body('userDescription') userDescription: string,
  ): Promise<any> {
    return this.aiService.generateCategories(userDescription);
  }

  @Post('generateEmailStreaming')
  @Sse()
  generateEmailStreaming(@Body('prompt') prompt: string): Observable<any> {
    const stream = this.aiService.generateEmailStreaming(prompt);
    return from(stream).pipe(map((chunk) => ({ data: chunk })));
  }

  @Post('generateEmail')
  async generateEmail(
    @Body('prompt') prompt: string,
  ): Promise<{ html: string }> {
    const html = await this.aiService.generateEmail(prompt);
    return { html };
  }

  @Post('rephrase')
  rephrase(@Body('text') text: string): Promise<any> {
    // const stream = this.aiService.RephraseEmail(text);
    return this.aiService.RephraseEmail(text);
  }

  @Post('aiRefactor')
  aiRefactor(
    @Body('htmlText') htmlText: string,
    @Body('actionType') actionType: string,
  ): Promise<any> {
    // const stream = this.aiService.aiRefactorEmail(htmlText);
    return this.aiService.aiRefactorEmail(htmlText, actionType);
  }

  @Post('addMoreContext')
  addMoreContext(
    @Body('htmlText') htmlText: string,
    @Body('prompt') prompt: string,
  ): Promise<any> {
    // const stream = this.aiService.aiRefactorEmail(htmlText);
    return this.aiService.addMoreContext(htmlText, prompt);
  }
}
