// content.js (Corrigido com escuta contínua e fala local)

class AccessibilityContentScript {
  constructor() {
    this.isAssistantActive = true; // Começa ativo
    this.isListening = false;
    this.isActivated = false; // NOVO: Controla se o assistente foi ativado
    this.activationTimeout = null; // NOVO: Timeout para desativar automaticamente
    this.recognition = null;
    this.synthesis = window.speechSynthesis; // <-- API de fala
    this.init();
  }

  async init() {
    // Carrega o estado salvo
    const result = await chrome.storage.sync.get(['assistantActive']);
    this.isAssistantActive = result.assistantActive !== undefined ? result.assistantActive : true;

    this.createFloatingButton();
    this.setupSpeechRecognition();
    this.setupClickToRead();
    this.updateButtonState();

    // Inicia em modo passivo (só escuta palavras-chave de ativação)
    if (this.isAssistantActive) {
      this.startPassiveListening();
      // Lê o título da página automaticamente após um pequeno delay
      setTimeout(() => {
        this.readPageTitle();
      }, 2000);
    }
    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  // MUDANÇA: Função de fala local com controle de interrupção
  speak(text, interruptible = true) {
    if (!text || !this.isAssistantActive) return;
    
    // Se não for interrompível e já estiver falando, não interrompe
    if (!interruptible && this.synthesis.speaking) {
      return;
    }
    
    this.synthesis.cancel(); // Cancela falas anteriores
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    this.synthesis.speak(utterance);
  }

  createFloatingButton() {
     // Seu código do botão flutuante aqui...
     // Apenas garanta que o evento de clique chame `this.activateAndListen()`
     if (document.getElementById('voice-assistant-floating')) return;

      const buttonContainer = document.createElement('div');
      buttonContainer.id = 'voice-assistant-floating';
      buttonContainer.style.position = 'fixed';
      buttonContainer.style.bottom = '20px';
      buttonContainer.style.right = '20px';
      buttonContainer.style.zIndex = '999999';

      const button = document.createElement('button');
      button.id = 'assistantBtn';
      button.textContent = '🎤';
      button.style.width = '60px';
      button.style.height = '60px';
      button.style.borderRadius = '50%';
      button.style.border = 'none';
      button.style.backgroundColor = '#764ba2';
      button.style.color = 'white';
      button.style.fontSize = '24px';
      button.style.cursor = 'pointer';

      buttonContainer.appendChild(button);
      document.body.appendChild(buttonContainer);
      
      button.addEventListener('click', () => this.activateAndListen());
  }

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'pt-BR';
    this.recognition.continuous = true; // <-- MUDANÇA: Escuta contínua
    this.recognition.interimResults = false;

    this.recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        console.log(`Ouviu: "${transcript}"`);
        
        // Comandos de interrupção (sempre funcionam)
        if (transcript.includes('para') || transcript.includes('pare') || transcript.includes('stop')) {
          this.synthesis.cancel();
          this.speak('Parado.', false);
          this.deactivateAssistant(); // Desativa após parar
          return;
        }
        
        // Ativação por palavra-chave
        if (transcript.includes('ok assistente') || transcript.includes('ei assistente')) {
          this.activateAssistant();
        } else if (this.isActivated) {
          // Só processa comandos se estiver ativado
          this.resetActivationTimeout(); // Reseta o timeout
          
          // Processa comandos locais primeiro
          const localCommand = this.processLocalCommand(transcript);
          if (localCommand) {
            this.speak(localCommand);
          } else {
            // Se não encontrou comando local, envia para o background
            chrome.runtime.sendMessage({
              action: 'processVoiceCommand',
              transcript: transcript
            }).catch(e => console.error(e));
          }
        }
        // Se não estiver ativado, ignora outros comandos
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateButtonState();
      // MUDANÇA: Reinicia a escuta se o assistente ainda estiver ativo
      if (this.isAssistantActive) {
        setTimeout(() => this.startPassiveListening(), 250); // Reinicia após um pequeno intervalo
      }
    };
    
