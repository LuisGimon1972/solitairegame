<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="q-pa-xs q-pa-sm-md bg-green-10 flex flex-center text-white">
        <div class="solitaire-table q-px-xs q-px-sm-md">
          <!-- Barra Superior Responsiva -->
          <div class="row justify-between items-center q-mb-sm q-mb-md-md q-gutter-y-xs">
            <div class="text-subtitle1 text-h6 text-weight-bold">Solitaire Pro</div>
            <div class="row q-gutter-xs q-gutter-sm-sm">
              <q-btn
                size="sm"
                class="q-px-sm"
                color="amber-8"
                icon="undo"
                label="Desfazer"
                :disabled="history.length === 0"
                @click="undoMove"
              />
              <q-btn
                size="sm"
                class="q-px-sm"
                color="primary"
                icon="refresh"
                label="Novo"
                @click="initGame"
              />
              <!-- Botão Acerca de -->
              <q-btn
                size="sm"
                class="q-px-sm"
                color="teal-7"
                icon="info"
                label="Acerca"
                @click="showAboutDialog = true"
              />
              <q-btn
                size="sm"
                class="q-px-sm"
                color="negative"
                icon="logout"
                label="Sair"
                @click="exitGame"
              />
            </div>
          </div>

          <!-- Topo: Estoque, Descarte e Fundações -->
          <div class="row justify-between items-center q-mb-md q-mb-md-lg q-gutter-y-sm">
            <!-- Pilha de Compra e Descarte -->
            <div class="row q-gutter-xs q-gutter-sm-sm">
              <div
                class="card-slot cursor-pointer bg-red-9 flex flex-center shadow-2"
                @click="drawStockCard"
              >
                <span v-if="stock.length">🂠</span>
                <span v-else class="text-caption text-center">🔄</span>
              </div>
              <div
                class="card-slot cursor-pointer shadow-2"
                :class="{ 'selected-card': selectedSource?.type === 'waste' }"
                @click="selectWasteCard"
              >
                <div
                  v-if="waste.length && waste[waste.length - 1]"
                  class="playing-card"
                  :style="cardAtlas.getCardStyle(waste[waste.length - 1]!)"
                ></div>
              </div>
            </div>

            <!-- Pilhas de Fundação (Destino por Naipe) -->
            <div class="row q-gutter-xs q-gutter-sm-sm">
              <div
                v-for="(foundation, fIndex) in foundations"
                :key="fIndex"
                class="card-slot foundation-slot flex flex-center cursor-pointer"
                @click="moveToFoundation(fIndex)"
              >
                <div
                  v-if="foundation.length && foundation[foundation.length - 1]"
                  class="playing-card"
                  :style="cardAtlas.getCardStyle(foundation[foundation.length - 1]!)"
                ></div>
                <span v-else class="text-grey-5 text-subtitle1">♠</span>
              </div>
            </div>
          </div>

          <!-- Mesa Principal (Tableau - 7 Colunas com rolagem horizontal automática) -->
          <div class="tableau-scroll-container">
            <div class="tableau-columns-container q-mt-md">
              <div
                v-for="(column, colIndex) in tableau"
                :key="colIndex"
                class="tableau-column cursor-pointer"
                @click="moveToTableauColumn(colIndex)"
              >
                <div
                  v-for="(card, cardIndex) in column"
                  :key="card.id"
                  class="playing-card shadow-3 absolute-card"
                  :style="[
                    cardAtlas.getCardStyle(card),
                    { top: `${cardIndex * 26}px`, left: '0px' },
                  ]"
                  :class="{ 'selected-card': isCardSelected(colIndex, cardIndex) }"
                  @click.stop="handleCardClick(colIndex, cardIndex)"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal de Acerca de / Sobre -->
        <q-dialog v-model="showAboutDialog">
          <q-card
            class="bg-dark text-white q-pa-md text-center"
            style="min-width: 300px; border-radius: 12px"
          >
            <q-card-section>
              <div class="text-h5 text-amber-5 text-weight-bold q-mb-xs">🃏 Solitaire Game Pro</div>
              <div class="text-caption text-grey-4 q-mb-md">Versão 1.0.0</div>
              <p class="text-body2 text-left q-px-sm">
                Uma experiência moderna e fluida do clássico jogo de cartas Solitário (Klondike),
                desenvolvida com alto desempenho para dispositivos móveis e computadores.
              </p>
              <div class="text-weight-medium text-amber-4 q-mt-md">
                Desenvolvido por Luis Manuel Gimón
              </div>
            </q-card-section>
            <q-card-actions align="center">
              <q-btn flat color="primary" label="Fechar" v-close-popup />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Modal de Vitória com Efeitos Especiais -->
        <q-dialog v-model="hasWon" persistent>
          <q-card
            class="bg-dark text-white q-pa-lg text-center"
            style="min-width: 280px; border-radius: 12px"
          >
            <q-card-section>
              <div class="text-h4 text-amber-5 text-weight-bold q-mb-sm">🏆 Vitória Épica!</div>
              <p class="text-subtitle1">Parabéns! Completaste todas as fundações com sucesso.</p>
            </q-card-section>
            <q-card-actions align="center">
              <q-btn color="primary" label="Jogar Novamente" icon="refresh" @click="initGame" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import confetti from 'canvas-confetti';
