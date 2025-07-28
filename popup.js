class PopupManager {
  constructor() {
    this.isAssistantActive = false;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.bindEvents();
    this.updateStatus();
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get(['voiceSpeed', 'voicePitch', 'assistantActive', 'aiEnabled']);
    
    const speedSlider = document.getElementById('voiceSpeed');
    const pitchSlider = document.getElementById('voicePitch');
    const aiEnabledCheckbox = document.getElementById('aiEnabled');
    
    speedSlider.value = result.voiceSpeed || 1.0;
    pitchSlider.value = result.voicePitch || 1.0;
    this.isAssistantActive = result.assistantActive || false;
    aiEnabledCheckbox.checked = result.aiEnabled !== false; // Sempre true por padrão
    
    this.updateSpeedValue();
    this.updatePitchValue();
  }

  bindEvents() {
    // Toggle do assistente
    document.getElementById('toggleAssistant').addEventListener('click', () => {
      this.toggleAssistant();
    });

    // Teste de voz
    document.getElementById('testVoice').addEventListener('click', () => {
      this.testVoice();
    });

    // Configurações de voz
    document.getElementById('voiceSpeed').addEventListener('input', (e) => {
      this.updateSpeedValue();
      this.saveSettings();
    });

    document.getElementById('voicePitch').addEventListener('input', (e) => {
      this.updatePitchValue();
      this.saveSettings();
    });

    // Configurações da API Gemini
    // Chave da API agora está integrada no código, não precisa mais salvar

    document.getElementById('aiEnabled').addEventListener('change', (e) => {
      this.saveSettings();
    });

    // Botão para recarregar o content script
    document.getElementById('reloadContent').addEventListener('click', () => {
      this.reloadContentScript();
    });
  }

  async toggleAssistant() {
    try {
      this.isAssistantActive = !this.isAssistantActive;
      
      // Envia mensagem para o background script
      await chrome.runtime.sendMessage({
        action: 'toggleAssistant',
        active: this.isAssistantActive
      });

      await this.saveSettings();
      this.updateStatus();
    } catch (error) {
      console.error('Erro ao alternar assistente:', error);
      // Reverte o estado em caso de erro
      this.isAssistantActive = !this.isAssistantActive;
      this.updateStatus();
    }
  }

  async testVoice() {
    try {
      const speed = parseFloat(document.getElementById('voiceSpeed').value);
      const pitch = parseFloat(document.getElementById('voicePitch').value);
      
      // Mostra indicador de carregamento
      const testButton = document.getElementById('testVoice');
      const originalText = testButton.textContent;
      testButton.textContent = 'Testando...';
      testButton.disabled = true;
      
      // Envia mensagem para testar a voz
      const response = await chrome.runtime.sendMessage({
        action: 'testVoice',
        text: 'Olá! Este é um teste da sua configuração de voz. O assistente está funcionando perfeitamente.',
        speed: speed,
        pitch: pitch
      });
      
      // Restaura o botão
      testButton.textContent = originalText;
      testButton.disabled = false;
      
      // Mostra resultado
      if (response && response.success) {
        alert('Teste de voz enviado com sucesso! Verifique se você ouviu a mensagem.');
      } else if (response && response.error) {
        alert(`Erro no teste: ${response.error}`);
      }
    } catch (error) {
      console.error('Erro ao testar voz:', error);
      
      // Restaura o botão em caso de erro
      const testButton = document.getElementById('testVoice');
      testButton.textContent = 'Testar Voz';
      testButton.disabled = false;
      
      // Mostra erro específico
      if (error.message.includes('Receiving end does not exist')) {
        alert('Erro: O assistente não está carregado nesta página. Tente recarregar a página ou navegar para uma página diferente.');
      } else {
        alert(`Erro ao testar voz: ${error.message}`);
      }
    }
  }

  updateSpeedValue() {
    const speed = document.getElementById('voiceSpeed').value;
    document.getElementById('speedValue').textContent = `${speed}x`;
  }

  updatePitchValue() {
    const pitch = document.getElementById('voicePitch').value;
    document.getElementById('pitchValue').textContent = pitch;
  }

  updateStatus() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const toggleBtn = document.getElementById('toggleAssistant');

    if (this.isAssistantActive) {
      statusDot.classList.add('active');
      statusText.textContent = 'Ativo';
      toggleBtn.textContent = 'Desativar Assistente';
      toggleBtn.classList.add('active');
    } else {
      statusDot.classList.remove('active', 'listening');
      statusText.textContent = 'Inativo';
      toggleBtn.textContent = 'Ativar Assistente';
      toggleBtn.classList.remove('active');
    }
  }

  async saveSettings() {
    try {
      const speed = parseFloat(document.getElementById('voiceSpeed').value);
      const pitch = parseFloat(document.getElementById('voicePitch').value);
      const aiEnabled = document.getElementById('aiEnabled').checked;
      
      await chrome.storage.sync.set({
        voiceSpeed: speed,
        voicePitch: pitch,
        assistantActive: this.isAssistantActive,
        aiEnabled: aiEnabled
      });

      // Notifica o background script sobre as mudanças
      chrome.runtime.sendMessage({
        action: 'updateSettings',
        settings: {
          voiceSpeed: speed,
          voicePitch: pitch,
          assistantActive: this.isAssistantActive,
          aiEnabled: aiEnabled
        }
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  }

  async reloadContentScript() {
    try {
      // Mostra indicador de carregamento
      const reloadButton = document.getElementById('reloadContent');
      const originalText = reloadButton.textContent;
      reloadButton.textContent = 'Recarregando...';
      reloadButton.disabled = true;
      
      // Envia mensagem para recarregar o content script
      const response = await chrome.runtime.sendMessage({
        action: 'reloadContentScript'
      });
      
      // Restaura o botão
      reloadButton.textContent = originalText;
      reloadButton.disabled = false;
      
      if (response && response.success) {
        alert('Assistente recarregado com sucesso! Agora você pode testar a voz.');
      } else {
        alert('Erro ao recarregar o assistente. Tente recarregar a página manualmente.');
      }
    } catch (error) {
      console.error('Erro ao recarregar content script:', error);
      
      // Restaura o botão em caso de erro
      const reloadButton = document.getElementById('reloadContent');
      reloadButton.textContent = 'Recarregar Assistente';
      reloadButton.disabled = false;
      
      alert('Erro ao recarregar o assistente. Tente recarregar a página manualmente.');
    }
  }
}

// Inicializa o gerenciador do popup quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});