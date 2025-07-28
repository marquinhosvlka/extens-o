// background.js (Melhorado com chave integrada e funcionalidades expandidas)

// Configuração do Gemini com chave integrada
const GEMINI_CONFIG = {
  API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  API_KEY: 'AIzaSyB2AG4ZV2JWHB9DwOkcFl40f5n4FmNWS-E', // Chave integrada
  MODEL_CONFIG: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  }
};

// Classe Gemini Service melhorada
class GeminiService {
  constructor() {
    this.apiKey = GEMINI_CONFIG.API_KEY;
  }

  isConfigured() {
    return this.apiKey && this.apiKey.length > 20;
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
    return `Você é um assistente de acessibilidade para navegação web especializado em ajudar pessoas com deficiência visual.
    Sua função é interpretar comandos de voz e convertê-los em ações específicas.

    CONTEXTO DA PÁGINA ATUAL:
    ${context}

    COMANDO DO USUÁRIO:
    "${userPrompt}"

    INSTRUÇÕES:
    1. Analise o comando do usuário e determine a melhor ação
    2. Se for um comando de navegação/acessibilidade, responda com o comando específico
    3. Se for uma pergunta sobre conteúdo, responda de forma clara e concisa
    4. Se for uma solicitação de busca, extraia o termo de busca
    5. Mantenha respostas curtas e diretas (máximo 150 palavras)
    6. Responda sempre em português brasileiro
    7. Se não entender, peça esclarecimento

    COMANDOS DISPONÍVEIS:
    - increaseFontSize: aumentar tamanho da fonte
    - decreaseFontSize: diminuir tamanho da fonte  
    - toggleHighContrast: alternar alto contraste
    - zoomIn: aumentar zoom da página
    - zoomOut: diminuir zoom da página
    - resetZoom: resetar zoom para 100%
    - readPage: ler todo o conteúdo da página
    - readPageTitle: ler apenas o título da página
    - readHeadings: ler todos os títulos e subtítulos
    - readLinks: ler todos os links da página
    - searchByVoice: buscar por termo específico
    - goBack: voltar para página anterior
    - goForward: avançar para próxima página
    - reloadPage: recarregar a página atual
    - scrollUp: rolar página para cima
    - scrollDown: rolar página para baixo
    - scrollToTop: ir para o topo da página
    - scrollToBottom: ir para o final da página
    - openNewTab: abrir nova aba
    - closeTab: fechar aba atual
    - switchTab: alternar entre abas
    - findInPage: procurar texto na página
    - clickElement: clicar em elemento específico
    - fillForm: preencher formulário
    - submitForm: enviar formulário

    EXEMPLOS DE INTERPRETAÇÃO:
    - "aumentar o texto" → increaseFontSize
    - "fazer zoom" → zoomIn
    - "ler esta página" → readPage
    - "buscar por notícias" → searchByVoice com termo "notícias"
    - "voltar" → goBack
    - "ir para o topo" → scrollToTop
    - "abrir nova aba" → openNewTab
    - "procurar por tecnologia" → findInPage com termo "tecnologia"

    RESPOSTA (formato JSON):
    {
      "action": "comando_específico_ou_null",
      "text": "resposta_para_falar",
      "parameter": "parâmetro_adicional_se_necessário",
      "confidence": 0.8
    }`;
  }

