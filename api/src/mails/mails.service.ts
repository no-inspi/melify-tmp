import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PipelineStage } from 'mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/users.schema';
import { Accounts } from '../users/schemas/accounts.schema';
import { Email } from './schemas/emails.schema'; // Adjust import as necessary
import { Thread } from './schemas/thread.schema';
import { MailsInteraction } from './schemas/mailsinteraction.schema';
// import { ProfileType } from '../users/interface/user.interface';
import { Label } from './interface/mail.interface';
import { google } from 'googleapis';

import {
  getMongooseQueryFromObject,
  parseSearchString,
  sendEmail,
  createMessage,
  extractEmails,
  extractNewContent,
  transformEmails,
} from './helpers/email.helpers';
import { TemplateService } from 'src/templates/templates.service';
import { MailsGateway } from './mails.gateway';
import { AuthService } from 'src/auth/auth.service';
import { Token } from 'src/auth/schemas/tokens.schema';
import {
  defaultCommands,
  defaultIsCommands,
  defaultFileNameCommands,
  defaultFromCommands,
  defaultSubjectCommands,
  defaultToCommands,
  defaultCategoryCommands,
} from 'src/utils/constants';

import { UserHelpers } from 'src/users/helpers/user.helpers';
import { ProfileType } from 'src/users/schemas/profileType.schema';

@Injectable()
export class MailsService {
  constructor(
    @InjectModel(Email.name) private emailModel: Model<Email>,
    @InjectModel(Accounts.name) private accountsModel: Model<Accounts>,
    @InjectModel(Thread.name) private threadModel: Model<Thread>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    @InjectModel(MailsInteraction.name)
    private mailsInteraction: Model<MailsInteraction>,
    @InjectModel(ProfileType.name) private profileTypeModel: Model<ProfileType>,
    private readonly templateService: TemplateService,
    private readonly mailsGateway: MailsGateway,
    private readonly authService: AuthService,
    private readonly userHelpers: UserHelpers,
  ) {}

  async fetchLabels(userEmail: string): Promise<Label[]> {
    const labels: Label[] = [
      { id: 'all', type: 'system', name: 'inbox', unreadCount: 0 },
      { id: 'todo', type: 'system', name: 'To-Do List', unreadCount: 0 },
      { id: 'done', type: 'system', name: 'done', unreadCount: 0 },
      { id: 'draft', type: 'system', name: 'draft', unreadCount: 0 },
      { id: 'sent', type: 'system', name: 'sent', unreadCount: '' },
      { id: 'trash', type: 'system', name: 'trash', unreadCount: '' },
      { id: 'spam', type: 'system', name: 'spam', unreadCount: '' },
    ];

    const emailRegex = new RegExp(`.*${userEmail}.*`, 'i'); // 'i' for case-insensitivity

    const account = await this.accountsModel.findOne({ email: userEmail });

    const user = await this.userModel
      .findOne({ _id: account.userId })
      .populate<{ profileType: ProfileType }>('profileType')
      .exec();
    if (!user) {
      throw new Error('User not found');
    }

    const categories = user.profileType.categories;

    for (const [index, label] of labels.entries()) {
      let cursorAll;
      switch (label.id) {
        case 'all':
          cursorAll = await this.emailModel.countDocuments({
            labelIds: { $all: ['UNREAD', 'INBOX'] },
            deliveredTo: { $regex: emailRegex },
          });
          labels[index].unreadCount = cursorAll;
          break;
        case 'done':
        case 'todo':
          cursorAll = await this.threadModel.countDocuments({
            deliveredTo: { $regex: emailRegex },
            statusInput: label.id,
          });
          labels[index].unreadCount = cursorAll;
          break;
        case 'draft':
          cursorAll = await this.emailModel.countDocuments({
            labelIds: { $all: ['DRAFT'], $nin: ['TRASH'] },
            draftId: { $exists: true },
            from: { $regex: emailRegex },
          });
          labels[index].unreadCount = cursorAll;
          break;
        default:
          cursorAll = await this.emailModel.countDocuments({
            labelIds: { $all: ['UNREAD', 'INBOX'] },
            to: { $regex: emailRegex },
            category: label.id,
          });
          labels[index].unreadCount = cursorAll;
      }
    }

    for (const category of categories) {
      if (!category.disable) {
        const cursorAll = await this.emailModel.countDocuments({
          labelIds: { $all: ['UNREAD', 'INBOX'] },
          deliveredTo: { $regex: emailRegex },
          category: category.name,
        });

        labels.push({
          id: category.name,
          type: 'system',
          name: category.displayName ? category.displayName : category.name,
          unreadCount: cursorAll,
          color: category.color ? category.color : '#0466c8',
        });
      }
    }

    labels.push({
      id: 'Other',
      type: 'system',
      name: 'Other',
      unreadCount: 0,
      color: '#40E0D0',
    });

    return labels;
  }

