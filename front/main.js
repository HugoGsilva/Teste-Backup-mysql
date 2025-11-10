document.addEventListener('DOMContentLoaded', () => {
	const input = document.getElementById('item-input');
	const insertBtn = document.getElementById('insert-btn');
	const backupBtn = document.getElementById('backup-btn');
	const destroyBtn = document.getElementById('destroy-btn');
	const restoreBtn = document.getElementById('restore-btn');
	const dataList = document.getElementById('data-list');

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
				const text = await res.text().catch(()=>null);
				throw new Error('Falha ao inserir' + (text ? (': '+text) : ''));
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
			setTimeout(loadItems, 1000);
			alert('Backup iniciado');
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
			setTimeout(loadItems, 1500);
			alert('Restauração iniciada');
		} catch (err) {
			console.error(err);
			alert('Erro ao restaurar');
		}
	}

	insertBtn.addEventListener('click', insertItem);
	backupBtn.addEventListener('click', triggerBackup);
	destroyBtn.addEventListener('click', simulateDisaster);
	restoreBtn.addEventListener('click', triggerRestore);

	loadItems();

	function escapeHtml(s) {
		return s.replace(/[&<>"']/g, (c) => ({
			'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
		})[c]);
	}
});