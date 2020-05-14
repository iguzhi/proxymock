function parseRegExpRule(key, rule) {
  const l = /(\^)?\s*([a-zA-Z]+)\s+\/(.+)\/([img]*)/.exec(key);
  if (l) {
    return {
      key,
      phaseFlag: l[1],
      method: l[2],
      regexp: new RegExp(l[3], l[4]),
      rule
    };
  }
}

function parseRegExpRules(rules = {}) {
  const regexpRules = Object.create(null);
  for (let key in rules) {
    const r = parseRegExpRule(key, rules[key]);
    if (r) {
      regexpRules[key] = r;
      // delete rules[key];
    }
  }
  return regexpRules;
}

module.exports = {
  parseRegExpRule,
  parseRegExpRules
};
