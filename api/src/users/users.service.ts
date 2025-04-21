import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { User } from './schemas/users.schema';
import { ProfileType } from './schemas/profileType.schema';
import { Email } from '../mails/schemas/emails.schema';
import { Token } from '../auth/schemas/tokens.schema'; // Adjust import path as necessary
import { Contact } from './schemas/contact.schema';
import { Search } from './schemas/search.schema';

import { UserHelpers } from './helpers/user.helpers';

import {
  extractEmails,
  extractSingleEmail,
} from '../mails/helpers/email.helpers';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(ProfileType.name) private profileTypeModel: Model<ProfileType>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Email.name) private readonly emailModel: Model<Email>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    @InjectModel(Contact.name) private contactModel: Model<Contact>,
    @InjectModel(Search.name) private searchModel: Model<Search>,
    private readonly userHelpers: UserHelpers, // Inject the helper
  ) {}

  async getProfileTypes(): Promise<ProfileType[]> {
    try {
      return await this.profileTypeModel.find().exec();
    } catch (error) {
      throw new InternalServerErrorException('Error retrieving profile types');
    }
  }

  async setProfileType(
    userEmail: string,
    profileTypeName: string,
  ): Promise<User> {
    if (!userEmail || !profileTypeName) {
      throw new BadRequestException('Missing userEmail or profileTypeName');
    }

    const profileType = await this.profileTypeModel.findOne({
      jobName: profileTypeName,
    });
    if (!profileType) {
      throw new NotFoundException('Profile type not found');
    }

    const updatedUser = await this.userModel.findOneAndUpdate(
      { email: userEmail },
      { $set: { profileType: profileType._id } },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async addCategory(
    userEmail: string,
    categoryName: string,
    categoryDescription: string,
    categoryColor: string,
    categoryDisplayName: string,
  ): Promise<any> {
    if (!userEmail) {
      throw new BadRequestException('Missing userEmail');
    }

    const user = await this.userModel.findOne({ email: userEmail });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profileType = await this.profileTypeModel.findOne({
      _id: user.profileType,
    });
    if (!profileType) {
      throw new NotFoundException('Profile type not found');
    }

    profileType.categories.push({
      name: categoryName,
      description: categoryDescription,
      color: categoryColor,
      displayName: categoryDisplayName,
      disable: false,
    });

    await profileType.save();
    return profileType;
  }

  async disableCategory(userEmail: string, categoryName: string): Promise<any> {
    if (!userEmail) {
      throw new BadRequestException('Missing userEmail');
    }

    const user = await this.userModel.findOne({ email: userEmail });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profileType = await this.profileTypeModel.findOne({
      _id: user.profileType,
    });
    if (!profileType) {
      throw new NotFoundException('Profile type not found');
    }

    const category = profileType.categories.find(
      (category) => category.name === categoryName,
    );
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    category.disable = true;

    await profileType.save();
    return profileType;
  }

  async getUserTagMapping(userEmail: string): Promise<any> {
    if (!userEmail) {
      throw new BadRequestException('Missing userEmail');
    }

    const user = await this.userModel.findOne({ email: userEmail });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profileType = await this.profileTypeModel.findOne({
      _id: user.profileType,
    });
    if (!profileType) {
      throw new NotFoundException('Profile type not found');
    }

    let tagMapping = {};
    for (const category of profileType.categories) {
      tagMapping[category.name.toLowerCase()] = {
        name: category.displayName,
        bgcolor: category.color,
        color: 'grey.200',
        disable: category.disable,
      };
    }

    tagMapping['other'] = {
      bgcolor: '#40E0D0',
      color: '#40E0D0',
      name: 'other',
    };

    tagMapping['draft'] = {
      bgcolor: '#827ded',
      color: '#827ded',
      name: 'other',
    };

    // tagMapping['notifications/promotions'] = {
    //   bgcolor: '#919EAB',
    //   color: 'grey.200',
    //   name: 'Notifications/Promotions',
    // };

    return tagMapping;
  }

  async getEmailContacts(userEmail: String): Promise<{ contacts: string[] }> {
    try {
      const emailRegex = new RegExp(`.*${userEmail}.*`, 'i'); // 'i' for case-insensitivity

      const emails = await this.emailModel
        .aggregate(
          [
            {
              $match: {
                $or: [
                  { from: { $regex: emailRegex } },
                  { to: { $regex: emailRegex } },
                ],
              },
            },
            { $sort: { date: -1 } },
            { $limit: 2000 },
            {
              $project: {
                from: 1,
                to: 1,
              },
            },
          ],
          { allowDiskUse: true },
        )
        .exec();

      const contacts = [];

      // Extract emails from 'from' and 'to' fields
      for (const email of emails) {
        const fromEmails = extractSingleEmail(email.from);
        const toEmails = extractSingleEmail(email.to);
        contacts.push(...fromEmails, ...toEmails);
      }

      // const extractedContacts = extractEmails(contacts);

      // Remove duplicates while maintaining order
      const uniqueContacts = [...new Set(contacts)];

      // const fromContacts = await this.emailModel.distinct('from').exec();
      // const toContacts = await this.emailModel.distinct('to').exec();

      // const rawContacts = Array.from(
      //   new Set([...fromContacts, ...toContacts]),
      // ).sort();

      // const extractedContacts = extractEmails(rawContacts);

      // const uniqueContacts = Array.from(new Set(extractedContacts));

      return { contacts: uniqueContacts };
    } catch (err) {
      throw new Error(`Error fetching email contacts: ${err.message}`);
    }
  }

  async generateCategoriesForUser(
    userEmail: string,
    categories: [any],
    userDescription: string,
  ): Promise<any> {
    if (!userEmail || !categories) {
      throw new BadRequestException('Missing userEmail');
    }

    const user = await this.userModel.findOne({ email: userEmail });
    const tokens = await this.tokenModel.findOne({ userId: user._id });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.profileType) {
      throw new BadRequestException('Profile type already set');
    }

    const newProfileType = new this.profileTypeModel({
      description: userDescription,
      categories: categories.map((category) => ({
        name: category.category,
        description: '',
        color: category.hexColor,
        displayName: category.category,
        disable: false,
      })),
    });

    await newProfileType.save();

    user.profileType = newProfileType._id as Types.ObjectId;

    await user.save();

    await this.userHelpers.setupGmailWatch(user._id, tokens.accessToken);
    this.userHelpers.retrieve30daysEmail(user.email);

    return newProfileType;
  }

  async updateCategories(userEmail: string, categories: [any]): Promise<any> {
    if (!userEmail || !categories) {
      throw new BadRequestException('Missing userEmail');
    }

    const user = await this.userModel.findOne({ email: userEmail });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profileType) {
      throw new BadRequestException('Not profileType found');
    }

    const profileType = await this.profileTypeModel
      .findOne({
        _id: user.profileType,
      })
      .lean();

    if (!profileType) {
      throw new NotFoundException('Profile type not found');
    }

    const newCategories = categories.map((category) => ({
      ...category,
      displayName: category.name,
      disable: category.disable || false,
      description: category.description || '',
      color: category.color,
    }));

    // // Create a Set for new category names for quick lookup
    // const newCategoryNames = new Set(newCategories.map((cat) => cat.name));

    // 1. Update the old categories: Disable categories missing in new array
    const updatedCategories = profileType.categories.map((oldCategory) => {
      const matchingNewCategory = newCategories.find(
        (newCategory) => newCategory.name === oldCategory.name,
      );

      if (!matchingNewCategory) {
        // If the old category is not in the new categories, disable it
        return { ...oldCategory, disable: true };
      }

      // Update properties if the category exists in newCategories
      return {
        ...oldCategory,
        color: matchingNewCategory.color,
        description: matchingNewCategory.description || oldCategory.description,
        disable: matchingNewCategory.disable, // Update disable state if present in newCategories
      };
    });

    // 2. Add new categories: Add categories in the new array that are not in the old array
    newCategories.forEach((newCategory) => {
      const exists = profileType.categories.some(
        (oldCategory) => oldCategory.name === newCategory.name,
      );
      if (!exists) {
        // Add the new category if it doesn't already exist
        updatedCategories.push({
          name: newCategory.name,
          description: newCategory.description || '',
          color: newCategory.color,
          displayName: newCategory.name,
          disable: false, // New categories should not be disabled
        });
      }
    });

    profileType.categories = updatedCategories;

    // Update the profileType document in the database
    await this.profileTypeModel.updateOne(
      { _id: user.profileType },
      { $set: { categories: updatedCategories } },
    );

    return updatedCategories;
  }

  async user_contact(body: any): Promise<any> {
    const newContact = new this.contactModel(body);
    await newContact.save();
    return newContact;
  }

  async add_search(body: any): Promise<any> {
    const { searchText, userEmail } = body;

    const user = await this.userModel.findOne({ email: userEmail });

    if (!user) {
      throw new Error('User not found');
    }

    // Create the new search document
    const newSearch = new this.searchModel({
      userId: user._id, // Insert the ObjectId of the user
      searchText: searchText,
    });

    // Save the new search document
    await newSearch.save();

    return newSearch;
  }

  async getMostUsedSearch(email: string): Promise<any> {
    // Find the user by email
    const user = await this.userModel.findOne({ email });

    // Check if the user exists
    if (!user) {
      throw new Error('User not found');
    }

    const userId = user._id;

    // Aggregate searches to find the most used search for the user
    const mostUsedSearch = await this.searchModel.aggregate([
      { $match: { userId } }, // Filter by userId
      { $group: { _id: '$searchText', count: { $sum: 1 } } }, // Group by searchText and count occurrences
      { $sort: { count: -1 } }, // Sort by count in descending order
      { $limit: 3 }, // Get the top result
    ]);

    // If no searches are found
    if (!mostUsedSearch.length) {
      return { message: 'No searches found for this user' };
    }

    // Return the most used search
    return mostUsedSearch.map((search, index) => ({
      name: `${search._id}`,
      description: `${search._id}`,
      id: index + 1, // Dynamic ID based on rank
    }));
  }

  async getMetrics(email: string): Promise<any> {
    const user = await this.userModel.findOne({ email });

    // Check if the user exists
    if (!user) {
      throw new Error('User not found');
    }

    const userId = user._id;

    const metrics = await this.userHelpers.getMetricsHelper(userId);

    const { newBadgesUnlocked, currentBadges } =
      await this.userHelpers.getBadgesUnlocked(userId, metrics);

    console.log('newBadgesUnlocked', newBadgesUnlocked);
    console.log('currentBadges', currentBadges);
    return metrics;
  }
}
