function readOutputTextValue(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => readOutputTextValue(entry))
      .filter(Boolean)
      .join('\n\n');
  }

  return '';
}

export function extractChiefResponseText(payload) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const outputText = readOutputTextValue(payload.output_text);
  if (outputText) {
    return outputText;
  }

  if (!Array.isArray(payload.output)) {
    return '';
  }

  const textParts = [];

  payload.output.forEach((item) => {
    if (!Array.isArray(item?.content)) {
      return;
    }

    item.content.forEach((contentPart) => {
      if (contentPart?.type !== 'output_text') {
        return;
      }

      const parsedText = readOutputTextValue(contentPart.text);
      if (parsedText) {
        textParts.push(parsedText);
      }
    });
  });

  return textParts.filter(Boolean).join('\n\n');
}
