import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';

export class TemplateService {
  private templateCache: { [key: string]: HandlebarsTemplateDelegate } = {};

  compileTemplate(templateName: string, data: any): string {
    if (!this.templateCache[templateName]) {
      const templatePath = path.join(
        __dirname,
        `../templates/${templateName}.hbs`,
      );
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      this.templateCache[templateName] = handlebars.compile(templateSource);
    }
    return this.templateCache[templateName](data);
  }
}
