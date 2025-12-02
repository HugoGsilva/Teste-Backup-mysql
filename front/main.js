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

	// Estado do relógio sincronizado com servidor (Horário de Brasília)
	let serverHour = 0;
	let serverMinute = 0;
	let serverSecond = 0;
	let serverDay = 1;
	let serverMonth = 1;
	let serverYear = 2025;
	let lastSyncTime = 0;
	let isSynced = false;

	// ===== RELÓGIO EM TEMPO REAL =====

	// Sincronizar com o servidor (horário de Brasília via Luxon)
	async function syncWithServer() {
		try {
			const res = await fetch('/api/current-time');
			if (res.ok) {
				const data = await res.json();
				serverHour = data.hour;
				serverMinute = data.minute;
				serverSecond = data.second;
				serverDay = data.day;
				serverMonth = data.month;
				serverYear = data.year;
				lastSyncTime = Date.now();
				isSynced = true;
				console.log(`✅ Sincronizado com Brasília: ${data.formatted} (${data.timezone})`);
			}
		} catch (err) {
			console.error('❌ Erro ao sincronizar com servidor:', err);
		}
	}

	function updateClock() {
		if (!isSynced) {
			clockDisplay.textContent = '--:--:--';
			dateDisplay.textContent = 'Sincronizando...';
			return;
		}

		// Calcular tempo decorrido desde última sincronização
		const elapsed = Math.floor((Date.now() - lastSyncTime) / 1000);
		
		// Calcular horário atual baseado no servidor
		let totalSeconds = serverHour * 3600 + serverMinute * 60 + serverSecond + elapsed;
		
		// Normalizar para 24 horas
		totalSeconds = totalSeconds % 86400;
		if (totalSeconds < 0) totalSeconds += 86400;
		
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		// Usar data do servidor (Brasília)
		const day = String(serverDay).padStart(2, '0');
		const month = String(serverMonth).padStart(2, '0');
		const year = serverYear;

		clockDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
		dateDisplay.textContent = `${day}/${month}/${year}`;

		// Atualizar contador de próximo backup
		if (autoBackupEnabled) {
			updateCountdown(seconds);
		}
	}

	function updateCountdown(currentSecond) {
		let secondsUntilBackup;

		if (currentSecond <= currentTriggerSecond) {
			secondsUntilBackup = currentTriggerSecond - currentSecond;
		} else {
			secondsUntilBackup = 60 - currentSecond + currentTriggerSecond;
		}

		countdownDisplay.textContent = secondsUntilBackup;

		// Destacar quando estiver próximo (ajustado para tema neon)
		if (secondsUntilBackup <= 5) {
			nextBackupInfo.style.background = 'linear-gradient(135deg, rgba(255, 23, 68, 0.2) 0%, rgba(255, 145, 0, 0.1) 100%)';
			nextBackupInfo.style.borderLeftColor = '#ff1744';
		} else {
			nextBackupInfo.style.background = 'linear-gradient(135deg, rgba(0, 243, 255, 0.1) 0%, rgba(255, 23, 68, 0.05) 100%)';
			nextBackupInfo.style.borderLeftColor = '#00f3ff';
		}
	}

	// Sincronizar imediatamente ao carregar
	syncWithServer();
	
	// Atualizar relógio a cada segundo
	setInterval(updateClock, 1000);
	
	// Re-sincronizar com o servidor a cada 10 segundos para manter precisão
	setInterval(syncWithServer, 10000);

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
			autoStatus.querySelector('span').textContent = 'Online ⚡';
			toggleAutoBackupBtn.textContent = '⏹️ Desativar Sistema';
			toggleAutoBackupBtn.classList.remove('btn-primary');
			toggleAutoBackupBtn.classList.add('btn-danger');
			nextBackupInfo.style.display = 'block';
		} else {
			autoStatus.classList.remove('active');
			autoStatus.classList.add('inactive');
			autoStatus.querySelector('span').textContent = 'Offline';
			toggleAutoBackupBtn.textContent = '⚡ Iniciar Sistema';
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