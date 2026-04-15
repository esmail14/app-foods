/**
 * @jest-environment node
 */
import { parseIngredientLine, aggregateIngredients, subtractPantry } from '../src/utils/ingredients';

describe('parseIngredientLine', () => {
  it('parses "2 kg patata" correctly', () => {
    const result = parseIngredientLine('2 kg patata');
    expect(result).toEqual({ name: 'patata', amount: 2, unit: 'kg' });
  });

  it('parses "tomate" (no amount) correctly', () => {
    const result = parseIngredientLine('tomate');
    expect(result).toEqual({ name: 'tomate', amount: null, unit: null });
  });

  it('parses "200g harina" (compact format) correctly', () => {
    const result = parseIngredientLine('200g harina');
    expect(result).toEqual({ name: 'harina', amount: 200, unit: 'g' });
  });

  it('normalizes comma decimal separator "1,5 l leche"', () => {
    const result = parseIngredientLine('1,5 l leche');
    expect(result).toEqual({ name: 'leche', amount: 1.5, unit: 'l' });
  });

  it('returns null for empty string', () => {
    expect(parseIngredientLine('')).toBeNull();
    expect(parseIngredientLine('   ')).toBeNull();
  });

  it('lowercases ingredient name', () => {
    const result = parseIngredientLine('2 kg Patata');
    expect(result.name).toBe('patata');
  });
});

describe('aggregateIngredients', () => {
  it('sums same ingredient and unit', () => {
    const ingredients = [
      { name: 'patata', unit: 'kg', amount: 1 },
      { name: 'patata', unit: 'kg', amount: 2 },
    ];
    const result = aggregateIngredients(ingredients);
    expect(result).toHaveLength(1);
    expect(result[0].totalAmount).toBe(3);
  });

  it('keeps different units separate', () => {
    const ingredients = [
      { name: 'agua', unit: 'l', amount: 1 },
      { name: 'agua', unit: 'ml', amount: 500 },
    ];
    const result = aggregateIngredients(ingredients);
    expect(result).toHaveLength(2);
  });

  it('handles null amounts', () => {
    const ingredients = [
      { name: 'sal', unit: null, amount: null },
      { name: 'sal', unit: null, amount: null },
    ];
    const result = aggregateIngredients(ingredients);
    expect(result).toHaveLength(1);
    expect(result[0].totalAmount).toBeNull();
  });
});

describe('subtractPantry', () => {
  it('removes ingredient fully covered by pantry', () => {
    const aggregated = [{ name: 'patata', unit: 'kg', totalAmount: 2 }];
    const pantry = [{ name: 'patata', unit: 'kg', amount: 2 }];
    const result = subtractPantry(aggregated, pantry);
    expect(result).toHaveLength(0);
  });

  it('reduces partial pantry coverage', () => {
    const aggregated = [{ name: 'patata', unit: 'kg', totalAmount: 3 }];
    const pantry = [{ name: 'patata', unit: 'kg', amount: 1 }];
    const result = subtractPantry(aggregated, pantry);
    expect(result).toHaveLength(1);
    expect(result[0].totalAmount).toBe(2);
  });

  it('does not affect unrelated ingredients', () => {
    const aggregated = [{ name: 'tomate', unit: 'kg', totalAmount: 1 }];
    const pantry = [{ name: 'patata', unit: 'kg', amount: 1 }];
    const result = subtractPantry(aggregated, pantry);
    expect(result).toHaveLength(1);
  });
});
