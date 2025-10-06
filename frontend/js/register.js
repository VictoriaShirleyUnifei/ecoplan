// Configurações da API
//const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Elementos do formulário
const registerForm = document.getElementById('registerForm');
const firstNameInput = document.getElementById('firstName');
const lastNameInput = document.getElementById('lastName');
const emailInput = document.getElementById('registerEmail');
const passwordInput = document.getElementById('registerPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const acceptTermsCheckbox = document.getElementById('acceptTerms');
const submitButton = document.querySelector('.btn-login-submit');
const btnText = submitButton.querySelector('.btn-text');
const btnLoading = submitButton.querySelector('.btn-loading');

// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const input = this.parentElement.querySelector('input');
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '👁️‍🗨️';
    });
});

// Validações em tempo real
firstNameInput.addEventListener('blur', validateName);
lastNameInput.addEventListener('blur', validateName);
emailInput.addEventListener('blur', validateEmail);
passwordInput.addEventListener('blur', validatePassword);
confirmPasswordInput.addEventListener('blur', validateConfirmPassword);

function validateName(e) {
    const input = e.target;
    const value = input.value.trim();
    
    if (value.length < 2) {
        showError(input, 'Nome deve ter pelo menos 2 caracteres');
        return false;
    }
    
    if (value.length > 50) {
        showError(input, 'Nome não pode ter mais de 50 caracteres');
        return false;
    }
    
    clearError(input);
    return true;
}

function validateEmail(e) {
    const input = e.target;
    const value = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(value)) {
        showError(input, 'Por favor, insira um email válido');
        return false;
    }
    
    clearError(input);
    return true;
}

function validatePassword(e) {
    const input = e.target;
    const value = input.value;
    
    if (value.length < 6) {
        showError(input, 'Senha deve ter no mínimo 6 caracteres');
        return false;
    }
    
    clearError(input);
    return true;
}

function validateConfirmPassword(e) {
    const input = e.target;
    const password = passwordInput.value;
    const confirmPassword = input.value;
    
    if (confirmPassword !== password) {
        showError(input, 'As senhas não coincidem');
        return false;
    }
    
    clearError(input);
    return true;
}

function showError(input, message) {
    clearError(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#e74c3c';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.textContent = message;
    
    input.parentElement.appendChild(errorDiv);
    input.style.borderColor = '#e74c3c';
}

function clearError(input) {
    const errorDiv = input.parentElement.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
    input.style.borderColor = '';
}

// Loading state
function setLoading(isLoading) {
    if (isLoading) {
        submitButton.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
    } else {
        submitButton.disabled = false;
        btnText.style.display = 'block';
        btnLoading.style.display = 'none';
    }
}

// Mostrar mensagem de sucesso/erro
function showMessage(message, type = 'success') {
    // Remove mensagens anteriores
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message ${type}`;
    messageDiv.style.padding = '12px';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.marginBottom = '1rem';
    messageDiv.style.textAlign = 'center';
    messageDiv.style.fontWeight = '500';
    
    if (type === 'success') {
        messageDiv.style.backgroundColor = '#d4edda';
        messageDiv.style.color = '#155724';
        messageDiv.style.border = '1px solid #c3e6cb';
    } else {
        messageDiv.style.backgroundColor = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.style.border = '1px solid #f5c6cb';
    }
    
    messageDiv.textContent = message;
    
    // Insere antes do formulário
    registerForm.parentElement.insertBefore(messageDiv, registerForm);
    
    // Auto-remove após 5 segundos para mensagens de sucesso
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Função principal de registro
async function registerUser(userData) {
    try {
        setLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Erro no registro');
        }
        
        return data;
        
    } catch (error) {
        console.error('Erro no registro:', error);
        throw error;
    } finally {
        setLoading(false);
    }
}

// Testar conexão com backend
async function testBackendConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log('✅ Backend conectado:', data);
        return true;
    } catch (error) {
        console.error('❌ Backend offline:', error);
        showMessage('Backend offline. Verifique se o servidor está rodando.', 'error');
        return false;
    }
}

// Event listener para o formulário
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validar todos os campos
    const isFirstNameValid = validateName({ target: firstNameInput });
    const isLastNameValid = validateName({ target: lastNameInput });
    const isEmailValid = validateEmail({ target: emailInput });
    const isPasswordValid = validatePassword({ target: passwordInput });
    const isConfirmPasswordValid = validateConfirmPassword({ target: confirmPasswordInput });
    
    if (!isFirstNameValid || !isLastNameValid || !isEmailValid || 
        !isPasswordValid || !isConfirmPasswordValid) {
        showMessage('Por favor, corrija os erros no formulário.', 'error');
        return;
    }
    
    if (!acceptTermsCheckbox.checked) {
        showMessage('Você deve aceitar os termos de uso e política de privacidade.', 'error');
        return;
    }
    
    // Testar conexão com backend primeiro
    const isBackendConnected = await testBackendConnection();
    if (!isBackendConnected) {
        return;
    }
    
    // Dados do usuário
    const userData = {
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value
    };
    
    try {
        const result = await registerUser(userData);
        
        if (result.success) {
            showMessage('✅ Cadastro realizado com sucesso! Redirecionando para login...', 'success');
            
            // Salvar token se necessário
            if (result.token) {
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userData', JSON.stringify(result.user));
            }
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
        
    } catch (error) {
        showMessage(`❌ Erro no cadastro: ${error.message}`, 'error');
    }
});

// Validação adicional para o checkbox
acceptTermsCheckbox.addEventListener('change', function() {
    if (!this.checked) {
        const checkboxContainer = this.closest('.checkbox-container');
        const errorDiv = checkboxContainer.querySelector('.error-message');
        if (!errorDiv) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.color = '#e74c3c';
            errorDiv.style.fontSize = '0.8rem';
            errorDiv.style.marginTop = '0.25rem';
            errorDiv.textContent = 'Você deve aceitar os termos';
            checkboxContainer.appendChild(errorDiv);
        }
    } else {
        const errorDiv = this.closest('.checkbox-container').querySelector('.error-message');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
});

// Testar conexão quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Script de registro carregado');
    testBackendConnection();
});