(() => {
  const MAX_PART_LENGTH = 80;
  const LONG_CLASS_LENGTH = 60;

  const entry = (value, aliases = '') => Object.freeze({
    value,
    aliases: `${value} ${aliases}`.toLocaleLowerCase('ja'),
  });

  const category = (label, labelJa, aliases, blocks, elements, modifiers) => Object.freeze({
    label,
    labelJa,
    aliases: `${label} ${labelJa} ${aliases}`.toLocaleLowerCase('ja'),
    blocks: Object.freeze(blocks),
    elements: Object.freeze(elements),
    modifiers: Object.freeze(modifiers),
  });

  const CATEGORY_DEFINITIONS = Object.freeze({
    header: category('HEADER / NAVIGATION', 'ヘッダー・ナビゲーション', 'サイト上部 メニュー グローバルナビ', [entry('header', 'ヘッダー'), entry('site-header', 'サイトヘッダー'), entry('navigation', 'ナビゲーション'), entry('navbar', 'ナビバー'), entry('menu', 'メニュー'), entry('mega-menu', 'メガメニュー')], [entry('inner', '内側'), entry('brand', 'ブランド'), entry('logo', 'ロゴ'), entry('nav', 'ナビ'), entry('list', 'リスト'), entry('item', '項目'), entry('link', 'リンク'), entry('toggle', '開閉ボタン'), entry('dropdown', 'ドロップダウン')], [entry('fixed', '固定'), entry('sticky', '追従'), entry('transparent', '透明'), entry('primary', '主要'), entry('mobile', 'モバイル'), entry('open', '開く'), entry('collapsed', '閉じる'), entry('active', '選択中')]),
    hero: category('HERO / BANNER', 'ヒーロー・バナー', 'メインビジュアル キービジュアル', [entry('hero', 'ヒーロー'), entry('banner', 'バナー'), entry('key-visual', 'キービジュアル'), entry('intro', '導入')], [entry('image', '画像'), entry('content', '内容'), entry('title', '見出し タイトル'), entry('subtitle', 'サブタイトル'), entry('description', '説明'), entry('cta', '行動喚起'), entry('overlay', 'オーバーレイ')], [entry('fullscreen', '全画面'), entry('large', '大'), entry('video', '動画'), entry('split', '分割'), entry('dark', '暗い'), entry('centered', '中央')]),
    section: category('SECTION / CONTENT', 'セクション・コンテンツ', '本文 記事 ページ内容', [entry('section', 'セクション'), entry('content', 'コンテンツ'), entry('introduction', '導入'), entry('feature', '特徴'), entry('services', 'サービス'), entry('projects', '制作実績')], [entry('heading', '見出し'), entry('title', 'タイトル'), entry('body', '本文'), entry('text', 'テキスト'), entry('description', '説明'), entry('list', 'リスト'), entry('item', '項目'), entry('media', 'メディア'), entry('actions', '操作')], [entry('primary', '主要'), entry('secondary', '副次'), entry('compact', '小型'), entry('wide', '幅広'), entry('featured', '注目'), entry('alternate', '交互')]),
    card: category('CARD / GALLERY', 'カード・ギャラリー', '一覧 タイル コレクション', [entry('card', 'カード'), entry('gallery', 'ギャラリー'), entry('tile', 'タイル'), entry('collection', 'コレクション')], [entry('image', '画像'), entry('media', 'メディア'), entry('body', '本文'), entry('title', 'タイトル 見出し'), entry('text', 'テキスト'), entry('meta', 'メタ情報'), entry('link', 'リンク'), entry('badge', 'バッジ'), entry('item', '項目')], [entry('featured', '注目'), entry('horizontal', '横並び'), entry('compact', '小型'), entry('selected', '選択中'), entry('disabled', '無効')]),
    form: category('FORM', 'フォーム', '入力 問い合わせ 検索', [entry('form', 'フォーム'), entry('field', '入力欄'), entry('input-group', '入力グループ'), entry('search-form', '検索フォーム')], [entry('field', '入力欄'), entry('label', 'ラベル'), entry('input', 'インプット'), entry('textarea', 'テキストエリア'), entry('select', 'セレクト'), entry('message', 'メッセージ'), entry('error', 'エラー'), entry('actions', '操作'), entry('submit', '送信')], [entry('inline', '横並び'), entry('stacked', '縦積み'), entry('required', '必須'), entry('invalid', '無効'), entry('success', '成功'), entry('disabled', '使用不可')]),
    button: category('BUTTON / CTA', 'ボタン・CTA', 'リンク 操作 行動喚起', [entry('button', 'ボタン'), entry('cta', '行動喚起'), entry('link-button', 'リンクボタン'), entry('icon-button', 'アイコンボタン')], [entry('label', 'ラベル'), entry('icon', 'アイコン'), entry('text', 'テキスト')], [entry('primary', '主要'), entry('secondary', '副次'), entry('ghost', 'ゴースト'), entry('small', '小'), entry('large', '大'), entry('disabled', '無効'), entry('loading', '読込中'), entry('full-width', '幅いっぱい')]),
    media: category('MEDIA', 'メディア', '画像 動画 図版', [entry('media', 'メディア'), entry('image', '画像'), entry('figure', '図版'), entry('video', '動画'), entry('gallery', 'ギャラリー')], [entry('image', '画像'), entry('source', 'ソース'), entry('caption', 'キャプション'), entry('credit', 'クレジット'), entry('thumbnail', 'サムネイル'), entry('controls', '操作')], [entry('cover', 'カバー'), entry('contain', '全体表示'), entry('portrait', '縦長'), entry('landscape', '横長'), entry('lazy', '遅延'), entry('rounded', '角丸')]),
    testimonial: category('TESTIMONIAL / REVIEW', 'お客様の声・レビュー', '評価 引用 口コミ', [entry('testimonial', 'お客様の声'), entry('review', 'レビュー'), entry('quote', '引用')], [entry('quote', '引用文'), entry('body', '本文'), entry('author', '著者'), entry('name', '名前'), entry('role', '役職'), entry('avatar', '顔写真'), entry('rating', '評価')], [entry('featured', '注目'), entry('compact', '小型'), entry('verified', '確認済み')]),
    partner: category('PARTNER / LOGO', 'パートナー・ロゴ', '取引先 協賛 ブランド', [entry('partners', 'パートナー'), entry('logo-list', 'ロゴ一覧'), entry('client-list', '取引先一覧'), entry('badges', 'バッジ一覧')], [entry('list', 'リスト'), entry('item', '項目'), entry('logo', 'ロゴ'), entry('link', 'リンク'), entry('name', '名前')], [entry('monochrome', '単色'), entry('featured', '注目'), entry('compact', '小型')]),
    footer: category('FOOTER', 'フッター', 'サイト下部 コピーライト', [entry('footer', 'フッター'), entry('site-footer', 'サイトフッター'), entry('legal', '法務'), entry('social-links', 'SNSリンク')], [entry('inner', '内側'), entry('logo', 'ロゴ'), entry('nav', 'ナビ'), entry('list', 'リスト'), entry('item', '項目'), entry('link', 'リンク'), entry('copyright', 'コピーライト'), entry('legal', '法務'), entry('social', 'SNS')], [entry('simple', '簡易'), entry('dark', '暗い'), entry('compact', '小型'), entry('sticky', '固定')]),
    layout: category('LAYOUT / GRID', 'レイアウト・グリッド', '配置 枠 コンテナ', [entry('container', 'コンテナ'), entry('wrapper', 'ラッパー'), entry('grid', 'グリッド'), entry('row', '行'), entry('stack', '縦積み'), entry('cluster', '集合')], [entry('inner', '内側'), entry('item', '項目'), entry('column', '列'), entry('main', 'メイン'), entry('aside', '補助')], [entry('fluid', '可変'), entry('wide', '幅広'), entry('narrow', '幅狭'), entry('two-column', '2列'), entry('centered', '中央')]),
  });

  const normalizeToken = (value = '') => String(value)
    .normalize('NFKC')
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, MAX_PART_LENGTH);

  const hasInvalidCharacters = (value) => /[^a-zA-Z0-9\s_-]/u.test(String(value));
  const hasPresentationalMeaning = (value) => /(?:^|-)(?:red|blue|green|yellow|black|white|gray|grey|left|right|top|bottom|margin|padding|font|bold|italic|small|large|\d+(?:px|rem|em|vh|vw)?)(?:-|$)/u.test(value);

  const inspect = (input = {}) => {
    const raw = {
      block: String(input.block || '').slice(0, MAX_PART_LENGTH * 2),
      element: String(input.element || '').slice(0, MAX_PART_LENGTH * 2),
      modifier: String(input.modifier || '').slice(0, MAX_PART_LENGTH * 2),
    };
    const parts = {
      block: normalizeToken(raw.block),
      element: normalizeToken(raw.element),
      modifier: normalizeToken(raw.modifier),
    };
    const warnings = [];
    const add = (type, severity, part, message) => warnings.push(Object.freeze({ type, severity, part, message }));

    const hasAnyInput = Object.values(raw).some((value) => value.trim());
    if (!raw.block.trim() && hasAnyInput) add('BLOCK_REQUIRED', 'error', 'BLOCK', 'BLOCKは必須です。コンポーネントの独立した名前を入力してください。');
    else if (raw.block.trim() && !parts.block) add('BLOCK_INVALID', 'error', 'BLOCK', 'BLOCKを有効な英数字の名前へ変更してください。');

    Object.entries(raw).forEach(([part, value]) => {
      const label = part.toUpperCase();
      if (!value.trim()) return;
      if (/^\s*\d/u.test(value)) add('LEADING_DIGIT', 'error', label, '数字から始まる名前はCSSセレクターで扱いにくいため変更してください。');
      if (value.includes('__') || value.includes('--')) add('BEM_DELIMITER', 'error', label, '区切り記号 __ / -- は入力せず、各欄を分けて使用してください。');
      if (hasInvalidCharacters(value)) add('INVALID_CHARACTERS', 'warning', label, '英数字・ハイフン以外の文字は正規化時に置換または除去されます。');
      if (value.length > MAX_PART_LENGTH) add('PART_TOO_LONG', 'warning', label, `${MAX_PART_LENGTH}文字を超える部分は切り詰められます。`);
    });

    if (raw.element.includes('__')) add('NESTED_ELEMENT', 'error', 'ELEMENT', 'BEMでは block__element__child のようなElementの入れ子を避けます。');
    if (parts.modifier && hasPresentationalMeaning(parts.modifier)) add('PRESENTATIONAL_MODIFIER', 'warning', 'MODIFIER', '色・位置・余白など見た目ではなく、状態や役割を表す名前を推奨します。');

    const target = parts.block ? `${parts.block}${parts.element ? `__${parts.element}` : ''}` : '';
    const className = target ? `${target}${parts.modifier ? `--${parts.modifier}` : ''}` : '';
    if (className.length > LONG_CLASS_LENGTH) add('CLASS_TOO_LONG', 'warning', 'OUTPUT', `${LONG_CLASS_LENGTH}文字を超えるため、役割が伝わる範囲で短縮を検討してください。`);

    const classList = target ? (parts.modifier ? `${target} ${className}` : target) : '';
    const selector = className ? `.${className}` : '';
    const attribute = classList ? `class="${classList}"` : '';
    const rules = target ? [`.${target} {\n}`] : [];
    if (parts.modifier) rules.push(`.${className} {\n}`);
    const css = rules.join('\n\n');
    const structure = !parts.block ? 'EMPTY' : parts.modifier ? 'MODIFIER' : parts.element ? 'ELEMENT' : 'BLOCK';
    const errorCount = warnings.filter((warning) => warning.severity === 'error').length;
    const warningCount = warnings.filter((warning) => warning.severity === 'warning').length;
    const normalized = Object.keys(parts).some((part) => raw[part].trim() && raw[part].trim() !== parts[part]);

    return Object.freeze({
      raw: Object.freeze(raw),
      parts: Object.freeze(parts),
      warnings: Object.freeze(warnings),
      target,
      className,
      classList,
      selector,
      attribute,
      css,
      structure,
      classCount: classList ? classList.split(' ').length : 0,
      characterCount: className.length,
      normalized,
      errorCount,
      warningCount,
      isValid: Boolean(className) && errorCount === 0,
      status: errorCount ? 'INVALID' : className ? 'READY' : 'EMPTY',
    });
  };

  const generate = (input = {}) => inspect(input);

  const getCategory = (key) => CATEGORY_DEFINITIONS[key] || CATEGORY_DEFINITIONS.header;

  const searchSuggestions = (categoryKey, query = '') => {
    const selected = getCategory(categoryKey);
    const needle = String(query).trim().toLocaleLowerCase('ja');
    const filter = (items) => items.filter((item) => !needle || item.aliases.includes(needle));
    return Object.freeze({
      blocks: Object.freeze(filter(selected.blocks)),
      elements: Object.freeze(filter(selected.elements)),
      modifiers: Object.freeze(filter(selected.modifiers)),
    });
  };

  globalThis.MarkBenchBemClassBuilder = Object.freeze({
    MAX_PART_LENGTH,
    LONG_CLASS_LENGTH,
    CATEGORY_DEFINITIONS,
    normalizeToken,
    inspect,
    generate,
    getCategory,
    searchSuggestions,
  });
})();
