import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

const FALLBACK_TIPS = [
  "Look for 10, J, Q, K to make a Niu (Bull).",
  "Try to find three cards that sum to a multiple of 10.",
  "High cards are valuable even without a Niu.",
  "Don't rush! Precision is key in Niu-Niu.",
  "A Joker is a powerful Wild card—use it wisely!",
  "The dealer is tough, but your strategy is tougher.",
  "Focus on the sum of your remaining two cards.",
  "Niu-Niu (Bull-Bull) is the strongest hand!",
  "Trust your instincts and play bold.",
  "Every round is a new chance to win big."
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getGameTip = async (playerHand: string, dealerHandVisible: string, retries = 2): Promise<string> => {
  if (!apiKey) {
    return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a professional Niu-Niu (Bull-Bull) coach. 
      The player has these cards: ${playerHand}. 
      The dealer's visible cards are: ${dealerHandVisible}.
      Give a very short, encouraging tip (max 12 words) on what the player should look for or how to play this hand.`,
    });

    return response.text?.trim() || FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
  } catch (error: any) {
    // Check for rate limit error (429)
    const errorStr = JSON.stringify(error);
    if (errorStr.includes("429") && retries > 0) {
      console.warn(`Gemini rate limit hit. Retrying in 1s... (${retries} left)`);
      await sleep(1000 * (3 - retries)); // Simple exponential backoff
      return getGameTip(playerHand, dealerHandVisible, retries - 1);
    }

    console.error("Error fetching tip from Gemini:", error);
    // Return a random fallback tip if API fails or quota is exhausted
    return FALLBACK_TIPS[Math.floor(Math.random() * FALLBACK_TIPS.length)];
  }
};
