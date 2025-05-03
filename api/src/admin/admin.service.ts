import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/users.schema';
import { Accounts } from 'src/users/schemas/accounts.schema';
import { Email } from '../mails/schemas/emails.schema';
import * as moment from 'moment';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Email.name) private readonly emailModel: Model<Email>,
    @InjectModel(Accounts.name) private readonly accountsModel: Model<Accounts>,
  ) {}

  async getNbEmailsPerDay(pastDays: number): Promise<any> {
    const accounts = await this.accountsModel.find().exec();
    const accountEmailCounts = [];

    const ninetyDaysAgo = new Date(Date.now() - pastDays * 24 * 60 * 60 * 1000);

    for (const account of accounts) {
      const emailRegex = new RegExp(
        `\\b${account.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i',
      );

      const emailCountsByDate = await this.emailModel.aggregate([
        {
          $match: {
            to: { $regex: emailRegex },
            labelIds: { $in: ['INBOX'] },
            createdAt: { $ne: null, $gte: ninetyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              email: '$to',
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id.date',
            email: '$_id.email',
            count: '$count',
          },
        },
        { $sort: { date: 1 } },
      ]);

      accountEmailCounts.push({
        user: account.email,
        counts: emailCountsByDate,
      });
    }

    const normalizedAccountsEmailCounts = accountEmailCounts.map(
      (accountEmailCount) => {
        const dateCounts = {};
        accountEmailCount.counts.forEach(({ date, email, count }) => {
          const EMAIL = this.extractEmail(email);
          if (!dateCounts[date]) {
            dateCounts[date] = {};
          }
          if (!dateCounts[date][EMAIL]) {
            dateCounts[date][EMAIL] = 0;
          }
          dateCounts[date][EMAIL] += count;
        });

        const counts = Object.entries(dateCounts).flatMap(([date, emails]) =>
          Object.entries(emails).map(([email, count]) => ({
            date,
            email,
            count,
          })),
        );

        return {
          user: accountEmailCount.user,
          counts,
        };
      },
    );

    const { series, categories } = this.transformToSeriesFormat(
      normalizedAccountsEmailCounts,
    );
    return { series, categories };
  }

  async getCategoryPerEmail(): Promise<any> {
    const emailCounts = await this.emailModel.aggregate([
      {
        $match: {
          category: { $ne: null }, // Exclude documents with null category
        },
      },
      {
        $group: {
          _id: '$category', // Group by category field
          count: { $sum: 1 }, // Count each occurrence
        },
      },
      {
        $sort: { count: -1 }, // Sort by count in descending order
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          count: 1,
        },
      },
    ]);

    const seriesData = {
      name: 'Email Count',
      data: emailCounts.map((item) => item.count),
    };
    const categories = emailCounts.map((item) => item.category);

    return {
      series: [seriesData],
      categories: categories,
    };
  }

  async getEmailStats(): Promise<any> {
    // Calculate the start date for 7 weeks ago
    const startDate = moment().subtract(7, 'weeks').startOf('week').toDate();

    // Aggregation pipeline for the last 7 weeks
    const emailStats = await this.emailModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }, // Match emails created within the last 7 weeks
        },
      },
      {
        $group: {
          _id: {
            week: { $isoWeek: '$createdAt' },
            year: { $isoWeekYear: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': -1, '_id.week': -1 }, // Sort by year and week in descending order
      },
      {
        $limit: 7, // Limit to the last 7 weeks
      },
      {
        $project: {
          _id: 0,
          count: 1,
        },
      },
    ]);

    // Get total count of emails
    const totalEmails = await this.emailModel.countDocuments();

    // Extract counts and reverse the order
    const emailCounts = emailStats.map((stat) => stat.count).reverse();

    // Calculate total emails for the last week
    const startOfWeek = moment().subtract(1, 'week').startOf('week').toDate();
    const totalEmailsLastWeek = await this.emailModel.countDocuments({
      createdAt: { $gte: startOfWeek },
    });

    // Calculate total emails for each of the last 3 months
    const totalEmailsLast3Months = await Promise.all(
      [0, 1, 2, 3].map(async (monthOffset) => {
        const startOfMonth = moment()
          .subtract(monthOffset, 'months')
          .startOf('month')
          .toDate();
        const endOfMonth = moment()
          .subtract(monthOffset - 1, 'months')
          .startOf('month')
          .toDate();
        return await this.emailModel.countDocuments({
          createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        });
      }),
    );

    totalEmailsLast3Months.reverse();

    const totalEmailsLastMonth =
      totalEmailsLast3Months[totalEmailsLast3Months.length - 1];

    return {
      total: totalEmails,
      series: emailCounts,
      totalEmailsLastMonth,
      totalEmailsLastWeek,
      totalEmailsLast3Months,
    };
  }

  async getUserDetails(): Promise<any> {
    const accounts = await this.accountsModel.find().exec();
    return accounts.map((account) => ({
      email: account.email,
      name: 'test',
      lastconnection: account.lastConnection,
    }));
  }

  private extractEmail(str: string): string {
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const match = str.match(emailRegex);
    return match ? match[0].toLowerCase() : '';
  }

  private transformToSeriesFormat(data: any): {
    series: any[];
    categories: any;
  } {
    const allDates = [
      ...new Set(
        data.flatMap((user) => user.counts.map((count) => count.date)),
      ),
    ];
    allDates.sort();

    const series = data.map((userEmailCount) => ({
      name: userEmailCount.user,
      data: allDates.map((date) => {
        const countObj = userEmailCount.counts.find(
          (count) => count.date === date,
        );
        return countObj ? countObj.count : 0;
      }),
    }));

    return { series, categories: allDates };
  }
}
