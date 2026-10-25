(() => {
  const toWords = (value) => value
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.toLocaleLowerCase());

  const capitalize = (word) => word
    ? `${word.charAt(0).toLocaleUpperCase()}${word.slice(1)}`
    : '';

  const convertCases = (value) => {
    const words = toWords(value);
    const upperWords = words.map((word) => word.toLocaleUpperCase());

    return [
      { key: 'space-upper', label: 'SPACE CASE', value: upperWords.join(' ') },
      { key: 'space', label: 'space case', value: words.join(' ') },
      { key: 'space-title', label: 'Space Case', value: words.map(capitalize).join(' ') },
      { key: 'kebab-upper', label: 'KEBAB-CASE', value: upperWords.join('-') },
      { key: 'kebab', label: 'kebab-case', value: words.join('-') },
      { key: 'snake-upper', label: 'SNAKE_CASE', value: upperWords.join('_') },
      { key: 'snake', label: 'snake_case', value: words.join('_') },
      { key: 'pascal', label: 'PascalCase', value: words.map(capitalize).join('') },
      { key: 'camel', label: 'camelCase', value: words.map((word, index) => index === 0 ? word : capitalize(word)).join('') },
    ];
  };

  window.CodingNoteTextCase = Object.freeze({ convertCases });
})();
