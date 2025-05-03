import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/users.schema';
import { ProfileType } from './schemas/profileType.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('getProfileTypes')
  async getProfileTypes(): Promise<ProfileType[]> {
    return this.usersService.getProfileTypes();
  }

  @Post('setProfileType')
  async setProfileType(
    @Body('userEmail') userEmail: string,
    @Body('profileTypeName') profileTypeName: string,
  ): Promise<User> {
    return this.usersService.setProfileType(userEmail, profileTypeName);
  }

  @Post('addCategory')
  async addCategory(
    @Body('userEmail') userEmail: string,
    @Body('categoryName') categoryName: string,
    @Body('categoryDescription') categoryDescription: string,
    @Body('categoryColor') categoryColor: string,
    @Body('categoryDisplayName') categoryDisplayName: string,
  ): Promise<User> {
    return this.usersService.addCategory(
      userEmail,
      categoryName,
      categoryDescription,
      categoryColor,
      categoryDisplayName,
    );
  }

  @Post('disableCategory')
  async disableCategory(
    @Body('userEmail') userEmail: string,
    @Body('categoryName') categoryName: string,
  ): Promise<User> {
    return this.usersService.disableCategory(userEmail, categoryName);
  }

  @Get('tagMapping/:userEmail')
  async getUserTagMapping(
    @Param('userEmail') userEmail: string,
  ): Promise<User> {
    return this.usersService.getUserTagMapping(userEmail);
  }

  @Get('email_contacts/:userEmail')
  async getEmailContacts(@Param('userEmail') userEmail: string): Promise<any> {
    return this.usersService.getEmailContacts(userEmail);
  }

  @Post('generateCategories')
  async generateCategories(
    @Body('userEmail') userEmail: string,
    @Body('categories') categories: [string],
    @Body('userDescription') userDescription: string,
  ): Promise<any> {
    return this.usersService.generateCategoriesForUser(
      userEmail,
      categories,
      userDescription,
    );
  }

  @Post('updateCategories')
  async updateCategories(
    @Body('userEmail') userEmail: string,
    @Body('categories') categories: [string],
  ): Promise<any> {
    return this.usersService.updateCategories(userEmail, categories);
  }

  @Post('user_contact')
  async user_contact(@Body() body: any): Promise<any> {
    return this.usersService.user_contact(body);
  }

  @Post('add_search')
  async add_search(@Body() body: any): Promise<any> {
    return this.usersService.add_search(body);
  }

  @Get('search_suggestion')
  async search_suggestion(@Query('userEmail') userEmail: string): Promise<any> {
    return this.usersService.getMostUsedSearch(userEmail);
  }

  @Get('user_metrics')
  async user_metrics(@Query('userEmail') userEmail: string): Promise<any> {
    return this.usersService.getMetrics(userEmail);
  }
}