    this.recognition.onerror = (event) => {
        // Ignora o erro 'no-speech' que acontece quando ninguém fala
        if (event.error !== 'no-speech') {
            console.error('Erro de reconhecimento:', event.error);
        }
    };
  }

  // NOVA FUNÇÃO: Processa comandos locais primeiro
  processLocalCommand(transcript) {
    const command = transcript.toLowerCase();
    
    // Comandos de leitura
    if (command.includes('ler página') || command.includes('ler conteúdo') || command.includes('ler texto')) {
      this.readPage();
      return 'Lendo o conteúdo da página.';
    }
    
    if (command.includes('resumir') || command.includes('resumo') || command.includes('resuma')) {
      this.summarizePage();
      return 'Gerando resumo da página.';
    }
    
    if (command.includes('ler título')) {
      this.readPageTitle();
      return 'Lendo o título da página.';
    }
    
    if (command.includes('ler títulos') || command.includes('ler cabeçalhos')) {
      this.readHeadings();
      return 'Lendo os títulos da página.';
    }
    
    if (command.includes('ler links')) {
      this.readLinks();
      return 'Lendo os links da página.';
    }
    
    // Comandos de acessibilidade
    if (command.includes('aumentar fonte') || command.includes('fonte maior')) {
      this.increaseFontSize();
      return 'Fonte aumentada.';
    }
    
    if (command.includes('diminuir fonte') || command.includes('fonte menor')) {
      this.decreaseFontSize();
      return 'Fonte diminuída.';
    }
    
    if (command.includes('alto contraste')) {
      this.toggleHighContrast();
      return 'Alto contraste alternado.';
    }
    
    // Comandos de zoom
    if (command.includes('zoom in') || command.includes('aumentar zoom')) {
      this.zoomIn();
      return 'Zoom aumentado.';
    }
    
    if (command.includes('zoom out') || command.includes('diminuir zoom')) {
      this.zoomOut();
      return 'Zoom diminuído.';
    }
    
    if (command.includes('reset zoom') || command.includes('zoom normal')) {
      this.resetZoom();
      return 'Zoom resetado.';
    }
    
    // Comandos de navegação
    if (command.includes('voltar') || command.includes('anterior')) {
      this.goBack();
      return 'Voltando para a página anterior.';
    }
    
    if (command.includes('avançar') || command.includes('próximo')) {
      this.goForward();
      return 'Avançando para a próxima página.';
    }
    
    if (command.includes('recarregar') || command.includes('atualizar')) {
      this.reloadPage();
      return 'Recarregando a página.';
    }
    
    // Comandos de rolagem
    if (command.includes('rolar cima') || command.includes('scroll up')) {
      this.scrollUp();
      return 'Rolando para cima.';
    }
    
    if (command.includes('rolar baixo') || command.includes('scroll down')) {
      this.scrollDown();
      return 'Rolando para baixo.';
    }
    
    if (command.includes('topo') || command.includes('início')) {
      this.scrollToTop();
      return 'Indo para o topo da página.';
    }
    
    if (command.includes('final') || command.includes('fim')) {
      this.scrollToBottom();
      return 'Indo para o final da página.';
    }
    
    // Se não encontrou comando local, retorna null para enviar ao background
    return null;
  }

  // MUDANÇA: Inicia a escuta
  startPassiveListening() {
    if (this.isAssistantActive && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        this.updateButtonState();
      } catch (e) {
        // Captura o erro 'InvalidStateError' se já estiver iniciado
        this.isListening = false;
      }
    }
  }

  // Função para o clique do botão
  activateAndListen() {
      if (!this.isAssistantActive) {
          this.speak("Assistente desativado.");
          return;
      }
      
      this.synthesis.cancel(); // Para qualquer fala
      
      if (this.isActivated) {
          // Se já está ativado, desativa
          this.deactivateAssistant();
      } else {
          // Se não está ativado, ativa
          this.activateAssistant();
      }
  }

  // NOVA FUNÇÃO: Ativa o assistente
  activateAssistant() {
    this.isActivated = true;
    this.speak('Assistente ativado. Pode falar.', false);
    this.updateButtonState();
    this.resetActivationTimeout();
  }

  // NOVA FUNÇÃO: Desativa o assistente
  deactivateAssistant() {
    this.isActivated = false;
    this.speak("Assistente desativado.", false);
    this.updateButtonState();
    this.clearActivationTimeout();
  }

  // NOVA FUNÇÃO: Reseta o timeout de ativação
  resetActivationTimeout() {
    this.clearActivationTimeout();
    // Desativa automaticamente após 30 segundos de inatividade
    this.activationTimeout = setTimeout(() => {
      if (this.isActivated) {
        this.speak("Desativando assistente por inatividade.", false);
        this.deactivateAssistant();
      }
    }, 30000); // 30 segundos
  }

  // NOVA FUNÇÃO: Limpa o timeout
  clearActivationTimeout() {
    if (this.activationTimeout) {
      clearTimeout(this.activationTimeout);
      this.activationTimeout = null;
    }
  }

  updateButtonState() {
    const button = document.getElementById('assistantBtn');
    if (!button) return;
    
    if (this.isActivated) {
      button.style.backgroundColor = '#ff6b6b'; // Cor de ativo (vermelho)
      button.textContent = '🎤'; // Ícone de microfone ativo
    } else if (this.isListening) {
      button.style.backgroundColor = '#ffa500'; // Cor de escuta passiva (laranja)
      button.textContent = '👂'; // Ícone de ouvido
    } else if (this.isAssistantActive) {
      button.style.backgroundColor = '#764ba2'; // Cor normal
      button.textContent = '🎤'; // Ícone normal
    } else {
      button.style.backgroundColor = '#6c757d'; // Cor inativa
      button.textContent = '🔇'; // Ícone mudo
    }
  }

  setupClickToRead() {
    // Adiciona funcionalidade de clique para ler elementos
    document.addEventListener('click', (event) => {
      if (!this.isAssistantActive || !this.isActivated) return;
      
      const target = event.target;
      let text = target.innerText || target.textContent;
      
      // Se for um link, adiciona informação sobre o destino
      if (target.tagName === 'A' && target.href) {
        const linkText = text.trim();
        const href = target.href;
        text = `Link: ${linkText}. Destino: ${href}`;
      }
      
      // Se o elemento tem texto e não é muito pequeno, lê o texto
      if (text && text.trim().length > 5 && text.trim().length < 500) {
        this.speak(text.trim());
      }
    }, true);
    
    // Adiciona hover para ler elementos (opcional)
    document.addEventListener('mouseover', (event) => {
      if (!this.isAssistantActive || !this.isActivated) return;
      
      const target = event.target;
      const text = target.getAttribute('title') || target.getAttribute('alt') || target.innerText;
      
      // Só lê se for um elemento importante (botões, links, imagens)
      if (text && (target.tagName === 'BUTTON' || target.tagName === 'A' || target.tagName === 'IMG')) {
        if (text.trim().length > 0 && text.trim().length < 200) {
          this.speak(text.trim());
        }
      }
    });
  }

  handleMessage(message, sender, sendResponse) {
    // Handler para ping - verifica se o content script está ativo
    if (message.action === 'ping') {
      sendResponse({ status: 'active', timestamp: Date.now() });
      return;
    }
    
    if (message.action === 'updateAssistantStatus') {
      this.isAssistantActive = message.active;
      if (this.isAssistantActive) {
        this.startPassiveListening();
      } else {
        this.recognition.stop();
      }
      this.updateButtonState();
    }
    
    // MUDANÇA: Nova ação para executar comandos e falar
    if (message.action === 'executeAndSpeak') {
        if (message.command) {
            // Comandos especiais que precisam de parâmetros
            if (message.command === 'searchByVoice' && message.searchTerm) {
                this.searchByVoice(message.searchTerm);
            } else if (message.command === 'navigateToUrl' && message.url) {
                this.navigateToUrl(message.url);
            } else {
                // Comandos normais
                this[message.command](); // Chama a função local (ex: this.increaseFontSize())
            }
        }
        if (message.textToSpeak) {
            this.speak(message.textToSpeak);
        }
    }

    if(message.action === 'speak') {
        this.speak(message.text);
    }
  }

  // --- Suas funções de acessibilidade ---
  increaseFontSize() { document.body.style.fontSize = `${parseFloat(getComputedStyle(document.body).fontSize) + 2}px`; }
  decreaseFontSize() { document.body.style.fontSize = `${parseFloat(getComputedStyle(document.body).fontSize) - 2}px`; }
  toggleHighContrast() { document.body.classList.toggle('high-contrast-mode-accessibility'); /* Adicione seu CSS de alto contraste */ }
  
  readPageTitle() {
    const title = document.title || 'Página sem título';
    this.speak(`Título da página: ${title}`);
  }
  
  readHeadings() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length > 0) {
      const headingText = Array.from(headings)
        .map(h => h.innerText.trim())
        .filter(text => text.length > 0)
        .slice(0, 10) // Limita a 10 títulos
        .join('. ');
      this.speak(`Títulos da página: ${headingText}`);
    } else {
      this.speak('Nenhum título encontrado nesta página.');
    }
  }
  
  readLinks() {
    const links = document.querySelectorAll('a[href]');
    if (links.length > 0) {
      const linkText = Array.from(links)
        .map(link => link.innerText.trim())
        .filter(text => text.length > 0 && text.length < 50)
        .slice(0, 10) // Limita a 10 links
        .join('. ');
      this.speak(`Links encontrados: ${linkText}`);
    } else {
      this.speak('Nenhum link encontrado nesta página.');
    }
  }
  
  // NOVA FUNÇÃO: Busca por voz
  searchByVoice(searchTerm) {
    // Tenta diferentes métodos de busca
    let searchBox = null;
    
    // Procura por diferentes tipos de campos de busca
    const searchSelectors = [
      'input[type="search"]',
      'input[name*="search"]',
      'input[id*="search"]',
      'input[placeholder*="buscar"]',
      'input[placeholder*="search"]',
      'input[placeholder*="procurar"]',
      'input[aria-label*="buscar"]',
      'input[aria-label*="search"]',
      '.search input',
      '#search input',
      'form[role="search"] input'
    ];
    
    for (const selector of searchSelectors) {
      searchBox = document.querySelector(selector);
      if (searchBox) break;
    }
    
    if (searchBox) {
      // Foca no campo de busca
      searchBox.focus();
      searchBox.value = searchTerm;
      
      // Dispara evento de input para ativar funcionalidades de busca
      searchBox.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Tenta submeter o formulário
      const form = searchBox.closest('form');
      if (form) {
        form.submit();
      } else {
        // Se não há formulário, simula Enter
        searchBox.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        }));
      }
      
      this.speak(`Buscando por: ${searchTerm}`);
    } else {
      // Se não encontrou campo de busca, abre nova aba com Google
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
      window.open(googleSearchUrl, '_blank');
      this.speak(`Abrindo busca no Google para: ${searchTerm}`);
    }
  }
  
  // NOVA FUNÇÃO: Navegar para URL
  navigateToUrl(url) {
    if (url.startsWith('http')) {
      window.location.href = url;
    } else {
      window.location.href = `https://${url}`;
    }
    this.speak(`Navegando para: ${url}`);
  }
  
  // NOVA FUNÇÃO: Voltar página
  goBack() {
    if (window.history.length > 1) {
      window.history.back();
      this.speak('Voltando para a página anterior.');
    } else {
      this.speak('Não há páginas anteriores para voltar.');
    }
  }
  
  // NOVA FUNÇÃO: Avançar página
  goForward() {
    window.history.forward();
    this.speak('Avançando para a próxima página.');
  }
  
  // NOVA FUNÇÃO: Recarregar página
  reloadPage() {
    window.location.reload();
    this.speak('Recarregando a página.');
  }
  
  // NOVA FUNÇÃO: Rolar para cima
  scrollUp() {
    window.scrollBy(0, -300);
    this.speak('Rolando para cima.');
  }
  
  // NOVA FUNÇÃO: Rolar para baixo
  scrollDown() {
    window.scrollBy(0, 300);
    this.speak('Rolando para baixo.');
  }
  
  // NOVA FUNÇÃO: Ir para o topo
  scrollToTop() {
    window.scrollTo(0, 0);
    this.speak('Indo para o topo da página.');
  }
  
  // NOVA FUNÇÃO: Ir para o final
  scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
    this.speak('Indo para o final da página.');
  }
  
  // NOVA FUNÇÃO: Zoom in
  zoomIn() {
    const currentZoom = document.body.style.zoom || 1;
    const newZoom = Math.min(parseFloat(currentZoom) + 0.1, 3);
    document.body.style.zoom = newZoom;
    this.speak(`Zoom aumentado para ${Math.round(newZoom * 100)}%.`);
  }
  
  // NOVA FUNÇÃO: Zoom out
  zoomOut() {
    const currentZoom = document.body.style.zoom || 1;
    const newZoom = Math.max(parseFloat(currentZoom) - 0.1, 0.5);
    document.body.style.zoom = newZoom;
    this.speak(`Zoom diminuído para ${Math.round(newZoom * 100)}%.`);
  }
  
  // NOVA FUNÇÃO: Reset zoom
  resetZoom() {
    document.body.style.zoom = 1;
    this.speak('Zoom resetado para 100%.');
  }
  
  // FUNÇÃO MELHORADA: Ler página completa
  readPage() {
    // Tenta diferentes seletores para encontrar o conteúdo principal
    let content = '';
    
    // Primeiro tenta elementos semânticos principais
    const selectors = [
      'main',
      'article',
      '.content',
      '.main-content',
      '#content',
      '#main',
      '.post-content',
      '.entry-content',
      '.text-content',
      '.article-content'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText.trim().length > 100) {
        content = element.innerText;
        break;
      }
    }
    
    // Se não encontrou, usa o body mas filtra elementos desnecessários
    if (!content) {
      const body = document.body.cloneNode(true);
      
      // Remove elementos que não são conteúdo principal
      const elementsToRemove = body.querySelectorAll('nav, header, footer, .sidebar, .menu, .advertisement, script, style, .hidden, .sr-only, .ads, .advertisement, .banner, .popup, .modal, .overlay');
      elementsToRemove.forEach(el => el.remove());
      
      content = body.innerText;
    }
    
    // Limpa o texto
    const cleanText = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 3000); // Aumentei o limite para 3000 caracteres
    
    if (cleanText.length > 0) {
      this.speak(`Lendo o conteúdo da página. ${cleanText}`);
    } else {
      this.speak('Não foi possível encontrar conteúdo para ler nesta página.');
    }
  }
  
  // NOVA FUNÇÃO: Resumir página com IA
  async summarizePage() {
    try {
      this.speak('Gerando resumo da página com inteligência artificial...');
      
      // Obtém o conteúdo da página
      let content = '';
      const selectors = [
        'main',
        'article',
        '.content',
        '.main-content',
        '#content',
        '#main',
        '.post-content',
        '.entry-content'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim().length > 100) {
          content = element.innerText;
          break;
        }
      }
      
      if (!content) {
        const body = document.body.cloneNode(true);
        const elementsToRemove = body.querySelectorAll('nav, header, footer, .sidebar, .menu, .advertisement, script, style, .hidden, .sr-only');
        elementsToRemove.forEach(el => el.remove());
        content = body.innerText;
      }
      
      // Limpa o texto
      const cleanText = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 2000);
      
      if (cleanText.length < 50) {
        this.speak('Não há conteúdo suficiente para gerar um resumo.');
        return;
      }
      
      // Envia para o background script para processar com IA
      chrome.runtime.sendMessage({
        action: 'summarizeContent',
        content: cleanText,
        pageTitle: document.title,
        pageUrl: window.location.href
      }).then(response => {
        if (response && response.summary) {
          this.speak(`Resumo da página: ${response.summary}`);
        } else {
          this.speak('Não foi possível gerar um resumo. Verifique se a IA está configurada.');
        }
      }).catch(error => {
        console.error('Erro ao gerar resumo:', error);
        this.speak('Erro ao gerar resumo. Tente novamente.');
      });
      
    } catch (error) {
      console.error('Erro ao resumir página:', error);
      this.speak('Erro ao gerar resumo da página.');
    }
  }
}

// Garante que o script só rode uma vez
if (typeof accessibilityScript === 'undefined') {
  var accessibilityScript = new AccessibilityContentScript();
}