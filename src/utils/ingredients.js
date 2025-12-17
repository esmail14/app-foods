// Helpers to parse ingredient line and aggregate ingredients
// Very simple parser: tries to extract leading number and optional unit.
// Examples:
// "2 kg patata" => { amount: 2, unit: 'kg', name: 'patata' }
// "tomate" => { name: 'tomate' }

export function parseIngredientLine(line) {
  if (!line || !line.trim()) return null;
  const parts = line.trim().split(/\s+/);
  let amount = null, unit = null, name = null;
  // if first token is a number
  const first = parts[0].replace(',', '.');
  if (!isNaN(first)) {
    amount = Number(first);
    if (parts.length >= 3) {
      unit = parts[1];
      name = parts.slice(2).join(' ');
    } else if (parts.length === 2) {
      name = parts[1];
    } else {
      name = '';
    }
  } else {
    // maybe first token like "2kg" or "200g"
    const m = first.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)$/);
    if (m) {
      amount = Number(m[1]);
      unit = m[2];
      name = parts.slice(1).join(' ');
    } else {
      // no number: whole line is name
      name = parts.join(' ');
    }
  }
  return { name: name?.toLowerCase().trim(), amount: amount ?? null, unit: unit ?? null };
}

export function aggregateIngredients(ingredients) {
  // returns array of { name, unit, totalAmount }
  const map = {};
  ingredients.forEach((ing) => {
    const key = (ing.name || '').toLowerCase().trim() + '||' + (ing.unit || '');
    if (!map[key]) {
      map[key] = { name: ing.name, unit: ing.unit, totalAmount: ing.amount ?? null };
    } else {
      if (ing.amount != null && map[key].totalAmount != null) {
        map[key].totalAmount += ing.amount;
      } else if (ing.amount != null && map[key].totalAmount == null) {
        map[key].totalAmount = ing.amount;
      }
      // if both null, keep null
    }
  });
  return Object.values(map);
}

export function subtractPantry(aggregated, pantry) {
  // for each aggregated item, subtract pantry item with same name and unit if possible
  const result = aggregated.map(a => ({ ...a })); // clone
  pantry.forEach(p => {
    const name = (p.name || '').toLowerCase().trim();
    const unit = p.unit ?? '';
    for (let i=0;i<result.length;i++) {
      const r = result[i];
      if ((r.name || '').toLowerCase().trim() === name && (r.unit ?? '') === unit) {
        if (r.totalAmount == null) {
          // can't decrement unknown totals: remove entirely
          result[i] = null;
        } else {
          r.totalAmount -= (p.amount || 0);
          if (r.totalAmount <= 0) result[i] = null;
        }
      }
    }
  });
  return result.filter(Boolean);
}