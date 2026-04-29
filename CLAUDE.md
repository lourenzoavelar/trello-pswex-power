# Trello Gantt Power-Up — Contexto para LLMs

Este arquivo é a fonte de verdade do projeto para qualquer sessão de IA.
Leia **antes** de qualquer alteração de código.

---

## Visão Geral

Power-Up privado do Trello para **gestão de conteúdo de marketing** com:
- Gráfico de Gantt por datas dos cards
- Campos customizados por card (cliente, legenda, rede social, artes, anúncios)
- Automação de publicação via webhooks n8n
- Processamento automático de cards criados por IA

**URL em produção:** `https://lourenzoavelar.github.io/trello-gantt-powerup/`
**Repositório:** `d:\dev\trello-gantt-powerup` (Windows)
**Deploy:** GitHub Pages — branch `main`, pasta raiz `/`

---

## Estrutura de Arquivos

```
connector.js            # Ponto de entrada do Power-Up (único arquivo lido pelo Trello)
index.html              # HTML mínimo que carrega connector.js
card-custom-fields.html # UI dos campos customizados (exibida no back do card)
card-custom-fields.js   # Lógica dos campos: leitura, salvamento, tabs, n8n, IA
gantt.html              # Modal do Gráfico de Gantt
preview-modal.html      # Modal de preview antes de publicar
preview-modal.js        # Lógica do modal de preview
settings.html           # Configurações do board (lista de clientes, webhooks n8n)
settings.js             # Lógica das configurações
manifest.json           # Manifesto do Power-Up (capabilities declaradas)
migrate.html            # Ferramenta de migração de campos legados (desativada)
```

---

## Arquitetura do pluginData (t.get / t.set)

Todos os dados são salvos via `t.set()` e lidos via `t.get()`.
Escopo: `'card'`, visibilidade: `'shared'`.

### `customFieldsData` (object)

Campos de um card de conteúdo:

| Campo | Tipo | Descrição |
|---|---|---|
| `clientProject` | string | Nome do cliente/projeto |
| `postCaption` | string | Legenda do post |
| `socialNetwork` | string[] | Redes selecionadas (`['instagram', 'facebook', ...]`) |
| `artGuidelines` | string | Briefing da arte |
| `artText` | string | Texto da arte |
| `finalCreativeLink` | string | Link do criativo finalizado |
| `readyMediaLink` | string | Link da mídia pronta |
| `creativeFormat` | string | Formato do criativo |
| `postDate` | string | Data de publicação |
| `adMainText` | string | Texto principal do anúncio |
| `adVariations` | string | Variações do anúncio |
| `adTitle1..4` | string | Títulos do anúncio |
| `aiAgentLink` | string | URL do agente de IA externo |
| `aiPromptSuggest` | string | Prompt sugerido para a IA |

### `iaSynced` (boolean)

Flag que indica que o card foi processado automaticamente pela IA.
Se `true`, o processamento automático **não deve rodar novamente**.

### `clientsList` (string[]) — escopo board

Lista global de clientes cadastrados nas configurações do board.
`t.get('board', 'shared', 'clientsList')`

### `n8nPublishUrl` / `n8nDownloadUrl` (string) — escopo board

URLs dos webhooks n8n configurados nas Configurações do Power-Up.

---

## Protocolo de Cards Criados por IA (`[IA_PROCESSAR]`)

Cards podem ser criados automaticamente por agentes de IA externos (n8n, LLMs, etc.)
usando o seguinte formato na **descrição** do card:

```
[IA_PROCESSAR]
IA_PLUGIN_DATA_START
{
  "clientProject": "Nome do Cliente",
  "postCaption": "Texto do post aqui",
  "socialNetwork": ["instagram"],
  "creativeFormat": "Story 9:16",
  "postDate": "2025-05-01"
}
IA_PLUGIN_DATA_END
```

### Regras do protocolo

1. A descrição **deve começar** com `[IA_PROCESSAR]` (sem espaços antes)
2. O JSON deve estar **exatamente** entre `IA_PLUGIN_DATA_START` e `IA_PLUGIN_DATA_END`
3. O JSON deve ser válido — caso contrário, **nada é alterado** (fail-safe)
4. Cards sem `[IA_PROCESSAR]` são completamente ignorados
5. Após processamento, `iaSynced = true` impede reprocessamento

### O que o Power-Up faz ao detectar o marcador

1. Verifica lock em memória (anti race condition entre hooks)
2. Verifica `[IA_PROCESSAR]` na descrição (early return se ausente)
3. Verifica `iaSynced === true` (idempotência)
4. Extrai e parseia o JSON (abort se inválido, sem tocar na descrição)
5. `t.set('card', 'shared', 'customFieldsData', parsedJson)`
6. `t.set('card', 'shared', 'iaSynced', true)`
7. Limpa a descrição via `PUT /1/cards/:id` (REST API do Trello)
8. Texto final: restante da descrição ou `"Card criado automaticamente pela IA."`

**Ordem crítica:** sempre salvar pluginData ANTES de limpar a descrição.

---

## Hooks do Power-Up (connector.js)

| Capability | Quando dispara | O que faz |
|---|---|---|
| `board-buttons` | Board carrega | Botão "Gráfico Gantt" |
| `card-badges` | Card listado no board | Badges de clientProject + creativeFormat; dispara `processIaCard()` |
| `card-back-section` | Card aberto | Renderiza iframe `card-custom-fields.html`; dispara `processIaCard()` |
| `show-settings` | Botão Configurações | Abre modal `settings.html` |
| `card-buttons` | Back do card | (vazio por ora) |
| `card-detail-badges` | Back do card | (vazio por ora) |

> **`processIaCard(t)`** é chamada de forma assíncrona e não-bloqueante em
> `card-badges` e `card-back-section`. O lock `_iaProcessingLocks[cardId]`
> garante que apenas uma execução ocorra por vez.

---

## Convenções de Código

- **Sem frameworks** — JavaScript vanilla puro, sem bundler, sem build step
- **Sem TypeScript** — JS puro para compatibilidade máxima com GitHub Pages
- **Estilo:** `var` nos arquivos mais antigos, `const/let/async-await` nos novos
- **Logs:** prefixo `[IA]` para todos os logs do processamento automático
- **Erros:** nunca lançar exceção que quebre o Power-Up; sempre `try/catch` com log

---

## Deploy

Não há build. Edite os arquivos e dê `git push` na branch `main`.
O GitHub Pages publica automaticamente em ~1 min.

```bash
git add .
git commit -m "descrição da mudança"
git push origin main
```

Para testar localmente, use qualquer servidor HTTP estático (ex: `npx serve .`)
e aponte o Power-Up para `https://localhost:PORT/connector.js` via ngrok ou similar.

---

## Cuidados Importantes

- **Nunca limpar a descrição antes de salvar o pluginData** (perda de dados)
- **Nunca remover o lock `_iaProcessingLocks`** sem o `finally` correspondente
- **`ENABLE_MIGRATION_TOOL`** no topo do `connector.js` controla a ferramenta de migração legada — manter `false` em produção
- O token REST da API do Trello vem de `t.getRestApi().getToken()` — requer que o Power-Up declare a capability `rest-api` se necessário
- `t.sizeTo('#content')` deve ser chamado sempre que o iframe mudar de altura