  async fetchThreads({
    email,
    labelIds,
    searchWords,
    searching,
  }: {
    email: string;
    labelIds: string;
    searchWords: string;
    searching: string;
  }): Promise<any> {
    try {
      this.userHelpers.retrieve30daysEmail(email);
      const parsedObject = parseSearchString(searchWords);

      const { query, queryThread } = await getMongooseQueryFromObject(
        labelIds,
        email,
        parsedObject,
        searching,
      );

      if (labelIds !== 'draft') {
        query.labelIds.$in.push('SENT');
      }
      // if (query.labelIds.$nin) {
      //   query.labelIds.$nin.push('IMPORTANT');
      // }

      let threadCategoryToQuery = '';
      if (query.category) {
        threadCategoryToQuery = query.category;
        delete query.category;
      }

      const threadMatchCommand = [];

      if (searching && queryThread['statusInput'] !== '') {
        threadMatchCommand.push({
          $match: { 'thread.statusInput': queryThread['statusInput'] },
        });
      } else if (labelIds === 'todo' || labelIds === 'done') {
        threadMatchCommand.push({
          $match: { 'thread.statusInput': labelIds },
        });
      } else {
        threadMatchCommand.push({
          $match: {
            $or: [
              { 'thread.statusInput': { $eq: '' } },
              { 'thread.statusInput': { $exists: false } },
            ],
          },
        });
      }

      const pipeline: PipelineStage[] = [
        { $match: query }, // Initial match on primary query fields
        {
          $lookup: {
            from: 'threads', // Ensure this matches the threads collection name
            localField: 'threadId',
            foreignField: 'threadId',
            as: 'thread',
          },
        },
        { $unwind: { path: '$thread', preserveNullAndEmptyArrays: true } },

        // New condition: Only keep threads with `statusInput === 'todo` when `labelIds` is 'todo'
        ...threadMatchCommand,

        // Apply the category filter on `thread.category` here
        ...(threadCategoryToQuery && threadCategoryToQuery !== ''
          ? [
              {
                $match: {
                  $or: [
                    // If userCategory is NOT empty, it must match `threadCategoryToQuery`
                    {
                      $and: [
                        { 'thread.userCategory': { $ne: '' } }, // Ensure it's not empty
                        { 'thread.userCategory': threadCategoryToQuery }, // Must match threadCategoryToQuery
                      ],
                    },
                    // Otherwise, use generatedCategory
                    { 'thread.generatedCategory': threadCategoryToQuery },
                  ],
                },
              },
            ]
          : []),

        {
          $group: {
            _id: '$threadId',
            summary: { $first: { $ifNull: ['$thread.summary', ''] } },
            category: { $first: { $ifNull: ['$thread.category', ''] } },
            userCategory: { $first: { $ifNull: ['$thread.userCategory', ''] } },
            generatedCategory: {
              $first: { $ifNull: ['$thread.generatedCategory', ''] },
            },
            statusInput: {
              $first: { $ifNull: ['$thread.statusInput', ''] },
            },
            emails: {
              $push: {
                messageId: '$messageId',
                snippet: '$snippet',
                to: '$to',
                from: '$from',
                subject: '$subject',
                labelIds: '$labelIds',
                category: '$category',
                userCategory: '$userCategory',
                generatedCategory: '$generatedCategory',
                date: '$date',
                // html: {
                //   $cond: {
                //     if: { $in: ['DRAFT', '$labelIds'] },
                //     then: '$html',
                //     else: null,
                //   },
                // },
                // text: '$text',
                draftId: '$draftId',
                attachments: '$attachments',
                attachmentCount: { $size: { $ifNull: ['$attachments', []] } },
              },
            },
            lastInboxEmailDate: {
              $max: {
                $cond: [{ $in: ['INBOX', '$labelIds'] }, '$date', null],
              },
            },
          },
        },
        { $skip: 0 }, // Adjust as needed
      ];

      // Execute the aggregation pipeline
      const threads = await this.emailModel.aggregate(pipeline);
      // Sort the result by `lastInboxEmailDate` in descending order
      const sortedThreads = threads.sort((a, b) => {
        const dateA = new Date(
          a.lastInboxEmailDate || a.emails[a.emails.length - 1]?.date || 0,
        ).getTime();
        const dateB = new Date(
          b.lastInboxEmailDate || b.emails[b.emails.length - 1]?.date || 0,
        ).getTime();
        return dateB - dateA; // Descending order
      });

      return sortedThreads;
    } catch (err) {
      console.error('Error fetching threads: ', err);
      throw err;
    }
  }

