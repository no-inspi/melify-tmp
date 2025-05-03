import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  Body,
  Put,
  Post,
  Delete,
  Res,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MailsService } from './mails.service';
import { AuthService } from '../auth/auth.service';
import { Email } from './schemas/emails.schema';
import { Response } from 'express';
import { MailsGateway } from './mails.gateway';

@Controller('mails')
export class MailsController {
  constructor(
    private readonly mailsService: MailsService,
    private readonly authService: AuthService,
    private readonly mailsGateway: MailsGateway,
  ) {}

  @Get('threads')
  async getThreads(
    @Query('email') email: string,
    @Query('labelId') labelIds: string,
    @Query('searchWords') searchWords: string,
    @Query('searching') searching: string,
  ): Promise<Email[]> {
    const threads = await this.mailsService.fetchThreads({
      email: email.toLowerCase(),
      labelIds,
      searchWords,
      searching,
    });
    return threads;
  }

  @Get('importantthreads')
  async getImportantThreads(
    @Query('email') email: string,
    @Query('labelId') labelIds: string,
    @Query('searchWords') searchWords: string,
    @Query('searching') searching: string,
  ): Promise<Email[]> {
    const threads = await this.mailsService.fetchImportantThreads({
      email: email.toLowerCase(),
      labelIds,
      searchWords,
      searching,
    });
    return threads;
  }

  @Get('labels')
  async getLabels(@Query('email') email: string): Promise<any> {
    const labels = await this.mailsService.fetchLabels(email.toLowerCase());
    return { labels: labels };
  }

  @Get('details')
  async getDetails(
    @Query('mailId') mailId: string,
    @Query('threadId') threadId: string,
  ): Promise<any> {
    try {
      if (mailId) {
        const maildetail = await this.mailsService.getMailDetails(mailId);
        return { emails: maildetail };
      } else if (threadId) {
        const threadDetails =
          await this.mailsService.getThreadDetails(threadId);
        return { emails: threadDetails };
      } else {
        return { error: 'error' };
      }
    } catch (err) {
      console.error('Error retrieving details:', err);
      return { error: 'error' };
    }
  }

  @Put('setAsRead')
  async setAsRead(
    @Body('id') id: string,
    @Req() req: any,
  ): Promise<{ message: string }> {
    if (!req.cookies) {
      throw new UnauthorizedException('Authentication required.');
    }

    try {
      // Use the AuthService to get the userId
      const userId = await this.authService.getUserIdFromRequest(req);

      // Proceed with marking the mail as read
      const returnValue = await this.mailsService.setAsRead(
        id,
        req.oauth2Client,
      );

      if (
        returnValue.message === 'Email updated successfully.' &&
        returnValue.labelIds
      ) {
        // Emit mail update event to the user
        this.mailsGateway.sendMailUpdateToUser(
          userId,
          {
            labelIds: returnValue.labelIds,
          },
          id,
        );
      }

      return returnValue;
    } catch (error) {
      console.error('Error in setAsRead:', error);
      throw new UnauthorizedException('Authentication required.');
    }
  }

  @Post('addMail')
  async addMail(@Body() body: any, @Req() req: any): Promise<any> {
    return this.mailsService.addMail(body, req.oauth2Client);
  }

  @Post('addAnswer')
  async addAnswer(@Body() body: any, @Req() req): Promise<void> {
    const result = await this.mailsService.addAnswer(body, req.oauth2Client);
    return result;
  }

  @Post('forward')
  async forward(@Body() body: any, @Req() req): Promise<void> {
    return this.mailsService.forward(body, req.oauth2Client);
  }

  @Get('search_global')
  async searchGlobal(
    @Query('query') query: string,
    @Query('email') email: string,
  ): Promise<any> {
    return this.mailsService.searchBarSuggestion(query, email);
  }

