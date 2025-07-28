// content.js (Melhorado com mais funcionalidades e comandos avançados)

class AccessibilityContentScript {
  constructor() {
    this.isAssistantActive = true;
    this.isListening = false;
    this.isActivated = false;
    this.activationTimeout = null;
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.currentUtterance = null;
    this.init();
  }

  async init() {
    const result = await chrome.storage.sync.get(['assistantActive']);
    this.isAssistantActive = result.assistantActive !== undefined ? result.assistantActive : true;

    this.createFloatingButton();
    this.setupSpeechRecognition();
    this.setupClickToRead();
    this.setupKeyboardShortcuts();
    this.updateButtonState();

    if (this.isAssistantActive) {
      this.startPassiveListening();
      setTimeout(() => {
        this.readPageTitle();
      }, 2000);
    }
    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  speak(text, interruptible = true) {
    if (!text || !this.isAssistantActive) return;
    
    if (!interruptible && this.synthesis.speaking) {
      return;
    }
    
    this.synthesis.cancel();
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = 'pt-BR';
    this.currentUtterance.rate = 1.0;
    this.currentUtterance.pitch = 1.0;
    
    // Callback quando termina de falar
    this.currentUtterance.onend = () => {
      this.currentUtterance = null;
    };
    
    this.synthesis.speak(this.currentUtterance);
  }

  createFloatingButton() {
    if (document.getElementById('voice-assistant-floating')) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'voice-assistant-floating';
    buttonContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: Arial, sans-serif;
    `;

    const button = document.createElement('button');
    button.id = 'assistantBtn';
    button.textContent = '🎤';
    button.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      background-color: #764ba2;
      color: white;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
    `;

    button.addEventListener('click', () => this.activateAndListen());
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });

