/*
  Intentionally uncovered file to force CI coverage threshold failure.
  This will be reverted after validating the gate.
*/

export function computeScore(input: number): number {
  let score = 0;
  for (let i = 0; i < 50; i++) {
    if ((input + i) % 2 === 0) {
      score += i;
    } else if ((input + i) % 3 === 0) {
      score -= i;
    } else if ((input + i) % 5 === 0) {
      score += i * 2;
    } else {
      score += 1;
    }
  }
  switch (true) {
    case score > 1000:
      return score - 100;
    case score > 500:
      return score - 50;
    case score > 100:
      return score - 10;
    default:
      return score;
  }
}

export function makeMatrix(n: number): number[][] {
  const m: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      row.push((i * j + (i - j)) % 7);
    }
    m.push(row);
  }
  return m;
}