  async fetchImportantThreads({
    email,
    labelIds,
    searchWords,
    searching,
  }: {
    email: string;
    labelIds: string;
    searchWords: string;
    searching: string;
  }): Promise<any> {
    try {
      const parsedObject = parseSearchString(searchWords);

      const { query } = await getMongooseQueryFromObject(
        labelIds,
        email,
        parsedObject,
        searching,
      );

      if (labelIds !== 'draft') {
        query.labelIds.$in.push('SENT');
      }

      query.labelIds['$all'] = query.labelIds['$all'] || [];

      query.labelIds['$all'].push('IMPORTANT');

      const pipeline: PipelineStage[] = [
        { $match: query }, // Initial match on primary query fields
        {
          $lookup: {
            from: 'threads', // Ensure this matches the threads collection name
            localField: 'threadId',
            foreignField: 'threadId',
            as: 'thread',
          },
        },
        { $unwind: { path: '$thread', preserveNullAndEmptyArrays: true } },

        // Apply the category filter on `thread.category` here
        ...(query.category && query.category.$regex
          ? [{ $match: { 'thread.category': query.category } }]
          : []),

        {
          $group: {
            _id: '$threadId',
            summary: { $first: { $ifNull: ['$thread.summary', ''] } },
            category: { $first: { $ifNull: ['$thread.category', ''] } },
            userCategory: { $first: { $ifNull: ['$thread.userCategory', ''] } },
            generatedCategory: {
              $first: { $ifNull: ['$thread.generatedCategory', ''] },
            },
            emails: {
              $push: {
                messageId: '$messageId',
                snippet: '$snippet',
                to: '$to',
                from: '$from',
                subject: '$subject',
                labelIds: '$labelIds',
                category: '$category',
                userCategory: '$userCategory',
                generatedCategory: '$generatedCategory',
                date: '$date',
                html: {
                  $cond: {
                    if: { $in: ['DRAFT', '$labelIds'] },
                    then: '$html',
                    else: null,
                  },
                },
                text: '$text',
                draftId: '$draftId',
                attachments: '$attachments',
                attachmentCount: { $size: { $ifNull: ['$attachments', []] } },
              },
            },
            lastInboxEmailDate: {
              $max: {
                $cond: [{ $in: ['INBOX', '$labelIds'] }, '$date', null],
              },
            },
          },
        },
        // { $sort: { 'emails.date': -1 as 1 | -1 } },
        { $skip: 0 }, // Adjust as needed
      ];

      // Execute the aggregation pipeline
      const threads = await this.emailModel.aggregate(pipeline);

      // Sort the result by `lastInboxEmailDate` in descending order
      const sortedThreads = threads.sort((a, b) => {
        const dateA = new Date(
          a.lastInboxEmailDate || a.emails[a.emails.length - 1]?.date || 0,
        ).getTime();
        const dateB = new Date(
          b.lastInboxEmailDate || b.emails[b.emails.length - 1]?.date || 0,
        ).getTime();
        return dateB - dateA; // Descending order
      });

      return sortedThreads;
    } catch (err) {
      console.error('Error fetching threads: ', err);
      throw err;
    }
  }

  async getMailDetails(mailId: string): Promise<Email> {
    return this.emailModel.findOne({ _id: mailId }).exec();
  }

  async setAsRead(emailId: string, oauth2Client: any): Promise<any> {
    try {
      if (!oauth2Client) {
        throw new UnauthorizedException('Authentication required.');
      }

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const deliveredTo = userInfo.data.email;

      const email = await this.emailModel.findOne({
        messageId: emailId,
      });

      if (!email) {
        return { message: 'Email not found ' };
      }

      // Fetch all unread emails in the thread that belong to the authenticated user
      const unreadEmails = await this.emailModel.find({
        threadId: email.threadId,
        labelIds: 'UNREAD',
        deliveredTo: deliveredTo,
      });

      if (unreadEmails.length === 0) {
        return { message: 'No unread emails found in the thread.' };
      }

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      for (const email of unreadEmails) {
        await gmail.users.messages.modify({
          userId: 'me',
          id: email.messageId,
          requestBody: {
            removeLabelIds: ['UNREAD'],
          },
        });

        // Update in MongoDB database
        await this.emailModel.findOneAndUpdate(
          { messageId: email.messageId },
          { $pull: { labelIds: 'UNREAD' } }, // Remove 'UNREAD' from labelIds array
          { new: true }, // Return the updated document
        );
      }

      return {
        message: 'Email updated successfully.',
        labelIds: email.labelIds.filter((labelId) => labelId !== 'UNREAD'),
      };
    } catch (error) {
      console.error('Failed to update email:', error);
      throw new InternalServerErrorException(
        'Error updating email.',
        error.message,
      );
    }
  }