    buttonContainer.appendChild(button);
    document.body.appendChild(buttonContainer);
  }

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'pt-BR';
    this.recognition.continuous = true;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        console.log(`Ouviu: "${transcript}"`);
        
        // Comandos de interrupção (sempre funcionam)
        if (transcript.includes('para') || transcript.includes('pare') || transcript.includes('stop')) {
          this.synthesis.cancel();
          this.speak('Parado.', false);
          this.deactivateAssistant();
          return;
        }
        
        // Ativação por palavra-chave
        if (transcript.includes('ok assistente') || transcript.includes('ei assistente') || transcript.includes('hey assistente')) {
          this.activateAssistant();
        } else if (this.isActivated) {
          this.resetActivationTimeout();
          
          // Processa comandos locais primeiro
          const localCommand = this.processLocalCommand(transcript);
          if (localCommand) {
            if (localCommand.action) {
              this[localCommand.action](localCommand.parameter);
            }
            if (localCommand.text) {
              this.speak(localCommand.text);
            }
          } else {
            // Se não encontrou comando local, envia para o background
            chrome.runtime.sendMessage({
              action: 'processVoiceCommand',
              transcript: transcript
            }).catch(e => console.error(e));
          }
        }
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateButtonState();
      if (this.isAssistantActive) {
        setTimeout(() => this.startPassiveListening(), 250);
      }
    };
    
    this.recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('Erro de reconhecimento:', event.error);
      }
    };
  }

  setupClickToRead() {
    document.addEventListener('click', (event) => {
      if (!this.isAssistantActive || !this.isActivated) return;
      
      const target = event.target;
      let text = target.innerText || target.textContent || target.alt || target.title;
      
      if (target.tagName === 'A' && target.href) {
        const linkText = text.trim();
        const href = target.href;
        text = `Link: ${linkText}. Destino: ${href}`;
      } else if (target.tagName === 'IMG') {
        text = `Imagem: ${target.alt || target.title || 'sem descrição'}`;
      } else if (target.tagName === 'BUTTON') {
        text = `Botão: ${text}`;
      }
      
      if (text && text.trim().length > 0 && text.trim().length < 500) {
        this.speak(text.trim());
      }
    }, true);
    
    document.addEventListener('mouseover', (event) => {
      if (!this.isAssistantActive || !this.isActivated) return;
      
      const target = event.target;
      
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.tagName === 'IMG') {
        const text = target.getAttribute('title') || target.getAttribute('alt') || target.innerText;
        
        if (text && text.trim().length > 0 && text.trim().length < 200) {
          // Fala mais baixo para hover
          const utterance = new SpeechSynthesisUtterance(text.trim());
          utterance.lang = 'pt-BR';
          utterance.rate = 1.2;
          utterance.volume = 0.7;
          this.synthesis.speak(utterance);
        }
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (!this.isAssistantActive) return;
      
      // Ctrl + Shift + A para ativar/desativar assistente
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        this.activateAndListen();
      }
      
      // Escape para parar fala
      if (event.key === 'Escape') {
        this.synthesis.cancel();
        if (this.isActivated) {
          this.speak('Parado.', false);
        }
      }
    });
  }

  processLocalCommand(transcript) {
    const command = transcript.toLowerCase();
    
    // Comandos de leitura
    if (command.includes('ler página') || command.includes('ler conteúdo') || command.includes('ler texto')) {
      return { action: 'readPage', text: 'Lendo o conteúdo da página.' };
    }
    
    if (command.includes('resumir') || command.includes('resumo') || command.includes('resuma')) {
      return { action: 'summarizePage', text: 'Gerando resumo da página.' };
    }
    
    if (command.includes('ler título')) {
      return { action: 'readPageTitle', text: 'Lendo o título da página.' };
    }
    
    if (command.includes('ler títulos') || command.includes('ler cabeçalhos')) {
      return { action: 'readHeadings', text: 'Lendo os títulos da página.' };
    }
    
    if (command.includes('ler links')) {
      return { action: 'readLinks', text: 'Lendo os links da página.' };
    }
    
    // Comandos de acessibilidade
    if (command.includes('aumentar fonte') || command.includes('fonte maior')) {
      return { action: 'increaseFontSize', text: 'Fonte aumentada.' };
    }
    
    if (command.includes('diminuir fonte') || command.includes('fonte menor')) {
      return { action: 'decreaseFontSize', text: 'Fonte diminuída.' };
    }
    
    if (command.includes('alto contraste')) {
      return { action: 'toggleHighContrast', text: 'Alto contraste alternado.' };
    }
    
    // Comandos de zoom
    if (command.includes('zoom in') || command.includes('aumentar zoom')) {
      return { action: 'zoomIn', text: 'Zoom aumentado.' };
    }
    
    if (command.includes('zoom out') || command.includes('diminuir zoom')) {
      return { action: 'zoomOut', text: 'Zoom diminuído.' };
    }
    
    if (command.includes('reset zoom') || command.includes('zoom normal')) {
      return { action: 'resetZoom', text: 'Zoom resetado.' };
    }
    
    // Comandos de navegação
    if (command.includes('voltar') || command.includes('anterior')) {
      return { action: 'goBack', text: 'Voltando para a página anterior.' };
    }
    
    if (command.includes('avançar') || command.includes('próximo')) {
      return { action: 'goForward', text: 'Avançando para a próxima página.' };
    }
    
    if (command.includes('recarregar') || command.includes('atualizar')) {
      return { action: 'reloadPage', text: 'Recarregando a página.' };
    }
    
    // Comandos de rolagem
    if (command.includes('rolar cima') || command.includes('scroll up')) {
      return { action: 'scrollUp', text: 'Rolando para cima.' };
    }
    
    if (command.includes('rolar baixo') || command.includes('scroll down')) {
      return { action: 'scrollDown', text: 'Rolando para baixo.' };
    }
    
    if (command.includes('topo') || command.includes('início')) {
      return { action: 'scrollToTop', text: 'Indo para o topo da página.' };
    }
    
    if (command.includes('final') || command.includes('fim')) {
      return { action: 'scrollToBottom', text: 'Indo para o final da página.' };
    }
    
    // Comandos de busca
    if (command.includes('buscar') || command.includes('procurar') || command.includes('pesquisar')) {
      const searchTerm = this.extractSearchTerm(command);
      if (searchTerm) {
        return { action: 'searchByVoice', parameter: searchTerm, text: `Buscando por: ${searchTerm}` };
      }
    }
    
    // Comandos de abas
    if (command.includes('nova aba') || command.includes('abrir aba')) {
      return { action: 'openNewTab', text: 'Abrindo nova aba.' };
    }
    
    if (command.includes('fechar aba')) {
      return { action: 'closeTab', text: 'Fechando aba atual.' };
    }
    
    if (command.includes('próxima aba') || command.includes('alternar aba')) {
      return { action: 'switchTab', text: 'Alternando para próxima aba.' };
    }
    
    // Comando de procurar na página
    if (command.includes('procurar na página') || command.includes('encontrar na página')) {
      const searchTerm = this.extractSearchTerm(command);
      if (searchTerm) {
        return { action: 'findInPage', parameter: searchTerm, text: `Procurando na página por: ${searchTerm}` };
      }
    }
    
    return null;
  }

  extractSearchTerm(command) {
    const searchWords = ['buscar', 'procurar', 'pesquisar', 'encontrar'];
    let searchTerm = command;
    
    for (const word of searchWords) {
      if (searchTerm.includes(word)) {
        searchTerm = searchTerm.replace(word, '').replace('por', '').replace('na página', '').trim();
        break;
      }
    }
    
    return searchTerm || null;
  }

  startPassiveListening() {
    if (this.isAssistantActive && !this.isListening) {
      try {
        this.recognition.start();
        this.isListening = true;
        this.updateButtonState();
      } catch (e) {
        this.isListening = false;
      }
    }
  }

  activateAndListen() {
    if (!this.isAssistantActive) {
      this.speak("Assistente desativado.");
      return;
    }
    
    this.synthesis.cancel();
    
    if (this.isActivated) {
      this.deactivateAssistant();
    } else {
      this.activateAssistant();
    }
  }

  activateAssistant() {
    this.isActivated = true;
    this.speak('Assistente ativado. Pode falar.', false);
    this.updateButtonState();
    this.resetActivationTimeout();
  }

  deactivateAssistant() {
    this.isActivated = false;
    this.speak("Assistente desativado.", false);
    this.updateButtonState();
    this.clearActivationTimeout();
  }

  resetActivationTimeout() {
    this.clearActivationTimeout();
    this.activationTimeout = setTimeout(() => {
      if (this.isActivated) {
        this.speak("Desativando assistente por inatividade.", false);
        this.deactivateAssistant();
      }
    }, 30000);
  }

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
      button.style.backgroundColor = '#ff6b6b';
      button.textContent = '🎤';
      button.style.animation = 'pulse 1s infinite';
    } else if (this.isListening) {
      button.style.backgroundColor = '#ffa500';
      button.textContent = '👂';
      button.style.animation = 'none';
    } else if (this.isAssistantActive) {
      button.style.backgroundColor = '#764ba2';
      button.textContent = '🎤';
      button.style.animation = 'none';
    } else {
      button.style.backgroundColor = '#6c757d';
      button.textContent = '🔇';
      button.style.animation = 'none';
    }
  }

  handleMessage(message, sender, sendResponse) {
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
    
    if (message.action === 'executeAndSpeak') {
      if (message.command) {
        if (message.command === 'searchByVoice' && message.parameter) {
          this.searchByVoice(message.parameter);
        } else if (message.command === 'openNewTab') {
          this.openNewTab(message.parameter);
        } else if (message.command === 'closeTab') {
          this.closeTab();
        } else if (message.command === 'switchTab') {
          this.switchTab();
        } else if (message.command === 'findInPage' && message.parameter) {
          this.findInPage(message.parameter);
        } else if (this[message.command]) {
          this[message.command](message.parameter);
        }
      }
      if (message.textToSpeak) {
        this.speak(message.textToSpeak);
      }
    }

    if (message.action === 'speak') {
      this.speak(message.text);
    }
  }

  // Funções de acessibilidade
  increaseFontSize() { 
    document.body.style.fontSize = `${parseFloat(getComputedStyle(document.body).fontSize) + 2}px`; 
  }
  
  decreaseFontSize() { 
    document.body.style.fontSize = `${parseFloat(getComputedStyle(document.body).fontSize) - 2}px`; 
  }
  
  toggleHighContrast() { 
    if (!document.getElementById('high-contrast-style')) {
      const style = document.createElement('style');
      style.id = 'high-contrast-style';
      style.textContent = `
        * {
          background-color: black !important;
          color: white !important;
          border-color: white !important;
        }
        a, a * {
          color: yellow !important;
        }
        img {
          filter: contrast(200%) brightness(150%) !important;
        }
      `;
      document.head.appendChild(style);
    } else {
      document.getElementById('high-contrast-style').remove();
    }
  }
  
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
        .slice(0, 10)
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
        .slice(0, 10)
        .join('. ');
      this.speak(`Links encontrados: ${linkText}`);
    } else {
      this.speak('Nenhum link encontrado nesta página.');
    }
  }
  
  searchByVoice(searchTerm) {
    let searchBox = null;
    
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
      searchBox.focus();
      searchBox.value = searchTerm;
      
      searchBox.dispatchEvent(new Event('input', { bubbles: true }));
      
      const form = searchBox.closest('form');
      if (form) {
        form.submit();
      } else {
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
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
      window.open(googleSearchUrl, '_blank');
      this.speak(`Abrindo busca no Google para: ${searchTerm}`);
    }
  }
  
  goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.speak('Não há páginas anteriores para voltar.');
    }
  }
  
  goForward() {
    window.history.forward();
  }
  
  reloadPage() {
    window.location.reload();
  }
  
  scrollUp() {
    window.scrollBy(0, -300);
  }
  
  scrollDown() {
    window.scrollBy(0, 300);
  }
  
  scrollToTop() {
    window.scrollTo(0, 0);
  }
  
  scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
  }
  
  zoomIn() {
    const currentZoom = document.body.style.zoom || 1;
    const newZoom = Math.min(parseFloat(currentZoom) + 0.1, 3);
    document.body.style.zoom = newZoom;
    this.speak(`Zoom aumentado para ${Math.round(newZoom * 100)}%.`);
  }
  
  zoomOut() {
    const currentZoom = document.body.style.zoom || 1;
    const newZoom = Math.max(parseFloat(currentZoom) - 0.1, 0.5);
    document.body.style.zoom = newZoom;
    this.speak(`Zoom diminuído para ${Math.round(newZoom * 100)}%.`);
  }
  
  resetZoom() {
    document.body.style.zoom = 1;
    this.speak('Zoom resetado para 100%.');
  }
  
  readPage() {
    let content = '';
    
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
    
    if (!content) {
      const body = document.body.cloneNode(true);
      
      const elementsToRemove = body.querySelectorAll('nav, header, footer, .sidebar, .menu, .advertisement, script, style, .hidden, .sr-only, .ads, .advertisement, .banner, .popup, .modal, .overlay');
      elementsToRemove.forEach(el => el.remove());
      
      content = body.innerText;
    }
    
    const cleanText = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 3000);
    
    if (cleanText.length > 0) {
      this.speak(`Lendo o conteúdo da página. ${cleanText}`);
    } else {
      this.speak('Não foi possível encontrar conteúdo para ler nesta página.');
    }
  }
  
  async summarizePage() {
    try {
      this.speak('Gerando resumo da página com inteligência artificial...');
      
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
      
      const cleanText = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 2000);
      
      if (cleanText.length < 50) {
        this.speak('Não há conteúdo suficiente para gerar um resumo.');
        return;
      }
      
      chrome.runtime.sendMessage({
        action: 'summarizeContent',
        content: cleanText,
        pageTitle: document.title,
        pageUrl: window.location.href
      }).then(response => {
        if (response && response.summary) {
          this.speak(`Resumo da página: ${response.summary}`);
        } else {
          this.speak('Não foi possível gerar um resumo. Tente novamente.');
        }
      }).catch(error => {
        console.error('Erro ao gerar resumo:', error);
        this.speak('Erro ao gerar resumo da página.');
      });
      
    } catch (error) {
      console.error('Erro ao resumir página:', error);
      this.speak('Erro ao gerar resumo da página.');
    }
  }

  // Novos comandos avançados
  openNewTab(url = null) {
    chrome.runtime.sendMessage({
      action: 'executeAdvancedCommand',
      command: 'openNewTab',
      parameter: url
    });
  }

  closeTab() {
    chrome.runtime.sendMessage({
      action: 'executeAdvancedCommand',
      command: 'closeTab'
    });
  }

  switchTab() {
    chrome.runtime.sendMessage({
      action: 'executeAdvancedCommand',
      command: 'switchTab'
    });
  }

  findInPage(searchTerm) {
    if (searchTerm) {
      chrome.runtime.sendMessage({
        action: 'executeAdvancedCommand',
        command: 'findInPage',
        parameter: searchTerm
      });
    }
  }
}

// Garante que o script só rode uma vez
if (typeof accessibilityScript === 'undefined') {
  var accessibilityScript = new AccessibilityContentScript();
  
  // Adiciona CSS para animação do botão
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}