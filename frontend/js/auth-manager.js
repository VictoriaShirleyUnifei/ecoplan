// Gerenciador de Autenticação Global
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.init();
  }

  init() {
    this.checkAuthentication();
    this.initializeAuthListeners();
    this.updateUI();
    this.protectRoutes();
    this.redirectIfAuthenticated();
  }

  checkAuthentication() {
    const token = localStorage.getItem("EcoPlan-auth-token");
    const userData = localStorage.getItem("EcoPlan-user");

    if (token && userData) {
      try {
        this.currentUser = JSON.parse(userData);
        this.isAuthenticated = true;

        // Verifica se o token ainda é válido (simulação)
        if (this.isTokenExpired(token)) {
          this.logout();
          return;
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        this.logout();
      }
    }
  }

  isTokenExpired(token) {
    // Simulação - em produção, verificar expiração real do token
    const tokenAge = Date.now() - parseInt(token.split("_").pop(), 36);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
    return tokenAge > maxAge;
  }

  initializeAuthListeners() {
    // Botão de Login no Header
    const loginBtn = document.getElementById("headerLoginBtn");
    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        this.redirectToLogin();
      });
    }

    // Botão de Cadastro no Header
    const registerBtn = document.getElementById("headerRegisterBtn");
    if (registerBtn) {
      registerBtn.addEventListener("click", () => {
        this.redirectToRegister();
      });
    }

    // User Avatar (menu dropdown)
    const userAvatar = document.getElementById("userAvatar");
    if (userAvatar) {
      userAvatar.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleUserDropdown();
      });
    }

    // Botão de Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        this.logout();
      });
    }

    // Fechar dropdown ao clicar fora
    document.addEventListener("click", () => {
      this.hideUserDropdown();
    });

    // Prevenir fechar dropdown ao clicar dentro
    const userDropdown = document.getElementById("userDropdown");
    if (userDropdown) {
      userDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }
  }

  protectRoutes() {
    const protectedRoutes = ["projects.html", "analysis.html", "reports.html"];
    const currentPage = window.location.pathname.split("/").pop();

    if (protectedRoutes.includes(currentPage) && !this.isAuthenticated) {
      this.showNotification(
        "Você precisa fazer login para acessar esta página",
        "warning"
      );
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
      return false;
    }
    return true;
  }

  redirectIfAuthenticated() {
    const currentPage = window.location.pathname.split("/").pop();
    if (
      this.isAuthenticated &&
      (currentPage === "login.html" || currentPage === "register.html")
    ) {
      this.showNotification("Você já está logado!", "info");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    }
  }

  redirectToLogin() {
    window.location.href = "login.html";
  }

  redirectToRegister() {
    // Se não tiver página de registro, redireciona para login
    window.location.href = "login.html";
  }

  toggleUserDropdown() {
    const dropdown = document.getElementById("userDropdown");
    if (dropdown) {
      dropdown.classList.toggle("show");
    }
  }

  hideUserDropdown() {
    const dropdown = document.getElementById("userDropdown");
    if (dropdown) {
      dropdown.classList.remove("show");
    }
  }

  updateUI() {
    const loginBtn = document.getElementById("headerLoginBtn");
    const registerBtn = document.getElementById("headerRegisterBtn");
    const userMenu = document.getElementById("userMenu");

    if (this.isAuthenticated && this.currentUser) {
      // Usuário logado - mostra menu do usuário
      if (loginBtn) loginBtn.style.display = "none";
      if (registerBtn) registerBtn.style.display = "none";
      if (userMenu) userMenu.style.display = "flex";

      // Atualiza informações do usuário
      this.updateUserInfo();
    } else {
      // Usuário não logado - mostra botões de login/cadastro
      if (loginBtn) loginBtn.style.display = "block";
      if (registerBtn) registerBtn.style.display = "block";
      if (userMenu) userMenu.style.display = "none";
    }
  }

  updateUserInfo() {
    const avatarInitials = document.getElementById("avatarInitials");
    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmail");

    if (this.currentUser) {
      // Iniciais do avatar
      if (avatarInitials) {
        const initials = this.getUserInitials(
          this.currentUser.name || this.currentUser.email
        );
        avatarInitials.textContent = initials;
      }

      // Nome e email
      if (userName) {
        userName.textContent = this.currentUser.name || "Usuário";
      }
      if (userEmail) {
        userEmail.textContent = this.currentUser.email || "";
      }

      // Cor do avatar baseada no email (para consistência)
      this.updateAvatarColor();
    }
  }

  getUserInitials(name) {
    if (!name) return "U";

    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }

  updateAvatarColor() {
    const avatar = document.getElementById("userAvatar");
    if (avatar && this.currentUser) {
      // Gera cor consistente baseada no email
      const colors = [
        "#2c5aa0",
        "#2ecc71",
        "#9b59b6",
        "#e74c3c",
        "#f39c12",
        "#1abc9c",
        "#34495e",
        "#e67e22",
      ];

      const emailHash = this.currentUser.email
        ? this.currentUser.email.split("").reduce((a, b) => {
            a = (a << 5) - a + b.charCodeAt(0);
            return a & a;
          }, 0)
        : 0;

      const colorIndex = Math.abs(emailHash) % colors.length;
      avatar.style.background = colors[colorIndex];
    }
  }

  login(userData, token) {
    localStorage.setItem("EcoPlan-auth-token", token);
    localStorage.setItem("EcoPlan-user", JSON.stringify(userData));

    this.currentUser = userData;
    this.isAuthenticated = true;

    this.updateUI();
    this.hideUserDropdown();

    // Mostra notificação de boas-vindas
    this.showNotification(
      `Bem-vindo(a), ${userData.name || "Usuário"}!`,
      "success"
    );
  }

  logout() {
    // Remove dados de autenticação
    localStorage.removeItem("EcoPlan-auth-token");
    localStorage.removeItem("EcoPlan-user");

    // Reseta estado
    this.currentUser = null;
    this.isAuthenticated = false;

    // Atualiza UI
    this.updateUI();
    this.hideUserDropdown();

    // Mostra notificação
    this.showNotification("Logout realizado com sucesso!", "info");

    // Redireciona para a página inicial se não estiver nela
    if (
      !window.location.pathname.includes("index.html") &&
      !window.location.pathname.endsWith("/")
    ) {
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    }
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

  // Métodos para verificar permissões
  hasRole(role) {
    return (
      this.isAuthenticated && this.currentUser && this.currentUser.role === role
    );
  }

  isAdmin() {
    return this.hasRole("admin");
  }

  // Método para proteger rotas
  requireAuth() {
    if (!this.isAuthenticated) {
      this.redirectToLogin();
      return false;
    }
    return true;
  }

  // Método para redirecionar se já estiver autenticado
  redirectIfAuthenticated() {
    if (
      this.isAuthenticated &&
      window.location.pathname.includes("login.html")
    ) {
      window.location.href = "index.html";
    }
  }
}

// Inicialização global
document.addEventListener("DOMContentLoaded", () => {
  window.authManager = new AuthManager();
});