  async updateLabel(
    emailId: string,
    oauth2Client: any,
    labelToUpdate: string[],
    add: boolean,
  ): Promise<any> {
    try {
      // const email = await this.emailModel.findOne({
      //   messageId: emailId,
      // });

      const pipeline: PipelineStage[] = [
        // Step 1: Match emails based on the primary query
        { $match: { messageId: emailId } },

        // Step 2: Lookup to join with threads collection on threadId
        {
          $lookup: {
            from: 'threads', // Ensure this matches the threads collection name
            localField: 'threadId', // Field in emails collection
            foreignField: 'threadId', // Field in threads collection
            as: 'thread',
          },
        },
        // Step 3: Unwind the thread array
        { $unwind: { path: '$thread', preserveNullAndEmptyArrays: true } },
        // Step 5: Group by threadId to aggregate category, summary, emails, and lastInboxEmailDate
        {
          $group: {
            _id: '$threadId', // Group by threadId

            // Get the first summary and category from the thread
            summary: { $first: { $ifNull: ['$thread.summary', ''] } },
            category: { $first: { $ifNull: ['$thread.category', ''] } },
            userCategory: { $first: { $ifNull: ['$thread.userCategory', ''] } },
            generatedCategory: {
              $first: { $ifNull: ['$thread.generatedCategory', ''] },
            },

            // Collect email details into an array
            emails: {
              $push: {
                messageId: '$messageId',
                snippet: '$snippet',
                to: '$to',
                from: '$from',
                subject: '$subject',
                labelIds: '$labelIds',
                category: '$category',
                userCategory: '$userCategory',
                generatedCategory: '$generatedCategory',
                date: '$date',
                draftId: '$draftId',
                attachments: '$attachments',
                attachmentCount: { $size: { $ifNull: ['$attachments', []] } },
              },
            },

            // Calculate the most recent date for emails with the INBOX label
            lastInboxEmailDate: {
              $max: {
                $cond: [{ $in: ['INBOX', '$labelIds'] }, '$date', null],
              },
            },
          },
        },

        // Step 6: Limit results for pagination, adjust as needed
        { $skip: 0 },
      ];

      const email = await this.emailModel.aggregate(pipeline);
      if (!email) {
        return { message: 'Email not found or is already read.' };
      }

      if (!oauth2Client) {
        throw new UnauthorizedException('Authentication required.');
      }

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      let response;

      if (add) {
        response = await gmail.users.messages.modify({
          userId: 'me',
          id: emailId,
          requestBody: {
            addLabelIds: labelToUpdate,
          },
        });
      } else {
        response = await gmail.users.messages.modify({
          userId: 'me',
          id: emailId,
          requestBody: {
            removeLabelIds: labelToUpdate,
          },
        });
      }

      return {
        message: 'Email label updated successfully.',
        labelIds: response.data.labelIds,
        email: email[0],
      };
    } catch (error) {
      console.error('Failed to update email:', error);
      throw new InternalServerErrorException(
        'Error updating email.',
        error.message,
      );
    }
  }

  async getThreadDetails(threadId: string): Promise<Email[]> {
    return this.emailModel
      .find({
        threadId: threadId,
        labelIds: { $in: ['SENT', 'INBOX'] },
      })
      .sort({ createdAt: 1 })
      .exec();
  }

  async addMail(body: any, oauth2Client: any): Promise<any> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      let additionnalHtmlContent = '';

      if (body.user.email === 'charlie.apcher@melify.fr') {
        additionnalHtmlContent = this.templateService.compileTemplate(
          'paulMessage',
          {},
        );
      }

      let attachments = body.attachments;

      attachments = attachments.map((attachment) => {
        const { data, content, ...rest } = attachment;
        const base64data = data
          ? data.replace(/-/g, '+').replace(/_/g, '/') // Transform `data` if it exists
          : content; // Use `content` if `data` is not available

        return { ...rest, content: base64data }; // Always return as `content`
      });

      const emailContent = await createMessage(
        body.user.email,
        body.to,
        body.subject,
        body.message,
        null,
        null,
        body.cc,
        body.bcc,
        attachments,
        true,
        additionnalHtmlContent,
        body.user.email === 'paul.charon@melify.fr',
        // || body.user.email === 'charlie.apcher@gmail.com',
      );

      const sendResult = await sendEmail(gmail, emailContent);

      const transformEmailsResponse = await transformEmails(
        body.user.email,
        sendResult.id,
      );

      this.saveEmailToDatabase(transformEmailsResponse);
      const response = await gmail.users.drafts.delete({
        userId: 'me',
        id: body.draftId,
      });