import { CardEngine, Card } from './CardEngine';
import { SolitaireRules } from './SolitaireRules';
import { CardAtlas } from './CardAtlas';

const tableau = ref<Card[][]>([]);
const stock = ref<Card[]>([]);
const waste = ref<Card[]>([]);
const foundations = ref<Card[][]>([[], [], [], []]);
const hasWon = ref<boolean>(false);
const showAboutDialog = ref<boolean>(false); // Estado para controlar a janela Acerca de

interface GameState {
  tableau: Card[][];
  stock: Card[];
  waste: Card[];
  foundations: Card[][];
}
const history = ref<GameState[]>([]);

const cardAtlas = new CardAtlas({
  cardWidth: 67,
  cardHeight: 119,
  atlasWidth: 1024,
  atlasHeight: 512,
});

interface Selection {
  type: 'waste' | 'tableau';
  colIndex?: number;
  cardIndex?: number;
}
const selectedSource = ref<Selection | null>(null);

const saveState = () => {
  history.value.push({
    tableau: JSON.parse(JSON.stringify(tableau.value)),
    stock: JSON.parse(JSON.stringify(stock.value)),
    waste: JSON.parse(JSON.stringify(waste.value)),
    foundations: JSON.parse(JSON.stringify(foundations.value)),
  });
};

const initGame = () => {
  const engine = new CardEngine();
  engine.shuffle();
  tableau.value = engine.dealTableau();
  stock.value = engine.getStock();
  waste.value = [];
  foundations.value = [[], [], [], []];
  selectedSource.value = null;
  history.value = [];
  hasWon.value = false;
};

onMounted(() => {
  initGame();
});

const exitGame = () => {
  window.close();
  setTimeout(() => {
    initGame();
  }, 100);
};

const undoMove = () => {
  if (history.value.length === 0) return;
  const previousState = history.value.pop();
  if (previousState) {
    tableau.value = previousState.tableau;
    stock.value = previousState.stock;
    waste.value = previousState.waste;
    foundations.value = previousState.foundations;
    selectedSource.value = null;
    hasWon.value = false;
  }
};

