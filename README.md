# Navegador Falante - Extensão de Acessibilidade

Assistente virtual com IA para acessibilidade na navegação web.

## Funcionalidades

- Ativação por comando de voz ("Ok, Assistente")
- Comandos de acessibilidade (aumentar/diminuir fonte, alto contraste)
- Leitura de páginas web
- Notícias do dia
- Configurações personalizáveis de voz

## Como instalar

1. Abra o Chrome/Edge
2. Vá em `chrome://extensions/`
3. Ative "Modo do desenvolvedor"
4. Clique em "Carregar sem compactação" e selecione esta pasta
5. Permita acesso ao microfone quando solicitado

## Configurando a IA (Opcional)

Para usar a funcionalidade de IA inteligente:

1. **Obtenha uma chave da API do Google AI Studio**:
   - Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Faça login com sua conta Google
   - Clique em "Create API Key"
   - Copie a chave gerada

2. **Configure a chave na extensão**:
   - Clique no ícone da extensão
   - Vá em "Configurações"
   - Cole sua chave da API no campo "Chave da API Gemini"
   - Clique em "Salvar"
   - Ative a opção "IA Inteligente"

3. **Teste a IA**:
   - Agora você pode fazer perguntas mais naturais como:
     - "O que tem nesta página?"
     - "Me explique o conteúdo"
     - "Quais são os links importantes?"

**Nota**: A IA é opcional. A extensão funciona perfeitamente sem ela, usando apenas os comandos básicos.

## Comandos disponíveis

### Comandos Básicos:

**Controle:**
- "Ok, Assistente" ou "Ei, Assistente" - Ativa o assistente (30 segundos)
- "Para" ou "Pare" - Para e desativa o assistente
- "Ajuda" - Lista todos os comandos

**Acessibilidade:**
- "Aumentar fonte" / "Diminuir fonte" - Controla o tamanho do texto
- "Alto contraste" - Ativa/desativa modo de alto contraste
- "Zoom in" / "Zoom out" - Controla o zoom da página
- "Reset zoom" - Volta ao zoom normal

**Leitura:**
- "Ler página" - Lê o conteúdo principal da página
- "Ler título" - Lê o título da página
- "Ler títulos" ou "Ler cabeçalhos" - Lista os títulos e subtítulos
- "Ler links" - Lista os links encontrados na página

**Navegação:**
- "Buscar [termo]" - Busca na página ou no Google
- "Voltar" / "Avançar" - Navega no histórico do navegador
- "Recarregar" - Atualiza a página atual
- "Rolar cima" / "Rolar baixo" - Controla a rolagem da página
- "Topo" / "Final" - Vai para o início ou fim da página

**Informações:**
- "Notícias do dia" - Lê as principais notícias

### Comandos com IA (requer configuração):
- "O que tem nesta página?" - Análise inteligente do conteúdo
- "Me explique o conteúdo" - Explicação detalhada
- "Quais são os links importantes?" - Identificação de links relevantes
- "Resuma esta página" - Resumo inteligente
- "O que posso fazer aqui?" - Sugestões de ações

## Funcionalidades de leitura

- **Clique para ler**: Clique em qualquer elemento da página para que seja lido (quando ativado)
- **Hover para ler**: Passe o mouse sobre botões, links e imagens para ouvir descrições (quando ativado)
- **Leitura automática**: O título da página é lido automaticamente ao carregar
- **Filtragem inteligente**: A extensão filtra automaticamente elementos desnecessários (navegação, rodapé, etc.)

## Sistema de Ativação

- **Modo passivo**: O assistente escuta apenas palavras-chave de ativação
- **Modo ativo**: Após ativação, escuta todos os comandos por 30 segundos
- **Desativação automática**: Desativa automaticamente após 30 segundos de inatividade
- **Desativação manual**: Diga "Para" ou "Pare" para desativar imediatamente
- **Indicadores visuais**: O botão muda de cor e ícone conforme o estado

## Como testar

1. **Página de teste**: Abra o arquivo `test.html` no navegador para testar todas as funcionalidades
2. **Sites reais**: Teste em sites como Google, Wikipedia, ou qualquer site de notícias
3. **Verificação**: Certifique-se de que o botão flutuante (🎤) aparece no canto inferior direito

## Desenvolvimento

```bash
# Para testar a extensão
npm run start

# Para gerar build de produção
npm run build
```

## Solução de problemas

Se a extensão não estiver lendo o conteúdo:

1. **Verifique as permissões**: Certifique-se de que o microfone está permitido
2. **Recarregue a extensão**: Vá em `chrome://extensions/` e clique em "Recarregar"
3. **Verifique o console**: Abra as ferramentas do desenvolvedor (F12) e verifique se há erros
4. **Teste em diferentes sites**: Alguns sites podem ter proteções que impedem a leitura