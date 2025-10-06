// Gerenciador de Interface do Usuário
class UIManager {
  constructor() {
    this.savedLocations =
      JSON.parse(localStorage.getItem("savedLocations")) || [];
    this.currentSearch = null;
    this.apiService = new BrazilAPIService();
    this.init();
  }

  init() {
    this.initializeEventListeners();
    this.initializeSearch();
    this.renderSavedLocations();
  }

  initializeEventListeners() {
    // Elementos DOM
    this.searchState = document.getElementById("searchState");
    this.searchCity = document.getElementById("searchCity");
    this.searchNeighborhood = document.getElementById("searchNeighborhood");
    this.searchLocationBtn = document.getElementById("searchLocationBtn");
    this.saveLocationBtn = document.getElementById("saveLocationBtn");
    this.savedLocationsList = document.getElementById("savedLocationsList");
    this.filterLocations = document.getElementById("filterLocations");
    this.analysisType = document.getElementById("analysisType");
    this.analysisLocation = document.getElementById("analysisLocation");
    this.runAnalysisBtn = document.getElementById("runAnalysisBtn");
    this.analysisResults = document.getElementById("analysisResults");
    this.saveLocationModal = document.getElementById("saveLocationModal");
    this.saveLocationForm = document.getElementById("saveLocationForm");
    this.closeModalButtons = document.querySelectorAll(".close");
    this.tabButtons = document.querySelectorAll(".tab-button");
    this.tabPanes = document.querySelectorAll(".tab-pane");

    // Event Listeners
    this.searchState.addEventListener("change", () => this.handleStateChange());
    this.searchCity.addEventListener("change", () => this.handleCityChange());
    this.searchNeighborhood.addEventListener("change", () =>
      this.handleNeighborhoodChange()
    );
    this.searchLocationBtn.addEventListener("click", () =>
      this.handleSearchLocation()
    );
    this.saveLocationBtn.addEventListener("click", () =>
      this.showSaveLocationModal()
    );
    this.saveLocationForm.addEventListener("submit", (e) =>
      this.handleSaveLocation(e)
    );
    this.runAnalysisBtn.addEventListener("click", () =>
      this.handleRunAnalysis()
    );
    this.filterLocations.addEventListener("input", () =>
      this.renderSavedLocations()
    );

    // Modais
    this.closeModalButtons.forEach((button) => {
      button.addEventListener("click", function () {
        this.closest(".modal").style.display = "none";
      });
    });

    window.addEventListener("click", (event) => {
      if (event.target.classList.contains("modal")) {
        event.target.style.display = "none";
      }
    });

    // Abas
    this.tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.tabButtons.forEach((btn) => btn.classList.remove("active"));
        this.tabPanes.forEach((pane) => pane.classList.remove("active"));

        button.classList.add("active");
        const tabId = button.getAttribute("data-tab");
        document.getElementById(`${tabId}-tab`).classList.add("active");
      });
    });
  }

  async initializeSearch() {
    const states = await this.apiService.getStates();

    this.searchState.innerHTML =
      '<option value="">Selecione um estado</option>';
    states.forEach((state) => {
      const option = document.createElement("option");
      option.value = state.id;
      option.textContent = `${state.nome} (${state.sigla})`;
      option.dataset.sigla = state.sigla;
      this.searchState.appendChild(option);
    });
  }

  async handleStateChange() {
    const stateId = this.searchState.value;

    if (stateId) {
      this.searchCity.disabled = false;
      this.searchCity.innerHTML =
        '<option value="">Carregando cidades...</option>';

      const cities = await this.apiService.getCities(stateId);
      this.searchCity.innerHTML =
        '<option value="">Selecione uma cidade</option>';
      cities.forEach((city) => {
        const option = document.createElement("option");
        option.value = city.id;
        option.textContent = city.nome;
        this.searchCity.appendChild(option);
      });

      this.searchNeighborhood.disabled = true;
      this.searchNeighborhood.innerHTML =
        '<option value="">Selecione um bairro</option>';
      this.searchLocationBtn.disabled = true;
      this.saveLocationBtn.disabled = true;
    } else {
      this.searchCity.disabled = true;
      this.searchCity.innerHTML =
        '<option value="">Selecione uma cidade</option>';
      this.searchNeighborhood.disabled = true;
      this.searchLocationBtn.disabled = true;
      this.saveLocationBtn.disabled = true;
    }
  }

  async handleCityChange() {
    const cityId = this.searchCity.value;

    if (cityId) {
      this.searchNeighborhood.disabled = false;
      this.searchLocationBtn.disabled = false;

      // Carrega bairros reais do JSON quando for Itajubá
      if (cityId === "itajuba" || cityId === "itajubá") {
        await this.loadBairrosFromJSON();
      } else {
        // Fallback para outras cidades
        this.loadDefaultNeighborhoods();
      }
    } else {
      this.searchNeighborhood.disabled = true;
      this.searchLocationBtn.disabled = true;
      this.saveLocationBtn.disabled = true;
    }
  }

  async loadBairrosFromJSON() {
    try {

      console.log("Carregando bairros de Itajubá do JSON...");
      // Carrega o JSON com os dados dos bairros
      const response = await fetch("js/data/itajuba_bairros.json");
      const bairrosData = await response.json();

      this.searchNeighborhood.innerHTML =
        '<option value="">Selecione um bairro</option>';

      bairrosData.forEach((bairro, index) => {
        const option = document.createElement("option");
        option.value = index; // Usa o índice como valor
        option.textContent = this.formatBairroName(bairro.nome);
        option.dataset.bairroData = JSON.stringify(bairro); // Armazena todos os dados
        this.searchNeighborhood.appendChild(option);
      });

      console.log("Bairros carregados do JSON:", bairrosData.length);
    } catch (error) {
      console.error("Erro ao carregar bairros:", error);
      this.loadDefaultNeighborhoods();
      this.showNotification(
        "Erro ao carregar bairros. Usando lista padrão.",
        "warning"
      );
    }
  }

  loadDefaultNeighborhoods() {
    const neighborhoodNames = [
      "Centro",
      "Jardim",
      "Vila",
      "Bairro Novo",
      "Industrial",
    ];

    this.searchNeighborhood.innerHTML =
      '<option value="">Selecione um bairro</option>';
    neighborhoodNames.forEach((name, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = name;
      this.searchNeighborhood.appendChild(option);
    });
  }

  formatBairroName(name) {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  handleNeighborhoodChange() {
    this.saveLocationBtn.disabled = !this.searchNeighborhood.value;
  }

  async handleSearchLocation() {
    const stateOption =
      this.searchState.options[this.searchState.selectedIndex];
    const cityName =
      this.searchCity.options[this.searchCity.selectedIndex].textContent;
    const stateSigla = stateOption.dataset.sigla;
    const neighborhood = this.searchNeighborhood.value
      ? this.searchNeighborhood.options[this.searchNeighborhood.selectedIndex]
          .textContent
      : null;

    this.showLoading("Buscando localização...");

    try {
      const coordinates = await this.apiService.getCoordinates(
        cityName,
        stateSigla
      );

      // Salva busca atual
      this.currentSearch = {
        city: cityName,
        state: stateSigla,
        neighborhood: neighborhood,
        lat: coordinates.lat,
        lng: coordinates.lng,
        timestamp: new Date().toISOString(),
      };

      // Centraliza o mapa e adiciona marcador
      app.mapManager.setView(coordinates, neighborhood ? 14 : 12);

      const popupContent = `
                <b>${
                  neighborhood ? neighborhood + " - " : ""
                }${cityName}, ${stateSigla}</b>
                ${
                  neighborhood ? `<br><small>Bairro de ${cityName}</small>` : ""
                }
            `;

      app.mapManager.addMarker(coordinates, popupContent);

      // Habilita botão de salvar
      this.saveLocationBtn.disabled = false;

      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      this.showNotification(
        "Erro ao buscar localização: " + error.message,
        "error"
      );
    }
  }

  showSaveLocationModal() {
    if (!this.currentSearch) return;

    // Preenche o modal com dados atuais
    document.getElementById("locationName").value = this.currentSearch
      .neighborhood
      ? `${this.currentSearch.neighborhood} - ${this.currentSearch.city}`
      : this.currentSearch.city;

    document.getElementById("locationType").value = this.currentSearch
      .neighborhood
      ? "neighborhood"
      : "city";

    this.saveLocationModal.style.display = "block";
  }

  handleSaveLocation(e) {
    e.preventDefault();

    const newId =
      this.savedLocations.length > 0
        ? Math.max(...this.savedLocations.map((l) => l.id)) + 1
        : 1;

    const locationData = {
      id: newId,
      name: document.getElementById("locationName").value,
      type: document.getElementById("locationType").value,
      description: document.getElementById("locationDescription").value,
      city: this.currentSearch.city,
      state: this.currentSearch.state,
      neighborhood: this.currentSearch.neighborhood,
      lat: this.currentSearch.lat,
      lng: this.currentSearch.lng,
      timestamp: new Date().toISOString(),
    };

    this.savedLocations.push(locationData);
    localStorage.setItem("savedLocations", JSON.stringify(this.savedLocations));

    this.renderSavedLocations();
    this.saveLocationForm.reset();
    this.saveLocationModal.style.display = "none";

    this.showNotification("Localização salva com sucesso!", "success");
  }

  renderSavedLocations() {
    this.savedLocationsList.innerHTML = "";

    const filter = this.filterLocations.value.toLowerCase();
    const filteredLocations = this.savedLocations.filter(
      (location) =>
        location.name.toLowerCase().includes(filter) ||
        location.city.toLowerCase().includes(filter) ||
        location.state.toLowerCase().includes(filter) ||
        (location.neighborhood &&
          location.neighborhood.toLowerCase().includes(filter))
    );

    if (filteredLocations.length === 0) {
      this.savedLocationsList.innerHTML =
        '<p class="placeholder">Nenhuma localização salva</p>';
      return;
    }

    filteredLocations.forEach((location) => {
      const div = document.createElement("div");
      div.className = `location-item ${location.type}`;
      div.innerHTML = `
                <div class="location-info">
                    <div class="location-name">${location.name}</div>
                    <div class="location-details">
                        ${
                          location.type === "neighborhood"
                            ? "Bairro"
                            : location.type === "city"
                            ? "Cidade"
                            : "Ponto"
                        } • 
                        ${location.city}, ${location.state}
                        ${
                          location.description
                            ? `<br>${location.description}`
                            : ""
                        }
                    </div>
                </div>
                <div class="location-actions">
                    <button class="view-btn" onclick="app.uiManager.viewLocation(${
                      location.id
                    })">👁️</button>
                    <button onclick="app.uiManager.removeLocation(${
                      location.id
                    })">🗑️</button>
                </div>
            `;
      this.savedLocationsList.appendChild(div);
    });
  }

  viewLocation(id) {
    const location = this.savedLocations.find((l) => l.id === id);
    if (!location) return;

    app.mapManager.setView(
      location,
      location.type === "neighborhood" ? 14 : 12
    );

    const popupContent = `
            <b>${location.name}</b><br>
            <small>${
              location.type === "neighborhood"
                ? "Bairro"
                : location.type === "city"
                ? "Cidade"
                : "Ponto"
            } • 
                   ${location.city}, ${location.state}</small>
            ${location.description ? `<br><p>${location.description}</p>` : ""}
        `;

    app.mapManager.addMarker(location, popupContent);
  }

  removeLocation(id) {
    if (confirm("Tem certeza que deseja remover esta localização?")) {
      this.savedLocations = this.savedLocations.filter((l) => l.id !== id);
      localStorage.setItem(
        "savedLocations",
        JSON.stringify(this.savedLocations)
      );
      this.renderSavedLocations();
    }
  }

  async handleRunAnalysis() {
    const type = this.analysisType.value;
    const locationType = this.analysisLocation.value;

    this.showLoading("Executando análise...");

    try {
      let results;

      switch (type) {
        case "heat":
          results = await this.performRealHeatAnalysis(locationType);
          break;
        case "vegetation":
          results = await this.performRealVegetationAnalysis(locationType);
          break;
        case "sustainability":
          results = await this.performSustainabilityAnalysis(locationType);
          break;
        case "demography":
          results = await this.performDemographyAnalysis(locationType);
          break;
      }

      this.displayAnalysisResults(results);
      this.hideLoading();
    } catch (error) {
      this.hideLoading();
      this.showNotification("Erro na análise: " + error.message, "error");
    }
  }

  displayAnalysisResults(results) {
    this.analysisResults.innerHTML = "";

    if (results.length === 0) {
      this.analysisResults.innerHTML =
        '<p class="placeholder">Nenhum resultado encontrado</p>';
      return;
    }

    results.forEach((result) => {
      const div = document.createElement("div");
      div.className = "result-item";
      div.innerHTML = `
                <strong>${result.title}</strong>
                <p>${result.description}</p>
                <small>${result.value}</small>
            `;
      this.analysisResults.appendChild(div);
    });
  }

  // Funções de análise (simuladas)
  async performHeatAnalysis(locationType) {
    return [
      {
        title: "Ilhas de Calor Identificadas",
        description: "Áreas urbanas com temperatura elevada",
        value: "3 áreas críticas detectadas",
      },
      {
        title: "Temperatura Média",
        description: "Comparação área urbana vs rural",
        value: "+4.2°C na área urbana",
      },
      {
        title: "Recomendações",
        description: "Ações para mitigação",
        value: "Aumento de áreas verdes e telhados reflexivos",
      },
    ];
  }

  async performVegetationAnalysis(locationType) {
    return [
      {
        title: "Cobertura Vegetal",
        description: "Percentual de área verde",
        value: "28% de cobertura vegetal",
      },
      {
        title: "Áreas de Preservação",
        description: "Áreas protegidas e parques",
        value: "12 áreas identificadas",
      },
      {
        title: "Qualidade do Verde",
        description: "Índice de vegetação (NDVI)",
        value: "0.65 - Boa qualidade",
      },
    ];
  }

  async performSustainabilityAnalysis(locationType) {
    return [
      {
        title: "Índice de Sustentabilidade",
        description: "Avaliação geral da área",
        value: "7.2/10 - Moderadamente Sustentável",
      },
      {
        title: "Mobilidade Urbana",
        description: "Acesso a transporte público",
        value: "85% da população atendida",
      },
      {
        title: "Eficiência Energética",
        description: "Potencial para energias renováveis",
        value: "Alto potencial solar",
      },
    ];
  }

  async performDemographyAnalysis(locationType) {
    return [
      {
        title: "Densidade Populacional",
        description: "Habitantes por km²",
        value: "8,450 hab/km²",
      },
      {
        title: "Faixa Etária",
        description: "Distribuição por idade",
        value: "45% entre 25-45 anos",
      },
      {
        title: "Crescimento Populacional",
        description: "Taxa anual de crescimento",
        value: "1.8% ao ano",
      },
    ];
  }

  // Utilitários de UI
  showLoading(message = "Carregando...") {
    const loadingOverlay = document.getElementById("loadingOverlay");
    const loadingText = loadingOverlay.querySelector(".loading-text");

    loadingText.textContent = message;
    loadingOverlay.style.display = "flex";
  }

  hideLoading() {
    const loadingOverlay = document.getElementById("loadingOverlay");
    loadingOverlay.style.display = "none";
  }

  getNotificationIcon(type) {
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };
    return icons[type] || "ℹ️";
  }

  getNotificationColor(type) {
    const colors = {
      success: "#2ecc71",
      error: "#e74c3c",
      warning: "#f39c12",
      info: "#3498db",
    };
    return colors[type] || "#3498db";
  }

  showNotification(message, type = "info") {
    console.log(`📢 Notificação [${type}]:`, message);

    // Remove notificação anterior se existir
    const existingNotification = document.querySelector(".login-notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    // Cria nova notificação
    const notification = document.createElement("div");
    notification.className = `login-notification notification-${type}`;
    notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(
                  type
                )}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;

    // Estilos da notificação
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            z-index: 1000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;

    document.body.appendChild(notification);

    // Remove automaticamente após 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = "slideOutRight 0.3s ease-in";
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  // NOVOS MÉTODOS COM APIS REAIS
  async performRealHeatAnalysis(locationType) {
    const location = await this.getAnalysisLocation(locationType);
    if (!location) throw new Error("Localização não encontrada");

    const weatherAPI = new RealWeatherAPI();
    const heatAnalysis = new HeatIslandAnalysis();

    const weatherData = await weatherAPI.getCurrentWeather(
      location.lat,
      location.lng
    );
    const heatData = await heatAnalysis.generateHeatData(
      location.lat,
      location.lng,
      weatherData
    );

    // Análise baseada em dados reais
    const avgIntensity =
      heatData.reduce((sum, point) => sum + point[2], 0) / heatData.length;

    return [
      {
        title: "🌡️ Análise de Ilhas de Calor",
        description: "Baseado em dados meteorológicos em tempo real",
        value: `Temperatura atual: ${weatherData.current.temperature_2m}°C`,
      },
      {
        title: "📊 Intensidade das Ilhas de Calor",
        description: "Média da intensidade detectada na área",
        value: `${(avgIntensity * 100).toFixed(1)}% de intensidade`,
      },
      {
        title: "💧 Fatores Influentes",
        description: "Condições que afetam o calor urbano",
        value: `Umidade: ${weatherData.current.relative_humidity_2m}% | Vento: ${weatherData.current.wind_speed_10m} km/h`,
      },
      {
        title: "🛠️ Recomendações",
        description: "Ações para mitigação do calor urbano",
        value:
          avgIntensity > 0.7
            ? "Prioridade ALTA - Áreas críticas detectadas"
            : avgIntensity > 0.5
            ? "Prioridade MÉDIA - Ações preventivas recomendadas"
            : "Situação controlada - Manutenção preventiva",
      },
    ];
  }

  async performRealVegetationAnalysis(locationType) {
    const location = await this.getAnalysisLocation(locationType);
    if (!location) throw new Error("Localização não encontrada");

    const vegetationAPI = new VegetationAnalysis();
    const vegetationData = await vegetationAPI.generateVegetationData(
      location.lat,
      location.lng
    );

    const avgNDVI =
      vegetationData.reduce((sum, area) => sum + area.ndvi, 0) /
      vegetationData.length;
    const highVegetation = vegetationData.filter(
      (area) => area.ndvi > 0.6
    ).length;

    return [
      {
        title: "🌿 Análise de Cobertura Vegetal",
        description: "Índice de vegetação por diferença normalizada (NDVI)",
        value: `NDVI médio: ${avgNDVI.toFixed(2)}`,
      },
      {
        title: "📈 Qualidade da Vegetação",
        description: "Distribuição por qualidade na área analisada",
        value: `${highVegetation}/${vegetationData.length} áreas com vegetação de alta qualidade`,
      },
      {
        title: "🎯 Recomendações",
        description: "Ações para melhoria das áreas verdes",
        value:
          avgNDVI < 0.3
            ? "Urgente - Necessidade de reflorestamento"
            : avgNDVI < 0.5
            ? "Moderado - Expandir áreas verdes existentes"
            : "Satisfatório - Manter e conectar fragmentos",
      },
    ];
  }

  // Método auxiliar para obter localização
  async getAnalysisLocation(locationType) {
    if (locationType === "current" && this.currentSearch) {
      return this.currentSearch;
    } else if (locationType === "saved" && this.savedLocations.length > 0) {
      // Usa a primeira localização salva
      return this.savedLocations[0];
    }
    return null;
  }

  handleLocationSearch() {
    const stateId = this.searchState.value;
    const cityId = this.searchCity.value;
    const neighborhoodIndex = this.searchNeighborhood.value;
    
    if (stateId && cityId && neighborhoodIndex !== '') {
        // Se for Itajubá e temos dados do JSON
        if ((cityId === 'itajuba' || cityId === 'itajubá') && this.searchNeighborhood.options[neighborhoodIndex].dataset.bairroData) {
            const bairroData = JSON.parse(this.searchNeighborhood.options[neighborhoodIndex].dataset.bairroData);
            this.showBairroOnMap(bairroData);
        } else {
            // Para outras cidades, usa busca padrão
            this.showStandardLocationOnMap(stateId, cityId, neighborhoodIndex);
        }
    }
}

showBairroOnMap(bairroData) {
    // Coordenadas aproximadas de Itajubá (podem ser ajustadas)
    const itajubaCoords = {
        lat: -22.4262,
        lng: -45.4559
    };
    
    // Centraliza o mapa em Itajubá
    this.mapManager.setView(itajubaCoords, 13);
    
    // Adiciona marcador com informações do bairro
    this.mapManager.addMarker(itajubaCoords, this.createBairroPopup(bairroData));
    
    // Mostra informações detalhadas do bairro
    this.showBairroInfo(bairroData);
    
    this.showNotification(`Bairro ${this.formatBairroName(bairroData.nome)} carregado no mapa`, 'success');
}

createBairroPopup(bairroData) {
    return `
        <div class="bairro-popup">
            <h3>${this.formatBairroName(bairroData.nome)}</h3>
            <div class="bairro-stats-popup">
                <div class="stat-row">
                    <span class="stat-label">🌡️ Temperatura Superfície:</span>
                    <span class="stat-value ${this.getTemperatureColor(bairroData.surface_temp)}">
                        ${bairroData.surface_temp.toFixed(1)}°C
                    </span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">🌿 Índice de Vegetação:</span>
                    <span class="stat-value ${this.getVegetationColor(bairroData.index_vegetacao)}">
                        ${(bairroData.index_vegetacao * 100).toFixed(1)}%
                    </span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">💨 Temperatura do Ar (2m):</span>
                    <span class="stat-value">${bairroData.temperature_2m.toFixed(1)}°C</span>
                </div>
            </div>
        </div>
    `;
}

showBairroInfo(bairroData) {
    // Cria ou atualiza um painel lateral com informações detalhadas
    let infoPanel = document.getElementById('bairroInfoPanel');
    
    if (!infoPanel) {
        infoPanel = document.createElement('div');
        infoPanel.id = 'bairroInfoPanel';
        infoPanel.className = 'bairro-info-panel';
        document.querySelector('.main-content').appendChild(infoPanel);
    }
    
    infoPanel.innerHTML = `
        <div class="panel-header">
            <h3>📊 ${this.formatBairroName(bairroData.nome)}</h3>
            <button class="close-panel" onclick="this.parentElement.parentElement.style.display='none'">×</button>
        </div>
        <div class="panel-content">
            <div class="info-grid">
                <div class="info-card temp-card">
                    <div class="info-icon">🔥</div>
                    <div class="info-content">
                        <h4>Temperatura Superfície</h4>
                        <div class="info-value ${this.getTemperatureColor(bairroData.surface_temp)}">
                            ${bairroData.surface_temp.toFixed(1)}°C
                        </div>
                        <div class="info-comparison">
                            ${this.getTemperatureComparison(bairroData.surface_temp)}
                        </div>
                    </div>
                </div>
                
                <div class="info-card veg-card">
                    <div class="info-icon">🌿</div>
                    <div class="info-content">
                        <h4>Cobertura Vegetal</h4>
                        <div class="info-value ${this.getVegetationColor(bairroData.index_vegetacao)}">
                            ${(bairroData.index_vegetacao * 100).toFixed(1)}%
                        </div>
                        <div class="info-comparison">
                            ${this.getVegetationComparison(bairroData.index_vegetacao)}
                        </div>
                    </div>
                </div>
                
                <div class="info-card air-card">
                    <div class="info-icon">💨</div>
                    <div class="info-content">
                        <h4>Temperatura do Ar</h4>
                        <div class="info-value">
                            ${bairroData.temperature_2m.toFixed(1)}°C
                        </div>
                        <div class="info-comparison">
                            Temperatura a 2 metros do solo
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="recommendations">
                <h4>💡 Recomendações</h4>
                ${this.generateRecommendations(bairroData)}
            </div>
        </div>
    `;
    
    infoPanel.style.display = 'block';
}

// Métodos auxiliares para comparações e recomendações
getTemperatureComparison(temp) {
    if (temp > 33) return '🌡️ Acima da média - Área de atenção';
    if (temp > 30) return '🌡️ Na média da cidade';
    return '🌡️ Abaixo da média - Área mais fresca';
}

getVegetationComparison(veg) {
    if (veg > 0.5) return '🌳 Alta cobertura vegetal';
    if (veg > 0.3) return '🌿 Média cobertura vegetal';
    return '🍂 Baixa cobertura vegetal';
}

generateRecommendations(bairroData) {
    const recommendations = [];
    
    if (bairroData.surface_temp > 33) {
        recommendations.push('• Implementar áreas verdes para reduzir ilhas de calor');
        recommendations.push('• Considerar telhados verdes ou claros');
        recommendations.push('• Aumentar permeabilidade do solo');
    }
    
    if (bairroData.index_vegetacao < 0.3) {
        recommendations.push('• Plantio de árvores nativas');
        recommendations.push('• Criação de praças e parques');
        recommendations.push('• Incentivo a jardins verticais');
    }
    
    if (bairroData.index_vegetacao > 0.5) {
        recommendations.push('• Manutenção das áreas verdes existentes');
        recommendations.push('• Proteção contra desmatamento');
        recommendations.push('• Criação de corredores ecológicos');
    }
    
    return recommendations.length > 0 
        ? `<ul>${recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>`
        : '<p>✅ Área com boas condições ambientais</p>';
}

getTemperatureColor(temp) {
    if (temp > 33) return 'temp-high';
    if (temp > 30) return 'temp-medium';
    return 'temp-low';
}

getVegetationColor(veg) {
    if (veg > 0.5) return 'veg-high';
    if (veg > 0.3) return 'veg-medium';
    return 'veg-low';
}
}



// Exportar para uso global
window.UIManager = UIManager;
