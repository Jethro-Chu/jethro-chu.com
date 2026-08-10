export type QuestionCategory =
  | "probability"
  | "logic"
  | "patterns"
  | "quantitative"
  | "spatial";

export type DiagramId =
  | "grid-transform"
  | "cube-net"
  | "painted-cube"
  | "decagon";

export interface IQOption {
  id: string;
  text: string;
}

export interface IQQuestion {
  id: number;
  category: QuestionCategory;
  question: string;
  detail?: string;
  options: IQOption[];
  correctAnswer: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  explanation: string;
  diagram?: DiagramId;
}

export const categoryLabels: Record<QuestionCategory, string> = {
  probability: "Probability",
  logic: "Logic",
  patterns: "Pattern Recognition",
  quantitative: "Quantitative",
  spatial: "Spatial",
};

export const iqQuestions: IQQuestion[] = [
  {
    id: 1,
    category: "patterns",
    question: "A sequence repeats the same two-step cycle. What comes next?",
    detail: "2, 6, 5, 15, 14, 42, ?",
    options: [
      { id: "a", text: "40" },
      { id: "b", text: "41" },
      { id: "c", text: "43" },
      { id: "d", text: "126" },
    ],
    correctAnswer: "b",
    difficulty: 1,
    explanation:
      "The operations alternate: multiply by 3, then subtract 1. Thus 2 × 3 = 6, 6 − 1 = 5, 5 × 3 = 15, and so on. After 14 × 3 = 42, the next step is 42 − 1 = 41.",
  },
  {
    id: 2,
    category: "logic",
    question:
      "Four runners, A, B, C, and D, finish with no ties. B finishes ahead of D. A finishes behind B. C does not finish first. Who must finish first?",
    options: [
      { id: "a", text: "Runner A" },
      { id: "b", text: "Runner B" },
      { id: "c", text: "Runner C" },
      { id: "d", text: "Runner D" },
    ],
    correctAnswer: "b",
    difficulty: 1,
    explanation:
      "Both A and D must be behind B. If B were second, C would have to be first, which is forbidden. B also cannot be third or fourth because two runners must follow B. Therefore B must be first.",
  },
  {
    id: 3,
    category: "quantitative",
    question:
      "What is the smallest positive integer that leaves remainders 1, 2, and 3 when divided by 2, 3, and 4 respectively, and is divisible by 5?",
    options: [
      { id: "a", text: "25" },
      { id: "b", text: "35" },
      { id: "c", text: "45" },
      { id: "d", text: "55" },
    ],
    correctAnswer: "b",
    difficulty: 2,
    explanation:
      "Each remainder condition says the number is one less than a multiple of 2, 3, and 4. So n + 1 is a multiple of 12, giving n = 12k − 1. Testing multiples of 12, the first value divisible by 5 is 12 × 3 − 1 = 35.",
  },
  {
    id: 4,
    category: "probability",
    question:
      "One of two boxes is chosen at random. Box A contains 2 red balls and 1 blue ball. Box B contains 1 red ball and 2 blue balls. A red ball is drawn and not replaced. What is the probability that the next ball from the same box is also red?",
    options: [
      { id: "a", text: "1/4" },
      { id: "b", text: "1/3" },
      { id: "c", text: "2/5" },
      { id: "d", text: "1/2" },
    ],
    correctAnswer: "b",
    difficulty: 2,
    explanation:
      "After seeing red, Box A is twice as likely as Box B: P(A | red) = 2/3. From A, one of the two remaining balls is red, so the chance is (2/3)(1/2) = 1/3. From B, no red balls remain.",
  },
  {
    id: 5,
    category: "spatial",
    question:
      "The three marked cells are rotated 90° clockwise, then reflected left-to-right. Which cells are marked at the end?",
    options: [
      { id: "a", text: "Top-left, top-middle, and center" },
      { id: "b", text: "Top-middle, top-right, and center" },
      { id: "c", text: "Center, bottom-left, and bottom-middle" },
      { id: "d", text: "Top-left, center, and center-right" },
    ],
    correctAnswer: "a",
    difficulty: 2,
    explanation:
      "After the clockwise rotation, the marks occupy top-middle, top-right, and center. Reflecting left-to-right moves the two top marks to top-left and top-middle; the center stays fixed.",
    diagram: "grid-transform",
  },
  {
    id: 6,
    category: "logic",
    question:
      "A three-symbol code uses distinct symbols from A, B, C, and D. Each clue states all matches exactly. Which code fits?",
    detail:
      "ABD: 2 correct, both correctly placed\nACD: 2 correct, 1 correctly placed\nADB: 2 correct, 1 correctly placed",
    options: [
      { id: "a", text: "ABC" },
      { id: "b", text: "ACB" },
      { id: "c", text: "BAC" },
      { id: "d", text: "BCA" },
    ],
    correctAnswer: "a",
    difficulty: 2,
    explanation:
      "ABD fixes A in position 1 and B in position 2, while D is absent. In ACD, A is correctly placed and C is present but misplaced, so C must occupy position 3. ABC also satisfies the final clue: A is correctly placed and B is present in the wrong position.",
  },
  {
    id: 7,
    category: "probability",
    question:
      "Three distinct integers are chosen uniformly from 1 through 8. Given that the smallest chosen integer is 3, what is the probability that the largest is 7?",
    options: [
      { id: "a", text: "1/5" },
      { id: "b", text: "3/10" },
      { id: "c", text: "2/5" },
      { id: "d", text: "1/2" },
    ],
    correctAnswer: "b",
    difficulty: 3,
    explanation:
      "Once 3 is fixed as the minimum, choose the other two numbers from {4, 5, 6, 7, 8}. There are C(5,2) = 10 pairs. For 7 to be the maximum, it must be paired with 4, 5, or 6, giving 3 favorable pairs. The probability is 3/10.",
  },
  {
    id: 8,
    category: "patterns",
    question:
      "Each token has two independently generated parts. What token comes next?",
    detail: "B2, E6, J12, Q20, ?",
    options: [
      { id: "a", text: "W28" },
      { id: "b", text: "X30" },
      { id: "c", text: "Z28" },
      { id: "d", text: "Z30" },
    ],
    correctAnswer: "d",
    difficulty: 3,
    explanation:
      "The letter positions are 2, 5, 10, 17: each is n² + 1 for n = 1, 2, 3, 4, so the next is 26, or Z. The numbers are n(n + 1): 2, 6, 12, 20, then 30. The next token is Z30.",
  },
  {
    id: 9,
    category: "logic",
    question:
      "Four books W, X, Y, and Z occupy four shelf positions. X is left of Z. W is not adjacent to X. Y is exactly two positions from W. Z is not rightmost. What is the order from left to right?",
    options: [
      { id: "a", text: "X Y Z W" },
      { id: "b", text: "X Z Y W" },
      { id: "c", text: "Y X Z W" },
      { id: "d", text: "X Y W Z" },
    ],
    correctAnswer: "a",
    difficulty: 3,
    explanation:
      "Y and W must be two positions apart. Testing the possible placements while keeping X left of a non-rightmost Z leaves only X, Y, Z, W. It satisfies every clue: X is left of Z, W is not adjacent to X, Y and W are two positions apart, and Z is third.",
  },
  {
    id: 10,
    category: "quantitative",
    question:
      "A four-digit number has the form ABBA, where A and B are digits and A is nonzero. The number is divisible by 45. What is the smallest possible number?",
    options: [
      { id: "a", text: "5005" },
      { id: "b", text: "5225" },
      { id: "c", text: "5445" },
      { id: "d", text: "5665" },
    ],
    correctAnswer: "c",
    difficulty: 3,
    explanation:
      "Divisibility by 5 forces the last digit A to be 5. Divisibility by 9 requires the digit sum 2A + 2B = 10 + 2B to be a multiple of 9. The smallest possible B is 4, giving digit sum 18 and number 5445.",
  },
  {
    id: 11,
    category: "spatial",
    question: "The diagram is folded into a cube. Which face is opposite B?",
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "C" },
      { id: "c", text: "D" },
      { id: "d", text: "F" },
    ],
    correctAnswer: "d",
    difficulty: 3,
    explanation:
      "A and C fold onto opposite side faces. D and E become the top and bottom. The final flap F folds around to close the cube directly opposite the central face B.",
    diagram: "cube-net",
  },
  {
    id: 12,
    category: "probability",
    question:
      "A fair six-sided die is rolled until a 6 appears or until three rolls have occurred, whichever comes first. What is the expected number of rolls?",
    options: [
      { id: "a", text: "25/12" },
      { id: "b", text: "5/2" },
      { id: "c", text: "91/36" },
      { id: "d", text: "18/7" },
    ],
    correctAnswer: "c",
    difficulty: 3,
    explanation:
      "A first roll always occurs. A second occurs with probability 5/6, and a third occurs with probability (5/6)². Therefore E = 1 + 5/6 + 25/36 = 91/36.",
  },
  {
    id: 13,
    category: "logic",
    question:
      "A, B, C, and D each either always tell the truth or always lie. They say the following. Which conclusion must be true?",
    detail:
      "A: Exactly one of B, C, and D is truthful.\nB: A and C are the same type.\nC: B and D are different types.\nD: A is lying.",
    options: [
      { id: "a", text: "A lies and D tells the truth" },
      { id: "b", text: "A and B both lie" },
      { id: "c", text: "B tells the truth and C lies" },
      { id: "d", text: "C and D both tell the truth" },
    ],
    correctAnswer: "a",
    difficulty: 3,
    explanation:
      "Suppose D lies. Then D's claim is false, so A is truthful. A's statement then requires exactly one of B and C to be truthful. But B says A and C match: with A truthful, B is truthful exactly when C is truthful, making B and C equal, not one-of-two. Contradiction. Thus D is truthful and A lies. The remaining statements allow two cases, but both preserve that conclusion.",
  },
  {
    id: 14,
    category: "patterns",
    question: "Two interleaved sequences occupy alternating positions. What comes next?",
    detail: "2, 3, 6, 8, 18, 15, 54, 24, ?",
    options: [
      { id: "a", text: "72" },
      { id: "b", text: "81" },
      { id: "c", text: "162" },
      { id: "d", text: "216" },
    ],
    correctAnswer: "c",
    difficulty: 4,
    explanation:
      "The odd-position terms are 2, 6, 18, 54, each multiplied by 3, so the next odd-position term is 162. The even-position terms follow a separate pattern: 3, 8, 15, 24, with successive increases of 5, 7, and 9.",
  },
  {
    id: 15,
    category: "probability",
    question:
      "Machines A, B, and C make 50%, 30%, and 20% of a factory's output. Their defect rates are 1%, 2%, and 4% respectively. A randomly selected item is defective. What is the probability it came from machine C?",
    options: [
      { id: "a", text: "4/15" },
      { id: "b", text: "2/7" },
      { id: "c", text: "8/19" },
      { id: "d", text: "1/2" },
    ],
    correctAnswer: "c",
    difficulty: 4,
    explanation:
      "For every unit of total output, defective shares are 0.50×0.01 = 0.005 from A, 0.30×0.02 = 0.006 from B, and 0.20×0.04 = 0.008 from C. Conditional on a defect, C's share is 0.008/(0.005 + 0.006 + 0.008) = 8/19.",
  },
  {
    id: 16,
    category: "quantitative",
    question:
      "Two distinct positive integers sum to 20. What is the largest possible value of their greatest common divisor?",
    options: [
      { id: "a", text: "4" },
      { id: "b", text: "5" },
      { id: "c", text: "8" },
      { id: "d", text: "10" },
    ],
    correctAnswer: "b",
    difficulty: 4,
    explanation:
      "Write the numbers as ga and gb, where g is their greatest common divisor and a, b are distinct coprime positive integers. Then g(a + b) = 20. Since distinct positive a and b have a + b at least 3, g is at most 20/3 and must divide 20. The largest candidate is 5, achieved by 5 and 15.",
  },
  {
    id: 17,
    category: "logic",
    question:
      "Five talks A, B, C, D, and E are scheduled in order. B is immediately before D. A is after C. E is neither first nor last. Exactly one talk is between A and B. C is before E. A is not second. What is the schedule?",
    options: [
      { id: "a", text: "C E B D A" },
      { id: "b", text: "C A E B D" },
      { id: "c", text: "E C B D A" },
      { id: "d", text: "C B D E A" },
    ],
    correctAnswer: "a",
    difficulty: 4,
    explanation:
      "Treat BD as a fixed block. The one-gap condition places A two positions from B. Combining that with C before both A and E, while E is internal, leaves C E B D A. Each alternative violates at least one of the immediate-order, gap, or endpoint clues.",
  },
  {
    id: 18,
    category: "spatial",
    question:
      "Only the top, front, and right faces of a 4 × 4 × 4 cube are painted. The cube is cut into 64 unit cubes. How many unit cubes have exactly two painted faces?",
    options: [
      { id: "a", text: "6" },
      { id: "b", text: "9" },
      { id: "c", text: "12" },
      { id: "d", text: "15" },
    ],
    correctAnswer: "b",
    difficulty: 4,
    explanation:
      "The three painted faces meet along three painted-pair edges: top-front, top-right, and front-right. Each edge has 4 cubes, but the common top-front-right corner has three painted faces and must be excluded. Each edge therefore contributes 3 cubes with exactly two painted faces, for 3 × 3 = 9.",
    diagram: "painted-cube",
  },
  {
    id: 19,
    category: "probability",
    question:
      "A fair coin is flipped until either HHT or THH first appears as three consecutive outcomes. What is the probability that HHT appears first?",
    options: [
      { id: "a", text: "1/4" },
      { id: "b", text: "1/3" },
      { id: "c", text: "1/2" },
      { id: "d", text: "2/3" },
    ],
    correctAnswer: "a",
    difficulty: 4,
    explanation:
      "If the first flip is T, every later run toward HHT is preempted by THH, so HHT cannot win. If the first flip is H, the next flip must also be H; a T would reset the relevant ending to T, again favoring THH. After HH, HHT eventually wins when the next T arrives. Thus HHT wins exactly when the first two flips are HH, with probability 1/4.",
  },
  {
    id: 20,
    category: "patterns",
    question: "What is the next term?",
    detail: "1, 2, 6, 21, 88, ?",
    options: [
      { id: "a", text: "440" },
      { id: "b", text: "441" },
      { id: "c", text: "444" },
      { id: "d", text: "445" },
    ],
    correctAnswer: "d",
    difficulty: 4,
    explanation:
      "Multiply by an increasing integer, then add that same integer: 1×1+1=2, 2×2+2=6, 6×3+3=21, and 21×4+4=88. Next is 88×5+5=445.",
  },
  {
    id: 21,
    category: "probability",
    question:
      "Three distinct tickets are drawn in order from tickets numbered 1 through 8. Given that the third ticket is larger than each of the first two, what is the probability that the first two numbers sum to more than the third?",
    options: [
      { id: "a", text: "3/8" },
      { id: "b", text: "11/28" },
      { id: "c", text: "5/12" },
      { id: "d", text: "3/7" },
    ],
    correctAnswer: "b",
    difficulty: 5,
    explanation:
      "There are 112 eligible ordered triples: for each possible third value k, choose and order two values below it, giving Σ(k−1)(k−2) for k=3 through 8. Favorable ordered pairs number 0, 2, 4, 8, 12, and 18 for k=3 through 8, totaling 44. Therefore the probability is 44/112 = 11/28.",
  },
  {
    id: 22,
    category: "logic",
    question:
      "A four-digit code uses four distinct digits from 1 through 6. In each clue, the counts are exact. Which code fits all four clues?",
    detail:
      "2415: 1 correct and placed, 1 correct but misplaced\n2453: 0 correct and placed, 2 correct but misplaced\n6253: 0 correct and placed, 3 correct but misplaced\n1362: 0 correct and placed, 3 correct but misplaced",
    options: [
      { id: "a", text: "3165" },
      { id: "b", text: "3516" },
      { id: "c", text: "3612" },
      { id: "d", text: "5316" },
    ],
    correctAnswer: "b",
    difficulty: 5,
    explanation:
      "Apply the clues as exact filters. The first two clues leave 12 possible codes. Adding 6253 reduces them to 1365, 1635, 3165, 3516, 3612, and 5316. Of those, only 3516 has exactly three digits from 1362 with all three misplaced. Direct checking confirms it also matches every earlier clue.",
  },
  {
    id: 23,
    category: "patterns",
    question: "The numerators and denominators follow interacting rules. Which fraction is written next?",
    detail: "1/2, 2/3, 6/5, 30/8, 240/13, ?",
    options: [
      { id: "a", text: "3120/18" },
      { id: "b", text: "3120/21" },
      { id: "c", text: "3360/21" },
      { id: "d", text: "6240/21" },
    ],
    correctAnswer: "b",
    difficulty: 5,
    explanation:
      "The denominators are consecutive Fibonacci values: 2, 3, 5, 8, 13, then 21. Each new numerator equals the previous numerator times the previous denominator: 1×2=2, 2×3=6, 6×5=30, and 30×8=240. Thus the next numerator is 240×13=3120, giving 3120/21.",
  },
  {
    id: 24,
    category: "quantitative",
    question:
      "A positive integer n has exactly 12 positive divisors, while n² has exactly 45 positive divisors. What is the smallest possible value of n?",
    options: [
      { id: "a", text: "48" },
      { id: "b", text: "60" },
      { id: "c", text: "72" },
      { id: "d", text: "84" },
    ],
    correctAnswer: "b",
    difficulty: 5,
    explanation:
      "If n has prime exponents aᵢ, its divisor counts are ∏(aᵢ+1)=12 and ∏(2aᵢ+1)=45 for n². The only compatible exponent pattern is 2,1,1: it gives 3×2×2=12 and 5×3×3=45. So n=p²qr for distinct primes. The smallest choice is 2²×3×5=60.",
  },
  {
    id: 25,
    category: "probability",
    question:
      "Four vertices of a regular decagon are chosen uniformly. Given that no two chosen vertices are adjacent, what is the probability that the four vertices form a rectangle?",
    options: [
      { id: "a", text: "1/10" },
      { id: "b", text: "1/5" },
      { id: "c", text: "1/4" },
      { id: "d", text: "2/5" },
    ],
    correctAnswer: "b",
    difficulty: 5,
    explanation:
      "Let N be the number of nonadjacent four-vertex sets. Distinguish one chosen vertex in each set. There are 10 choices for it, and the six unchosen vertices can be split into four positive gaps in C(5,3)=10 ways. Since each set was counted four times, N=10×10/4=25. A rectangle must use two pairs of opposite vertices. Of the C(5,2)=10 diameter-pairs, 5 create adjacent vertices, leaving 5 valid rectangles. The probability is 5/25=1/5.",
    diagram: "decagon",
  },
];

export function getQuestion(id: number) {
  return iqQuestions.find((question) => question.id === id);
}
