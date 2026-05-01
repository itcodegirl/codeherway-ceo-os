export function resolveNextValue(nextValue, currentValue) {
  return typeof nextValue === 'function' ? nextValue(currentValue) : nextValue;
}

export function shallowEqualRecords(left, right) {
  if (Object.is(left, right)) {
    return true;
  }

  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  for (let index = 0; index < leftKeys.length; index += 1) {
    const key = leftKeys[index];
    if (!Object.prototype.hasOwnProperty.call(right, key)) {
      return false;
    }

    if (!Object.is(left[key], right[key])) {
      return false;
    }
  }

  return true;
}

export function shallowEqualRecordArrays(left, right) {
  if (Object.is(left, right)) {
    return true;
  }

  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return false;
  }

  for (let index = 0; index < left.length; index += 1) {
    if (!shallowEqualRecords(left[index], right[index])) {
      return false;
    }
  }

  return true;
}

export function replaceRecordById(items, id, nextItem, options = {}) {
  const {
    notFoundMessage = 'Record not found',
  } = options;
  const normalizedId = String(id || '');
  let didReplace = false;
  const sourceItems = Array.isArray(items) ? items : [];
  const nextItems = sourceItems.map((item) => {
    if (String(item?.id || '') !== normalizedId) {
      return item;
    }

    didReplace = true;
    return nextItem;
  });

  if (!didReplace) {
    throw new Error(notFoundMessage);
  }

  return nextItems;
}

export function deleteRecordById(items, id, options = {}) {
  const {
    notFoundMessage = 'Record not found',
  } = options;
  const normalizedId = String(id || '');
  const sourceItems = Array.isArray(items) ? items : [];
  const nextItems = sourceItems.filter((item) => String(item?.id || '') !== normalizedId);

  if (nextItems.length === sourceItems.length) {
    throw new Error(notFoundMessage);
  }

  return nextItems;
}
