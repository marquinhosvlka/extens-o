# Configuração da IA - Navegador Falante

## Passo a Passo para Configurar a IA

### 1. Obter Chave da API do Google AI Studio

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada (algo como: `AIzaSyC...`)

### 2. Configurar a Extensão

#### Opção A: Via Interface da Extensão (Recomendado)
1. Clique no ícone da extensão no navegador
2. Vá na seção "Configurações"
3. Cole sua chave da API no campo "Chave da API Gemini"
4. Clique em "Salvar"
5. Ative a opção "IA Inteligente"

#### Opção B: Via Interface da Extensão (Recomendado)
1. Clique no ícone da extensão no navegador
2. Vá na seção "Configurações"
3. Cole sua chave da API no campo "Chave da API Gemini"
4. Clique em "Salvar"
5. Ative a opção "IA Inteligente"

### 3. Testar a IA

Após configurar, você pode testar comandos como:
- "O que tem nesta página?"
- "Me explique o conteúdo"
- "Quais são os links importantes?"
- "Resuma esta página"

## Funcionalidades da IA

### Comandos Inteligentes
A IA pode entender comandos naturais e convertê-los em ações:
- "Torne o texto maior" → Aumentar fonte
- "Deixe mais escuro" → Alto contraste
- "Leia o que está aqui" → Ler página
- "Onde posso clicar?" → Ler links
- "Procure por notícias" → Buscar por "notícias"
- "Vá para o início" → Ir para o topo da página
- "Amplie a tela" → Aumentar zoom
- "Volte para trás" → Voltar página

### Análise de Conteúdo
A IA analisa o contexto da página para fornecer respostas mais precisas:
- Identifica o tipo de página (notícias, blog, e-commerce, etc.)
- Sugere ações relevantes
- Explica o conteúdo de forma clara

### Fallback Inteligente
Se a IA não conseguir processar um comando, o sistema volta para os comandos básicos conhecidos.

## Solução de Problemas

### "IA não configurada"
- Verifique se a chave da API foi salva corretamente
- Recarregue a extensão
- Verifique se a opção "IA Inteligente" está ativada

### "Erro na API"
- Verifique se sua chave da API é válida
- Confirme se você tem créditos disponíveis no Google AI Studio
- Verifique sua conexão com a internet

### Comandos não funcionam
- Tente comandos mais específicos
- Verifique se o microfone está funcionando
- Teste em diferentes sites

## Segurança

⚠️ **Importante**: 
- Nunca compartilhe sua chave da API
- Não commite o arquivo `config.js` no Git
- Use apenas em sites confiáveis
- A chave é armazenada localmente no seu navegador

## Limitações

- A IA requer conexão com a internet
- Alguns sites podem bloquear o acesso ao conteúdo
- A precisão depende da qualidade do áudio e da clareza do comando
- Limite de requisições da API do Google (verifique sua cota) 