const triggerWinEffects = () => {
  hasWon.value = true;
  const duration = 3 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({ particleCount: 7, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
};

const checkWinCondition = () => {
  const totalInFoundations = foundations.value.reduce((acc, f) => acc + f.length, 0);
  if (totalInFoundations === 52) {
    triggerWinEffects();
  }
};

const isCardSelected = (colIndex: number, cardIndex: number): boolean => {
  if (!selectedSource.value || selectedSource.value.type !== 'tableau') return false;
  if (selectedSource.value.colIndex !== colIndex) return false;
  return cardIndex >= (selectedSource.value.cardIndex ?? 0);
};

const drawStockCard = () => {
  saveState();
  if (stock.value.length > 0) {
    const card = stock.value.pop();
    if (card) {
      card.faceUp = true;
      waste.value.push(card);
    }
  } else {
    stock.value = waste.value.reverse().map((c) => ({ ...c, faceUp: false }));
    waste.value = [];
  }
  selectedSource.value = null;
};

const selectWasteCard = () => {
  if (waste.value.length > 0) {
    if (selectedSource.value?.type === 'waste') {
      selectedSource.value = null;
    } else {
      selectedSource.value = { type: 'waste' };
    }
  }
};

const handleCardClick = (colIndex: number, cardIndex: number) => {
  const column = tableau.value[colIndex];
  if (!column) return;
  const card = column[cardIndex];
  if (!card) return;

  if (!card.faceUp) {
    if (cardIndex === column.length - 1) {
      saveState();
      card.faceUp = true;
      selectedSource.value = null;
    }
    return;
  }

  if (selectedSource.value) {
    if (
      selectedSource.value.type === 'tableau' &&
      selectedSource.value.colIndex === colIndex &&
      selectedSource.value.cardIndex === cardIndex
    ) {
      selectedSource.value = null;
      return;
    }

    const moved = executeMoveToTableau(colIndex);
    if (!moved) {
      selectedSource.value = { type: 'tableau', colIndex, cardIndex };
    }
  } else {
    selectedSource.value = { type: 'tableau', colIndex, cardIndex };
  }
};

const executeMoveToTableau = (targetColIndex: number): boolean => {
  if (!selectedSource.value) return false;

  const targetColumn = tableau.value[targetColIndex];
  if (!targetColumn) return false;

  const targetCard = targetColumn[targetColumn.length - 1];

  if (selectedSource.value.type === 'waste') {
    const cardToMove = waste.value[waste.value.length - 1];
    if (cardToMove && SolitaireRules.canMoveToTableau(cardToMove, targetCard)) {
      saveState();
      const popped = waste.value.pop();
      if (popped) targetColumn.push(popped);
      selectedSource.value = null;
      return true;
    }
  } else if (selectedSource.value.type === 'tableau') {
    const sourceColIndex = selectedSource.value.colIndex!;
    const sourceCardIndex = selectedSource.value.cardIndex!;
    const sourceCol = tableau.value[sourceColIndex];
    if (!sourceCol) return false;

    if (sourceColIndex === targetColIndex) {
      selectedSource.value = null;
      return false;
    }

    const firstCardOfBlock = sourceCol[sourceCardIndex];

    if (firstCardOfBlock && SolitaireRules.canMoveToTableau(firstCardOfBlock, targetCard)) {
      saveState();
      const movedCards = sourceCol.splice(sourceCardIndex);
      targetColumn.push(...movedCards);

      const lastCard = sourceCol[sourceCol.length - 1];
      if (sourceCol.length > 0 && lastCard && !lastCard.faceUp) {
        lastCard.faceUp = true;
      }
      selectedSource.value = null;
      return true;
    }
  }
  return false;
};

const moveToTableauColumn = (targetColIndex: number) => {
  executeMoveToTableau(targetColIndex);
};

const moveToFoundation = (foundationIndex: number) => {
  if (!selectedSource.value) return;

  const targetFoundation = foundations.value[foundationIndex];
  if (!targetFoundation) return;

  const topFoundationCard = targetFoundation[targetFoundation.length - 1];

  if (selectedSource.value.type === 'waste') {
    const cardToMove = waste.value[waste.value.length - 1];
    if (cardToMove && SolitaireRules.canMoveToFoundation(cardToMove, topFoundationCard)) {
      saveState();
      const popped = waste.value.pop();
      if (popped) targetFoundation.push(popped);
      selectedSource.value = null;
      checkWinCondition();
    }
  } else if (selectedSource.value.type === 'tableau') {
    const sourceColIndex = selectedSource.value.colIndex!;
    const sourceCardIndex = selectedSource.value.cardIndex!;
    const sourceCol = tableau.value[sourceColIndex];
    if (!sourceCol) return;

    if (sourceCardIndex === sourceCol.length - 1) {
      const cardToMove = sourceCol[sourceCardIndex];
      if (cardToMove && SolitaireRules.canMoveToFoundation(cardToMove, topFoundationCard)) {
        saveState();
        const popped = sourceCol.pop();
        if (popped) targetFoundation.push(popped);

        const lastCard = sourceCol[sourceCol.length - 1];
        if (sourceCol.length > 0 && lastCard && !lastCard.faceUp) {
          lastCard.faceUp = true;
        }
        selectedSource.value = null;
        checkWinCondition();
      }
    }
  }
};
</script>

<style scoped>
.solitaire-table {
  width: 100%;
  max-width: 750px;
  margin: 0 auto;
}

.card-slot {
  width: 54px;
  height: 96px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  flex-shrink: 0;
}

.foundation-slot {
  background: rgba(0, 0, 0, 0.2);
}

.tableau-scroll-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 20px;
}

.tableau-columns-container {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  min-width: 520px;
}

@media (min-width: 600px) {
  .tableau-columns-container {
    justify-content: center;
  }
  .card-slot {
    width: 67px;
    height: 119px;
  }
  .absolute-card {
    width: 67px;
    height: 119px;
  }
}

.tableau-column {
  position: relative;
  width: 54px;
  min-height: 400px;
  flex-shrink: 0;
}

@media (min-width: 600px) {
  .tableau-column {
    width: 67px;
  }
}

.absolute-card {
  position: absolute;
  top: 0;
  left: 0;
  width: 54px;
  height: 96px;
}

.playing-card {
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease;
  overflow: hidden;
}

.playing-card:hover {
  transform: translateY(-3px);
}

.selected-card {
  filter: brightness(1.1);
  box-shadow: 0 0 8px #ffeb3b;
  transform: translateY(-6px);
}
</style>
