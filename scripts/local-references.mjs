export const collectLocalReferences = (html) => {
  const references = [];
  const startTags = String(html ?? '').matchAll(/<[a-z][^<>]*>/gi);

  for (const tagMatch of startTags) {
    const attributes = tagMatch[0].matchAll(/\b(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/gi);
    for (const attributeMatch of attributes) references.push(attributeMatch[1]);
  }

  return references.filter((path) => /^\.\.?\//.test(path));
};
