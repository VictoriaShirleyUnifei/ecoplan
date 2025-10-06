// Gerenciador da Tela de Login
class LoginManager {
    constructor() {
        this.isLoading = false;
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.checkRememberedUser();
        this.testBackendConnection();
    }

    // Testar conexão com backend
    async testBackendConnection() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/health`);
            const data = await response.json();
            console.log('✅ Backend conectado:', data);
            return true;
        } catch (error) {
            console.error('❌ Backend offline:', error);
            this.showNotification('Backend offline. Verifique se o servidor está rodando.', 'error');
            return false;
        }
    }

    initializeEventListeners() {
        console.log('🔧 Inicializando event listeners...');
        
        // Formulário de Login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            console.log('✅ Formulário de login encontrado');
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📝 Formulário submetido');
                this.handleLogin();
            });
        } else {
            console.error('❌ Formulário de login NÃO encontrado!');
        }

        // Toggle de Senha
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                this.togglePasswordVisibility();
            });
        }

        // Esqueci Senha
        const forgotPasswordLink = document.querySelector('.forgot-password');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordModal();
            });
        }

        // Modal Esqueci Senha
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordRecovery();
            });
        }

        const cancelRecovery = document.getElementById('cancelRecovery');
        if (cancelRecovery) {
            cancelRecovery.addEventListener('click', () => {
                this.hideForgotPasswordModal();
            });
        }

        // Login Social (mantido para compatibilidade, mas desativaremos a funcionalidade)
        const googleBtn = document.querySelector('.google-btn');
        const githubBtn = document.querySelector('.github-btn');
        
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                this.showNotification('Login social temporariamente desativado. Use email e senha.', 'info');
            });
        }

        if (githubBtn) {
            githubBtn.addEventListener('click', () => {
                this.showNotification('Login social temporariamente desativado. Use email e senha.', 'info');
            });
        }

        // Fechar Modal
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', () => {
                this.hideForgotPasswordModal();
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideForgotPasswordModal();
            }
        });

        // Validação em tempo real
        this.initializeRealTimeValidation();
    }

    initializeRealTimeValidation() {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (emailInput) {
            emailInput.addEventListener('input', () => {
                this.validateEmail();
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                this.validatePassword();
            });
        }
    }

    validateEmail() {
        const emailInput = document.getElementById('email');
        const email = emailInput.value.trim();
        
        if (email === '') {
            this.setInputState(emailInput, 'neutral');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email)) {
            this.setInputState(emailInput, 'valid');
            return true;
        } else {
            this.setInputState(emailInput, 'invalid');
            return false;
        }
    }

    validatePassword() {
        const passwordInput = document.getElementById('password');
        const password = passwordInput.value;
        
        if (password === '') {
            this.setInputState(passwordInput, 'neutral');
            return false;
        }

        if (password.length >= 6) {
            this.setInputState(passwordInput, 'valid');
            return true;
        } else {
            this.setInputState(passwordInput, 'invalid');
            return false;
        }
    }

    setInputState(input, state) {
        input.classList.remove('valid', 'invalid');
        if (state !== 'neutral') {
            input.classList.add(state);
        }
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleButton = document.getElementById('togglePassword');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleButton.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            toggleButton.textContent = '👁️';
        }
    }

    async handleLogin() {
        console.log('🔐 Iniciando processo de login...');
        
        if (this.isLoading) return;

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        console.log('📧 Email:', email);
        console.log('🔑 Senha:', '*'.repeat(password.length));

        // Validação básica
        if (!this.validateEmail() || !this.validatePassword()) {
            this.showNotification('Por favor, preencha todos os campos corretamente.', 'error');
            return;
        }

        // Testar conexão com backend primeiro
        const isBackendConnected = await this.testBackendConnection();
        if (!isBackendConnected) {
            return;
        }

        this.setLoadingState(true);

        try {
            // Login real com backend
            await this.realLogin({ email, password, rememberMe });
            
        } catch (error) {
            this.showNotification(error.message, 'error');
            this.setLoadingState(false);
        }
    }

    // LOGIN REAL COM BACKEND
    async realLogin(credentials) {
        console.log('🔄 Conectando com backend...');
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro no login');
            }

            console.log('✅ Login bem-sucedido:', data);

            // Salva preferências do usuário
            if (credentials.rememberMe) {
                this.rememberUser(credentials.email);
            } else {
                this.forgetUser();
            }

            // Usa o AuthManager global para fazer login
            if (window.authManager) {
                console.log('🔑 Usando AuthManager para login');
                window.authManager.login(data.user, data.token);
            } else {
                console.log('⚠️ AuthManager não disponível, usando fallback');
                // Fallback se o AuthManager não estiver disponível
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
            }

            this.showNotification('Login realizado com sucesso!', 'success');
            
            // Redireciona para a página principal
            setTimeout(() => {
                console.log('🔄 Redirecionando para index.html...');
                window.location.href = 'index.html';
            }, 1500);

        } catch (error) {
            console.error('❌ Erro no login:', error);
            throw error;
        }
    }

    // MÉTODO ANTIGO (mantido para referência)
    async simulateLogin(credentials) {
        console.log('🔄 Simulando login...');
        
        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulação de credenciais (substituir por verificação real)
        const validUsers = [
            { email: 'usuario@EcoPlan.com', password: '123456' },
            { email: 'admin@EcoPlan.com', password: 'admin123' },
            { email: 'demo@EcoPlan.com', password: 'demo123' }
        ];

        const user = validUsers.find(u => 
            u.email === credentials.email && u.password === credentials.password
        );

        if (user) {
            console.log('✅ Usuário válido encontrado:', user.email);
            
            // Simula token de autenticação
            const authToken = this.generateAuthToken();
            
            // Usa o AuthManager global para fazer login
            if (window.authManager) {
                console.log('🔑 Usando AuthManager para login');
                window.authManager.login({
                    email: user.email,
                    name: user.email.split('@')[0],
                    role: user.email === 'admin@EcoPlan.com' ? 'admin' : 'user'
                }, authToken);
            } else {
                console.log('⚠️ AuthManager não disponível, usando fallback');
                // Fallback se o AuthManager não estiver disponível
                localStorage.setItem('EcoPlan-auth-token', authToken);
                localStorage.setItem('EcoPlan-user', JSON.stringify({
                    email: user.email,
                    name: user.email.split('@')[0],
                    role: user.email === 'admin@EcoPlan.com' ? 'admin' : 'user'
                }));
            }
            
            return { success: true, user };
        } else {
            console.log('❌ Credenciais inválidas');
            throw new Error('E-mail ou senha incorretos. Tente novamente.');
        }
    }

    generateAuthToken() {
        return 'EcoPlan_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
    }

    rememberUser(email) {
        localStorage.setItem('EcoPlan-remembered-email', email);
    }

    forgetUser() {
        localStorage.removeItem('EcoPlan-remembered-email');
    }

    checkRememberedUser() {
        const rememberedEmail = localStorage.getItem('EcoPlan-remembered-email');
        if (rememberedEmail) {
            document.getElementById('email').value = rememberedEmail;
            document.getElementById('rememberMe').checked = true;
            this.validateEmail();
        }
    }

    showForgotPasswordModal() {
        document.getElementById('forgotPasswordModal').style.display = 'block';
    }

    hideForgotPasswordModal() {
        document.getElementById('forgotPasswordModal').style.display = 'none';
        document.getElementById('forgotPasswordForm').reset();
    }

    async handlePasswordRecovery() {
        const email = document.getElementById('recoveryEmail').value.trim();

        if (!email) {
            this.showNotification('Por favor, informe seu e-mail.', 'warning');
            return;
        }

        if (!this.validateEmailFormat(email)) {
            this.showNotification('Por favor, informe um e-mail válido.', 'warning');
            return;
        }

        this.showNotification('Funcionalidade de recuperação de senha em desenvolvimento.', 'info');
        this.hideForgotPasswordModal();
    }

    validateEmailFormat(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async handleSocialLogin(provider) {
        this.showNotification(`Login com ${provider} em desenvolvimento. Use email e senha.`, 'info');
    }

    setLoadingState(loading) {
        this.isLoading = loading;
        const submitButton = document.querySelector('.btn-login-submit');
        
        if (submitButton) {
            const btnText = submitButton.querySelector('.btn-text');
            const btnLoading = submitButton.querySelector('.btn-loading');

            if (loading) {
                btnText.style.display = 'none';
                btnLoading.style.display = 'flex';
                submitButton.disabled = true;
            } else {
                btnText.style.display = 'flex';
                btnLoading.style.display = 'none';
                submitButton.disabled = false;
            }
        }
    }

    showNotification(message, type = 'info') {
        console.log(`📢 Notificação [${type}]:`, message);
        
        // Remove notificação anterior se existir
        const existingNotification = document.querySelector('.login-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Cria nova notificação
        const notification = document.createElement('div');
        notification.className = `login-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
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
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#2ecc71',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        return colors[type] || '#3498db';
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando LoginManager...');
    window.loginManager = new LoginManager();
});

// Adiciona estilos de animação para notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .input-with-icon input.valid {
        border-color: #2ecc71 !important;
    }
    
    .input-with-icon input.invalid {
        border-color: #e74c3c !important;
    }
    
    .btn-login-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);