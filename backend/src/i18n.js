// BE-13: 에러 응답 문구 다국어. 코드에는 한국어 원문을 쓰고 응답 직전에 번역한다(PQ-06)
export const LOCALES = ['ko', 'ja', 'en'];
const DEFAULT_LOCALE = 'ko';

// 원문 → [ja, en]. 새 에러 문구를 추가하면 여기에도 추가한다(test/i18n.test.js가 누락을 잡는다)
const MESSAGES = {
  '찾을 수 없습니다': ['見つかりません', 'Not found'],
  '로그인이 필요합니다': ['ログインが必要です', 'Login required'],
  '다시 로그인해 주세요': ['もう一度ログインしてください', 'Please log in again'],
  '이메일 또는 비밀번호가 올바르지 않습니다': [
    'メールアドレスまたはパスワードが正しくありません',
    'Incorrect email or password',
  ],
  '이미 사용 중인 이메일입니다': ['このメールアドレスは既に使用されています', 'This email is already in use'],
  '이미 있는 이름입니다': ['この名前は既に存在します', 'This name already exists'],
  '이미 존재하는 데이터입니다': ['既に存在するデータです', 'This data already exists'],
  '다른 변경과 충돌했습니다. 다시 시도해 주세요': [
    '他の変更と競合しました。もう一度お試しください',
    'Conflicted with another change. Please try again',
  ],
  '요청 본문이 올바른 JSON이 아닙니다': [
    'リクエスト本文が正しいJSONではありません',
    'Request body is not valid JSON',
  ],
  '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요': [
    '一時的なエラーが発生しました。しばらくしてからもう一度お試しください',
    'A temporary error occurred. Please try again later',
  ],
  '입력값을 확인해 주세요': ['入力内容を確認してください', 'Please check your input'],
  '필수 입력 항목입니다': ['必須項目です', 'This field is required'],
  '이메일을 입력하세요': ['メールアドレスを入力してください', 'Enter your email'],
  '이메일 형식이 올바르지 않습니다': ['メールアドレスの形式が正しくありません', 'Invalid email format'],
  '비밀번호를 입력하세요': ['パスワードを入力してください', 'Enter your password'],
  '현재 비밀번호를 입력하세요': ['現在のパスワードを入力してください', 'Enter your current password'],
  '현재 비밀번호가 올바르지 않습니다': ['現在のパスワードが正しくありません', 'Current password is incorrect'],
  'refresh token이 필요합니다': ['リフレッシュトークンが必要です', 'Refresh token is required'],
  '올바른 id가 아닙니다': ['正しいIDではありません', 'Invalid id'],
  '1 이상의 정수여야 합니다': ['1以上の整数である必要があります', 'Must be an integer of 1 or more'],
  'true 또는 false여야 합니다': ['true または false である必要があります', 'Must be true or false'],
  '문자열이어야 합니다': ['文字列である必要があります', 'Must be a string'],
  '날짜 형식이 올바르지 않습니다(YYYY-MM-DD)': [
    '日付の形式が正しくありません(YYYY-MM-DD)',
    'Invalid date format (YYYY-MM-DD)',
  ],
  '종료일자는 시작일자 이후여야 합니다': [
    '終了日は開始日以降にしてください',
    'End date must be on or after the start date',
  ],
  '종료일은 시작일 이후여야 합니다': [
    '終了日は開始日以降にしてください',
    'End date must be on or after the start date',
  ],
  '카테고리를 찾을 수 없습니다': ['カテゴリが見つかりません', 'Category not found'],
  '허용되지 않는 필드입니다': ['許可されていないフィールドです', 'This field is not allowed'],
  '올바른 상태 값이 아닙니다': ['正しいステータス値ではありません', 'Invalid status value'],
  "'기본' 카테고리는 변경하거나 삭제할 수 없습니다": [
    '「デフォルト」カテゴリは変更・削除できません',
    "The 'Default' category cannot be changed or deleted",
  ],
};

// 숫자가 들어간 문구: [원문 패턴, ja, en]
const PATTERNS = [
  [/^(\d+)자 이하로 입력하세요$/, (n) => `${n}文字以内で入力してください`, (n) => `Enter ${n} characters or fewer`],
  [
    /^비밀번호는 (\d+)~(\d+)자여야 합니다$/,
    (a, b) => `パスワードは${a}〜${b}文字にしてください`,
    (a, b) => `Password must be ${a}–${b} characters`,
  ],
  [/^조회 기간은 최대 (\d+)일입니다$/, (n) => `照会期間は最大${n}日です`, (n) => `The range can be at most ${n} days`],
];

// 'ja,en-US;q=0.9,ko;q=0.8' → 지원 언어 중 q가 가장 큰 것. 없으면 ko
export function pickLocale(header) {
  if (typeof header !== 'string') return DEFAULT_LOCALE;
  const ranked = header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { lang: tag.trim().toLowerCase().split('-')[0], q: q ? Number(q.slice(2)) : 1, index };
    })
    .filter(({ lang, q }) => LOCALES.includes(lang) && q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return ranked[0]?.lang ?? DEFAULT_LOCALE;
}

// 표에 없는 문구는 원문 그대로(한국어)
export function translate(message, locale) {
  const index = LOCALES.indexOf(locale) - 1;
  if (index < 0 || typeof message !== 'string') return message;
  const entry = MESSAGES[message];
  if (entry) return entry[index];
  for (const [pattern, ...fns] of PATTERNS) {
    const match = pattern.exec(message);
    if (match) return fns[index](...match.slice(1));
  }
  return message;
}

export function hasTranslation(message) {
  return Object.hasOwn(MESSAGES, message) || PATTERNS.some(([pattern]) => pattern.test(message));
}
