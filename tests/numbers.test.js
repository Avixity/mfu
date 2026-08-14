import { describe, expect, it } from "vitest";

import {
  birthdayPairProbability,
  countDistinctArrangements,
  countDivisors,
  digitalRoot,
  formatPrimeFactorization,
  isFibonacci,
  isPalindrome,
  isPerfectSquare,
  isPrime,
  isTriangular,
  nextPalindrome,
  nextPrime,
  previousPalindrome,
  primeFactorization,
  primeFactors,
  specificBirthdayProbability,
  sumDivisors,
  toRoman,
} from "../src/calculations/numbers.js";

describe("number properties", () => {
  it("detects prime and composite ages", () => {
    expect(isPrime(2)).toBe(true);
    expect(isPrime(2_753)).toBe(true);
    expect(isPrime(5_506)).toBe(false);
    expect(isPrime(1)).toBe(false);
    expect(isPrime(0)).toBe(false);
  });

  it("creates complete flat and grouped prime factorisations", () => {
    expect(primeFactors(360)).toEqual([2, 2, 2, 3, 3, 5]);
    expect(primeFactorization(360)).toEqual([
      { prime: 2, exponent: 3 },
      { prime: 3, exponent: 2 },
      { prime: 5, exponent: 1 },
    ]);
    expect(formatPrimeFactorization(360)).toBe("2³ × 3² × 5");
    expect(primeFactors(1)).toEqual([]);
  });

  it("calculates divisor count and sum", () => {
    expect(countDivisors(360)).toBe(24);
    expect(sumDivisors(360)).toBe(1_170);
    expect(countDivisors(1)).toBe(1);
    expect(sumDivisors(1)).toBe(1);
  });

  it("detects palindromic, triangular, square and Fibonacci numbers", () => {
    expect(isPalindrome(5_445)).toBe(true);
    expect(isPalindrome(5_506)).toBe(false);
    expect(isTriangular(15)).toBe(true);
    expect(isTriangular(14)).toBe(false);
    expect(isPerfectSquare(144)).toBe(true);
    expect(isPerfectSquare(145)).toBe(false);
    expect(isFibonacci(610)).toBe(true);
    expect(isFibonacci(611)).toBe(false);
  });

  it("finds strict next and previous special ages", () => {
    expect(nextPrime(0)).toBe(2);
    expect(nextPrime(10)).toBe(11);
    expect(nextPrime(11)).toBe(13);
    expect(nextPalindrome(5_506)).toBe(5_555);
    expect(nextPalindrome(9_999)).toBe(10_001);
    expect(previousPalindrome(5_506)).toBe(5_445);
    expect(previousPalindrome(1_001)).toBe(999);
    expect(previousPalindrome(0)).toBeNull();
  });

  it("calculates digital roots and standard Roman numerals", () => {
    expect(digitalRoot(5_506)).toBe(7);
    expect(digitalRoot(0)).toBe(0);
    expect(toRoman(2_024)).toBe("MMXXIV");
    expect(toRoman(5_506)).toBeNull();
  });

  it("counts distinct digit arrangements", () => {
    expect(countDistinctArrangements("18-07-2011")).toBe(3_360);
    expect(countDistinctArrangements("111")).toBe(1);
  });
});

describe("birthday probabilities", () => {
  it("calculates the chance that any pair shares a birthday", () => {
    expect(birthdayPairProbability(2)).toBeCloseTo(1 / 365, 12);
    expect(birthdayPairProbability(23)).toBeCloseTo(0.5072972343, 10);
    expect(birthdayPairProbability(366)).toBe(1);
  });

  it("separately calculates a match with the visitor's birthday", () => {
    expect(specificBirthdayProbability(2)).toBeCloseTo(1 / 365, 12);
    expect(specificBirthdayProbability(23)).toBeCloseTo(1 - (364 / 365) ** 22, 12);
    expect(specificBirthdayProbability(23)).toBeLessThan(birthdayPairProbability(23));
  });
});
