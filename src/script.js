// Password Manager Application
class PasswordManager {
    constructor() {
        this.passwords = this.loadPasswords();
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderPasswords();
        this.updateEmptyState();
    }

    bindEvents() {
        // Modal events
        document.getElementById('addPasswordBtn').addEventListener('click', () => this.openAddModal());
        document.getElementById('generatePasswordBtn').addEventListener('click', () => this.openGeneratorModal());
        document.getElementById('passwordForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Search and filter events
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('categoryFilter').addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));
        
        // Generator events
        document.getElementById('passwordLength').addEventListener('input', (e) => this.updateLengthValue(e.target.value));
        document.querySelectorAll('#generatorModal input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.generatePassword());
        });
        
        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
                this.closeGeneratorModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeGeneratorModal();
            }
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.openAddModal();
            }
        });
    }

    // Password CRUD Operations
    addPassword(passwordData) {
        const id = Date.now().toString();
        const password = {
            id,
            ...passwordData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.passwords.push(password);
        this.savePasswords();
        this.renderPasswords();
        this.updateEmptyState();
        this.showToast('Senha adicionada com sucesso!', 'success');
    }

    updatePassword(id, passwordData) {
        const index = this.passwords.findIndex(p => p.id === id);
        if (index !== -1) {
            this.passwords[index] = {
                ...this.passwords[index],
                ...passwordData,
                updatedAt: new Date().toISOString()
            };
            this.savePasswords();
            this.renderPasswords();
            this.showToast('Senha atualizada com sucesso!', 'success');
        }
    }

    deletePassword(id) {
        if (confirm('Tem certeza que deseja excluir esta senha?')) {
            this.passwords = this.passwords.filter(p => p.id !== id);
            this.savePasswords();
            this.renderPasswords();
            this.updateEmptyState();
            this.showToast('Senha excluída com sucesso!', 'success');
        }
    }

    // Local Storage Operations
    loadPasswords() {
        try {
            const stored = localStorage.getItem('securepass_passwords');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading passwords:', error);
            return [];
        }
    }

    savePasswords() {
        try {
            localStorage.setItem('securepass_passwords', JSON.stringify(this.passwords));
        } catch (error) {
            console.error('Error saving passwords:', error);
            this.showToast('Erro ao salvar dados!', 'error');
        }
    }

    // UI Rendering
    renderPasswords(passwordsToRender = null) {
        const passwords = passwordsToRender || this.passwords;
        const grid = document.getElementById('passwordGrid');
        
        if (passwords.length === 0) {
            grid.innerHTML = '';
            this.updateEmptyState();
            return;
        }
        
        grid.innerHTML = passwords.map(password => this.createPasswordCard(password)).join('');
        this.updateEmptyState();
    }

    createPasswordCard(password) {
        const categoryClass = `category-${password.category}`;
        const categoryNames = {
            social: 'Redes Sociais',
            email: 'E-mail',
            banking: 'Bancário',
            work: 'Trabalho',
            personal: 'Pessoal',
            other: 'Outros'
        };
        
        return `
            <div class="password-card" data-id="${password.id}">
                <div class="card-header">
                    <div>
                        <div class="card-title">${this.escapeHtml(password.siteName)}</div>
                        <span class="card-category ${categoryClass}">${categoryNames[password.category]}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-icon" onclick="passwordManager.editPassword('${password.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon" onclick="passwordManager.deletePassword('${password.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-info">
                    <div class="info-row">
                        <i class="fas fa-user"></i>
                        <span class="info-value">${this.escapeHtml(password.username)}</span>
                        <button class="btn btn-icon" onclick="passwordManager.copyToClipboard('${password.username}', 'Usuário copiado!')" title="Copiar usuário">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <div class="info-row">
                        <i class="fas fa-lock"></i>
                        <div class="password-field">
                            <span class="info-value password-hidden" id="password-${password.id}">••••••••••••</span>
                            <button class="btn btn-icon" onclick="passwordManager.togglePasswordVisibility('${password.id}')" title="Mostrar/Ocultar senha">
                                <i class="fas fa-eye" id="eye-${password.id}"></i>
                            </button>
                            <button class="btn btn-icon" onclick="passwordManager.copyToClipboard('${password.password}', 'Senha copiada!')" title="Copiar senha">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    ${password.url ? `
                        <div class="info-row">
                            <i class="fas fa-globe"></i>
                            <a href="${password.url}" target="_blank" class="info-value" style="color: #667eea; text-decoration: none;">
                                ${this.escapeHtml(password.url)}
                            </a>
                            <button class="btn btn-icon" onclick="window.open('${password.url}', '_blank')" title="Abrir site">
                                <i class="fas fa-external-link-alt"></i>
                            </button>
                        </div>
                    ` : ''}
                    ${password.notes ? `
                        <div class="info-row">
                            <i class="fas fa-sticky-note"></i>
                            <span class="info-value">${this.escapeHtml(password.notes)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const grid = document.getElementById('passwordGrid');
        
        if (this.passwords.length === 0) {
            emptyState.style.display = 'block';
            grid.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            grid.style.display = 'grid';
        }
    }

    // Modal Operations
    openAddModal() {
        this.currentEditId = null;
        document.getElementById('modalTitle').textContent = 'Nova Senha';
        document.getElementById('passwordForm').reset();
        document.getElementById('passwordModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    editPassword(id) {
        const password = this.passwords.find(p => p.id === id);
        if (!password) return;
        
        this.currentEditId = id;
        document.getElementById('modalTitle').textContent = 'Editar Senha';
        
        // Fill form with existing data
        document.getElementById('siteName').value = password.siteName;
        document.getElementById('username').value = password.username;
        document.getElementById('password').value = password.password;
        document.getElementById('category').value = password.category;
        document.getElementById('url').value = password.url || '';
        document.getElementById('notes').value = password.notes || '';
        
        document.getElementById('passwordModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('passwordModal').classList.remove('show');
        document.body.style.overflow = 'auto';
        this.currentEditId = null;
    }

    openGeneratorModal() {
        document.getElementById('generatorModal').classList.add('show');
        document.body.style.overflow = 'hidden';
        this.generatePassword();
    }

    closeGeneratorModal() {
        document.getElementById('generatorModal').classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    // Form Handling
    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            siteName: document.getElementById('siteName').value.trim(),
            username: document.getElementById('username').value.trim(),
            password: document.getElementById('password').value,
            category: document.getElementById('category').value,
            url: document.getElementById('url').value.trim(),
            notes: document.getElementById('notes').value.trim()
        };
        
        // Validation
        if (!formData.siteName || !formData.username || !formData.password) {
            this.showToast('Por favor, preencha todos os campos obrigatórios!', 'error');
            return;
        }
        
        if (this.currentEditId) {
            this.updatePassword(this.currentEditId, formData);
        } else {
            this.addPassword(formData);
        }
        
        this.closeModal();
    }

    // Search and Filter
    handleSearch(query) {
        const filtered = this.passwords.filter(password => 
            password.siteName.toLowerCase().includes(query.toLowerCase()) ||
            password.username.toLowerCase().includes(query.toLowerCase()) ||
            (password.notes && password.notes.toLowerCase().includes(query.toLowerCase()))
        );
        this.renderPasswords(filtered);
    }

    handleCategoryFilter(category) {
        if (!category) {
            this.renderPasswords();
            return;
        }
        
        const filtered = this.passwords.filter(password => password.category === category);
        this.renderPasswords(filtered);
    }

    // Password Generator
    generatePassword() {
        const length = parseInt(document.getElementById('passwordLength').value);
        const includeUppercase = document.getElementById('includeUppercase').checked;
        const includeLowercase = document.getElementById('includeLowercase').checked;
        const includeNumbers = document.getElementById('includeNumbers').checked;
        const includeSymbols = document.getElementById('includeSymbols').checked;
        
        let charset = '';
        if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (includeNumbers) charset += '0123456789';
        if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        if (!charset) {
            this.showToast('Selecione pelo menos uma opção de caracteres!', 'warning');
            return;
        }
        
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        
        document.getElementById('generatedPassword').value = password;
    }

    updateLengthValue(value) {
        document.getElementById('lengthValue').textContent = value;
        this.generatePassword();
    }

    useGeneratedPassword() {
        const generatedPassword = document.getElementById('generatedPassword').value;
        if (generatedPassword) {
            document.getElementById('password').value = generatedPassword;
            this.closeGeneratorModal();
            this.showToast('Senha gerada aplicada!', 'success');
        }
    }

    // Utility Functions
    togglePasswordVisibility(id, inputId = null) {
        if (inputId) {
            // For form inputs
            const input = document.getElementById(inputId);
            const icon = input.nextElementSibling.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        } else {
            // For password cards
            const passwordElement = document.getElementById(`password-${id}`);
            const eyeIcon = document.getElementById(`eye-${id}`);
            const password = this.passwords.find(p => p.id === id);
            
            if (passwordElement.classList.contains('password-hidden')) {
                passwordElement.textContent = password.password;
                passwordElement.classList.remove('password-hidden');
                passwordElement.classList.add('password-visible');
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            } else {
                passwordElement.textContent = '••••••••••••';
                passwordElement.classList.remove('password-visible');
                passwordElement.classList.add('password-hidden');
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            }
        }
    }

    async copyToClipboard(text, message = 'Copiado!') {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast(message, 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast(message, 'success');
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => {
                    toastContainer.removeChild(toast);
                }, 300);
            }
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export/Import functionality (bonus feature)
    exportPasswords() {
        const dataStr = JSON.stringify(this.passwords, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `securepass_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Backup exportado com sucesso!', 'success');
    }

    importPasswords(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedPasswords = JSON.parse(e.target.result);
                if (Array.isArray(importedPasswords)) {
                    this.passwords = [...this.passwords, ...importedPasswords];
                    this.savePasswords();
                    this.renderPasswords();
                    this.updateEmptyState();
                    this.showToast(`${importedPasswords.length} senhas importadas!`, 'success');
                } else {
                    throw new Error('Formato inválido');
                }
            } catch (error) {
                this.showToast('Erro ao importar arquivo!', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Global functions for HTML onclick events
function openAddModal() {
    passwordManager.openAddModal();
}

function closeModal() {
    passwordManager.closeModal();
}

function closeGeneratorModal() {
    passwordManager.closeGeneratorModal();
}

function togglePasswordVisibility(inputId) {
    passwordManager.togglePasswordVisibility(null, inputId);
}

function generatePassword() {
    passwordManager.generatePassword();
}

function useGeneratedPassword() {
    passwordManager.useGeneratedPassword();
}

function copyToClipboard(text, message) {
    passwordManager.copyToClipboard(text, message);
}

// Initialize the application
let passwordManager;

document.addEventListener('DOMContentLoaded', () => {
    passwordManager = new PasswordManager();
    
    // Add some sample data for demonstration (remove in production)
    if (passwordManager.passwords.length === 0) {
        const samplePasswords = [
            {
                id: '1',
                siteName: 'Gmail',
                username: 'usuario@gmail.com',
                password: 'MinhaSenh@123',
                category: 'email',
                url: 'https://gmail.com',
                notes: 'Conta principal de e-mail',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '2',
                siteName: 'Facebook',
                username: 'meuusuario',
                password: 'Facebook2023!',
                category: 'social',
                url: 'https://facebook.com',
                notes: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: '3',
                siteName: 'Banco do Brasil',
                username: '12345-6',
                password: 'BancoSeguro456',
                category: 'banking',
                url: 'https://bb.com.br',
                notes: 'Conta corrente principal',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        
        passwordManager.passwords = samplePasswords;
        passwordManager.savePasswords();
        passwordManager.renderPasswords();
        passwordManager.updateEmptyState();
    }
});