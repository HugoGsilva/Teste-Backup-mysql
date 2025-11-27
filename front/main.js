document.addEventListener('DOMContentLoaded', () => {
	// Elementos da página
	const clockDisplay = document.getElementById('clock');
	const dateDisplay = document.getElementById('date');
	const input = document.getElementById('item-input');
	const insertBtn = document.getElementById('insert-btn');
	const backupBtn = document.getElementById('backup-btn');
	const destroyBtn = document.getElementById('destroy-btn');
	const restoreBtn = document.getElementById('restore-btn');
	const dataList = document.getElementById('data-list');

	// Elementos de backup automático
	const triggerSecondInput = document.getElementById('trigger-second');
	const toggleAutoBackupBtn = document.getElementById('toggle-auto-backup');
	const autoStatus = document.getElementById('auto-status');
	const nextBackupInfo = document.getElementById('next-backup-info');
	const countdownDisplay = document.getElementById('countdown');

	// Estado do backup automático
	let autoBackupEnabled = false;
	let currentTriggerSecond = 30;

	// ===== RELÓGIO EM TEMPO REAL =====

	function updateClock() {
		const now = new Date();
		// Converter para horário de Brasília (UTC-3)
		const brasiliaOffset = -3 * 60; // UTC-3 em minutos
		const brasiliaTime = new Date(now.getTime() + (brasiliaOffset - now.getTimezoneOffset()) * 60000);

		const hours = String(brasiliaTime.getHours()).padStart(2, '0');
		const minutes = String(brasiliaTime.getMinutes()).padStart(2, '0');
		const seconds = String(brasiliaTime.getSeconds()).padStart(2, '0');

		const day = String(brasiliaTime.getDate()).padStart(2, '0');
		const month = String(brasiliaTime.getMonth() + 1).padStart(2, '0');
		const year = brasiliaTime.getFullYear();

		clockDisplay.textContent = `${hours}:${minutes}:${seconds}`;
		dateDisplay.textContent = `${day}/${month}/${year}`;

		// Atualizar contador de próximo backup
		if (autoBackupEnabled) {
			updateCountdown(brasiliaTime);
		}
	}

	function updateCountdown(brasiliaTime) {
		const currentSecond = brasiliaTime.getSeconds();
		let secondsUntilBackup;

		if (currentSecond <= currentTriggerSecond) {
			secondsUntilBackup = currentTriggerSecond - currentSecond;
		} else {
			secondsUntilBackup = 60 - currentSecond + currentTriggerSecond;
		}

		countdownDisplay.textContent = secondsUntilBackup;

		// Destacar quando estiver próximo
		if (secondsUntilBackup <= 5) {
			nextBackupInfo.style.background = '#fff3cd';
			nextBackupInfo.style.borderColor = '#ffc107';
		} else {
			nextBackupInfo.style.background = '#e7f3ff';
			nextBackupInfo.style.borderColor = '#667eea';
		}
	}

	// Atualizar relógio a cada segundo
	setInterval(updateClock, 1000);
	updateClock();

	// Sincronizar com o servidor a cada 30 segundos
	setInterval(async () => {
		try {
			const res = await fetch('/api/current-time');
			if (res.ok) {
				// Servidor está sincronizado, apenas para validação
				console.log('Relógio sincronizado com servidor');
			}
		} catch (err) {
			console.error('Erro ao sincronizar relógio:', err);
		}
	}, 30000);

	// ===== BACKUP AUTOMÁTICO =====

	async function loadAutoBackupConfig() {
		try {
			const res = await fetch('/api/auto-backup-config');
			if (!res.ok) throw new Error('Falha ao obter configuração');
			const config = await res.json();

			autoBackupEnabled = config.enabled;
			currentTriggerSecond = config.triggerSecond;
			triggerSecondInput.value = currentTriggerSecond;

			updateAutoBackupUI();
		} catch (err) {
			console.error('Erro ao carregar configuração:', err);
		}
	}

	function updateAutoBackupUI() {
		if (autoBackupEnabled) {
			autoStatus.classList.remove('inactive');
			autoStatus.classList.add('active');
			autoStatus.querySelector('span').textContent = 'Ativo';
			toggleAutoBackupBtn.textContent = 'Desativar Backup Automático';
			toggleAutoBackupBtn.classList.remove('btn-primary');
			toggleAutoBackupBtn.classList.add('btn-danger');
			nextBackupInfo.style.display = 'block';
		} else {
			autoStatus.classList.remove('active');
			autoStatus.classList.add('inactive');
			autoStatus.querySelector('span').textContent = 'Desativado';
			toggleAutoBackupBtn.textContent = 'Ativar Backup Automático';
			toggleAutoBackupBtn.classList.remove('btn-danger');
			toggleAutoBackupBtn.classList.add('btn-primary');
			nextBackupInfo.style.display = 'none';
		}
	}

	async function toggleAutoBackup() {
		try {
			const newEnabled = !autoBackupEnabled;
			const newTriggerSecond = parseInt(triggerSecondInput.value);

			if (isNaN(newTriggerSecond) || newTriggerSecond < 0 || newTriggerSecond > 59) {
				alert('Por favor, insira um valor válido entre 0 e 59 para os segundos');
				return;
			}

			const res = await fetch('/api/configure-auto-backup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					enabled: newEnabled,
					triggerSecond: newTriggerSecond
				})
			});

			if (!res.ok) throw new Error('Falha ao configurar backup automático');

			const result = await res.json();
			autoBackupEnabled = result.config.enabled;
			currentTriggerSecond = result.config.triggerSecond;

			updateAutoBackupUI();

			if (autoBackupEnabled) {
				alert(`Backup automático ativado! Será executado aos ${currentTriggerSecond} segundos de cada minuto.`);
			} else {
				alert('Backup automático desativado.');
			}
		} catch (err) {
			console.error('Erro ao alternar backup automático:', err);
			alert('Erro ao configurar backup automático');
		}
	}

	// ===== GERENCIAMENTO DE DADOS =====

	async function loadItems() {
		dataList.textContent = 'Carregando...';
		try {
			const res = await fetch('/api/itens');
			if (!res.ok) throw new Error('Falha ao obter itens');
			const items = await res.json();
			if (!Array.isArray(items)) {
				dataList.textContent = 'Resposta inválida';
				return;
			}
			if (items.length === 0) {
				dataList.textContent = '(sem itens)';
				return;
			}
			dataList.innerHTML = items.map(i => {
				const nome = (i && typeof i === 'object') ? (i.nome || '') : String(i);
				return `<div class="item">${escapeHtml(String(nome))}</div>`;
			}).join('');
		} catch (err) {
			console.error(err);
			dataList.textContent = 'Erro ao carregar itens';
		}
	}

	async function insertItem() {
		const value = input.value.trim();
		if (!value) return;
		try {
			const res = await fetch('/api/item', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nome: value })
			});
			if (!res.ok) {
				const text = await res.text().catch(() => null);
				throw new Error('Falha ao inserir' + (text ? (': ' + text) : ''));
			}
			input.value = '';
			await loadItems();
		} catch (err) {
			console.error(err);
			alert('Erro ao inserir item');
		}
	}

	async function triggerBackup() {
		try {
			const res = await fetch('/api/trigger-backup', { method: 'POST' });
			if (!res.ok) throw new Error('Falha ao disparar backup');
			const result = await res.json();
			setTimeout(loadItems, 1000);
			alert(`Backup criado: ${result.file}`);
		} catch (err) {
			console.error(err);
			alert('Erro no backup');
		}
	}

	async function simulateDisaster() {
		if (!confirm('Deseja realmente deletar todos os dados?')) return;
		try {
			const res = await fetch('/api/delete-all', { method: 'POST' });
			if (!res.ok) throw new Error('Falha ao deletar todos');
			await loadItems();
			alert('Todos os dados removidos (simulado)');
		} catch (err) {
			console.error(err);
			alert('Erro ao deletar dados');
		}
	}

	async function triggerRestore() {
		try {
			const res = await fetch('/api/trigger-restore', { method: 'POST' });
			if (!res.ok) throw new Error('Falha ao restaurar');
			const result = await res.json();
			setTimeout(loadItems, 1500);
			alert(`Restauração iniciada a partir de: ${result.file}`);
		} catch (err) {
			console.error(err);
			alert('Erro ao restaurar');
		}
	}

	function escapeHtml(s) {
		return s.replace(/[&<>"']/g, (c) => ({
			'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
		})[c]);
	}

	// ===== EVENT LISTENERS =====

	insertBtn.addEventListener('click', insertItem);
	backupBtn.addEventListener('click', triggerBackup);
	destroyBtn.addEventListener('click', simulateDisaster);
	restoreBtn.addEventListener('click', triggerRestore);
	toggleAutoBackupBtn.addEventListener('click', toggleAutoBackup);

	input.addEventListener('keypress', (e) => {
		if (e.key === 'Enter') insertItem();
	});

	// ===== INICIALIZAÇÃO =====

	loadItems();
	loadAutoBackupConfig();
});