  async processVoiceCommand(command, pageContext = '') {
    try {
      const response = await this.generateResponse(command, pageContext);
      
      // Tenta extrair JSON da resposta
      let parsedResponse;
      try {
        // Procura por JSON na resposta
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          // Se não encontrou JSON, cria resposta padrão
          parsedResponse = {
            action: null,
            text: response,
            parameter: null,
            confidence: 0.5
          };
        }
      } catch (parseError) {
        // Se falhou ao parsear JSON, usa resposta como texto
        parsedResponse = {
          action: null,
          text: response,
          parameter: null,
          confidence: 0.5
        };
      }
      
      return parsedResponse;
    } catch (error) {
      return {
        action: null,
        text: 'Desculpe, não consegui processar seu comando. Tente novamente.',
        parameter: null,
        confidence: 0
      };
    }
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
            links: Array.from(document.querySelectorAll('a[href]'))
              .map(a => a.textContent.trim())
              .filter(text => text.length > 0)
              .slice(0, 10),
            forms: Array.from(document.querySelectorAll('form'))
              .map(form => ({
                action: form.action,
                inputs: Array.from(form.querySelectorAll('input, select, textarea'))
                  .map(input => ({
                    type: input.type,
                    name: input.name,
                    placeholder: input.placeholder
                  }))
              })),
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
          Links disponíveis: ${context.links.join(', ')}
          Formulários: ${context.forms.length > 0 ? 'Sim' : 'Não'}
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

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.sync.set({ 
      assistantActive: true, 
      voiceSpeed: 1.0, 
      voicePitch: 1.0,
      aiEnabled: true // IA sempre ativada por padrão
    });
  }
});

class AssistantBackground {
  constructor() {
    this.isActive = false;
    this.settings = { voiceSpeed: 1.0, voicePitch: 1.0, aiEnabled: true };
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
    this.isActive = result.assistantActive !== undefined ? result.assistantActive : true;
    this.settings.aiEnabled = result.aiEnabled !== false; // Sempre true por padrão
  }

