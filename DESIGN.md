# DESIGN

Documentação do Design System, no formato **First-AI**: cada seção é autocontida e acessada via âncora — leia apenas a seção relevante, não o documento inteiro.

## Índice

- [Cores e superfícies](#cores-e-superficies)
- [Arquitetura do grid mosaico](#arquitetura-do-grid-mosaico)
- [Regras de bordas (posse da aresta)](#regras-de-bordas-posse-da-aresta)
- [Como criar uma nova seção ou página](#como-criar-uma-nova-secao-ou-pagina)
- [Tokens (:root)](#tokens-root)
- [Validação obrigatória](#validacao-obrigatoria)

## Cores e superfícies

**Regra:** não existe `--color-surface`, `shadow`, `border-radius` ou `gradient` neste projeto.
Todo background de bloco/container é `--color-bg` — a mesma cor em toda a aplicação.

- `--color-surface` só deve ser criado/reintroduzido se o usuário solicitar explicitamente — não é uma decisão que o agente deve tomar sozinho (ex.: para "dar profundidade" ou "destacar um card").

## Arquitetura do grid mosaico

Toda página é composta sobre **UM único CSS Grid de 6 colunas** — o `.app` (definido em [`src/styles/styles.css`](src/styles/styles.css)). Nenhuma seção cria grid próprio.

```css
.app {
    display: grid;
    grid-template-columns: repeat(6, minmax(var(--module-min), 1fr));
    max-width: var(--app-max-width); /* cartão de 430px, centralizado */
    margin-inline: auto;
    /* sem border: o perímetro é desenhado pelas células de extremidade
       (ver "Regras de bordas") — linhas encostam nas extremidades da tela */
}
```

Regras (as mesmas R1–R7 no cabeçalho do `styles.css`):

1. **Grid único (R1).** É **proibido** criar um grid aninhado com colunas próprias para uma seção. Motivo comprovado por medição nesta base: dois grids paralelos com `repeat(6, 1fr)` arredondam frações de subpixel de forma independente e as bordas verticais desalinham entre seções (~0,01–0,8px, visível como "degrau" na linha).
2. **Seção = `display: contents` (R2).** Wrappers semânticos (`<header>`, `<main>`, `<nav>`, `<section>`) recebem `display: contents`: saem da árvore de layout e seus **filhos** viram itens diretos do grid de `.app`. Cada filho se posiciona com `grid-row` e ocupa colunas com `grid-column: span N` (default 1).
3. **Bloco atômico = quadrado (R3).** Todo elemento de um único módulo (ícone, avatar, logo, botão) usa `aspect-ratio: 1 / 1` e **nenhuma** `width`/`height` própria. A altura da linha é derivada da largura real da coluna — **nunca** fixar altura de linha com `--row`, `px` ou `vw` em célula quadrada (fórmula paralela ao `1fr` diverge por arredondamento; defeito real já ocorrido e corrigido).
4. **Conteúdo variável (R6).** Texto que cresce (título, descrição, listas, comentários) ocupa a linha inteira (`grid-column: 1 / -1`), tem `min-height: var(--row)` (mínimo de 1 módulo) e cresce livremente com `padding` — sem exigir múltiplos inteiros de módulo.
5. **Módulo mínimo = 44px** (`--module-min: 2.75rem`), o alvo de toque da WCAG 2.1 SC 2.5.5. É o único lugar onde o tamanho do módulo é definido.

Observação conhecida (não é bug): quando a largura interna do `.app` não é divisível por 6, o motor do grid distribui a sobra dando **1/64px** a mais para algumas colunas (ex.: `64.8281` vs `64.8438`). As bordas continuam perfeitamente contíguas (sem gap/degrau) — é o comportamento correto de `1fr` e não deve ser "corrigido".

## Regras de bordas (posse da aresta)

Cada aresta da grade é desenhada por **um único elemento** (R4). Nunca dois vizinhos declaram a mesma divisória (dobraria a espessura) e nunca uma aresta fica sem dono (bloco "aberto").

| Aresta                    | Quem declara                | Propriedade                                          |
| ------------------------- | --------------------------- | ---------------------------------------------------- |
| Vertical (entre colunas)  | o elemento à **esquerda**   | `border-right: var(--hair) solid var(--color-line)`  |
| Horizontal (entre linhas) | o elemento **acima**        | `border-bottom: var(--hair) solid var(--color-line)` |
| Perímetro — topo          | células da **1ª linha**     | `border-top`                                         |
| Perímetro — esquerda      | células da **coluna 1**     | `border-left`                                        |
| Perímetro — direita       | células da **coluna 6**     | `border-right`                                       |
| Perímetro — base          | células da **última linha** | `border-bottom`                                      |

**O `.app` NÃO tem moldura própria** — o perímetro é desenhado pelas células de extremidade, para as linhas da grade encostarem nas extremidades da tela. Essas regras vivem no bloco **"BORDAS DE LINHA E PERÍMETRO"**, deliberadamente no **fim** do `styles.css` (o cascade garante que vençam resets de componente como `.btn { border: none }`).

Consequências práticas:

- Nas divisórias internas, o vizinho da direita/de baixo **não** redeclara (`border-left`/`border-top` são proibidos em células comuns — só o perímetro usa essas propriedades, onde não há vizinho).
- A célula da **última coluna** declara seu `border-right` (é o perímetro direito) — proibido `border-right: none` nela.
- Elemento **dentro** de um bloco (ex.: `.avatar-md` dentro de `.post-avatar`) **nunca** tem borda própria — a separação pertence ao bloco que o contém.
- Espessura única da grade: `--hair` (`--hair-edge` fica reservado para destaques futuros; não é usado no perímetro).

## Como criar uma nova seção ou página

Receita objetiva (copiar o padrão, não inventar):

**Nova seção em uma página existente** (exemplo completo e conectado — a
seção tem as DUAS classes: `mosaic-region` dá o `display: contents`;
`minha-secao` é o hook para posicionar a fileira):

```html
<section class="mosaic-region minha-secao" aria-label="Minha seção">
    <div class="icon-cell">…</div>
    <!-- 1 módulo quadrado -->
    <div class="minha-celula-larga">…</div>
    <!-- N módulos -->
    <button class="btn" type="button" aria-label="Ação">…</button>
    <!-- 1 módulo -->
</section>
```

```css
/* filhos entram no grid de .app; posicionar a fileira: */
.minha-secao > * {
    grid-row: 6;
}
.minha-celula-larga {
    grid-column: span 4;
}

/* e registrar as bordas NO BLOCO CONSOLIDADO (fim do styles.css): */
.minha-secao > * {
    border-bottom: var(--hair) solid var(--color-line);
} /* base da fileira */
.minha-secao > *:first-child {
    border-left: var(--hair) solid var(--color-line);
} /* perímetro esq. */
.minha-secao > *:last-child {
    border-right: var(--hair) solid var(--color-line);
} /* perímetro dir. */
.minha-celula-larga {
    border-right: var(--hair) solid var(--color-line);
} /* divisória interna */
```

Estados interativos (hover/focus) de célula clicável: copiar o padrão de
`.btn`/`.nav-btn` — `background: color-mix(in srgb, var(--color-accent) 10%, transparent)`
em `:hover`/`:focus-visible`, com `outline: none`. Nunca inventar outro efeito
(sombra, escala, cor nova).

- Wrapper: usar `.mosaic-region` (já é `display: contents`) ou adicionar a classe da seção à lista de wrappers no `styles.css`.
- Célula quadrada: `aspect-ratio: 1 / 1` + `place-items: center`; sem width/height.
- Bordas: seguir a tabela de posse acima e registrar a fileira no bloco **"BORDAS DE LINHA E PERÍMETRO"** (fim do `styles.css`): `border-bottom` da fileira + `border-left` na célula da coluna 1 + `border-right` na célula da coluna 6.

**Página inteira de blocos (grade/galeria):** copiar o padrão de [`public/mosaico.html`](public/mosaico.html) — `.app.app--mosaic` (linhas implícitas) + `.mosaic-region` + `.mosaic-cell`. É o modelo de referência validado (24 linhas × 6 colunas, drift 0 entre colunas).

**Proibido em qualquer caso:** grid aninhado com colunas próprias; `gap`; altura fixa em célula quadrada; borda dupla na mesma aresta; `innerHTML` para injetar SVG (usar `<use href="assets/icons/sprite.svg#bi-nome">`).

## Tokens (:root)

Todos definidos em [`src/styles/styles.css`](src/styles/styles.css). Nunca hardcodar valores que já têm token.

| Token                                 | Valor                                            | Papel                                                                             |
| ------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `--color-bg`                          | `#0d1420`                                        | único background da aplicação                                                     |
| `--color-line`                        | `#2a3b59`                                        | única cor de separação (bordas)                                                   |
| `--color-text` / `--color-text-muted` | `#dfe7f2` / `#94a3ba`                            | texto principal / secundário                                                      |
| `--color-accent`                      | `#7aa6e8`                                        | ícones, marca, estados                                                            |
| `--hair` / `--hair-edge`              | `max(1px, 0.0625rem)` / `max(2px, 0.0625rem)`    | linha da grade (única) / reservado p/ destaques                                   |
| `--module-min`                        | `2.75rem` (44px)                                 | lado mínimo do módulo (WCAG 2.1 SC 2.5.5)                                         |
| `--app-max-width`                     | `26.875rem` (430px)                              | teto do cartão `.app`                                                             |
| `--row`                               | `clamp(var(--module-min), 16.6667vw, 4.4792rem)` | só `min-height` de conteúdo variável — **nunca** para dimensionar célula quadrada |
| `--pad`                               | `clamp(0.875rem, 4.5vw, 1.125rem)`               | respiro interno de células de texto                                               |
| `--icon-size`                         | `1.375rem`                                       | tamanho do glifo dentro do módulo                                                 |

## Validação obrigatória

Antes de considerar qualquer feature de layout pronta: `npm run test:e2e`.

- O `webServer` do Playwright sobe o JSON Server sozinho (`npm run serve`, porta 5177) — necessário porque o sprite externo `<use href>` não resolve sob `file://`.
- [`tests/e2e/mosaic.spec.js`](tests/e2e/mosaic.spec.js) trava os invariantes do mosaico: células quadradas, módulos de tamanho idêntico entre seções, bordas alinhadas sem "degrau", sem scroll horizontal, ícones renderizando. Ao criar uma seção nova, adicionar asserções equivalentes para ela.
- Verificação visual: capturar screenshot via Playwright e **olhar a imagem** antes de afirmar que está correto (medidas lógicas não capturam defeitos de subpixel).
