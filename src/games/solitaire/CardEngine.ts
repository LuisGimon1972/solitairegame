export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  id: string;
  suit: Suit;
  value: CardValue;
  faceUp: boolean;
}

export class CardEngine {
  private deck: Card[] = [];

  constructor() {
    this.generateDeck();
  }

  private generateDeck() {
    const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    this.deck = [];

    for (const suit of suits) {
      for (let v = 1; v <= 13; v++) {
        this.deck.push({
          id: `${suit}-${v}`,
          suit,
          value: v as CardValue,
          faceUp: false,
        });
      }
    }
  }

  // Algoritmo de embaralhamento Fisher-Yates
  public shuffle(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = this.deck[i];
      const target = this.deck[j];
      if (temp && target) {
        this.deck[i] = target;
        this.deck[j] = temp;
      }
    }
  }

  // Distribuição correta para o Solitaire (Tableau)
  public dealTableau(numColumns: number = 7): Card[][] {
    const tableau: Card[][] = Array.from({ length: numColumns }, () => []);

    for (let i = 0; i < numColumns; i++) {
      for (let j = i; j < numColumns; j++) {
        const card = this.deck.pop();
        const column = tableau[j];

        if (card && column) {
          if (i === j) {
            card.faceUp = true; // A última carta de cada coluna fica virada para cima
          }
          column.push(card);
        }
      }
    }
    return tableau;
  }

  public getStock(): Card[] {
    return [...this.deck];
  }
}
