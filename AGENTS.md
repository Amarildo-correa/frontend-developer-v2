# AGENTS

Instruções para agentes de IA que trabalham neste repositório.

## Objetivo

O objetivo deste repositório é o agente desenvolver protótipos de frontend
conforme os prompts do usuário. Após a **aprovação de cada feature** pelo
usuário, o agente deve documentar o [`DESIGN.md`](DESIGN.md) no formato
**First-AI**: usar um índice com links âncora para cada seção, de modo a
evitar ruído de contexto (o agente lê apenas a seção relevante via âncora,
não o documento inteiro). Exemplo:

```markdown
## Índice

- [Tokens (:root)](#tokens-root)

## Tokens (:root)

Todos definidos em...
```

## Estado atual

> **Seção volátil**: descreve apenas o estado **atual** do repositório e a última
> ação realizada. O agente **DEVE** sobrescrever este bloco a cada feature
> concluída (substituir, nunca acumular histórico) para manter o `AGENTS.md`
> enxuto. Ao retomar o trabalho, continuar a partir daqui.

### Repositório atual

```

```

Protótipo do layout em mosaico (grid modular unificado) implementado e validado
com Playwright (**60/60 testes**, matriz Chromium + WebKit, mobile/tablet/
desktop); servido via JSON Server. Arquitetura do mosaico **aprovada pelo
usuário e consolidada no `DESIGN.md`** — antes de escrever qualquer layout
novo, o agente DEVE ler a seção relevante do `DESIGN.md` (via âncora) e seguir
as regras **R1–R7** do cabeçalho de `project/styles.css`.

### Última ação

Revisão final da documentação do design system (aprovada pelo usuário):

- **`DESIGN.md`** é agora a **única fonte de verdade** sobre a arquitetura do
  mosaico. Corrigido um exemplo desconectado na receita de "Como criar uma
  nova seção ou página" (HTML usava `.mosaic-region`, CSS referenciava
  `.minha-secao` sem vínculo) — agora o exemplo mostra as duas classes juntas,
  bordas completas (fileira + perímetro esquerdo/direito) e a convenção de
  estados hover/focus (`color-mix` 10%, único efeito permitido).
- Perímetro do `.app` (mudança anterior, já registrada no `DESIGN.md` e no
  `project/styles.css`): sem `border` próprio — cada célula de extremidade fecha a
  própria aresta externa; regras no bloco "BORDAS DE LINHA E PERÍMETRO" no
  fim de `project/styles.css`.
- Nota: sem a moldura de 2px, a largura interna (430px) não é divisível por 6;
  o `1fr` distribui a sobra em quanta de 1/64px entre colunas — benigno,
  bordas continuam contíguas (teste de kink com tolerância 0 continua verde).

## Convenções

- O agente **DEVE** nomear classes, chaves, identificadores, tokens e afins com termos em inglês consagrados nos quais os LLMs foram treinados.
- O agente **DEVE** desenvolver o frontend em **mobile-first**: escrever primeiro os estilos base para mobile e só depois adicionar media queries (`min-width`) para telas maiores — nunca o inverso.
- JavaScript vanilla (`const`/`let`, `===`/`!==`); sem TypeScript por padrão.
- Nunca usar `innerHTML` com conteúdo dinâmico — preferir `textContent` ou `<template>` + `createElement`.
- CSS com tokens/variáveis (`var(--...)`).
- Usar apenas CSS puro (vanilla) — sem frameworks como Bootstrap, Tailwind, etc.
- **Fonte**: usar [Inter do Google Fonts](https://fonts.google.com/specimen/Inter), carregada via `<link>` no `<head>` de todo `.html` (nunca `@import` no CSS, que bloqueia renderização). Aplicar como `font-family` padrão via token CSS (ex.: `--font-base: 'Inter', sans-serif;` em `:root`).
- **Recursos compartilhados**: todos os arquivos `.html` compartilham os mesmos [`project/scripts.js`](project/scripts.js), [`project/styles.css`](project/styles.css). Não criar scripts, folhas de estilo ou pastas de assets por página — sempre reutilizar esses arquivos únicos.
- **Ícones**: buscar em [icons.getbootstrap.com](https://icons.getbootstrap.com) e salvar em [`project/sprite.svg`](project/sprite.svg) — nunca arquivo avulso por ícone.
- Converter o `<svg>` copiado em um `<symbol id="bi-nome-do-icone" viewBox="...">`, mantendo apenas o(s) `<path>`; remover `width`, `height`, `fill` e `class` (ficam a cargo de quem consome).
- O `id` usa o nome da classe `bi-*` original do Bootstrap Icons, sem o framework CSS junto — só o path SVG é reaproveitado (não viola "sem frameworks CSS").
- Consumir via `<svg class="icon" width="16" height="16" fill="currentColor"><use href="assets/icons/sprite.svg#bi-nome-do-icone"></use></svg>`.`<use>` é nativo do browser e herda `currentColor`/CSS — nunca injetar o SVG via `innerHTML`.

## Validação com Playwright

Sempre que o usuário enviar um prompt com uma solicitação de implementação ou uma dúvida sobre "como fazer" algo no frontend (ex.: _"Como fazer 6 blocos se adaptarem automaticamente a todos os tamanhos de tela, do mobile ao desktop?"_), o agente **DEVE**, antes de responder, validar a solução proposta executando os testes Playwright via `npm run test:e2e` (specs em `tests/e2e/`).

- A resposta só **DEVE** ser enviada após a confirmação, na prática, de que a implementação funciona.
- O agente **NÃO DEVE** responder com soluções baseadas apenas em suposições quando a validação automatizada for possível.
- Quando a validação não for possível de imediato, o agente deve persistir: fazer varreduras amplas na internet até encontrar uma solução que funcione e, após encontrá-la, reiniciar o loop de validação para comprovar na prática antes de responder.

## Estrutura

> Nota para agentes: antes de assumir que algo existe ou tem conteúdo, confirme
> no sistema de arquivos — esta seção descreve papéis fixos, não o estado atual.