  @Put('updatecategory')
  async updateCategory(
    @Body('_id') _id: string,
    @Body('category') category: string,
    @Req() req: any,
  ): Promise<any> {
    try {
      const userId = await this.authService.getUserIdFromRequest(req);
      const { status, threadId } = await this.mailsService.updateCategory(
        _id,
        category,
      );
      if (status === 'Thread updated successfully.') {
        this.mailsGateway.sendThreadUpdateToUser(
          userId,
          {
            category,
          },
          threadId,
        );
      }
      return { result: status };
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  @Put('updatecategoryandstatus')
  async updateCategoryAndStatus(
    @Body('threadId') threadId: string,
    @Body('category') category: string,
    @Body('statusInput') statusInput: string,
    @Body('deletion') deletion: boolean,
    @Body('email') email: string,
    @Req() req: any,
  ): Promise<any> {
    try {
      const userId = await this.authService.getUserIdFromRequest(req);

      const { status, userInteractions, newBadgesUnlocked } =
        await this.mailsService.updateCategoryAndStatus(
          threadId,
          category,
          statusInput,
          email,
        );

      if (status === 'Thread updated successfully.' && deletion) {
        this.mailsGateway.sendDeleteThreadToUser(userId, threadId);
      }

      return { result: status, userInteractions, newBadgesUnlocked };
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  @Put('updatestatus')
  async updateStatus(
    @Body('threadId') threadId: string,
    @Body('statusInput') statusInput: string,
    @Body('email') email: string,
    @Req() req: any,
  ): Promise<any> {
    try {
      const userId = await this.authService.getUserIdFromRequest(req);

      const { status, userInteractions, newBadgesUnlocked } =
        await this.mailsService.updateStatus(threadId, statusInput, email);

      if (status === 'Thread updated successfully.') {
        this.mailsGateway.sendDeleteThreadToUser(userId, threadId);
      }

      return { result: status, userInteractions, newBadgesUnlocked };
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  @Put('threadupdatecategory')
  async threadUpdateCategory(
    @Body('threadId') threadId: string,
    @Body('category') category: string,
    @Req() req: any,
  ): Promise<any> {
    try {
      const userId = await this.authService.getUserIdFromRequest(req);
      const { status } = await this.mailsService.updateThreadCategory(
        threadId,
        category,
      );
      if (status === 'Thread updated successfully.') {
        this.mailsGateway.sendThreadUpdateToUser(
          userId,
          {
            category,
          },
          threadId,
        );
      }
      return { result: status };
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  @Get('attachment/:mailid/:filename')
  async getAttachment(
    @Param('mailid') mailId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { fileData, attachment } = await this.mailsService.getAttachment(
        mailId,
        filename,
      );

      const safeFilename = encodeURIComponent(attachment.filename)
        .replace(/['()]/g, escape)
        .replace(/\*/g, '%2A');

      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${safeFilename}`,
      );
      res.setHeader('Content-Type', attachment.mimeType);
      res.send(fileData);
    } catch (error) {
      console.log(error);
      throw new HttpException(
        'Error fetching attachment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('updateLabel')
  async updateLabel(
    @Body('id') id: string,
    @Body('labelToUpdate') labelToUpdate: string[],
    @Body('add') add: boolean,
    @Body('detail') detail: boolean,
    @Body('labelAdded') labelAdded: string,
    @Req() req: any,
  ): Promise<{ message: string }> {
    if (!req.cookies) {
      throw new UnauthorizedException('Authentication required.');
    }

    try {
      // Use the AuthService to get the userId
      const userId = await this.authService.getUserIdFromRequest(req);

      // Proceed with marking the mail as read
      const returnValue = await this.mailsService.updateLabel(
        id,
        req.oauth2Client,
        labelToUpdate,
        add,
      );

      if (returnValue.message === 'Email label updated successfully.') {
        if (detail) {
          // Emit mail update event to the user
          this.mailsGateway.sendMailDetailUpdateToUser(
            userId,
            {
              labelIds: returnValue.labelIds,
            },
            id,
          );
        } else {
          if (labelAdded === 'IMPORTANT') {
            if (add) {
              returnValue.email.emails.forEach((email) => {
                email.labelIds.push('IMPORTANT');
              });
              this.mailsGateway.sendDeleteThreadToUser(
                userId,
                returnValue.email._id,
              );

              this.mailsGateway.sendAddThreadToUserImportant(userId, {
                _id: returnValue.email._id,
                summary: returnValue.email.summary,
                category: returnValue.email.category,
                emails: returnValue.email.emails,
                lastInboxEmailDate: returnValue.email.lastInboxEmailDate,
              });
            } else {
              this.mailsGateway.sendDeleteThreadToUserImportant(
                userId,
                returnValue.email._id,
              );
              returnValue.email.emails.forEach((email) => {
                email.labelIds = email.labelIds.filter(
                  (label) => label !== 'IMPORTANT',
                );
              });
              this.mailsGateway.sendAddThreadToUser(userId, {
                _id: returnValue.email._id,
                summary: returnValue.email.summary,
                category: returnValue.email.category,
                emails: returnValue.email.emails,
                lastInboxEmailDate: returnValue.email.lastInboxEmailDate,
              });
            }
          } else {
            // Emit mail update event to the user
            this.mailsGateway.sendMailUpdateToUser(
              userId,
              {
                labelIds: returnValue.labelIds,
              },
              id,
            );
          }
        }
      }

      return returnValue;
    } catch (error) {
      console.error('Error in setAsRead:', error);
      throw new UnauthorizedException('Authentication required.');
    }
  }

  @Delete('thread/:id')
  async deleteThreadMail(
    @Param('id') threadId: string,
    @Req() req: any,
  ): Promise<any> {
    if (!req.cookies) {
      throw new UnauthorizedException('Authentication required.');
    }

    try {
      // Use the AuthService to get the userId
      const userId = await this.authService.getUserIdFromRequest(req);

      const returnValue = await this.mailsService.deleteThreadMail(
        req.oauth2Client,
        threadId,
      );

      if (
        returnValue.message ===
        'Thread and associated emails successfully deleted'
      ) {
        // Emit mail update event to the user
        this.mailsGateway.sendDeleteThreadToUser(userId, threadId);
      }

      return this.mailsService.deleteThreadMail(req.oauth2Client, threadId);
    } catch (error) {
      console.error('Error in setAsRead:', error);
      throw new UnauthorizedException('Authentication required.');
    }
  }
}