      if (response.status !== 200 && response.status !== 204) {
        throw new InternalServerErrorException('Failed to delete email draft.');
      }

      return {
        message: 'Email sent successfully',
        id: sendResult.id,
        sendResult: sendResult,
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new InternalServerErrorException('Failed to send email.');
    }
  }

  async addAnswer(body: any, oauth2Client: any): Promise<any> {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const email = await this.emailModel.findOne({ messageId: body._id });

    const emailContent = await createMessage(
      body.user.email,
      body.to,
      email.subject,
      body.message,
      body.threadId,
      email,
      body.cc,
      body.bcc,
      body.attachments,
    );

    const emailToReturn = {
      from: body.user.email,
      to: body.to,
      cc: body.cc,
    };

    const sendResult = await sendEmail(gmail, emailContent, body.threadId);

    return {
      message: 'Email sent successfully',
      id: sendResult.id,
      sendResult: sendResult,
      emailToReturn: emailToReturn,
    };
  }

  async forward(body: any, oauth2Client: any): Promise<any> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const threadId = body.threadId;
      const forwardEmails = body.forwardEmails;
      const isSummaryPresent = body.isSummaryPresent;
      const message = body.message;
      const subject = body.subject;
      const cc = body.cc;
      const bcc = body.bcc;
      let attachments = body.attachments;

      // const emails = await this.emailModel
      //   .find({ threadId: threadId, labelIds: { $in: ['INBOX', 'SENT'] } })
      //   .sort({ date: 1 })
      //   .lean();

      const sanitizedEmails = forwardEmails.map((email) => ({
        ...email,
        html: extractNewContent(email.html),
        from: email.from.replace(/</g, '').replace(/>/g, ''), // Sanitize emailFrom field
        to: email.to.replace(/</g, '').replace(/>/g, ''), // Sanitize emailTo field
        date: `${new Date(email.date).toLocaleDateString('en-US')} at ${new Date(
          email.date,
        ).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZoneName: 'short',
        })}`,
      }));

      const thread = await this.threadModel
        .findOne({ threadId: threadId })
        .lean();

      let htmlContent = this.templateService.compileTemplate('forward', {
        threadSummary: thread.summary,
        thread: sanitizedEmails,
        isSummaryPresent,
      });

      // Transform the attachments to ensure 'data' is base64-encoded and renamed to 'content'
      attachments = attachments.map((attachment) => {
        const { data, content, ...rest } = attachment;
        const base64data = data
          ? data.replace(/-/g, '+').replace(/_/g, '/') // Transform `data` if it exists
          : content; // Use `content` if `data` is not available

        return { ...rest, content: base64data }; // Always return as `content`
      });

      htmlContent = message + htmlContent;

      const emailContent = await createMessage(
        body.user.email,
        body.deliveredTo,
        subject ? subject : 'Fwd: ',
        htmlContent,
        null,
        null,
        cc,
        bcc,
        attachments,
        false,
      );

      const sendResult = await sendEmail(gmail, emailContent);

      const response = await gmail.users.drafts.delete({
        userId: 'me',
        id: body.draftId,
      });

      if (response.status !== 200 && response.status !== 204) {
        throw new InternalServerErrorException('Failed to delete email draft.');
      }

      return {
        message: 'Email sent successfully',
        id: sendResult.id,
        sendResult: sendResult,
      };
    } catch (error) {
      console.error('Failed to forward email:', error);
      throw new InternalServerErrorException('Failed to forward email.');
    }
  }

  async searchGlobal(email: string): Promise<any> {
    const emailRegex = new RegExp(`.*${email}.*`, 'i');
    try {
      // Fetch the last 100 emails sorted by receivedAt in descending order
      const emails = await this.emailModel
        .find({ to: { $regex: emailRegex } })
        .sort({ receivedAt: -1 })
        .limit(100)
        .select('from');

      // Extract the "from" fields and remove duplicates
      const fromEmails = [...new Set(emails.map((email: any) => email.from))];

      const cleanEmails = extractEmails(fromEmails);

      const result = cleanEmails.map((email, index) => ({
        name: `${email}`,
        html: `${email}`,
        id: index + 1,
        coverUrl:
          'https://api-prod-minimal-v6.pages.dev/assets/images/m-product/product-6.webp',
      }));

      return { results: result };
    } catch (err) {
      console.error('Error fetching emails:', err);
      throw err;
    }
  }

  async searchBarSuggestion(query: string, email: string): Promise<any> {
    const emailRegex = new RegExp(`.*${email}.*`, 'i');

    try {
      if (query === '') {
        return {
          results: defaultCommands,
        };
      }
      const parsedSearchString = parseSearchString(query);

      let result: any;
      if ('text' in parsedSearchString) {
        result = defaultCommands.filter((command) =>
          command.name.includes(parsedSearchString['text']),
        );

        if (result.length === 0) {
          const emails = await this.emailModel
            .find({ deliveredTo: { $regex: emailRegex } })
            .sort({ date: -1 })
            .select({ from: 1, to: 1 })
            .allowDiskUse(true);

          // Extract the "from" fields and remove duplicates
          const fromEmails = [
            ...new Set(emails.map((email: any) => email.from)),
          ];

          const toEmails = [...new Set(emails.map((email: any) => email.to))];

          let cleanEmails = extractEmails(fromEmails);
          const toCleanEmails = extractEmails(toEmails);

          const uniqueToCleanEmails = [...new Set(toCleanEmails)];

          const filteredToCleanEmails = uniqueToCleanEmails.filter(
            (emailFiltered) => emailFiltered !== email,
          );

          cleanEmails = cleanEmails.concat(filteredToCleanEmails);
          const uniqueCleanEmails = [...new Set(cleanEmails)];

          const filteredEmails = uniqueCleanEmails.filter((email) =>
            email.includes(parsedSearchString.text),
          );

          result = filteredEmails.map((email, index) => ({
            name: `${email}`,
            description: `${email}`,
            id: index + 1,
          }));

          return { results: result };
        }
      } else {
        const resultArr: any = [];

        const all_keys = Object.keys(parsedSearchString);
        const last_key = all_keys[all_keys.length - 1];

        if (parsedSearchString[last_key].trim() === '') {
          switch (last_key) {
            case 'is':
              return { results: defaultIsCommands };
            case 'from':
              return { results: defaultFromCommands };
            case 'subject':
              return { results: defaultSubjectCommands };
            case 'to':
              return { results: defaultToCommands };
            case 'category':
              return { results: defaultCategoryCommands };
            case 'filename':
              return { results: defaultFileNameCommands };
            default:
              break;
          }
          return { results: defaultIsCommands };
        } else {
          switch (last_key) {
            case 'is':
              return { results: defaultIsCommands };
            case 'subject':
              break;
            case 'filename':
              break;
            case 'category':
              const account = await this.accountsModel.findOne({ email });
              const user = await this.userModel.findOne({
                _id: account.userId,
              });

              const profileType = await this.profileTypeModel.findOne({
                _id: user.profileType,
              });

              const trimmedCategory = parsedSearchString.category.trim();

              const filteredCategories = profileType.categories.filter(
                (category) =>
                  category.name.includes(trimmedCategory) && !category.disable,
              );

              const resultArrayCategory: any = [];

              for (const [index, category] of filteredCategories.entries()) {
                resultArrayCategory.push({
                  name: query.replace(
                    parsedSearchString.category.trim(),
                    category.name,
                  ),
                  description: query.replace(
                    parsedSearchString.category.trim(),
                    category.name,
                  ),
                  id: index + 1,
                });
              }

              return { results: resultArrayCategory };
            case 'to':
              const emailsTo = await this.emailModel
                .find({
                  $or: [
                    { deliveredTo: { $regex: emailRegex } },
                    { from: { $regex: emailRegex } },
                  ],
                })
                .sort({ date: -1 })
                .select({ to: 1 })
                .allowDiskUse(true);

              const toEmails = [
                ...new Set(emailsTo.map((email: any) => email.to)),
              ];
              let cleanEmailsTo = extractEmails(toEmails);
              cleanEmailsTo = [...new Set(cleanEmailsTo)];

              const filteredEmailsTo = cleanEmailsTo.filter((email) =>
                email.includes(parsedSearchString.to.trim()),
              );

              const resultArrayTo: any = [];

              for (const [index, email] of filteredEmailsTo.entries()) {
                resultArrayTo.push({
                  name: query.replace(parsedSearchString.to.trim(), email),
                  description: query.replace(
                    parsedSearchString.to.trim(),
                    email,
                  ),
                  id: index + 1,
                });
              }

              return { results: resultArrayTo };
            case 'from':
              const emails = await this.emailModel
                .find({ deliveredTo: { $regex: emailRegex } })
                .sort({ date: -1 })
                .select({ from: 1 })
                .allowDiskUse(true);

              const fromEmails = [
                ...new Set(emails.map((email: any) => email.from)),
              ];
              let cleanEmails = extractEmails(fromEmails);
              cleanEmails = [...new Set(cleanEmails)];

              const filteredEmails = cleanEmails.filter((email) =>
                email.includes(parsedSearchString.from.trim()),
              );

              const resultArray: any = [];

              for (const [index, email] of filteredEmails.entries()) {
                resultArray.push({
                  name: query.replace(parsedSearchString.from.trim(), email),
                  description: query.replace(
                    parsedSearchString.from.trim(),
                    email,
                  ),
                  id: index + 1,
                });
              }

              return { results: resultArray };
            default:
              break;
          }
        }

        Object.keys(parsedSearchString).forEach((key) => {
          resultArr.push({
            name: key + ':' + parsedSearchString[key],
            description: key + ':' + parsedSearchString[key],
          });
        });
        return { results: resultArr };
      }

      return { results: result };
    } catch (err) {
      console.error('Error fetching emails:', err);
      throw err;
    }
  }

  async updateCategory(
    _id: string,
    category: string,
  ): Promise<{ status: string; threadId: string }> {
    if (!_id) {
      return {
        status: 'Email ID (_id) is required for updating.',
        threadId: null,
      };
    }

    try {
      const emailToUpdate = await this.emailModel.findById(_id);

      if (!emailToUpdate) {
        return { status: 'Email not found.', threadId: null };
      }

      // Extract the threadId from the email
      const threadId = emailToUpdate.threadId;

      if (!threadId) {
        return { status: 'No thread associated with this email.', threadId };
      }

      const threadToUpdate = await this.threadModel.findOne({ threadId });

      if (!threadToUpdate) {
        return { status: 'Thread not found.', threadId };
      }
      // Update the thread's category
      threadToUpdate.initialCategory = threadToUpdate.category;
      threadToUpdate.userCategory = category;

      // Save the updated thread
      await threadToUpdate.save();

      return { status: 'Thread updated successfully.', threadId };
    } catch (err) {
      throw new Error(`Error updating thread: ${err.message}`);
    }
  }

  async updateThreadCategory(
    threadId: string,
    category: string,
  ): Promise<{ status: string }> {
    if (!threadId) {
      return {
        status: 'Email threadId is required for updating.',
      };
    }

    try {
      if (!threadId) {
        return { status: 'No thread associated with this email.' };
      }

      const threadToUpdate = await this.threadModel.findOne({ threadId });

      if (!threadToUpdate) {
        return { status: 'Thread not found.' };
      }
      // Update the thread's category
      threadToUpdate.initialCategory = threadToUpdate.category;
      threadToUpdate.userCategory = category;

      // Save the updated thread
      await threadToUpdate.save();

      return { status: 'Thread updated successfully.' };
    } catch (err) {
      throw new Error(`Error updating thread: ${err.message}`);
    }
  }

  async updateCategoryAndStatus(
    threadId: string,
    category: string,
    statusInput: string,
    email: string,
  ): Promise<{
    status: string;
    userInteractions: any[];
    newBadgesUnlocked: any[];
  }> {
    if (!threadId) {
      return {
        status: 'Email threadId is required for updating.',
        userInteractions: [],
        newBadgesUnlocked: [],
      };
    }

    try {
      if (!threadId) {
        return {
          status: 'No thread associated with this email.',
          userInteractions: [],
          newBadgesUnlocked: [],
        };
      }

      const threadToUpdate = await this.threadModel.findOne({ threadId });
      const mailsInteractionToCheck = await this.mailsInteraction.findOne({
        threadId,
      });

      const account = await this.accountsModel.findOne({ email });

      const user = await this.userModel.findOne({ _id: account.userId });

      let userInteractions = [];
      let newBadgesUnlocked: any[] = [];

      if (!mailsInteractionToCheck && statusInput === 'done') {
        const newMailsInteraction = new this.mailsInteraction({
          threadId,
          userId: user._id,
        });

        await newMailsInteraction.save();

        const userMetrics = await this.userHelpers.getMetricsHelper(user._id);

        const { newBadgesUnlocked: badgesTmp = [] } =
          await this.userHelpers.getBadgesUnlocked(user._id, userMetrics);

        // Ensure newBadgesUnlocked is always an array
        newBadgesUnlocked = Array.isArray(badgesTmp) ? badgesTmp : [];

        userInteractions = await this.userHelpers.watchAchievementsCourtTerme(
          user._id,
        );
      }

      if (!threadToUpdate) {
        return {
          status: 'Thread not found.',
          userInteractions: [],
          newBadgesUnlocked: [],
        };
      }
      // Update the thread's category
      threadToUpdate.initialCategory = threadToUpdate.category;
      threadToUpdate.userCategory = category;
      threadToUpdate.statusInput = statusInput;

      // Save the updated thread
      await threadToUpdate.save();

      return {
        status: 'Thread updated successfully.',
        userInteractions,
        newBadgesUnlocked,
      };
    } catch (err) {
      throw new Error(`Error updating thread: ${err.message}`);
    }
  }

  async updateStatus(
    threadId: string,
    statusInput: string,
    email: string,
  ): Promise<{
    status: string;
    userInteractions: any[];
    newBadgesUnlocked: any[];
  }> {
    if (!threadId) {
      return {
        status: 'Email threadId is required for updating.',
        userInteractions: [],
        newBadgesUnlocked: [],
      };
    }

    try {
      if (!threadId) {
        return {
          status: 'No thread associated with this email.',
          userInteractions: [],
          newBadgesUnlocked: [],
        };
      }

      const threadToUpdate = await this.threadModel.findOne({ threadId });
      const mailsInteractionToCheck = await this.mailsInteraction.findOne({
        threadId,
      });

      const account = await this.accountsModel.findOne({ email });

      const user = await this.userModel.findOne({ _id: account.userId });

      let userInteractions = [];
      let newBadgesUnlocked: any[] = [];

      if (!mailsInteractionToCheck && statusInput === 'done') {
        const newMailsInteraction = new this.mailsInteraction({
          threadId,
          userId: user._id,
        });

        await newMailsInteraction.save();

        const userMetrics = await this.userHelpers.getMetricsHelper(user._id);

        const { newBadgesUnlocked: badgesTmp = [] } =
          await this.userHelpers.getBadgesUnlocked(user._id, userMetrics);

        // Ensure newBadgesUnlocked is always an array
        newBadgesUnlocked = Array.isArray(badgesTmp) ? badgesTmp : [];

        userInteractions = await this.userHelpers.watchAchievementsCourtTerme(
          user._id,
        );
      }

      if (!threadToUpdate) {
        return {
          status: 'Thread not found.',
          userInteractions: [],
          newBadgesUnlocked: [],
        };
      }
      // Update the thread's status
      threadToUpdate.statusInput = statusInput;

      // Save the updated thread
      await threadToUpdate.save();

      return {
        status: 'Thread updated successfully.',
        userInteractions,
        newBadgesUnlocked,
      };
    } catch (err) {
      throw new Error(`Error updating thread: ${err.message}`);
    }
  }

  async getAttachment(
    mailId: string,
    filename: string,
  ): Promise<{ fileData: Buffer; attachment: any }> {
    const mail = await this.emailModel.findOne({ _id: mailId }).exec();
    if (!mail) {
      throw new NotFoundException('Email not found');
    }

    const attachment = mail.attachments.find(
      (att) => att.filename === filename,
    );
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const fileData = Buffer.from(attachment.data, 'base64');

    return { fileData, attachment };
  }

  async deleteThreadMail(oauth2Client: any, threadId: string): Promise<any> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const deliveredTo = userInfo.data.email;

      if (!deliveredTo) {
        throw new InternalServerErrorException(
          'Failed to retrieve authenticated user email.',
        );
      }

      // Make the request to delete the thread in Gmail
      const gmailResponse = await gmail.users.threads.trash({
        userId: 'me', // 'me' refers to the authenticated user
        id: threadId, // Thread ID to be deleted
      });

      // Delete the associated emails from MongoDB
      const emailUpdateResult = await this.emailModel.updateMany(
        { threadId, deliveredTo },
        { $set: { labelIds: ['TRASH'] } }, // Update the labelIds to indicate it's in the trash
      );

      if (emailUpdateResult.modifiedCount === 0) {
        console.log(
          'No emails found to update for the provided threadId and deliveredTo',
        );
      } else {
        console.log(
          `Marked ${emailUpdateResult.modifiedCount} email(s) as trashed in MongoDB for user: ${deliveredTo}`,
        );
      }

      // Return a success message or response
      return {
        message: 'Thread and associated emails successfully deleted',
        gmailStatus: gmailResponse.status,
      };
    } catch (error) {
      console.error('Failed to delete thread:', error);
      throw new InternalServerErrorException('Failed to delete thread.');
    }
  }

  /**
   * Insert the transformed email response into MongoDB
   */
  async saveEmailToDatabase(transformEmailsResponse: any): Promise<Email> {
    try {
      console.log(
        'Saving email to database:',
        JSON.stringify(transformEmailsResponse, null, 2),
      );

      // Create a new document using the email model
      const createdEmail = new this.emailModel(transformEmailsResponse);

      // Save the document to the database
      const savedEmail = await createdEmail.save();

      console.log('Email saved successfully with ID:', savedEmail._id);
      return savedEmail;
    } catch (error) {
      console.error('Error saving email to database:', error);

      // Check for duplicate key error (common in MongoDB)
      if (error.code === 11000) {
        console.error(
          'Duplicate key error. This email might already exist in the database.',
        );
      }

      throw new Error(`Failed to save email to database: ${error.message}`);
    }
  }
}
