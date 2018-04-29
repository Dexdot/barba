export const prevAll = el => {
  const result = [];

  while ((el = el.previousElementSibling)) result.push(el);
  return result;
};

export const nextAll = el => {
  let next = false;
  return [].filter.call(el.parentNode.children, function(child) {
    if (child === el) next = true;
    return next && child !== el;
  });
};
