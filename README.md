# Navegador Falante - Extensão de Acessibilidade

Assistente virtual com IA para acessibilidade na navegação web.

## Funcionalidades

- Ativação por comando de voz ("Ok, Assistente")
- IA integrada para entender comandos naturais
- Comandos de acessibilidade (aumentar/diminuir fonte, alto contraste)
- Leitura de páginas web
- Resumo inteligente de páginas
- Navegação avançada (abas, busca, formulários)
- Configurações personalizáveis de voz
- Atalhos de teclado para acessibilidade

## Como instalar

1. Abra o Chrome/Edge
2. Vá em `chrome://extensions/`
3. Ative "Modo do desenvolvedor"
4. Clique em "Carregar sem compactação" e selecione esta pasta
5. Permita acesso ao microfone quando solicitado

## IA Integrada

A extensão já vem com IA integrada e configurada! Não é necessário configurar nenhuma chave da API.

### Funcionalidades da IA:

- **Comandos naturais**: Fale como se estivesse conversando
- **Análise contextual**: A IA entende o conteúdo da página atual
- **Sugestões inteligentes**: Receba dicas baseadas no que está navegando
- **Resumos automáticos**: Gere resumos de qualquer página
- **Busca inteligente**: Encontre informações de forma mais eficiente

### Exemplos de comandos com IA:

- "O que tem nesta página?"
- "Me explique o conteúdo principal"
- "Quais são os links mais importantes?"
- "Resuma esta página para mim"
- "O que posso fazer aqui?"
- "Procure por informações sobre tecnologia"
- "Abra uma nova aba com o Google"

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

### Comandos com IA (sempre disponíveis):
- "O que tem nesta página?" - Análise inteligente do conteúdo  
- "Me explique o conteúdo" - Explicação detalhada
- "Quais são os links importantes?" - Identificação de links relevantes
- "Resuma esta página" - Resumo inteligente
- "O que posso fazer aqui?" - Sugestões de ações
- "Abrir nova aba" - Abre nova aba
- "Fechar aba" - Fecha aba atual
- "Próxima aba" - Alterna entre abas
- "Procurar na página [termo]" - Busca texto na página atual

## Atalhos de teclado

- **Ctrl + Shift + A**: Ativar/desativar assistente
- **Escape**: Parar fala atual
- **Clique no botão flutuante**: Ativar assistente

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
- **IA sempre ativa**: Entende comandos naturais e contextuais

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
5. **Use o botão "Recarregar Assistente"**: No popup da extensão para reiniciar o assistente
6. **Teste comandos naturais**: A IA entende frases como "me ajude a navegar nesta página"