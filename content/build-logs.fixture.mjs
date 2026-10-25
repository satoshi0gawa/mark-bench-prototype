export default [
  {
    id: 'fixture-px-rem-converter',
    createdAt: '2026-10-25T00:00:00+09:00',
    updatedAt: '2026-10-25T00:00:00+09:00',
    publishedAt: '2026-10-25T00:00:00+09:00',
    displayStatus: 'published',
    logNumber: 'BUILD_LOG_004',
    title: 'pxとremの換算基準を整理する',
    slug: 'px-rem-converter',
    summary: 'pxとremの変換は単純な割り算と掛け算ですが、結果を正しく使うには基準となるルートフォントサイズと丸め方を共有する必要があります。双方向変換を安定させるための設計と検証内容を整理します。',
    category: 'CSS TOOLS',
    displayDate: '2026-10-25T00:00:00+09:00',
    readingTime: 7,
    relatedToolId: 'px-rem-converter',
    ctaLabel: 'PX / REM CONVERTERを使う',
    ctaDescription: 'プロジェクトのルートフォントサイズを指定し、pxとremを双方向に変換できます。丸め精度と計算式を確認し、必要な結果をそのままコピーできます。',
    ogImage: null,
    sections: [
      {
        fieldId: 'buildLogSection',
        sectionNumber: '01',
        sectionLabel: 'PURPOSE',
        heading: '換算ツールを作る理由',
        body: `<p>デザインデータではpx、CSSのタイポグラフィや余白ではremというように、Web制作では同じ寸法を異なる単位で扱う場面があります。値が少なければ暗算できますが、複数のサイズを確認しながら実装すると、割り算の基準や小数点以下の扱いが担当者ごとに変わりやすくなります。</p>
<p>PX / REM Converterでは、変換する数値とルートフォントサイズを明示し、計算結果と式を同じ画面で確認できる状態を目指しました。pxからremへ変換するだけでなく、remから元のpxへ戻す操作も同じ条件で行えるようにします。</p>`,
        calloutLabel: 'PROCESS',
        calloutBody: '<p>入力値 → 変換方向を選択 → ルートフォントサイズを適用 → 丸め精度を反映 → 結果と計算式を表示</p>',
      },
      {
        fieldId: 'buildLogSection',
        sectionNumber: '02',
        sectionLabel: 'ROOT SIZE',
        heading: 'ルートサイズを基準にする',
        body: `<p>remはルート要素のフォントサイズを基準にした相対単位です。ブラウザの一般的な初期値である16pxを使う場合、16pxは1rem、32pxは2remになります。ただし、プロジェクト側でルートサイズを変更している場合は同じpx値でも結果が変わります。</p>
<p>そのため、ツールでは16pxを初期値としながら、1〜256pxの範囲で基準値を変更できるようにしました。変換結果だけでなく、現在使用しているルートサイズを画面へ常に表示し、どの条件で算出した値かを見失わない構成にしています。</p>`,
        calloutLabel: 'DESIGN NOTE',
        calloutBody: '<p>remは固定の換算表ではありません。ルートフォントサイズを変換条件の一部として扱うことで、プロジェクトごとの設計基準に合わせられます。</p>',
      },
      {
        fieldId: 'buildLogSection',
        sectionNumber: '03',
        sectionLabel: 'FORMULA',
        heading: '双方向の計算式を揃える',
        body: `<p>pxからremへ変換するときは入力値をルートサイズで割り、remからpxへ戻すときはルートサイズを掛けます。変換方向によって入力欄の単位表示と演算子を切り替え、結果には必ず出力単位を付けます。</p>
<pre><code>const numericResult = direction === 'rem-to-px'
  ? inputValue * rootSize
  : inputValue / rootSize;

// root size: 16px
32px ÷ 16px = 2rem
2rem × 16px = 32px</code></pre>
<p>結果の数値だけでなく、<code>32px ÷ 16px = 2rem</code>のように式も表示します。入力値、基準値、演算方向を一度に確認できるため、別のプロジェクトへ値を移すときも換算条件を追いやすくなります。</p>`,
        calloutLabel: '',
        calloutBody: '',
      },
      {
        fieldId: 'buildLogSection',
        sectionNumber: '04',
        sectionLabel: 'PRECISION',
        heading: '丸め精度を選べるようにする',
        body: `<p>pxをremへ変換すると、割り切れない小数が発生します。用途によって必要な精度が異なるため、不要な末尾の0を除くAUTO、小数点以下を2桁に揃える2 DEC、4桁に揃える4 DECの3種類を用意しました。</p>
<pre><code>const formatNumber = (value, precision) =&gt; {
  const normalized = Object.is(value, -0) ? 0 : value;
  if (precision === '2') return normalized.toFixed(2);
  if (precision === '4') return normalized.toFixed(4);
  return String(Number(normalized.toFixed(6)));
};</code></pre>
<p>AUTOでは内部計算の長い小数を最大6桁で整理してから、不要な末尾の0を取り除きます。また、計算過程で発生する可能性がある<code>-0</code>は<code>0</code>へ正規化し、コピー後も扱いやすい出力にします。</p>`,
        calloutLabel: '',
        calloutBody: '',
      },
      {
        fieldId: 'buildLogSection',
        sectionNumber: '05',
        sectionLabel: 'VALIDATION',
        heading: '入力値と状態表示を検証する',
        body: `<p>入力値は正負どちらにも対応し、絶対値1,000,000までを有効範囲としました。ルートフォントサイズは1〜256pxに制限し、空欄、数値以外、範囲外の値をそれぞれ判定します。無効な場合は結果を「—」へ戻し、コピーボタンを操作できない状態にします。</p>
<p>画面には<code>INPUT EMPTY</code>、<code>READY</code>、<code>INVALID VALUE</code>、<code>ROOT SIZE OUT OF RANGE</code>を表示し、該当する入力欄へ<code>aria-invalid</code>を設定します。SAMPLE、CLEAR、変換方向、精度の変更後も同じ描画処理を通し、表示と内部結果がずれないことを確認しました。</p>`,
        calloutLabel: '',
        calloutBody: '',
      },
      {
        fieldId: 'buildLogSection',
        sectionNumber: '06',
        sectionLabel: 'RESULT',
        heading: '実装から得た判断',
        body: `<p>計算ロジックと画面更新を分離したことで、変換方向や精度が変わっても同じ検証結果を利用できるようになりました。結果へ単位を含め、計算式を併記することで、単なる数値だけを返すよりも変換条件を確認しやすくなっています。</p>
<p>一方、remを採用すれば自動的に読みやすくなるわけではありません。タイポグラフィ、余白、コンポーネント寸法のどこへ相対単位を使うかは、サイト全体の設計ルールとして決める必要があります。このツールは、その判断に必要な換算を素早く確かめるための補助として位置づけています。</p>`,
        calloutLabel: '',
        calloutBody: '',
      },
    ],
  },
  {
    id: 'fixture-case-style-guide',
    createdAt: '2026-10-25T00:00:00+09:00',
    updatedAt: '2026-10-25T00:00:00+09:00',
    publishedAt: '2026-10-25T00:00:00+09:00',
    displayStatus: 'published',
    logNumber: 'BUILD_LOG_001',
    title: 'テキストケース変換の仕組みを整理する',
    slug: 'case-style-guide',
    summary: '命名規則の変換は、区切り文字を置き換えるだけでは安定しません。入力を共通の単語配列へ戻し、9種類のケースへ再構築するまでの設計と検証内容を整理します。',
    category: 'TEXT TOOLS',
    displayDate: '2026-10-25T00:00:00+09:00',
    readingTime: 7,
    relatedToolId: 'text-case-converter',
    ctaLabel: 'TEXT CASE CONVERTERを使う',
    ctaDescription: 'HTML、CSS、JavaScriptで使用する命名候補を9形式で比較し、必要な結果をコピーできます。入力内容はブラウザ内で処理され、外部へ送信されません。',
    ogImage: null,
    sections: [
      {
        fieldId: 'buildLogSection',
        sectionNumber: '01',
        sectionLabel: 'PURPOSE',
        heading: '変換処理を整理した理由',
        body: `<p>Web制作では、同じ言葉をCSSクラス、JavaScriptの変数、ファイル名、CMSの管理項目などへ繰り返し入力します。用途ごとに求められる命名規則は異なり、手作業で大文字や区切り文字を直していると、表記揺れや入力ミスが起こりやすくなります。</p>
<p>Text Case Converterでは、ひとつの入力から複数の命名候補を同時に生成し、必要な形式をそのままコピーできる状態を目指しました。ここで重要なのは、出力時に大文字と小文字を切り替えることより、入力された文字列を正しく「単語」へ戻すことです。</p>`,
        calloutLabel: 'PROCESS',
        calloutBody: '<p>入力文字列 → 単語境界を検出 → 共通の単語配列へ正規化 → 9種類のケースへ再構築</p>',
      },
      {
        fieldId: 'buildLogSection',
        sectionNumber: '02',
        sectionLabel: 'NORMALIZE',
        heading: '入力を共通形式へ戻す',
        body: `<p>入力欄へ渡される文字列は、スペース区切りとは限りません。すでに<code>camelCase</code>や<code>snake_case</code>になっている場合もあれば、ハイフン、記号、連続した空白が混在している場合もあります。形式ごとに別の変換処理を用意すると、出力形式を追加するたびに同じ判定が増えてしまいます。</p>
<p>そこで、最初にハイフンとアンダースコアを区切りへ置き換え、不要な記号を除去し、空白で分割した単語配列へ統一します。文字の判定にはUnicodeプロパティを使用し、日本語を含む文字や数字を不用意に削除しないようにしました。大文字と小文字を持たない文字はそのまま保持され、区切り文字だけが出力形式に合わせて変化します。</p>`,
        calloutLabel: '',
        calloutBody: '',
      },
      {
        fieldId: 'buildLogSection',
        sectionNumber: '03',
        sectionLabel: 'TOKENIZE',
        heading: '単語境界を判定する',
        body: String.raw`<p><code>camelCase</code>や<code>PascalCase</code>には目に見える区切り文字がありません。そのため、小文字または数字の直後に大文字が続く位置へ区切りを追加します。さらに、<code>XMLHttpRequest</code>のように大文字が連続する入力では、頭字語と次の単語の境界も先に検出します。</p>
<pre><code>const toWords = (value) =&gt; value
  .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .map((word) =&gt; word.toLocaleLowerCase());</code></pre>`,
        calloutLabel: 'DESIGN NOTE',
        calloutBody: '<p>変換結果の品質は、出力側の処理よりも単語をどこで分けるかによって決まります。すべての出力形式が同じ単語配列を参照することで、形式ごとの判定差も防げます。</p>',
      },
      {
        fieldId: 'buildLogSection',
        sectionNumber: '04',
        sectionLabel: 'REBUILD',
        heading: '9種類のケースへ組み立てる',
        body: `<p>正規化した単語配列が用意できれば、あとは大文字・小文字と区切り文字の組み合わせです。Space系、ハイフン・アンダースコア系、識別子系の3グループへ整理し、同じ入力結果を比較できるようにしました。</p>
<pre><code>INPUT        test text pattern

SPACE CASE   TEST TEXT PATTERN
space case   test text pattern
Space Case   Test Text Pattern
KEBAB-CASE   TEST-TEXT-PATTERN
kebab-case   test-text-pattern
SNAKE_CASE   TEST_TEXT_PATTERN
snake_case   test_text_pattern
PascalCase   TestTextPattern
camelCase    testTextPattern</code></pre>
<p><code>Space Case</code>は各単語の先頭を大文字にする形式です。見出し候補や表示用ラベルとして使える一方、<code>PascalCase</code>とは異なり単語間のスペースを保持します。</p>`,
        calloutLabel: '',
        calloutBody: '',
      },
      {
        fieldId: 'buildLogSection',
        sectionNumber: '05',
        sectionLabel: 'VALIDATION',
        heading: '境界値と操作を検証する',
        body: `<p>通常の文章だけでなく、空入力、連続した区切り文字、先頭や末尾の記号、連続する大文字、日本語と英数字の混在も確認します。どの入力でも同じ正規化処理を通るため、変換形式ごとに結果が食い違っていないかを比較できます。</p>
<p>操作面では、入力に合わせた自動更新、空結果の「—」表示、結果がないときのコピーボタン無効化、コピー完了時の状態通知を確認しました。処理はブラウザ内で完結し、入力内容を外部サーバーへ送信しない構成です。</p>`,
        calloutLabel: '',
        calloutBody: '',
      },
      {
        fieldId: 'buildLogSection',
        sectionNumber: '06',
        sectionLabel: 'RESULT',
        heading: '実装から得た判断',
        body: `<p>入力の解析と出力の組み立てを分離したことで、新しい変換形式を追加するときも共通の単語配列を利用できるようになりました。また、画面に表示するラベルと処理で使用するキーを分けたことで、表示順や名称を変更しても変換ロジックへ影響しにくい構成になっています。</p>
<p>一方で、頭字語を常に大文字で残すか、言語ごとのタイトル表記をどこまで扱うかは用途によって判断が変わります。Text Case Converterでは、結果を予測しやすい共通ルールを優先し、複数形式を並べて比較できることで選択を補助します。</p>`,
        calloutLabel: '',
        calloutBody: '',
      },
    ],
  },
  {
    id: 'fixture-json-error-handling',
    createdAt: '2026-10-25T00:00:00+09:00',
    updatedAt: '2026-10-25T00:00:00+09:00',
    publishedAt: '2026-10-25T00:00:00+09:00',
    displayStatus: 'planned',
    logNumber: 'BUILD_NOTE_XXX',
    title: 'JSON.parse()のエラー処理を確認する',
    slug: 'json-error-handling',
    summary: '',
    category: 'CODE TOOLS',
    displayDate: null,
    readingTime: null,
    relatedToolId: 'json-formatter',
    ctaLabel: '',
    ctaDescription: '',
    ogImage: null,
    plannedOrder: 1,
    sections: [],
  },
  {
    id: 'fixture-fluid-scale-design',
    createdAt: '2026-10-25T00:00:00+09:00',
    updatedAt: '2026-10-25T00:00:00+09:00',
    publishedAt: '2026-10-25T00:00:00+09:00',
    displayStatus: 'planned',
    logNumber: 'BUILD_NOTE_XXX',
    title: 'clamp()で流動的な値を設計する',
    slug: 'fluid-scale-design',
    summary: '',
    category: 'CSS TOOLS',
    displayDate: null,
    readingTime: null,
    relatedToolId: 'fluid-scale-generator',
    ctaLabel: '',
    ctaDescription: '',
    ogImage: null,
    plannedOrder: 2,
    sections: [],
  },
];
