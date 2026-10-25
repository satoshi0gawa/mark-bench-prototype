(() => {
  const HISTORY_LIMIT = 8;
  const DEFAULT_COLOR = Object.freeze({ r: 74, g: 111, b: 165, a: 1 });
  const WHITE = Object.freeze({ r: 255, g: 255, b: 255, a: 1 });
  const BLACK = Object.freeze({ r: 0, g: 0, b: 0, a: 1 });

  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const round = (value, precision = 4) => Number(Number(value).toFixed(precision));
  const formatNumber = (value, precision = 1) => String(round(value, precision));
  const normalizeHue = (value) => ((Number(value) % 360) + 360) % 360;
  const channelToHex = (value) => Math.round(clamp(Number(value), 0, 255)).toString(16).padStart(2, '0').toUpperCase();
  const alphaToHex = (value) => channelToHex(clamp(Number(value), 0, 1) * 255);
  const formatAlpha = (value) => formatNumber(clamp(Number(value), 0, 1), 3);
  const freezeColor = (color) => Object.freeze({
    r: Math.round(clamp(Number(color.r), 0, 255)),
    g: Math.round(clamp(Number(color.g), 0, 255)),
    b: Math.round(clamp(Number(color.b), 0, 255)),
    a: round(clamp(Number(color.a ?? 1), 0, 1), 4),
  });

  const parseAlpha = (value) => {
    if (value === undefined || value === null || String(value).trim() === '') return 1;
    const source = String(value).trim();
    const numeric = source.endsWith('%') ? Number(source.slice(0, -1)) / 100 : Number(source);
    return Number.isFinite(numeric) && numeric >= 0 && numeric <= 1 ? numeric : null;
  };

  const parseHex = (value) => {
    const raw = String(value || '').trim().replace(/^#/, '');
    if (!/^(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/iu.test(raw)) return null;
    const expanded = raw.length <= 4 ? [...raw].map((character) => character + character).join('') : raw;
    return freezeColor({
      r: Number.parseInt(expanded.slice(0, 2), 16),
      g: Number.parseInt(expanded.slice(2, 4), 16),
      b: Number.parseInt(expanded.slice(4, 6), 16),
      a: expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1,
    });
  };

  const rgbToHex = (color, includeAlpha = false) => {
    const normalized = freezeColor(color);
    return `#${channelToHex(normalized.r)}${channelToHex(normalized.g)}${channelToHex(normalized.b)}${includeAlpha ? alphaToHex(normalized.a) : ''}`;
  };

  const rgbToHsl = (color) => {
    const normalized = freezeColor(color);
    const r = normalized.r / 255;
    const g = normalized.g / 255;
    const b = normalized.b / 255;
    const maximum = Math.max(r, g, b);
    const minimum = Math.min(r, g, b);
    const delta = maximum - minimum;
    const lightness = (maximum + minimum) / 2;
    let hue = 0;
    let saturation = 0;

    if (delta !== 0) {
      saturation = delta / (1 - Math.abs(2 * lightness - 1));
      if (maximum === r) hue = 60 * (((g - b) / delta) % 6);
      else if (maximum === g) hue = 60 * ((b - r) / delta + 2);
      else hue = 60 * ((r - g) / delta + 4);
    }

    return Object.freeze({ h: round(normalizeHue(hue), 2), s: round(saturation * 100, 2), l: round(lightness * 100, 2), a: normalized.a });
  };

  const hueToRgb = (p, q, hue) => {
    let value = hue;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };

  const hslToRgb = ({ h, s, l, a = 1 }) => {
    const hue = normalizeHue(h) / 360;
    const saturation = clamp(Number(s), 0, 100) / 100;
    const lightness = clamp(Number(l), 0, 100) / 100;
    if (saturation === 0) {
      const channel = Math.round(lightness * 255);
      return freezeColor({ r: channel, g: channel, b: channel, a });
    }
    const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;
    return freezeColor({
      r: hueToRgb(p, q, hue + 1 / 3) * 255,
      g: hueToRgb(p, q, hue) * 255,
      b: hueToRgb(p, q, hue - 1 / 3) * 255,
      a,
    });
  };

  const rgbToHsv = (color) => {
    const normalized = freezeColor(color);
    const r = normalized.r / 255;
    const g = normalized.g / 255;
    const b = normalized.b / 255;
    const maximum = Math.max(r, g, b);
    const minimum = Math.min(r, g, b);
    const delta = maximum - minimum;
    let hue = 0;

    if (delta !== 0) {
      if (maximum === r) hue = 60 * (((g - b) / delta) % 6);
      else if (maximum === g) hue = 60 * ((b - r) / delta + 2);
      else hue = 60 * ((r - g) / delta + 4);
    }

    return Object.freeze({
      h: round(normalizeHue(hue), 2),
      s: round((maximum === 0 ? 0 : delta / maximum) * 100, 2),
      v: round(maximum * 100, 2),
      a: normalized.a,
    });
  };

  const hsvToRgb = ({ h, s, v, a = 1 }) => {
    const hue = normalizeHue(h);
    const saturation = clamp(Number(s), 0, 100) / 100;
    const value = clamp(Number(v), 0, 100) / 100;
    const chroma = value * saturation;
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = value - chroma;
    let channels = [0, 0, 0];
    if (hue < 60) channels = [chroma, x, 0];
    else if (hue < 120) channels = [x, chroma, 0];
    else if (hue < 180) channels = [0, chroma, x];
    else if (hue < 240) channels = [0, x, chroma];
    else if (hue < 300) channels = [x, 0, chroma];
    else channels = [chroma, 0, x];
    return freezeColor({ r: (channels[0] + m) * 255, g: (channels[1] + m) * 255, b: (channels[2] + m) * 255, a });
  };

  const parseSource = (format, values = {}) => {
    const source = String(format || '').toLowerCase();
    const errors = [];
    const addError = (type, field, message) => errors.push(Object.freeze({ type, field, message }));
    const alpha = parseAlpha(values.alpha);
    if (alpha === null) addError('ALPHA_RANGE', 'alpha', 'ALPHAは0〜1、または0〜100%で入力してください。');
    let color = null;

    if (source === 'hex') {
      color = parseHex(values.hex);
      if (!color) addError('HEX_FORMAT', 'hex', 'HEXは#RGB・#RGBA・#RRGGBB・#RRGGBBAA形式で入力してください。');
      else if (!/^(?:#?[\da-f]{4}|#?[\da-f]{8})$/iu.test(String(values.hex || '').trim()) && alpha !== null) color = freezeColor({ ...color, a: alpha });
    } else {
      const fields = source === 'rgb' ? [['r', 0, 255], ['g', 0, 255], ['b', 0, 255]] : source === 'hsl' ? [['h', 0, 360], ['s', 0, 100], ['l', 0, 100]] : source === 'hsv' ? [['h', 0, 360], ['s', 0, 100], ['v', 0, 100]] : [];
      if (!fields.length) addError('SOURCE_FORMAT', 'source', '変換元のカラー形式を選択してください。');
      const parsed = {};
      fields.forEach(([field, minimum, maximum]) => {
        const raw = String(values[field] ?? '').trim();
        const numeric = Number(raw);
        if (!raw || !Number.isFinite(numeric)) addError('NUMBER_REQUIRED', field, `${field.toUpperCase()}は数値で入力してください。`);
        else if (numeric < minimum || numeric > maximum) addError('VALUE_RANGE', field, `${field.toUpperCase()}は${minimum}〜${maximum}で入力してください。`);
        else parsed[field] = numeric;
      });
      if (!errors.length) {
        if (source === 'rgb') color = freezeColor({ ...parsed, a: alpha });
        if (source === 'hsl') color = hslToRgb({ ...parsed, a: alpha });
        if (source === 'hsv') color = hsvToRgb({ ...parsed, a: alpha });
      }
    }

    return Object.freeze({ source: source.toUpperCase(), valid: errors.length === 0 && Boolean(color), color, errors: Object.freeze(errors) });
  };

  const compositeOver = (foreground, background = WHITE) => {
    const color = freezeColor(foreground);
    const base = freezeColor(background);
    return freezeColor({
      r: color.r * color.a + base.r * (1 - color.a),
      g: color.g * color.a + base.g * (1 - color.a),
      b: color.b * color.a + base.b * (1 - color.a),
      a: 1,
    });
  };

  const getRelativeLuminance = (color) => {
    const normalized = freezeColor(color);
    const channels = [normalized.r, normalized.g, normalized.b].map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };

  const getContrastRatio = (first, second) => {
    const firstLuminance = getRelativeLuminance(first);
    const secondLuminance = getRelativeLuminance(second);
    return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
  };

  const createResult = (color, source = 'HEX') => {
    const normalized = freezeColor(color);
    const hsl = rgbToHsl(normalized);
    const hsv = rgbToHsv(normalized);
    const hex = rgbToHex(normalized);
    const hexAlpha = rgbToHex(normalized, true);
    const alpha = formatAlpha(normalized.a);
    const rgb = normalized.a < 1 ? `rgb(${normalized.r} ${normalized.g} ${normalized.b} / ${alpha})` : `rgb(${normalized.r} ${normalized.g} ${normalized.b})`;
    const hslValue = normalized.a < 1 ? `hsl(${formatNumber(hsl.h)} ${formatNumber(hsl.s)}% ${formatNumber(hsl.l)}% / ${alpha})` : `hsl(${formatNumber(hsl.h)} ${formatNumber(hsl.s)}% ${formatNumber(hsl.l)}%)`;
    const hsvValue = normalized.a < 1 ? `hsv(${formatNumber(hsv.h)} ${formatNumber(hsv.s)}% ${formatNumber(hsv.v)}% / ${alpha})` : `hsv(${formatNumber(hsv.h)} ${formatNumber(hsv.s)}% ${formatNumber(hsv.v)}%)`;
    const composited = compositeOver(normalized, WHITE);
    const blackContrast = getContrastRatio(composited, BLACK);
    const whiteContrast = getContrastRatio(composited, WHITE);
    const bestText = blackContrast >= whiteContrast ? 'BLACK' : 'WHITE';
    const bestContrast = Math.max(blackContrast, whiteContrast);
    const cssColor = normalized.a < 1 ? hexAlpha : hex;

    return Object.freeze({
      valid: true,
      source: String(source).toUpperCase(),
      color: normalized,
      hsl,
      hsv,
      outputs: Object.freeze({ hex, hexAlpha, rgb, hsl: hslValue, hsv: hsvValue, cssVariable: `--color-custom: ${cssColor};` }),
      metrics: Object.freeze({
        alpha,
        luminance: round(getRelativeLuminance(composited), 4),
        blackContrast: round(blackContrast, 2),
        whiteContrast: round(whiteContrast, 2),
        bestText,
        bestContrast: round(bestContrast, 2),
        normalText: bestContrast >= 4.5 ? 'AA PASS' : 'AA FAIL',
        largeText: bestContrast >= 3 ? 'AA PASS' : 'AA FAIL',
      }),
      errors: Object.freeze([]),
      status: 'READY',
    });
  };

  const convert = (format, values = {}) => {
    const parsed = parseSource(format, values);
    if (!parsed.valid) return Object.freeze({ ...parsed, status: 'INVALID' });
    return createResult(parsed.color, parsed.source);
  };

  const addToHistory = (history = [], color) => {
    const value = rgbToHex(color, true);
    return Object.freeze([value, ...history.filter((item) => item !== value)].slice(0, HISTORY_LIMIT));
  };

  globalThis.MarkBenchColorFormatConverter = Object.freeze({
    HISTORY_LIMIT,
    DEFAULT_COLOR,
    WHITE,
    BLACK,
    parseAlpha,
    parseHex,
    rgbToHex,
    rgbToHsl,
    hslToRgb,
    rgbToHsv,
    hsvToRgb,
    parseSource,
    compositeOver,
    getRelativeLuminance,
    getContrastRatio,
    createResult,
    convert,
    addToHistory,
    formatNumber,
  });
})();
