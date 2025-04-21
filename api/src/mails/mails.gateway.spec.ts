import { Test, TestingModule } from '@nestjs/testing';
import { MailsGateway } from './mails.gateway';

describe('MailsGateway', () => {
  let gateway: MailsGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailsGateway],
    }).compile();

    gateway = module.get<MailsGateway>(MailsGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
