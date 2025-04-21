import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const corsOptions = {
    origin: [
      configService.get<string>('FRONT_URL'),
      'https://dev.melify.fr',
      'https://staging.melify.fr',
      'https://app.melify.fr',
    ],
    credentials: true,
  };

  app.enableCors(corsOptions);
  app.setGlobalPrefix('api'); // Set global prefix
  app.use(cookieParser());

  // Increase the body size limit
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  await app.listen(8080);
}
bootstrap();
