import { Card } from './CardEngine';

export class SolitaireRules {
  /**
   * Valida se uma carta pode ser colocada sobre outra no Tableau.
   * Regra Simplificada:
   * - Coluna vazia: Apenas Reis (valor 13).
   * - Coluna com carta: Qualquer carta de valor exatamente inferior (-1) entra, sem restrição de cor.
   */
  public static canMoveToTableau(cardToMove: Card, targetCard?: Card): boolean {
    // Se a coluna estiver totalmente vazia, aceita apenas o Rei (13)
    if (!targetCard) {
      return cardToMove.value === 13;
    }

    // A carta de destino tem de estar virada para cima
    if (!targetCard.faceUp) {
      return false;
    }

    // O valor tem de ser exatamente o valor da carta alvo menos 1 (ex: 9 sobre 10, 5 sobre 6, etc.)
    return cardToMove.value === targetCard.value - 1;
  }

  /**
   * Valida se uma carta pode ser colocada nas pilhas de Fundação superiores.
   * Regra Clássica:
   * - Fundação vazia: Apenas Ás (valor 1).
   * - Fundação com carta: Mesmo naipe e valor imediatamente superior (+1).
   */
  public static canMoveToFoundation(cardToMove: Card, topFoundationCard?: Card): boolean {
    if (!topFoundationCard) {
      return cardToMove.value === 1; // Apenas Ás
    }

    return (
      cardToMove.suit === topFoundationCard.suit && cardToMove.value === topFoundationCard.value + 1
    );
  }
}
