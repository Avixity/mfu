function assertNonNegativeSafeInteger(value, name = "Value") {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer.`);
  }
}

function assertPositiveSafeInteger(value, name = "Value") {
  assertNonNegativeSafeInteger(value, name);
  if (value === 0) throw new RangeError(`${name} must be greater than zero.`);
}

export function isPrime(value) {
  if (!Number.isSafeInteger(value) || value < 2) return false;
  if (value === 2) return true;
  if (value % 2 === 0) return false;
  for (let divisor = 3; divisor <= Math.sqrt(value); divisor += 2) {
    if (value % divisor === 0) return false;
  }
  return true;
}

/** Flat list, for example primeFactors(72) -> [2, 2, 2, 3, 3]. */
export function primeFactors(value) {
  assertPositiveSafeInteger(value);
  const factors = [];
  let remainder = value;

  while (remainder % 2 === 0) {
    factors.push(2);
    remainder /= 2;
  }
  for (let divisor = 3; divisor <= Math.sqrt(remainder); divisor += 2) {
    while (remainder % divisor === 0) {
      factors.push(divisor);
      remainder /= divisor;
    }
  }
  if (remainder > 1) factors.push(remainder);
  return factors;
}

/** Grouped factorisation, for example 72 -> [{ prime: 2, exponent: 3 }, ...]. */
export function primeFactorization(value) {
  return primeFactors(value).reduce((groups, prime) => {
    const last = groups.at(-1);
    if (last?.prime === prime) last.exponent += 1;
    else groups.push({ prime, exponent: 1 });
    return groups;
  }, []);
}

export const primeFactorisation = primeFactorization;

const SUPERSCRIPT_DIGITS = Object.freeze({
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "-": "⁻",
});

function exponentToSuperscript(exponent) {
  return String(exponent)
    .split("")
    .map((character) => SUPERSCRIPT_DIGITS[character] ?? character)
    .join("");
}

export function formatPrimeFactorization(value) {
  if (value === 1) return "1";
  return primeFactorization(value)
    .map(({ prime, exponent }) => `${prime}${exponent === 1 ? "" : exponentToSuperscript(exponent)}`)
    .join(" × ");
}

export const formatPrimeFactorisation = formatPrimeFactorization;

export function divisors(value) {
  assertPositiveSafeInteger(value);
  const lower = [];
  const upper = [];
  for (let divisor = 1; divisor <= Math.sqrt(value); divisor += 1) {
    if (value % divisor !== 0) continue;
    lower.push(divisor);
    if (divisor !== value / divisor) upper.push(value / divisor);
  }
  return lower.concat(upper.reverse());
}

export function countDivisors(value) {
  assertPositiveSafeInteger(value);
  return primeFactorization(value).reduce((product, factor) => product * (factor.exponent + 1), 1);
}

export const numberOfFactors = countDivisors;

export function sumDivisors(value) {
  assertPositiveSafeInteger(value);
  return primeFactorization(value).reduce(
    (product, { prime, exponent }) =>
      product * ((prime ** (exponent + 1) - 1) / (prime - 1)),
    1,
  );
}

export const sumOfFactors = sumDivisors;

export function isPalindrome(value) {
  if (!Number.isSafeInteger(value) || value < 0) return false;
  const text = String(value);
  return text === [...text].reverse().join("");
}

export const isPalindromeNumber = isPalindrome;

export function isPerfectSquare(value) {
  if (!Number.isSafeInteger(value) || value < 0) return false;
  const root = Math.floor(Math.sqrt(value));
  return root * root === value;
}

export function isTriangular(value) {
  if (!Number.isSafeInteger(value) || value < 0) return false;
  const discriminant = 8 * value + 1;
  return Number.isSafeInteger(discriminant) && isPerfectSquare(discriminant);
}

export const isTriangularNumber = isTriangular;

export function isFibonacci(value) {
  if (!Number.isSafeInteger(value) || value < 0) return false;
  const fiveSquared = 5 * value * value;
  if (!Number.isSafeInteger(fiveSquared)) {
    // Iteration avoids overflow in the 5n² ± 4 identity for unusually large n.
    let previous = 0;
    let current = 1;
    while (current < value && Number.isSafeInteger(current)) {
      [previous, current] = [current, previous + current];
    }
    return value === 0 || current === value;
  }
  return isPerfectSquare(fiveSquared + 4) || isPerfectSquare(fiveSquared - 4);
}

export const isFibonacciNumber = isFibonacci;

export function digitalRoot(value) {
  assertNonNegativeSafeInteger(value);
  return value === 0 ? 0 : 1 + ((value - 1) % 9);
}

/** Return the first prime strictly greater than value. */
export function nextPrime(value) {
  assertNonNegativeSafeInteger(value);
  if (value >= Number.MAX_SAFE_INTEGER - 2) throw new RangeError("No safe-integer search space remains.");
  if (value < 2) return 2;
  let candidate = value + 1;
  if (candidate > 2 && candidate % 2 === 0) candidate += 1;
  while (!isPrime(candidate)) {
    candidate += candidate === 2 ? 1 : 2;
    if (!Number.isSafeInteger(candidate)) throw new RangeError("Next prime exceeds safe integer range.");
  }
  return candidate;
}

export const nextPrimeNumber = nextPrime;

function palindromeFromPrefix(prefixText, oddLength) {
  const mirrored = oddLength
    ? prefixText + [...prefixText.slice(0, -1)].reverse().join("")
    : prefixText + [...prefixText].reverse().join("");
  return Number(mirrored);
}

/** Return the first non-negative decimal palindrome strictly greater than value. */
export function nextPalindrome(value) {
  assertNonNegativeSafeInteger(value);
  if (value >= Number.MAX_SAFE_INTEGER - 1) throw new RangeError("No safe-integer search space remains.");
  const target = value + 1;
  const text = String(target);
  const prefixLength = Math.ceil(text.length / 2);
  let prefix = Number(text.slice(0, prefixLength));
  let result = palindromeFromPrefix(String(prefix), text.length % 2 === 1);
  if (result < target) {
    prefix += 1;
    const prefixText = String(prefix);
    if (prefixText.length > prefixLength) {
      result = 10 ** text.length + 1;
    } else {
      result = palindromeFromPrefix(prefixText, text.length % 2 === 1);
    }
  }
  if (!Number.isSafeInteger(result)) throw new RangeError("Next palindrome exceeds safe integer range.");
  return result;
}

export const nextPalindromicNumber = nextPalindrome;

/** Return the first non-negative decimal palindrome strictly below value. */
export function previousPalindrome(value) {
  assertNonNegativeSafeInteger(value);
  if (value === 0) return null;
  const target = value - 1;
  if (target < 10) return target;

  const text = String(target);
  const prefixLength = Math.ceil(text.length / 2);
  let prefix = Number(text.slice(0, prefixLength));
  let result = palindromeFromPrefix(String(prefix), text.length % 2 === 1);
  if (result > target) {
    prefix -= 1;
    const prefixText = String(prefix);
    if (prefix <= 0 || prefixText.length < prefixLength) {
      result = Number("9".repeat(text.length - 1));
    } else {
      result = palindromeFromPrefix(prefixText, text.length % 2 === 1);
    }
  }
  return result;
}

export const previousPalindromicNumber = previousPalindrome;

/** Standard subtractive Roman numerals. Values outside 1–3999 return null. */
export function toRoman(value) {
  if (!Number.isInteger(value) || value < 1 || value > 3_999) return null;
  const symbols = [
    [1_000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let remainder = value;
  let result = "";
  for (const [amount, symbol] of symbols) {
    while (remainder >= amount) {
      result += symbol;
      remainder -= amount;
    }
  }
  return result;
}

export const toRomanNumeral = toRoman;

export function toBinary(value) {
  assertNonNegativeSafeInteger(value);
  return value.toString(2);
}

export function toHexadecimal(value) {
  assertNonNegativeSafeInteger(value);
  return value.toString(16).toUpperCase();
}

/**
 * Probability that at least one pair shares a birthday among roomSize people.
 * Assumes 365 equally likely birthdays and ignores 29 February.
 */
export function birthdayPairProbability(roomSize, possibleBirthdays = 365) {
  assertNonNegativeSafeInteger(roomSize, "Room size");
  assertPositiveSafeInteger(possibleBirthdays, "Possible birthdays");
  if (roomSize < 2) return 0;
  if (roomSize > possibleBirthdays) return 1;

  let allDifferent = 1;
  for (let index = 0; index < roomSize; index += 1) {
    allDifferent *= (possibleBirthdays - index) / possibleBirthdays;
  }
  return 1 - allDifferent;
}

/** Probability one of the other room members shares this visitor's birthday. */
export function specificBirthdayProbability(roomSize, possibleBirthdays = 365) {
  assertNonNegativeSafeInteger(roomSize, "Room size");
  assertPositiveSafeInteger(possibleBirthdays, "Possible birthdays");
  if (roomSize < 2) return 0;
  return 1 - ((possibleBirthdays - 1) / possibleBirthdays) ** (roomSize - 1);
}

export const birthdayMatchProbability = birthdayPairProbability;
export const yourBirthdayMatchProbability = specificBirthdayProbability;

function factorial(value) {
  let product = 1;
  for (let number = 2; number <= value; number += 1) product *= number;
  return product;
}

/** Number of distinct arrangements of characters, accounting for repeats. */
export function countDistinctArrangements(value) {
  const characters = [...String(value).replace(/\D/g, "")];
  if (characters.length === 0) return 0;
  const frequencies = new Map();
  for (const character of characters) {
    frequencies.set(character, (frequencies.get(character) ?? 0) + 1);
  }
  const denominator = [...frequencies.values()].reduce(
    (product, frequency) => product * factorial(frequency),
    1,
  );
  return factorial(characters.length) / denominator;
}

export function getNumberProperties(value) {
  assertNonNegativeSafeInteger(value);
  const hasFiniteDivisorSet = value > 0;
  return {
    value,
    decimal: String(value),
    binary: toBinary(value),
    hexadecimal: toHexadecimal(value),
    roman: toRoman(value),
    prime: isPrime(value),
    composite: value > 1 && !isPrime(value),
    factorization: hasFiniteDivisorSet ? primeFactorization(value) : [],
    factorizationText: hasFiniteDivisorSet ? formatPrimeFactorization(value) : "Not defined for 0",
    factorCount: hasFiniteDivisorSet ? countDivisors(value) : null,
    factorSum: hasFiniteDivisorSet ? sumDivisors(value) : null,
    parity: value % 2 === 0 ? "even" : "odd",
    palindrome: isPalindrome(value),
    triangular: isTriangular(value),
    perfectSquare: isPerfectSquare(value),
    fibonacci: isFibonacci(value),
    digitalRoot: digitalRoot(value),
    nextPrime: nextPrime(value),
    nextPalindrome: nextPalindrome(value),
    previousPalindrome: previousPalindrome(value),
  };
}

export const numberProperties = getNumberProperties;
