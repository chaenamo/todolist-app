import { readFileSync } from 'node:fs';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';

const SPEC_URL = new URL('../swagger.yaml', import.meta.url);

export function loadApiSpec() {
  return parse(readFileSync(SPEC_URL, 'utf8'));
}

// 개발 환경 전용 API 문서 화면. 운영에는 붙이지 않는다(app.js에서 config.isDev일 때만 호출)
export function mountApiDocs(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(loadApiSpec()));
}