  bindEvents() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  async handleMessage(message, sender, sendResponse) {
    if (message.action === 'processVoiceCommand') {
      const result = await this.processVoiceCommand(message.transcript, sender.tab?.id);
      
      if (sender.tab?.id) {
        const responseMessage = {
          action: 'executeAndSpeak',
          command: result.action,
          textToSpeak: result.text,
          parameter: result.parameter
        };
        
        chrome.tabs.sendMessage(sender.tab.id, responseMessage).catch(e => {
          console.error("Erro ao enviar mensagem para content script:", e);
        });
      }
      
      sendResponse({ success: true });
      return;
    }

    if (message.action === 'summarizeContent') {
      try {
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
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await this.toggleAssistant(message.active, activeTab?.id);
      sendResponse({ success: true });
      return;
    }

    if (message.action === 'updateSettings') {
      this.settings = { ...this.settings, ...message.settings };
      await chrome.storage.sync.set(message.settings);
      sendResponse({ success: true });
      return;
    }

    if (message.action === 'testVoice') {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.id) {
          try {
            await chrome.tabs.sendMessage(activeTab.id, { action: 'ping' });
            
            chrome.tabs.sendMessage(activeTab.id, {
              action: 'speak',
              text: message.text || 'Teste de voz funcionando perfeitamente! A extensão está pronta para uso.'
            }).catch((error) => {
              console.error('Erro ao enviar mensagem de fala:', error);
            });
            
            sendResponse({ success: true, message: 'Teste enviado com sucesso' });
          } catch (error) {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                files: ['content.js']
              });
              
              setTimeout(async () => {
                try {
                  chrome.tabs.sendMessage(activeTab.id, {
                    action: 'speak',
                    text: message.text || 'Teste de voz funcionando! Extensão carregada com sucesso.'
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
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.id) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: () => {
                const existingButton = document.getElementById('voice-assistant-floating');
                if (existingButton) {
                  existingButton.remove();
                }
                window.assistantInstance = null;
              }
            });
            
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

    // Nova ação para executar comandos avançados
    if (message.action === 'executeAdvancedCommand') {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.id) {
          const result = await this.executeAdvancedCommand(message.command, message.parameter, activeTab.id);
          sendResponse(result);
        } else {
          sendResponse({ success: false, error: 'Nenhuma aba ativa encontrada' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
      return;
    }
  }

  async toggleAssistant(active, tabId) {
    this.isActive = active;
    await chrome.storage.sync.set({ assistantActive: this.isActive });

    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateAssistantStatus',
        active: this.isActive
      }).catch(() => {});
    }

    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
          action: 'speak',
          text: this.isActive ? 'Assistente ativado e pronto para uso.' : 'Assistente desativado.'
      }).catch(() => {});
    }
  }
  
  async processVoiceCommand(transcript, tabId) {
    const command = transcript.toLowerCase().trim();
    console.log(`Background processando: "${command}"`);

    // Primeiro tenta comandos básicos conhecidos
    const basicCommand = this.processBasicCommand(command);
    if (basicCommand) {
      return basicCommand;
    }

    // Usa o Gemini para processar comandos mais complexos
    if (this.settings.aiEnabled && geminiService.isConfigured()) {
      try {
        let pageContext = '';
        if (tabId) {
          pageContext = await geminiService.getPageContext();
        }
        
        const aiResponse = await geminiService.processVoiceCommand(command, pageContext);
        
        console.log('Resposta do Gemini:', aiResponse);
        
        return {
          action: aiResponse.action || null,
          text: aiResponse.text,
          parameter: aiResponse.parameter || null,
          confidence: aiResponse.confidence || 0.8
        };
        
      } catch (error) {
        console.error('Erro ao processar comando com Gemini:', error);
        
        return {
          action: null,
          text: 'Desculpe, não consegui entender seu comando. Tente novamente ou diga "ajuda" para ver os comandos disponíveis.',
          parameter: null,
          confidence: 0
        };
      }
    } else {
      return {
        action: null,
        text: 'Comando não reconhecido. Diga "ajuda" para ver os comandos disponíveis.',
        parameter: null,
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
          parameter: searchTerm,
          confidence: 1.0
        };
      }
    }

    // Comandos de navegação
    if (hasAnyKeyword(['voltar', 'anterior', 'back'])) {
      return {
        action: 'goBack',
        text: 'Voltando para a página anterior.',
        parameter: null,
        confidence: 1.0
      };
    }
    
    if (hasAnyKeyword(['avançar', 'próximo', 'forward'])) {
      return {
        action: 'goForward',
        text: 'Avançando para a próxima página.',
        parameter: null,
        confidence: 1.0
      };
    }
    
    if (hasAnyKeyword(['recarregar', 'atualizar', 'refresh'])) {
      return {
        action: 'reloadPage',
        text: 'Recarregando a página.',
        parameter: null,
        confidence: 1.0
      };
    }

    // Comandos de rolagem
    if (hasAnyKeyword(['rolar', 'scroll'])) {
      if (hasAnyKeyword(['cima', 'up'])) {
        return {
          action: 'scrollUp',
          text: 'Rolando para cima.',
          parameter: null,
          confidence: 1.0
        };
      } else if (hasAnyKeyword(['baixo', 'down'])) {
        return {
          action: 'scrollDown',
          text: 'Rolando para baixo.',
          parameter: null,
          confidence: 1.0
        };
      } else if (hasAnyKeyword(['topo', 'início'])) {
        return {
          action: 'scrollToTop',
          text: 'Indo para o topo da página.',
          parameter: null,
          confidence: 1.0
        };
      } else if (hasAnyKeyword(['final', 'fim'])) {
        return {
          action: 'scrollToBottom',
          text: 'Indo para o final da página.',
          parameter: null,
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
          parameter: null,
          confidence: 1.0
        };
      } else if (hasAnyKeyword(['diminuir', 'menos', 'out'])) {
        return {
          action: 'zoomOut',
          text: 'Zoom diminuído.',
          parameter: null,
          confidence: 1.0
        };
      } else if (hasAnyKeyword(['reset', 'normal', 'padrão'])) {
        return {
          action: 'resetZoom',
          text: 'Zoom resetado.',
          parameter: null,
          confidence: 1.0
        };
      }
    }

    // Comandos de acessibilidade
    if (hasKeywords(['aumentar', 'fonte'])) {
        return {
          action: 'increaseFontSize',
          text: 'Fonte aumentada.',
          parameter: null,
          confidence: 1.0
        };
    } else if (hasKeywords(['diminuir', 'fonte'])) {
        return {
          action: 'decreaseFontSize',
          text: 'Fonte diminuída.',
          parameter: null,
          confidence: 1.0
        };
    } else if (hasKeywords(['contraste']) && (hasKeywords(['alto']) || hasKeywords(['auto']))) {
        return {
          action: 'toggleHighContrast',
          text: 'Alto contraste alternado.',
          parameter: null,
          confidence: 1.0
        };
    } else if (hasKeywords(['ler', 'página'])) {
        return {
          action: 'readPage',
          text: null,
          parameter: null,
          confidence: 1.0
        };
    } else if (hasKeywords(['ler', 'título'])) {
        return {
          action: 'readPageTitle',
          text: null,
          parameter: null,
          confidence: 1.0
        };
    } else if (hasKeywords(['ler', 'títulos']) || hasKeywords(['ler', 'cabeçalhos'])) {
        return {
          action: 'readHeadings',
          text: null,
          parameter: null,
          confidence: 1.0
        };
    } else if (hasKeywords(['ler', 'links'])) {
        return {
          action: 'readLinks',
          text: null,
          parameter: null,
          confidence: 1.0
        };
    } else if (hasKeywords(['ajuda'])) {
        return {
          action: null,
          text: this.showHelp(),
          parameter: null,
          confidence: 1.0
        };
    }

    return null;
  }

  // Extrai termo de busca do comando
  extractSearchTerm(command) {
    const searchWords = ['buscar', 'procurar', 'pesquisar', 'encontrar'];
    let searchTerm = command;
    
    for (const word of searchWords) {
      if (searchTerm.includes(word)) {
        searchTerm = searchTerm.replace(word, '').trim();
        break;
      }
    }
    
    return searchTerm || null;
  }

  // Executa comandos avançados
  async executeAdvancedCommand(command, parameter, tabId) {
    try {
      switch (command) {
        case 'openNewTab':
          const newTab = await chrome.tabs.create({ url: parameter || 'chrome://newtab/' });
          return { success: true, message: 'Nova aba aberta.' };

        case 'closeTab':
          await chrome.tabs.remove(tabId);
          return { success: true, message: 'Aba fechada.' };

        case 'switchTab':
          const tabs = await chrome.tabs.query({ currentWindow: true });
          const currentIndex = tabs.findIndex(tab => tab.id === tabId);
          const nextIndex = (currentIndex + 1) % tabs.length;
          await chrome.tabs.update(tabs[nextIndex].id, { active: true });
          return { success: true, message: 'Alternando para próxima aba.' };

        case 'findInPage':
          if (parameter) {
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              func: (searchTerm) => {
                window.find(searchTerm, false, false, true, false, true, false);
              },
              args: [parameter]
            });
            return { success: true, message: `Procurando por: ${parameter}` };
          }
          return { success: false, error: 'Termo de busca não especificado.' };

        default:
          return { success: false, error: 'Comando não reconhecido.' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
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
- "Resumir" - Gera resumo inteligente da página

NAVEGAÇÃO:
- "Buscar [termo]" - Busca na página ou no Google
- "Voltar" / "Avançar" - Navega no histórico
- "Recarregar" - Atualiza a página atual
- "Rolar cima/baixo" - Controla a rolagem
- "Topo" / "Final" - Vai para o início ou fim da página
- "Abrir nova aba" - Abre nova aba
- "Fechar aba" - Fecha aba atual
- "Próxima aba" - Alterna entre abas

CONTROLE:
- "Para" / "Pare" - Para o que está fazendo
- "Ok assistente" - Ativa o assistente
- "Ajuda" - Lista todos os comandos

A IA também entende comandos naturais como "me explique esta página" ou "o que posso fazer aqui".`;
  }
}

const assistant = new AssistantBackground();