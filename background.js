// background.js (Corrigido e mais inteligente com integração Gemini)

// Configuração do Gemini (incluída diretamente para evitar problemas de import)
const GEMINI_CONFIG = {
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  MODEL_CONFIG: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  }
};

// Classe Gemini Service (simplificada para o background)
class GeminiService {
  constructor() {
    this.apiKey = null;
    this.loadApiKey();
  }

  async loadApiKey() {
    const result = await chrome.storage.sync.get(['geminiApiKey']);
    this.apiKey = result.geminiApiKey;
  }

  isConfigured() {
    return this.apiKey && this.apiKey !== 'SUA_CHAVE_API_AQUI';
  }

  async generateResponse(prompt, context = '') {
    if (!this.isConfigured()) {
      throw new Error('API key do Gemini não configurada');
    }

    try {
      const fullPrompt = this.buildPrompt(prompt, context);
      
      const response = await fetch(`${GEMINI_CONFIG.API_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: GEMINI_CONFIG.MODEL_CONFIG
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Resposta inválida da API do Gemini');
      }
    } catch (error) {
      console.error('Erro ao chamar API do Gemini:', error);
      throw error;
    }
  }

  buildPrompt(userPrompt, context = '') {
    return `Você é um assistente de acessibilidade para navegação web. 
    Sua função é ajudar usuários com deficiência visual a navegar na internet.

    CONTEXTO DA PÁGINA ATUAL:
    ${context}

    COMANDO DO USUÁRIO:
    ${userPrompt}

    INSTRUÇÕES:
    1. Analise o comando do usuário e o contexto da página
    2. Se for um comando de acessibilidade, responda com o comando específico
    3. Se for uma pergunta sobre o conteúdo da página, responda de forma clara
    4. Mantenha suas respostas curtas e diretas (máximo 200 palavras)
    5. Responda sempre em português brasileiro

    COMANDOS DE ACESSIBILIDADE DISPONÍVEIS:
    - increaseFontSize: aumentar fonte
    - decreaseFontSize: diminuir fonte  
    - toggleHighContrast: alternar alto contraste
    - zoomIn: aumentar zoom
    - zoomOut: diminuir zoom
    - resetZoom: resetar zoom
    - readPage: ler conteúdo da página
    - readPageTitle: ler título da página
    - readHeadings: ler títulos e subtítulos
    - readLinks: ler links da página
    - searchByVoice: buscar por termo
    - goBack: voltar página
    - goForward: avançar página
    - reloadPage: recarregar página
    - scrollUp: rolar para cima
    - scrollDown: rolar para baixo
    - scrollToTop: ir para o topo
    - scrollToBottom: ir para o final

    RESPOSTA:`;
  }

  async processVoiceCommand(command, pageContext = '') {
    try {
      const response = await this.generateResponse(command, pageContext);
      
      const commandMatch = this.extractCommand(response);
      
      return {
        text: response,
        command: commandMatch?.command || null,
        confidence: commandMatch?.confidence || 0
      };
    } catch (error) {
      return {
        text: 'Desculpe, não consegui processar seu comando. Tente novamente.',
        command: null,
        confidence: 0
      };
    }
  }

  extractCommand(response) {
    const commands = {
      'increaseFontSize': ['aumentar fonte', 'fonte maior', 'texto maior'],
      'decreaseFontSize': ['diminuir fonte', 'fonte menor', 'texto menor'],
      'toggleHighContrast': ['alto contraste', 'contraste alto', 'modo contraste'],
      'zoomIn': ['aumentar zoom', 'zoom maior', 'ampliar'],
      'zoomOut': ['diminuir zoom', 'zoom menor', 'reduzir'],
      'resetZoom': ['reset zoom', 'zoom normal', 'zoom padrão'],
      'readPage': ['ler página', 'ler conteúdo', 'ler texto'],
      'readPageTitle': ['ler título', 'título da página'],
      'readHeadings': ['ler títulos', 'ler cabeçalhos', 'títulos da página'],
      'readLinks': ['ler links', 'links da página', 'enlaces'],
      'searchByVoice': ['buscar', 'procurar', 'pesquisar'],
      'goBack': ['voltar', 'anterior', 'página anterior'],
      'goForward': ['avançar', 'próximo', 'próxima página'],
      'reloadPage': ['recarregar', 'atualizar', 'refresh'],
      'scrollUp': ['rolar cima', 'scroll up', 'subir'],
      'scrollDown': ['rolar baixo', 'scroll down', 'descer'],
      'scrollToTop': ['topo', 'início', 'começo'],
      'scrollToBottom': ['final', 'fim', 'último']
    };

    const lowerResponse = response.toLowerCase();
    
    for (const [command, keywords] of Object.entries(commands)) {
      for (const keyword of keywords) {
        if (lowerResponse.includes(keyword)) {
          return {
            command: command,
            confidence: 0.8
          };
        }
      }
    }

    return null;
  }

  async getPageContext() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) return '';

      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            title: document.title,
            url: window.location.href,
            headings: Array.from(document.querySelectorAll('h1, h2, h3'))
              .map(h => h.textContent.trim())
              .slice(0, 5),
            mainContent: document.querySelector('main, article, .content, #content')?.textContent?.substring(0, 500) || ''
          };
        }
      });

      if (result && result[0]) {
        const context = result[0].result;
        return `
          Título: ${context.title}
          URL: ${context.url}
          Títulos principais: ${context.headings.join(', ')}
          Conteúdo principal: ${context.mainContent}
        `;
      }

      return '';
    } catch (error) {
      console.error('Erro ao obter contexto da página:', error);
      return '';
    }
  }
}

// Instância global do serviço Gemini
const geminiService = new GeminiService();

// A função de fala global não é mais necessária aqui, pois o content.js cuidará disso.

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.sync.set({ assistantActive: true, voiceSpeed: 1.0, voicePitch: 1.0 });
    // Não vai mais falar daqui, o content script cuidará dos sons.
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log("Navegador iniciado. O estado do assistente será controlado pelo content script.");
});


class AssistantBackground {
  constructor() {
    this.isActive = false;
    this.settings = { voiceSpeed: 1.0, voicePitch: 1.0 };
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.bindEvents();
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get(['voiceSpeed', 'voicePitch', 'assistantActive', 'aiEnabled']);
    this.settings.voiceSpeed = result.voiceSpeed || 1.0;
    this.settings.voicePitch = result.voicePitch || 1.0;
    this.isActive = result.assistantActive !== undefined ? result.assistantActive : true; // Ativo por padrão
    this.settings.aiEnabled = result.aiEnabled !== false; // Padrão: true
  }

  bindEvents() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Essencial para respostas assíncronas
    });
  }

  async handleMessage(message, sender, sendResponse) {
    if (message.action === 'processVoiceCommand') {
      // Recarrega a chave da API antes de processar
      await geminiService.loadApiKey();
      
      const result = await this.processVoiceCommand(message.transcript, sender.tab?.id);
      
      // Envia o resultado para o content script
      if (sender.tab?.id) {
        const responseMessage = {
          action: 'executeAndSpeak',
          command: result.action,
          textToSpeak: result.text
        };
        
        // Adiciona parâmetros especiais se necessário
        if (result.searchTerm) {
          responseMessage.searchTerm = result.searchTerm;
        }
        if (result.url) {
          responseMessage.url = result.url;
        }
        
        chrome.tabs.sendMessage(sender.tab.id, responseMessage).catch(e => {
          console.error("Erro ao enviar mensagem para content script:", e);
        });
      }
      
      sendResponse({ success: true });
      return;
    }

    // NOVA AÇÃO: Resumir conteúdo com IA
    if (message.action === 'summarizeContent') {
      try {
        await geminiService.loadApiKey();
        
        if (!geminiService.isConfigured()) {
          sendResponse({ 
            success: false, 
            error: 'API key do Gemini não configurada' 
          });
          return;
        }
        
        const prompt = `Resuma o seguinte conteúdo de uma página web de forma clara e concisa em português brasileiro. 
        Foque nos pontos principais e mantenha o resumo em no máximo 3 frases:
        
        Título da página: ${message.pageTitle}
        URL: ${message.pageUrl}
        
        Conteúdo:
        ${message.content}
        
        Resumo:`;
        
        const summary = await geminiService.generateResponse(prompt);
        
        sendResponse({ 
          success: true, 
          summary: summary 
        });
      } catch (error) {
        console.error('Erro ao gerar resumo:', error);
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      }
      return;
    }

    if (message.action === 'toggleAssistant') {
      // Para o toggle, precisamos encontrar a aba ativa
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await this.toggleAssistant(message.active, activeTab?.id);
      sendResponse({ success: true });
      return;
    }

    if (message.action === 'updateSettings') {
      // Atualiza as configurações
      this.settings = { ...this.settings, ...message.settings };
      await chrome.storage.sync.set(message.settings);
      sendResponse({ success: true });
      return;
    }

    if (message.action === 'testVoice') {
      try {
        // Teste de voz - envia para a aba ativa
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.id) {
          // Primeiro verifica se o content script está carregado
          try {
            await chrome.tabs.sendMessage(activeTab.id, { action: 'ping' });
            
            // Se chegou aqui, o content script está ativo
            chrome.tabs.sendMessage(activeTab.id, {
              action: 'speak',
              text: message.text || 'Teste de voz funcionando!'
            }).catch((error) => {
              console.error('Erro ao enviar mensagem de fala:', error);
            });
            
            sendResponse({ success: true, message: 'Teste enviado com sucesso' });
          } catch (error) {
            // Content script não está carregado, tenta injetar
            console.log('Content script não encontrado, tentando injetar...');
            
            try {
              await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['content.js']
              });
              
              // Aguarda um pouco e tenta novamente
              setTimeout(async () => {
                try {
                  chrome.tabs.sendMessage(activeTab.id, {
                    action: 'speak',
                    text: message.text || 'Teste de voz funcionando!'
                  }).catch((error) => {
                    console.error('Erro após injeção:', error);
                  });
                } catch (retryError) {
                  console.error('Erro no retry após injeção:', retryError);
                }
              }, 500);
              
              sendResponse({ success: true, message: 'Content script injetado e teste enviado' });
            } catch (injectionError) {
              console.error('Erro ao injetar content script:', injectionError);
              sendResponse({ 
                success: false, 
                error: 'Não foi possível carregar o assistente nesta página. Tente recarregar a página.' 
              });
            }
          }
        } else {
          sendResponse({ 
            success: false, 
            error: 'Nenhuma aba ativa encontrada' 
          });
        }
      } catch (error) {
        console.error('Erro no teste de voz:', error);
        sendResponse({ 
          success: false, 
          error: `Erro interno: ${error.message}` 
        });
      }
      return;
    }

    if (message.action === 'reloadContentScript') {
      try {
        // Recarrega o content script na aba ativa
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.id) {
          try {
            // Remove o content script antigo (se existir)
            await chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: () => {
                // Remove o botão flutuante se existir
                const existingButton = document.getElementById('voice-assistant-floating');
                if (existingButton) {
                  existingButton.remove();
                }
                // Limpa qualquer estado do assistente
                window.assistantInstance = null;
              }
            });
            
            // Injeta o novo content script
            await chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              files: ['content.js']
            });
            
            sendResponse({ success: true, message: 'Content script recarregado com sucesso' });
          } catch (error) {
            console.error('Erro ao recarregar content script:', error);
            sendResponse({ 
              success: false, 
              error: 'Erro ao recarregar o assistente. Tente recarregar a página manualmente.' 
            });
          }
        } else {
          sendResponse({ 
            success: false, 
            error: 'Nenhuma aba ativa encontrada' 
          });
        }
      } catch (error) {
        console.error('Erro no reloadContentScript:', error);
        sendResponse({ 
          success: false, 
          error: `Erro interno: ${error.message}` 
        });
      }
      return;
    }
    
    // As outras ações podem ser adicionadas aqui se necessário
  }

  async toggleAssistant(active, tabId) {
    this.isActive = active;
    await chrome.storage.sync.set({ assistantActive: this.isActive });

    // Notifica todas as abas sobre a mudança
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateAssistantStatus',
        active: this.isActive
      }).catch(() => {});
    }

    // Manda a aba que originou o comando falar o status (se existir)
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
          action: 'speak',
          text: this.isActive ? 'Assistente ativado.' : 'Assistente desativado.'
      }).catch(() => {});
    }
  }
  
  /**
   * NOVA LÓGICA: Integração com Gemini para processamento inteligente de comandos
   */
  async processVoiceCommand(transcript, tabId) {
    const command = transcript.toLowerCase().trim();
    console.log(`Background processando: "${command}"`);

    // Primeiro tenta comandos básicos conhecidos
    const basicCommand = this.processBasicCommand(command);
    if (basicCommand) {
      return basicCommand;
    }

    // Se não encontrou comando básico e IA está habilitada, usa o Gemini
    if (this.settings.aiEnabled) {
      try {
        // Verifica se o Gemini está configurado
        if (!geminiService.isConfigured()) {
          return {
            action: null,
            text: 'IA não configurada. Configure sua chave da API Gemini nas configurações.',
            confidence: 0
          };
        }

        // Obtém contexto da página atual (só se tiver tabId)
        let pageContext = '';
        if (tabId) {
          pageContext = await geminiService.getPageContext();
        }
        
        // Processa comando com IA
        const aiResponse = await geminiService.processVoiceCommand(command, pageContext);
        
        console.log('Resposta do Gemini:', aiResponse);
        
        return {
          action: aiResponse.command || null,
          text: aiResponse.text,
          confidence: aiResponse.confidence
        };
        
      } catch (error) {
        console.error('Erro ao processar comando com Gemini:', error);
        
        // Fallback para resposta básica
        return {
          action: null,
          text: 'Desculpe, não consegui entender seu comando. Tente novamente ou diga "ajuda" para ver os comandos disponíveis.',
          confidence: 0
        };
      }
    } else {
      // IA desabilitada, retorna resposta padrão
      return {
        action: null,
        text: 'Comando não reconhecido. Diga "ajuda" para ver os comandos disponíveis ou ative a IA nas configurações.',
        confidence: 0
      };
    }
  }

  // Processa comandos básicos conhecidos (fallback)
  processBasicCommand(command) {
    const hasKeywords = (keywords) => keywords.every(kw => command.includes(kw));
    const hasAnyKeyword = (keywords) => keywords.some(kw => command.includes(kw));

    // Comandos de busca
    if (hasAnyKeyword(['buscar', 'procurar', 'pesquisar', 'encontrar'])) {
      const searchTerm = this.extractSearchTerm(command);
      if (searchTerm) {
        return {
          action: 'searchByVoice',
          text: `Buscando por: ${searchTerm}`,
          searchTerm: searchTerm,
          confidence: 1.0
        };
      }
    }

    // Comandos de navegação
    if (hasAnyKeyword(['voltar', 'anterior', 'back'])) {
      return {
        action: 'goBack',
        text: 'Voltando para a página anterior.',
        confidence: 1.0
      };
    }
    
    if (hasAnyKeyword(['avançar', 'próximo', 'forward'])) {
      return {
        action: 'goForward',
        text: 'Avançando para a próxima página.',
        confidence: 1.0
      };
    }
    
    if (hasAnyKeyword(['recarregar', 'atualizar', 'refresh'])) {
      return {
        action: 'reloadPage',
        text: 'Recarregando a página.',
        confidence: 1.0
      };
    }

    // Comandos de rolagem
    if (hasAnyKeyword(['rolar', 'scroll'])) {
      if (hasAnyKeyword(['cima', 'up'])) {
        return {
          action: 'scrollUp',
          text: 'Rolando para cima.',
          confidence: 1.0
        };
      } else if (hasAnyKeyword(['baixo', 'down'])) {
        return {
          action: 'scrollDown',
          text: 'Rolando para baixo.',
          confidence: 1.0
        };
      } else if (hasAnyKeyword(['topo', 'início'])) {
        return {
          action: 'scrollToTop',
          text: 'Indo para o topo da página.',
          confidence: 1.0
        };
      } else if (hasAnyKeyword(['final', 'fim'])) {
        return {
          action: 'scrollToBottom',
          text: 'Indo para o final da página.',
          confidence: 1.0
        };
      }
    }

    // Comandos de zoom
    if (hasAnyKeyword(['zoom', 'ampliar'])) {
      if (hasAnyKeyword(['aumentar', 'mais', 'in'])) {
        return {
          action: 'zoomIn',
          text: 'Zoom aumentado.',
          confidence: 1.0
        };
      } else if (hasAnyKeyword(['diminuir', 'menos', 'out'])) {
        return {
          action: 'zoomOut',
          text: 'Zoom diminuído.',
          confidence: 1.0
        };
      } else if (hasAnyKeyword(['reset', 'normal', 'padrão'])) {
        return {
          action: 'resetZoom',
          text: 'Zoom resetado.',
          confidence: 1.0
        };
      }
    }

    // Comandos de acessibilidade
    if (hasKeywords(['aumentar', 'fonte'])) {
        return {
          action: 'increaseFontSize',
          text: 'Fonte aumentada.',
          confidence: 1.0
        };
    } else if (hasKeywords(['diminuir', 'fonte'])) {
        return {
          action: 'decreaseFontSize',
          text: 'Fonte diminuída.',
          confidence: 1.0
        };
    } else if (hasKeywords(['contraste']) && (hasKeywords(['alto']) || hasKeywords(['auto']))) {
        return {
          action: 'toggleHighContrast',
          text: 'Alto contraste alternado.',
          confidence: 1.0
        };
    } else if (hasKeywords(['ler', 'página'])) {
        return {
          action: 'readPage',
          text: null, // O content script vai falar o conteúdo
          confidence: 1.0
        };
    } else if (hasKeywords(['ler', 'título'])) {
        return {
          action: 'readPageTitle',
          text: null, // O content script vai falar o título
          confidence: 1.0
        };
    } else if (hasKeywords(['ler', 'títulos']) || hasKeywords(['ler', 'cabeçalhos'])) {
        return {
          action: 'readHeadings',
          text: null, // O content script vai falar os títulos
          confidence: 1.0
        };
    } else if (hasKeywords(['ler', 'links'])) {
        return {
          action: 'readLinks',
          text: null, // O content script vai falar os links
          confidence: 1.0
        };
    } else if (hasKeywords(['notícias', 'dia'])) {
        return {
          action: null,
          text: this.getNews(),
          confidence: 1.0
        };
    } else if (hasKeywords(['ajuda'])) {
        return {
          action: null,
          text: this.showHelp(),
          confidence: 1.0
        };
    }

    return null; // Nenhum comando básico encontrado
  }

  // Extrai termo de busca do comando
  extractSearchTerm(command) {
    const searchWords = ['buscar', 'procurar', 'pesquisar', 'encontrar'];
    let searchTerm = command;
    
    // Remove palavras de busca do início
    for (const word of searchWords) {
      if (searchTerm.startsWith(word)) {
        searchTerm = searchTerm.substring(word.length).trim();
        break;
      }
    }
    
    // Remove palavras de busca do final
    for (const word of searchWords) {
      if (searchTerm.endsWith(word)) {
        searchTerm = searchTerm.substring(0, searchTerm.length - word.length).trim();
        break;
      }
    }
    
    return searchTerm || null;
  }

  async getNews() {
        // Lógica para buscar notícias aqui...
    return "Notícia 1: IA avança no Brasil. Notícia 2: Nova tecnologia para navegadores é lançada.";
  }

  showHelp() {
    return `Comandos disponíveis:

ACESSIBILIDADE:
- "Aumentar fonte" / "Diminuir fonte" - Controla o tamanho do texto
- "Alto contraste" - Ativa/desativa modo de alto contraste
- "Zoom in/out" - Controla o zoom da página
- "Reset zoom" - Volta ao zoom normal

LEITURA:
- "Ler página" - Lê o conteúdo principal
- "Ler título" - Lê o título da página
- "Ler títulos" - Lista os títulos e subtítulos
- "Ler links" - Lista os links da página

NAVEGAÇÃO:
- "Buscar [termo]" - Busca na página ou no Google
- "Voltar" / "Avançar" - Navega no histórico
- "Recarregar" - Atualiza a página
- "Rolar cima/baixo" - Controla a rolagem
- "Topo" / "Final" - Vai para o início ou fim da página

CONTROLE:
- "Para" / "Pare" - Para o que está fazendo
- "Ok assistente" - Ativa o assistente
- "Ajuda" - Lista todos os comandos

Você também pode clicar em elementos da página para que sejam lidos.`;
  }
}

const assistant = new AssistantBackground();