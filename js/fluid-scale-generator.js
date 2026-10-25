(() => {
  const MIN_VIEWPORT = 240;
  const MAX_VIEWPORT = 3840;
  const MIN_VIEWPORT_GAP = 100;
  const MIN_ROOT_SIZE = 8;
  const MAX_ROOT_SIZE = 32;
  const MAX_TOKENS = 32;
  const SIZE_TOKEN_LIMIT = 12;

  const STEP_PRESETS = Object.freeze({
    compact: Object.freeze(['sm', 'base', 'lg', 'xl', '2xl']),
    standard: Object.freeze(['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl']),
    extended: Object.freeze(['2xs', 'xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl']),
  });

  const SPACING_PRESETS = Object.freeze({
    standard: Object.freeze([1, 2, 3, 4, 6, 8, 12, 16]),
    fibonacci: Object.freeze([1, 2, 3, 5, 8, 13]),
  });

  const DEFAULT_SIZE_TOKENS = Object.freeze([
    Object.freeze({ name: '--size-icon-sm', min: 16, max: 20 }),
    Object.freeze({ name: '--size-icon-lg', min: 24, max: 32 }),
    Object.freeze({ name: '--size-control', min: 40, max: 48 }),
  ]);

  const DEFAULT_CONFIG = Object.freeze({
    mode: 'system',
    viewportMin: 360,
    viewportMax: 1440,
    currentWidth: 900,
    rootSize: 16,
    unit: 'rem',
    basis: 'vi',
    precision: 3,
    type: Object.freeze({
      minBase: 16,
      maxBase: 18,
      minRatio: 1.2,
      maxRatio: 1.25,
      preset: 'standard',
      prefix: '--font',
    }),
    spacing: Object.freeze({
      minBase: 4,
      maxBase: 5,
      preset: 'standard',
      prefix: '--space',
    }),
    sizes: DEFAULT_SIZE_TOKENS,
    single: Object.freeze({
      name: '--fluid-value',
      min: 16,
      max: 48,
      preview: 'font',
    }),
  });

  const clampNumber = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const round = (value, precision = 3) => Number(Number(value).toFixed(precision));
  const isFiniteNumber = (value) => Number.isFinite(Number(value));
  const isCssVariable = (value) => /^--[a-z][a-z0-9-]*$/u.test(String(value || '').trim());
  const cloneSizeTokens = () => DEFAULT_SIZE_TOKENS.map((token) => ({ ...token }));
  const cloneDefaultConfig = () => ({
    ...DEFAULT_CONFIG,
    type: { ...DEFAULT_CONFIG.type },
    spacing: { ...DEFAULT_CONFIG.spacing },
    sizes: cloneSizeTokens(),
    single: { ...DEFAULT_CONFIG.single },
  });

  const formatNumber = (value, precision = 3) => {
    const normalized = Object.is(value, -0) ? 0 : value;
    return String(Number(Number(normalized).toFixed(precision)));
  };

  const formatLength = (valuePx, config) => {
    const numeric = Number(valuePx);
    if (config.unit === 'px') return `${formatNumber(numeric, config.precision)}px`;
    return `${formatNumber(numeric / config.rootSize, config.precision)}rem`;
  };

  const validateCommon = (config) => {
    const errors = [];
    const warnings = [];
    const viewportMin = Number(config.viewportMin);
    const viewportMax = Number(config.viewportMax);
    const rootSize = Number(config.rootSize);
    const precision = Number(config.precision);

    if (!Number.isFinite(viewportMin) || viewportMin < MIN_VIEWPORT || viewportMin > MAX_VIEWPORT) {
      errors.push({ type: 'VIEWPORT_MIN', field: 'viewportMin', message: `MIN VIEWPORTは${MIN_VIEWPORT}〜${MAX_VIEWPORT}pxで入力してください。` });
    }
    if (!Number.isFinite(viewportMax) || viewportMax < MIN_VIEWPORT || viewportMax > MAX_VIEWPORT) {
      errors.push({ type: 'VIEWPORT_MAX', field: 'viewportMax', message: `MAX VIEWPORTは${MIN_VIEWPORT}〜${MAX_VIEWPORT}pxで入力してください。` });
    }
    if (Number.isFinite(viewportMin) && Number.isFinite(viewportMax) && viewportMax - viewportMin < MIN_VIEWPORT_GAP) {
      errors.push({ type: 'VIEWPORT_GAP', field: 'viewportMax', message: `ビューポート幅の差は${MIN_VIEWPORT_GAP}px以上にしてください。` });
    }
    if (!Number.isFinite(rootSize) || rootSize < MIN_ROOT_SIZE || rootSize > MAX_ROOT_SIZE) {
      errors.push({ type: 'ROOT_SIZE', field: 'rootSize', message: `ROOT SIZEは${MIN_ROOT_SIZE}〜${MAX_ROOT_SIZE}pxで入力してください。` });
    }
    if (!Number.isInteger(precision) || precision < 2 || precision > 5) {
      errors.push({ type: 'PRECISION', field: 'precision', message: 'PRECISIONは2〜5桁で選択してください。' });
    }
    if (!['rem', 'px'].includes(config.unit)) errors.push({ type: 'UNIT', field: 'unit', message: 'OUTPUT UNITを選択してください。' });
    if (!['vi', 'cqi'].includes(config.basis)) errors.push({ type: 'BASIS', field: 'basis', message: 'FLUID BASISを選択してください。' });
    if (config.unit === 'px') warnings.push({ type: 'PX_OUTPUT', message: 'PX出力はユーザーのルートフォント設定へ追従しません。通常はREM出力を推奨します。' });
    if (config.basis === 'cqi') warnings.push({ type: 'CQI_SCOPE', message: 'CQIを使用する要素は、祖先にクエリーコンテナの指定が必要です。' });

    return { errors, warnings };
  };

  const createFluidValue = (minimum, maximum, config) => {
    const min = Number(minimum);
    const max = Number(maximum);
    const viewportMin = Number(config.viewportMin);
    const viewportMax = Number(config.viewportMax);
    const currentWidth = clampNumber(Number(config.currentWidth), viewportMin, viewportMax);
    const slope = (max - min) / (viewportMax - viewportMin);
    const intercept = min - slope * viewportMin;
    const current = min + slope * (currentWidth - viewportMin);
    const minValue = formatLength(min, config);
    const maxValue = formatLength(max, config);
    const currentValue = formatLength(current, config);

    if (Math.abs(max - min) < 1e-9) {
      return Object.freeze({
        kind: 'fixed', minPx: min, maxPx: max, currentPx: min,
        minValue, maxValue, currentValue: minValue, preferred: minValue, cssValue: minValue,
      });
    }

    const interceptValue = config.unit === 'px'
      ? `${formatNumber(intercept, config.precision)}px`
      : `${formatNumber(intercept / config.rootSize, config.precision)}rem`;
    const coefficient = formatNumber(slope * 100, config.precision);
    const preferred = `${interceptValue} + ${coefficient}${config.basis}`;
    return Object.freeze({
      kind: 'fluid', minPx: min, maxPx: max, currentPx: current,
      minValue, maxValue, currentValue, preferred,
      cssValue: `clamp(${minValue}, ${preferred}, ${maxValue})`,
    });
  };

  const validateRange = (errors, field, minimum, maximum, label, maximumAllowed = 4096) => {
    if (!isFiniteNumber(minimum) || Number(minimum) < 0 || Number(minimum) > maximumAllowed) {
      errors.push({ type: 'VALUE_RANGE', field: `${field}Min`, message: `${label}の最小値は0〜${maximumAllowed}pxで入力してください。` });
    }
    if (!isFiniteNumber(maximum) || Number(maximum) < 0 || Number(maximum) > maximumAllowed) {
      errors.push({ type: 'VALUE_RANGE', field: `${field}Max`, message: `${label}の最大値は0〜${maximumAllowed}pxで入力してください。` });
    }
    if (isFiniteNumber(minimum) && isFiniteNumber(maximum) && Number(maximum) < Number(minimum)) {
      errors.push({ type: 'VALUE_ORDER', field: `${field}Max`, message: `${label}の最大値は最小値以上にしてください。` });
    }
  };

  const makeToken = (name, family, label, minimum, maximum, config) => Object.freeze({
    name,
    family,
    label,
    ...createFluidValue(minimum, maximum, config),
  });

  const buildCss = (tokens) => `:root {\n${tokens.map((token) => `  ${token.name}: ${token.cssValue};`).join('\n')}\n}`;

  const findToken = (tokens, preferred, family) => tokens.find((token) => token.name === preferred)
    || tokens.find((token) => token.family === family);

  const buildUsage = (tokens) => {
    const font = findToken(tokens, '--font-lg', 'typography');
    const space = findToken(tokens, '--space-4', 'spacing');
    const size = findToken(tokens, '--size-control', 'size');
    const declarations = [
      font ? `  font-size: var(${font.name});` : '',
      space ? `  gap: var(${space.name});` : '',
      space ? `  padding: var(${space.name});` : '',
      size ? `  min-block-size: var(${size.name});` : '',
    ].filter(Boolean);
    return `.fluid-example {\n${declarations.join('\n')}\n}`;
  };

  const finalize = (config, tokens, errors, warnings, mode) => {
    const names = new Set();
    tokens.forEach((token) => {
      if (names.has(token.name)) errors.push({ type: 'DUPLICATE_TOKEN', field: token.name, message: `${token.name} が重複しています。` });
      names.add(token.name);
      if (token.kind === 'fixed') warnings.push({ type: 'FIXED_VALUE', token: token.name, message: `${token.name} は最小値と最大値が同じため固定値として出力します。` });
    });
    if (tokens.length > MAX_TOKENS) errors.push({ type: 'TOKEN_LIMIT', message: `生成できるトークンは最大${MAX_TOKENS}件です。` });
    const valid = errors.length === 0;
    return Object.freeze({
      valid,
      mode,
      tokens: Object.freeze(valid ? tokens : []),
      errors: Object.freeze(errors),
      warnings: Object.freeze(warnings),
      css: valid ? buildCss(tokens) : '',
      usage: valid ? buildUsage(tokens) : '',
      metrics: Object.freeze({
        tokenCount: valid ? tokens.length : 0,
        fluidCount: valid ? tokens.filter((token) => token.kind === 'fluid').length : 0,
        fixedCount: valid ? tokens.filter((token) => token.kind === 'fixed').length : 0,
        warningCount: warnings.length,
        currentWidth: Number(config.currentWidth),
        viewportRange: `${config.viewportMin}–${config.viewportMax}px`,
      }),
    });
  };

  const generateSystem = (source = {}) => {
    const config = { ...cloneDefaultConfig(), ...source };
    config.type = { ...DEFAULT_CONFIG.type, ...(source.type || {}) };
    config.spacing = { ...DEFAULT_CONFIG.spacing, ...(source.spacing || {}) };
    config.sizes = Array.isArray(source.sizes) ? source.sizes : cloneSizeTokens();
    const { errors, warnings } = validateCommon(config);
    const tokens = [];

    validateRange(errors, 'typeBase', config.type.minBase, config.type.maxBase, 'TYPE BASE', 256);
    if (!isFiniteNumber(config.type.minRatio) || Number(config.type.minRatio) < 1 || Number(config.type.minRatio) > 2) {
      errors.push({ type: 'TYPE_RATIO', field: 'typeMinRatio', message: 'MOBILE RATIOは1〜2で入力してください。' });
    }
    if (!isFiniteNumber(config.type.maxRatio) || Number(config.type.maxRatio) < 1 || Number(config.type.maxRatio) > 2) {
      errors.push({ type: 'TYPE_RATIO', field: 'typeMaxRatio', message: 'DESKTOP RATIOは1〜2で入力してください。' });
    }
    if (!isCssVariable(config.type.prefix)) errors.push({ type: 'TOKEN_PREFIX', field: 'typePrefix', message: 'TYPE PREFIXは「--font」のようなCSS変数形式で入力してください。' });

    validateRange(errors, 'spaceBase', config.spacing.minBase, config.spacing.maxBase, 'SPACE UNIT', 128);
    if (!isCssVariable(config.spacing.prefix)) errors.push({ type: 'TOKEN_PREFIX', field: 'spacePrefix', message: 'SPACE PREFIXは「--space」のようなCSS変数形式で入力してください。' });

    if (!Array.isArray(config.sizes) || config.sizes.length > SIZE_TOKEN_LIMIT) {
      errors.push({ type: 'SIZE_LIMIT', field: 'sizes', message: `SIZE TOKENは最大${SIZE_TOKEN_LIMIT}件です。` });
    } else {
      config.sizes.forEach((token, index) => {
        if (!isCssVariable(token.name)) errors.push({ type: 'TOKEN_NAME', field: `size-${index}-name`, message: `SIZE ${index + 1}の名前はCSS変数形式で入力してください。` });
        validateRange(errors, `size-${index}`, token.min, token.max, `SIZE ${index + 1}`);
      });
    }

    if (!errors.length) {
      const steps = STEP_PRESETS[config.type.preset] || STEP_PRESETS.standard;
      const baseline = steps.indexOf('base');
      steps.forEach((step, index) => {
        const exponent = index - baseline;
        const min = Number(config.type.minBase) * (Number(config.type.minRatio) ** exponent);
        const max = Number(config.type.maxBase) * (Number(config.type.maxRatio) ** exponent);
        tokens.push(makeToken(`${config.type.prefix}-${step}`, 'typography', step.toUpperCase(), min, max, config));
      });

      const multipliers = SPACING_PRESETS[config.spacing.preset] || SPACING_PRESETS.standard;
      multipliers.forEach((multiplier) => {
        tokens.push(makeToken(`${config.spacing.prefix}-${multiplier}`, 'spacing', `${multiplier}×`, Number(config.spacing.minBase) * multiplier, Number(config.spacing.maxBase) * multiplier, config));
      });

      config.sizes.forEach((token) => {
        tokens.push(makeToken(token.name, 'size', token.name.replace(/^--size-?/u, '').toUpperCase() || 'CUSTOM', Number(token.min), Number(token.max), config));
      });

      const smallestType = tokens.find((token) => token.family === 'typography');
      const largestType = [...tokens].reverse().find((token) => token.family === 'typography');
      if (smallestType?.minPx < 12) warnings.push({ type: 'SMALL_TEXT', token: smallestType.name, message: `${smallestType.name} の最小値が12px未満です。可読性を確認してください。` });
      if (largestType?.maxPx > 160) warnings.push({ type: 'LARGE_TEXT', token: largestType.name, message: `${largestType.name} の最大値が160pxを超えています。折り返しを確認してください。` });
    }

    return finalize(config, tokens, errors, warnings, 'system');
  };

  const generateSingle = (source = {}) => {
    const config = { ...cloneDefaultConfig(), ...source };
    config.single = { ...DEFAULT_CONFIG.single, ...(source.single || {}) };
    const { errors, warnings } = validateCommon(config);
    const tokens = [];
    validateRange(errors, 'single', config.single.min, config.single.max, 'VALUE');
    if (!isCssVariable(config.single.name)) errors.push({ type: 'TOKEN_NAME', field: 'singleName', message: 'TOKEN NAMEは「--fluid-value」のようなCSS変数形式で入力してください。' });
    if (!['font', 'spacing', 'size'].includes(config.single.preview)) errors.push({ type: 'PREVIEW', field: 'singlePreview', message: 'PREVIEW ASを選択してください。' });
    if (!errors.length) tokens.push(makeToken(config.single.name, config.single.preview, 'SINGLE', Number(config.single.min), Number(config.single.max), config));
    return finalize(config, tokens, errors, warnings, 'single');
  };

  const generate = (source = {}) => source.mode === 'single' ? generateSingle(source) : generateSystem(source);

  globalThis.MarkBenchFluidScaleGenerator = Object.freeze({
    MIN_VIEWPORT,
    MAX_VIEWPORT,
    MIN_VIEWPORT_GAP,
    MIN_ROOT_SIZE,
    MAX_ROOT_SIZE,
    MAX_TOKENS,
    SIZE_TOKEN_LIMIT,
    STEP_PRESETS,
    SPACING_PRESETS,
    DEFAULT_SIZE_TOKENS,
    DEFAULT_CONFIG,
    cloneDefaultConfig,
    formatNumber,
    formatLength,
    isCssVariable,
    createFluidValue,
    generateSystem,
    generateSingle,
    generate,
  });
})();
