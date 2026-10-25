import { Card } from './CardEngine';

export interface AtlasConfig {
  cardWidth?: number;
  cardHeight?: number;
  atlasWidth?: number;
  atlasHeight?: number;
  numCols?: number;
  numRows?: number;
}

export class CardAtlas {
  private config: Required<AtlasConfig>;

  constructor(config: AtlasConfig = {}) {
    this.config = {
      cardWidth: config.cardWidth ?? 67,
      cardHeight: config.cardHeight ?? 119,
      atlasWidth: config.atlasWidth ?? 1024,
      atlasHeight: config.atlasHeight ?? 512,
      numCols: config.numCols ?? 13,
      numRows: config.numRows ?? 4,
    };
  }

  public getCardStyle(card: Card) {
    const { cardWidth, cardHeight, atlasWidth, atlasHeight, numCols, numRows } = this.config;

    if (!card.faceUp) {
      return {
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        backgroundColor: '#1e3a8a',
        backgroundImage: 'radial-gradient(#3b82f6 15%, transparent 16%)',
        backgroundSize: '10px 10px',
        border: '2px solid #ffffff',
        borderRadius: '6px',
        boxSizing: 'border-box' as const,
      };
    }

    const cellWidth = atlasWidth / numCols;
    const cellHeight = atlasHeight / numRows;

    const suitRows: Record<string, number> = {
      spades: 0,
      hearts: 1,
      diamonds: 2,
      clubs: 3,
    };

    const row = suitRows[card.suit] ?? 0;
    const val = Number(card.value);
    const col = isNaN(val) ? 0 : Math.max(0, Math.min(numCols - 1, val - 1));

    // Aumentado para 3px para puxar mais 2mm/pixels para a esquerda e acima
    const offsetX = 3;
    const offsetY = 3;

    const posX = col * cellWidth + offsetX;
    const posY = row * cellHeight + offsetY;

    return {
      width: `${cardWidth}px`,
      height: `${cardHeight}px`,
      backgroundImage: 'url(/images/card-atlas.png)',
      backgroundPosition: `-${posX}px -${posY}px`,
      backgroundSize: `${atlasWidth}px ${atlasHeight}px`,
      backgroundRepeat: 'no-repeat',
      borderRadius: '6px',
    };
  }
}
