# Sistema de Ativação - Navegador Falante

## Como Funciona

O assistente agora tem um sistema de ativação inteligente que evita capturar conversas normais e torna o uso mais confortável.

### Estados do Assistente

#### 🔇 **Modo Passivo (Padrão)**
- **Cor do botão**: Roxo (#764ba2)
- **Ícone**: 🎤
- **Comportamento**: Escuta apenas palavras-chave de ativação
- **O que escuta**: "Ok, Assistente" ou "Ei, Assistente"

#### 👂 **Modo Escuta Passiva**
- **Cor do botão**: Laranja (#ffa500)
- **Ícone**: 👂
- **Comportamento**: Escuta palavras-chave de ativação
- **Quando acontece**: Quando o assistente está ativo mas não foi ativado

#### 🎤 **Modo Ativo**
- **Cor do botão**: Vermelho (#ff6b6b)
- **Ícone**: 🎤
- **Comportamento**: Escuta todos os comandos
- **Duração**: 30 segundos (ou até desativar manualmente)

#### 🔇 **Modo Inativo**
- **Cor do botão**: Cinza (#6c757d)
- **Ícone**: 🔇
- **Comportamento**: Não escuta nada
- **Quando acontece**: Quando o assistente foi desativado

## Como Usar

### 1. Ativar o Assistente
```
Diga: "Ok, Assistente" ou "Ei, Assistente"
```
- O botão fica vermelho
- Você tem 30 segundos para fazer comandos
- O assistente confirma: "Assistente ativado. Pode falar."

### 2. Fazer Comandos
```
Exemplos:
- "Ler página"
- "Buscar notícias"
- "Voltar"
- "Zoom in"
```

### 3. Desativar o Assistente
```
Opções:
- Diga: "Para" ou "Pare"
- Aguarde 30 segundos (desativação automática)
- Clique no botão flutuante
```

## Vantagens do Novo Sistema

### ✅ **Privacidade**
- Não captura conversas normais
- Só escuta quando você quer
- Controle total sobre quando está ativo

### ✅ **Conforto**
- Não precisa ficar falando "Ok, Assistente" toda vez
- 30 segundos é tempo suficiente para comandos
- Desativação automática evita esquecimento

### ✅ **Feedback Visual**
- Botão muda de cor e ícone
- Fácil de ver o estado atual
- Indicadores claros de quando está ativo

### ✅ **Flexibilidade**
- Múltiplas formas de ativar/desativar
- Timeout configurável (30 segundos)
- Comandos de interrupção sempre funcionam

## Configurações

### Timeout de Ativação
- **Padrão**: 30 segundos
- **Como alterar**: Edite o valor em `content.js` na função `resetActivationTimeout()`
- **Exemplo**: `setTimeout(() => { ... }, 30000);` // 30 segundos

### Palavras-chave de Ativação
- **Padrão**: "Ok, Assistente", "Ei, Assistente"
- **Como alterar**: Edite em `content.js` na função `onresult`
- **Exemplo**: `transcript.includes('ok assistente') || transcript.includes('ei assistente')`

### Comandos de Desativação
- **Padrão**: "Para", "Pare", "Stop"
- **Como alterar**: Edite em `content.js` na função `onresult`
- **Exemplo**: `transcript.includes('para') || transcript.includes('pare')`

## Solução de Problemas

### Assistente não ativa
- Verifique se o microfone está permitido
- Tente falar mais claramente: "Ok, Assistente"
- Verifique se o botão está roxo (modo passivo)

### Assistente desativa muito rápido
- Aumente o timeout na configuração
- Use comandos mais rapidamente
- Evite pausas longas entre comandos

### Assistente não escuta comandos
- Verifique se o botão está vermelho (modo ativo)
- Tente ativar novamente: "Ok, Assistente"
- Verifique se não há outros sons interferindo

### Botão não muda de cor
- Recarregue a extensão
- Verifique se há erros no console (F12)
- Teste em uma nova aba

## Dicas de Uso

1. **Fale claramente**: "Ok, Assistente" deve ser dito de forma clara
2. **Use comandos diretos**: "Ler página" em vez de "Pode ler a página?"
3. **Monitore o botão**: A cor indica o estado atual
4. **Use o timeout**: 30 segundos é suficiente para comandos
5. **Interrompa quando necessário**: "Para" sempre funciona

## Exemplos de Uso

### Cenário 1: Navegação Básica
```
Usuário: "Ok, Assistente"
Assistente: "Assistente ativado. Pode falar."
Usuário: "Ler página"
Assistente: [Lê o conteúdo]
Usuário: "Buscar tecnologia"
Assistente: [Faz a busca]
[30 segundos depois - desativa automaticamente]
```

### Cenário 2: Comandos Múltiplos
```
Usuário: "Ok, Assistente"
Assistente: "Assistente ativado. Pode falar."
Usuário: "Zoom in"
Assistente: "Zoom aumentado."
Usuário: "Rolar baixo"
Assistente: "Rolando para baixo."
Usuário: "Para"
Assistente: "Parado." [Desativa]
```

### Cenário 3: Interrupção
```
Usuário: "Ok, Assistente"
Assistente: "Assistente ativado. Pode falar."
Usuário: "Ler página"
Assistente: [Começa a ler...]
Usuário: "Para"
Assistente: "Parado." [Para e desativa]
``` 