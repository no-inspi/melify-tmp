import { Controller, Get, Res, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Response } from 'express';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('nb_emails_per_day')
  async getNbEmailsPerDay(
    @Res() res: Response,
    @Query('numberofdays') numberofdays: number,
  ): Promise<void> {
    try {
      const result = await this.adminService.getNbEmailsPerDay(numberofdays);
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Get('category_per_email')
  async getCategoryPerEmail(@Res() res: Response): Promise<void> {
    try {
      const result = await this.adminService.getCategoryPerEmail();
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Get('email_stats')
  async getEmailStats(@Res() res: Response): Promise<void> {
    try {
      const result = await this.adminService.getEmailStats();
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  @Get('user_details')
  async getUserDetails(@Res() res: Response): Promise<void> {
    try {
      const result = await this.adminService.getUserDetails();
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
