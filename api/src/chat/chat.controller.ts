import { Controller, Post, Sse, Body } from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('stream')
  @Sse()
  streamChatResponse(@Body('messages') messages: any): Observable<any> {
    const stream = this.chatService.generateChatResponseStreaming(messages);
    return from(stream).pipe(map((chunk) => ({ data: chunk })));
  }
}
