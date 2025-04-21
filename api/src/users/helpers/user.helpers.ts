import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '../schemas/users.schema';
import { ProfileType } from '../schemas/profileType.schema';
import { Subscription } from '../schemas/subscription.schema'; // Adjust import path as necessary
import { MailsInteraction } from 'src/mails/schemas/mailsinteraction.schema';
import { Thread } from 'src/mails/schemas/thread.schema';
import { Badge } from '../schemas/badge.schema';
import { google } from 'googleapis';
import axios from 'axios';

@Injectable()
export class UserHelpers {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(ProfileType.name) private profileTypeModel: Model<ProfileType>,
    @InjectModel(MailsInteraction.name)
    private mailsInteractionModel: Model<MailsInteraction>,
    @InjectModel(Thread.name)
    private threadModel: Model<Thread>,
    @InjectModel(Badge.name) private badgeModel: Model<Badge>,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>, // Adjust the path if necessary
    private configService: ConfigService,
  ) {}

  async createUser(user: {
    firstName: string;
    email: string;
    photo: string;
    profileType: any;
  }): Promise<User> {
    try {
      if (!user.firstName || !user.email) {
        throw new Error('User must have a first name and email.');
      }

      const newUser = new this.userModel({
        name: user.firstName,
        email: user.email,
        picture: user.photo,
        from: 'google',
        profileType: user.profileType._id,
      });

      await newUser.save();

      console.log('User created successfully:', newUser);

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async checkUserExists(email: string): Promise<boolean> {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (user) {
        console.log('User exists:', user);
        return true; // User exists
      } else {
        console.log('User does not exist');
        return false; // User does not exist
      }
    } catch (error) {
      console.error('Error checking user existence:', error);
      throw error; // Or handle it as appropriate
    }
  }

  async setupGmailWatch(userId: any, accessToken: string): Promise<any> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    console.log(this.configService.get<string>('TOPICNAME'));
    try {
      const response = await gmail.users.watch({
        userId: 'me', // or the actual user's email address
        requestBody: {
          // Replace with your actual topic name
          topicName: this.configService.get<string>('TOPICNAME'),
          labelIds: ['INBOX'], // Optional: specify specific labels to watch
        },
      });

      const newSubscription = new this.subscriptionModel({
        userId,
        historyId: response.data.historyId,
        expiration: response.data.expiration,
      });
      await newSubscription.save();

      console.log('Watch request setup successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to set up watch request:', error);
      throw error; // Or handle it as appropriate
    }
  }

  async retrieve30daysEmail(user_email: string): Promise<any> {
    try {
      let retrieveEmailUrl: string =
        this.configService.get<string>('LAST30DAYS');

      const isDevelopment =
        this.configService.get<string>('NODE_ENV') !== 'production';

      if (isDevelopment) {
        retrieveEmailUrl = 'http://localhost:8082';
      }

      const response = await axios.post(
        retrieveEmailUrl, // Replace with your Cloud Function URL
        { user_email }, // Sending the email as JSON in the body
        {
          headers: {
            'Content-Type': 'application/json', // Ensure content type is JSON
          },
        },
      );

      // Check if the response is successful
      if (response.status === 200) {
        const responseData = response.data;
        console.log('Cloud Function response:', responseData);

        // Handle the response data, which should contain email information
        const emails = responseData.emails; // Example data extraction
        console.log('Emails retrieved:', responseData.email_processed);

        return emails; // Return the retrieved emails
      } else {
        console.error('Unexpected response status:', response.status);
      }
    } catch (error) {
      console.error('Error calling Cloud Function:', error.message);
      throw error; // Rethrow the error for further handling
    }
  }

  async retrieveEmailByLabels(user_email: string): Promise<any> {
    try {
      let retrieveEmailByLabelsUrl: string = this.configService.get<string>(
        'RETRIEVEEMAILBYLABELS',
      );

      const isDevelopment =
        this.configService.get<string>('NODE_ENV') !== 'production';

      if (isDevelopment) {
        retrieveEmailByLabelsUrl = 'http://localhost:8083';
      }

      const response = await axios.post(
        retrieveEmailByLabelsUrl, // Replace with your Cloud Function URL
        { user_email }, // Sending the email as JSON in the body
        {
          headers: {
            'Content-Type': 'application/json', // Ensure content type is JSON
          },
        },
      );

      // Check if the response is successful
      if (response.status === 200) {
        const responseData = response.data;
        console.log('Cloud Function response:', responseData);

        return responseData;
      } else {
        console.error('Unexpected response status:', response.status);
      }
    } catch (error) {
      console.error('Error calling Cloud Function:', error.message);
      throw error; // Rethrow the error for further handling
    }
  }

  async watchAchievementsCourtTerme(userId: any): Promise<any> {
    try {
      console.log('Watching achievements for user:', userId);

      // Get the start and end of the current day
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0); // Set time to 00:00:00
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999); // Set time to 23:59:59

      // Query total interactions
      const totalInteractions = await this.mailsInteractionModel
        .countDocuments({ userId })
        .exec();

      // Query today's interactions directly in the database
      const todayInteractions = await this.mailsInteractionModel
        .countDocuments({
          userId,
          createdAt: { $gte: startOfDay, $lte: endOfDay },
        })
        .exec();

      const user = await this.userModel.findById(userId).populate('badgesList');
      const countUserBadges = user.badgesList.length;

      console.log('Total interactions:', totalInteractions);
      console.log('Today interactions:', todayInteractions);

      const totalMessage = {
        toastMessage: '',
        badgeName: '',
        badgeDetails: {
          hex: '',
        },
        type: '',
        levelNumber: 0,
      };
      switch (totalInteractions) {
        case 1:
          totalMessage.toastMessage =
            "Welcome aboard! You're officially an Inbox Explorer. Let's conquer your emails together!";
          totalMessage.badgeName = 'Inbox Explorer';
          totalMessage.badgeDetails = {
            hex: '#A8E6A3',
          };
          totalMessage.type = 'level';
          totalMessage.levelNumber = 1;
          break;
        case 100:
          totalMessage.toastMessage =
            "Fantastic! You're mastering your emails one by one. You've earned the title of Email Wrangler!";
          totalMessage.badgeName = 'Email Wrangler';
          totalMessage.badgeDetails = {
            hex: '#66BB6A',
          };
          totalMessage.type = 'level';
          totalMessage.levelNumber = 3;
          break;
        case 500:
          totalMessage.toastMessage =
            'Wow! Your inbox listens to you now. Congratulations on becoming an Inbox Whisperer!';
          totalMessage.badgeName = 'Inbox Whisperer';
          totalMessage.badgeDetails = {
            hex: '#66BB6A',
          };
          totalMessage.type = 'level';
          totalMessage.levelNumber = 5;
          break;
        case 1000:
          totalMessage.toastMessage =
            "Ace unlocked! Your inbox doesn't stand a chance against your efficiency. Welcome, Efficiency Ace!";
          totalMessage.badgeName = 'Efficiency Ace';
          totalMessage.badgeDetails = {
            hex: '#66BB6A',
          };
          totalMessage.type = 'level';
          totalMessage.levelNumber = 7;
          break;
        case 2000:
          totalMessage.toastMessage =
            "You've conquered the inbox battlefield! Action Conqueror status unlocked—take a bow!";
          totalMessage.badgeName = 'Action Conqueror';
          totalMessage.badgeDetails = {
            hex: '#66BB6A',
          };
          totalMessage.type = 'level';
          totalMessage.levelNumber = 9;
          break;
        case 5000:
          totalMessage.toastMessage =
            "Legend achieved! You're now a Productivity Titan. Your email mastery is unmatched. Bravo!";
          totalMessage.badgeName = 'Productivity Titan';
          totalMessage.badgeDetails = {
            hex: '#66BB6A',
          };
          totalMessage.type = 'level';
          totalMessage.levelNumber = 10;
          break;
      }

      switch (countUserBadges) {
        case 5:
          totalMessage.toastMessage =
            "Great work! You've tamed your first tasks. Welcome to Task Tamer status!";
          totalMessage.badgeName = 'Task Tamer';
          totalMessage.badgeDetails = {
            hex: '#66BB6A',
          };
          totalMessage.type = 'level';
          totalMessage.levelNumber = 2;
        case 10:
          totalMessage.toastMessage =
            'Impressive progress! Order is within your grasp—welcome to the Order Seeker club!';
          totalMessage.badgeName = 'Order Seeker';
          totalMessage.badgeDetails = {
            hex: '#66BB6A',
          };
          totalMessage.type = 'level';
          totalMessage.levelNumber = 4;
        case 20:
          totalMessage.toastMessage =
            'Magic in motion! Your productivity skills have leveled up to Workflow Sorcerer. Keep the spells coming!';
          totalMessage.badgeName = 'Workflow Sorcerer';
          totalMessage.badgeDetails = {
            hex: '#66BB6A',
          };
          totalMessage.type = 'level';
          totalMessage.levelNumber = 6;
        case 50:
          totalMessage.toastMessage =
            "Salute to you! You've risen to Email Commander. Your inbox is under complete control.";
          totalMessage.badgeName = 'Email Commander';
          totalMessage.badgeDetails = {
            hex: '#66BB6A',
          };
          totalMessage.type = 'level';
          totalMessage.levelNumber = 8;
      }

      if (totalMessage.badgeName !== '') {
        user.levelNumber = totalMessage.levelNumber;
        user.levelTitle = totalMessage.badgeName;
        await user.save();
      }

      return totalMessage;
    } catch (error) {
      console.error('Error calling watchAchievements:', error.message);
      throw error; // Rethrow the error for further handling
    }
  }

  async getMetricsHelper(userId: any): Promise<any> {
    const mailsInteractionToCheck = await this.mailsInteractionModel
      .find({ userId })
      .sort({ createdAt: 1 }); // Ensure sorted by createdAt in ascending order

    // Initialize metrics
    let taskCompletion = 0;
    let productivityStreak = 0;
    const speedTasks = {
      lastThreeUnder20Minutes: 0,
      lastFiveUnder40Minutes: 0,
      lastEightUnder60Minutes: 0,
    };
    let emailCategorization = 0;
    const toDoListsCleared = 0;
    const socialShares = 0;
    const tasksFromEmails = 0;

    const now = new Date(); // Current time

    // Productivity Streak logic
    const interactionDates = mailsInteractionToCheck.map(
      (interaction) =>
        new Date(interaction.createdAt).toISOString().split('T')[0],
    );

    const uniqueDays = Array.from(new Set(interactionDates)).sort();
    let currentStreak = 0;
    let maxStreak = 0;

    for (let i = 0; i < uniqueDays.length; i++) {
      const currentDay = new Date(uniqueDays[i]);
      const nextDay = new Date(uniqueDays[i + 1] || '');

      if (nextDay.getTime() - currentDay.getTime() === 24 * 60 * 60 * 1000) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak + 1);
        currentStreak = 0;
      }
    }
    productivityStreak = Math.max(maxStreak, currentStreak + 1);

    // Speed Tasks logic
    const last20MinutesInteractions = mailsInteractionToCheck.filter(
      (interaction) =>
        now.getTime() - new Date(interaction.createdAt).getTime() <=
        20 * 60 * 1000,
    );

    const last40MinutesInteractions = mailsInteractionToCheck.filter(
      (interaction) =>
        now.getTime() - new Date(interaction.createdAt).getTime() <=
        40 * 60 * 1000,
    );

    const last60MinutesInteractions = mailsInteractionToCheck.filter(
      (interaction) =>
        now.getTime() - new Date(interaction.createdAt).getTime() <=
        60 * 60 * 1000,
    );

    if (last20MinutesInteractions.length >= 3) {
      speedTasks.lastThreeUnder20Minutes++;
    }

    if (last40MinutesInteractions.length >= 5) {
      speedTasks.lastFiveUnder40Minutes++;
    }

    if (last60MinutesInteractions.length >= 8) {
      speedTasks.lastEightUnder60Minutes++;
    }

    // Increment taskCompletion
    taskCompletion = mailsInteractionToCheck.filter((interaction) =>
      interaction.threadId ? true : false,
    ).length;

    // Email Categorization logic
    const threadIds = mailsInteractionToCheck.map(
      (interaction) => interaction.threadId,
    );
    const threads = await this.threadModel.find({
      threadId: { $in: threadIds },
    });

    emailCategorization = threads.reduce((count, thread) => {
      if (thread.userCategory && thread.userCategory.trim() !== '') {
        count++;
      }
      return count;
    }, 0);

    // Return calculated metrics
    return {
      metrics: {
        taskCompletion,
        productivityStreak,
        speedTasks,
        emailCategorization,
        toDoListsCleared,
        socialShares,
        tasksFromEmails,
      },
    };
  }

  async getBadgesUnlocked(userId: any, userMetrics: any): Promise<any> {
    const user = await this.userModel.findById(userId).populate('badgesList');
    const currentBadges = user.badgesList.map((badge: any) => ({
      metric: badge.metric,
      metricStep: badge.metricStep,
    }));
    const currentBadgeIds = user.badgesList.map((badge: any) =>
      badge._id.toString(),
    );

    const allBadges = await this.badgeModel.find();

    // Check and unlock badges
    const newBadges = [];
    for (const badge of allBadges) {
      // Get the current metric value from userMetrics
      const metricValue = badge.metric
        .split('.')
        .reduce((acc, key) => acc && acc[key], userMetrics.metrics);

      // Check if the badge criteria are met and not already unlocked
      const alreadyUnlocked = currentBadges.some(
        (currentBadge) =>
          currentBadge.metric === badge.metric &&
          currentBadge.metricStep >= badge.metricStep,
      );

      if (metricValue >= badge.metricStep && !alreadyUnlocked) {
        // Avoid adding duplicate badge IDs
        if (!currentBadgeIds.includes(badge._id.toString())) {
          newBadges.push(badge._id);
        }
      }
    }

    // Update user's badges list
    if (newBadges.length > 0) {
      user.badgesList = [...new Set([...user.badgesList, ...newBadges])]; // Ensure uniqueness
      await user.save();
    }

    // Populate new badges with details for the return object
    const newBadgesDetails = await this.badgeModel
      .find({ _id: { $in: newBadges } })
      .exec();

    return {
      newBadgesUnlocked: newBadgesDetails.length > 0 ? newBadgesDetails : [],
      currentBadges: await this.userModel
        .findById(userId)
        .populate('badgesList')
        .exec(),
    };
  }
}
