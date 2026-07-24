(() => {
  'use strict';

  const LEGACY_STORAGE_KEY = 'er-studio-project-v3';
  const WORKSPACE_KEY = 'mbd-studio-workspace-v1';
  const LEGACY_MDB_WORKSPACE_KEY = 'mdb-studio-workspace-v1';
  const WORKSPACE_VERSION = 1;
  const THEME_KEY = 'er-studio-theme';
  const BACKUP_DB_NAME = 'er-studio-backup-db';
  const BACKUP_STORE_NAME = 'file-handles';
  const BACKUP_HANDLE_KEY = 'project-txt';
  const TXT_BACKUP_FORMAT = 'MBD_STUDIO_TXT_BACKUP_V1';
  const LEGACY_MDB_TXT_BACKUP_FORMAT = 'MDB_STUDIO_TXT_BACKUP_V1';
  const LEGACY_TXT_BACKUP_FORMAT = 'ER_STUDIO_TXT_BACKUP_V1';
  const TABLE_WIDTH = 310;
  const HEADER_HEIGHT = 46;
  const FIELD_HEIGHT = 36;
  const WORLD_WIDTH = 5000;
  const WORLD_HEIGHT = 3600;
  const DEFAULT_HEADER_COLOR = '#3867F4';
  const SQL_IDENTIFIER_PATTERN = '(?:"(?:[^"]|"")*"|`(?:[^`]|``)*`|\\[[^\\]]*\\]|[A-Za-z_#$][A-Za-z0-9_#$]*)';
  const SQL_QUALIFIED_IDENTIFIER_PATTERN = `${SQL_IDENTIFIER_PATTERN}(?:\\s*\\.\\s*${SQL_IDENTIFIER_PATTERN})?`;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

  const elements = {
    canvas: $('#canvas'),
    viewport: $('#viewport'),
    nodesLayer: $('#nodesLayer'),
    connections: $('#connections'),
    emptyState: $('#emptyState'),
    tableList: $('#tableList'),
    tableCount: $('#tableCount'),
    searchInput: $('#searchInput'),
    newTableBtn: $('#newTableBtn'),
    emptyNewTableBtn: $('#emptyNewTableBtn'),
    nativeSqlBtn: $('#nativeSqlBtn'),
    relationshipBtn: $('#relationshipBtn'),
    autoLayoutBtn: $('#autoLayoutBtn'),
    undoBtn: $('#undoBtn'),
    redoBtn: $('#redoBtn'),
    deleteBtn: $('#deleteBtn'),
    zoomInBtn: $('#zoomInBtn'),
    zoomOutBtn: $('#zoomOutBtn'),
    zoomResetBtn: $('#zoomResetBtn'),
    fitBtn: $('#fitBtn'),
    modeStatus: $('#modeStatus'),
    saveStatus: $('#saveStatus'),
    themeBtn: $('#themeBtn'),
    projectBtn: $('#projectBtn'),
    currentProjectName: $('#currentProjectName'),
    projectDialog: $('#projectDialog'),
    projectForm: $('#projectForm'),
    newProjectNameInput: $('#newProjectNameInput'),
    projectList: $('#projectList'),
    projectCount: $('#projectCount'),
    interactionDialog: $('#interactionDialog'),
    interactionForm: $('#interactionForm'),
    interactionIcon: $('#interactionIcon'),
    interactionEyebrow: $('#interactionEyebrow'),
    interactionDialogTitle: $('#interactionDialogTitle'),
    interactionDialogMessage: $('#interactionDialogMessage'),
    interactionDetails: $('#interactionDetails'),
    interactionInputGroup: $('#interactionInputGroup'),
    interactionInputLabel: $('#interactionInputLabel'),
    interactionInput: $('#interactionInput'),
    interactionInputError: $('#interactionInputError'),
    interactionCloseBtn: $('#interactionCloseBtn'),
    interactionCancelBtn: $('#interactionCancelBtn'),
    interactionConfirmBtn: $('#interactionConfirmBtn'),
    helpBtn: $('#helpBtn'),
    helpDialog: $('#helpDialog'),
    backupBtn: $('#backupBtn'),
    backupDialog: $('#backupDialog'),
    backupStatus: $('#backupStatus'),
    backupFileName: $('#backupFileName'),
    backupState: $('#backupState'),
    backupCompatibilityNote: $('#backupCompatibilityNote'),
    linkBackupBtn: $('#linkBackupBtn'),
    saveBackupNowBtn: $('#saveBackupNowBtn'),
    restoreLinkedBackupBtn: $('#restoreLinkedBackupBtn'),
    downloadBackupBtn: $('#downloadBackupBtn'),
    restoreBackupInput: $('#restoreBackupInput'),
    importBtn: $('#importBtn'),
    exportBtn: $('#exportBtn'),
    exportDialog: $('#exportDialog'),
    tableDialog: $('#tableDialog'),
    tableForm: $('#tableForm'),
    tableDialogTitle: $('#tableDialogTitle'),
    tableNameInput: $('#tableNameInput'),
    tableHeaderColorInput: $('#tableHeaderColorInput'),
    tableHeaderColorText: $('#tableHeaderColorText'),
    resetTableColorBtn: $('#resetTableColorBtn'),
    fieldsEditor: $('#fieldsEditor'),
    addFieldBtn: $('#addFieldBtn'),
    fieldEditorTemplate: $('#fieldEditorTemplate'),
    relationshipDialog: $('#relationshipDialog'),
    relationshipForm: $('#relationshipForm'),
    relationshipDialogTitle: $('#relationshipDialogTitle'),
    relationshipSummary: $('#relationshipSummary'),
    relationshipType: $('#relationshipType'),
    relationshipLabel: $('#relationshipLabel'),
    relationshipSubmitBtn: $('#relationshipSubmitBtn'),
    relationshipPickerDialog: $('#relationshipPickerDialog'),
    relationshipPickerList: $('#relationshipPickerList'),
    importDialog: $('#importDialog'),
    importForm: $('#importForm'),
    importStrategy: $('#importStrategy'),
    importText: $('#importText'),
    importHint: $('#importHint'),
    fileInput: $('#fileInput'),
    fileName: $('#fileName'),
    sqlDialog: $('#sqlDialog'),
    dialectSelect: $('#dialectSelect'),
    sqlOutput: $('#sqlOutput'),
    copySqlBtn: $('#copySqlBtn'),
    downloadSqlBtn: $('#downloadSqlBtn'),
    tableSqlDialog: $('#tableSqlDialog'),
    tableSqlForm: $('#tableSqlForm'),
    tableSqlTitle: $('#tableSqlTitle'),
    tableSqlInput: $('#tableSqlInput'),
    colorDialog: $('#colorDialog'),
    colorForm: $('#colorForm'),
    quickColorInput: $('#quickColorInput'),
    quickColorText: $('#quickColorText'),
    contextMenu: $('#contextMenu'),
    toastContainer: $('#toastContainer')
  };

  let projectWasLoadedFromStorage = false;
  let workspaceWasLoadedFromStorage = false;
  let workspace = loadWorkspace();
  let activeProjectId = workspace.activeProjectId;
  let project = getActiveProjectEntry().project;
  let selected = null;
  let editingTableId = null;
  let editingRelationshipId = null;
  let tableSqlEditingId = null;
  let quickColorTableId = null;
  let relationshipMode = false;
  let relationSource = null;
  let pendingRelationship = null;
  let importMode = 'json';
  let transform = { x: 110, y: 75, scale: 1 };
  let dragState = null;
  let panState = null;
  let spacePressed = false;
  let history = [];
  let future = [];
  let saveTimer = null;
  let backupFileHandle = null;
  let backupWriteTimer = null;
  let backupWriteInProgress = false;
  let backupWriteQueued = false;
  let backupRestoreRecommended = false;
  let interactionRequest = null;
  let interactionReturnFocus = null;

  const INTERACTION_VARIANTS = {
    info: { icon: 'i', eyebrow: 'Informação' },
    success: { icon: '✓', eyebrow: 'Concluído' },
    warning: { icon: '!', eyebrow: 'Atenção' },
    danger: { icon: '!', eyebrow: 'Ação irreversível' }
  };

  function clearInteractionError() {
    elements.interactionInputError.textContent = '';
    elements.interactionInputError.classList.add('hidden');
    elements.interactionInput.removeAttribute('aria-invalid');
  }

  function finishInteraction(value) {
    const request = interactionRequest;
    if (!request) return;
    interactionRequest = null;
    if (elements.interactionDialog.open) elements.interactionDialog.close();
    request.resolve(value);
    const target = interactionReturnFocus;
    interactionReturnFocus = null;
    if (target?.isConnected && typeof target.focus === 'function') {
      setTimeout(() => target.focus(), 0);
    }
  }

  function showInteractionDialog(options = {}) {
    if (interactionRequest) finishInteraction(null);

    const mode = ['alert', 'confirm', 'prompt'].includes(options.mode) ? options.mode : 'confirm';
    const variant = INTERACTION_VARIANTS[options.variant] ? options.variant : 'info';
    const variantConfig = INTERACTION_VARIANTS[variant];
    interactionReturnFocus = document.activeElement;

    elements.interactionDialog.dataset.mode = mode;
    elements.interactionDialog.dataset.variant = variant;
    elements.interactionIcon.textContent = options.icon || variantConfig.icon;
    elements.interactionEyebrow.textContent = options.eyebrow || variantConfig.eyebrow;
    elements.interactionDialogTitle.textContent = options.title || (mode === 'prompt' ? 'Informe um valor' : 'Confirmar ação');
    elements.interactionDialogMessage.textContent = options.message || '';

    const details = String(options.details || '').trim();
    elements.interactionDetails.textContent = details;
    elements.interactionDetails.classList.toggle('hidden', !details);

    const promptMode = mode === 'prompt';
    elements.interactionInputGroup.classList.toggle('hidden', !promptMode);
    elements.interactionInputLabel.textContent = options.inputLabel || 'Valor';
    elements.interactionInput.value = promptMode ? String(options.inputValue ?? '') : '';
    elements.interactionInput.placeholder = options.inputPlaceholder || '';
    elements.interactionInput.maxLength = Number.isFinite(Number(options.inputMaxLength)) ? Number(options.inputMaxLength) : 120;
    elements.interactionInput.dataset.required = options.inputRequired === false ? 'false' : 'true';
    clearInteractionError();

    elements.interactionCancelBtn.textContent = options.cancelText || 'Cancelar';
    elements.interactionConfirmBtn.textContent = options.confirmText || (mode === 'alert' ? 'Entendi' : 'Confirmar');
    elements.interactionConfirmBtn.className = `btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`;

    if (!elements.interactionDialog.open) elements.interactionDialog.showModal();

    setTimeout(() => {
      if (promptMode) {
        elements.interactionInput.focus();
        elements.interactionInput.select();
      } else {
        elements.interactionConfirmBtn.focus();
      }
    }, 0);

    return new Promise(resolve => {
      interactionRequest = { mode, resolve };
    });
  }

  function showAppConfirm(options) {
    return showInteractionDialog({ ...options, mode: 'confirm' });
  }

  function showAppPrompt(options) {
    return showInteractionDialog({ ...options, mode: 'prompt' });
  }

  function showAppAlert(options) {
    return showInteractionDialog({ ...options, mode: 'alert' });
  }

  function defaultProject(name = 'Novo projeto') {
    return {
      version: 3,
      name: String(name || 'Novo projeto').trim() || 'Novo projeto',
      tables: [],
      relationships: []
    };
  }

  function createWorkspaceEntry(projectInput, options = {}) {
    const now = new Date().toISOString();
    const normalized = normalizeProject(projectInput);
    return {
      id: options.id || uid('project'),
      createdAt: options.createdAt || now,
      updatedAt: options.updatedAt || now,
      project: normalized
    };
  }

  function normalizeWorkspace(input) {
    if (!input || !Array.isArray(input.projects)) throw new Error('Área de projetos inválida.');
    const projects = input.projects.map(item => {
      const projectInput = item?.project || item?.data || item;
      return createWorkspaceEntry(projectInput, {
        id: item?.id || uid('project'),
        createdAt: item?.createdAt,
        updatedAt: item?.updatedAt
      });
    });

    if (!projects.length) projects.push(createWorkspaceEntry(defaultProject('Meu projeto')));
    const activeProjectId = projects.some(item => item.id === input.activeProjectId)
      ? input.activeProjectId
      : projects[0].id;

    return { version: WORKSPACE_VERSION, activeProjectId, projects };
  }

  function loadWorkspace() {
    try {
      const rawWorkspace = localStorage.getItem(WORKSPACE_KEY);
      if (rawWorkspace) {
        workspaceWasLoadedFromStorage = true;
        projectWasLoadedFromStorage = true;
        return normalizeWorkspace(JSON.parse(rawWorkspace));
      }

      const legacyMdbWorkspace = localStorage.getItem(LEGACY_MDB_WORKSPACE_KEY);
      if (legacyMdbWorkspace) {
        workspaceWasLoadedFromStorage = false;
        projectWasLoadedFromStorage = true;
        return normalizeWorkspace(JSON.parse(legacyMdbWorkspace));
      }

      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const migratedProject = normalizeProject(JSON.parse(legacyRaw));
        const entry = createWorkspaceEntry(migratedProject);
        workspaceWasLoadedFromStorage = false;
        projectWasLoadedFromStorage = true;
        return { version: WORKSPACE_VERSION, activeProjectId: entry.id, projects: [entry] };
      }
    } catch (error) {
      console.warn('Falha ao carregar os projetos salvos:', error);
    }

    const entry = createWorkspaceEntry(defaultProject('Meu projeto'));
    workspaceWasLoadedFromStorage = false;
    projectWasLoadedFromStorage = false;
    return { version: WORKSPACE_VERSION, activeProjectId: entry.id, projects: [entry] };
  }

  function getProjectEntry(projectId) {
    return workspace.projects.find(item => item.id === projectId) || null;
  }

  function getActiveProjectEntry() {
    let entry = getProjectEntry(activeProjectId);
    if (!entry) {
      entry = workspace.projects[0] || createWorkspaceEntry(defaultProject('Meu projeto'));
      if (!workspace.projects.length) workspace.projects.push(entry);
      activeProjectId = entry.id;
      workspace.activeProjectId = entry.id;
    }
    return entry;
  }

  function persistWorkspaceNow(updateTimestamp = true) {
    const entry = getActiveProjectEntry();
    entry.project = project;
    if (updateTimestamp) entry.updatedAt = new Date().toISOString();
    workspace.activeProjectId = activeProjectId;
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
    // Espelhos para manter compatibilidade com versões anteriores do modelador.
    localStorage.setItem(LEGACY_MDB_WORKSPACE_KEY, JSON.stringify(workspace));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(project));
    workspaceWasLoadedFromStorage = true;
    projectWasLoadedFromStorage = true;
  }

  function normalizeProject(input) {
    if (!input || !Array.isArray(input.tables)) throw new Error('Projeto inválido: a propriedade tables é obrigatória.');
    const tables = input.tables.map((table, tableIndex) => ({
      id: table.id || uid('table'),
      name: cleanIdentifier(table.name || `TABELA_${tableIndex + 1}`).toUpperCase(),
      x: Number.isFinite(Number(table.x)) ? Number(table.x) : 180 + (tableIndex % 4) * 370,
      y: Number.isFinite(Number(table.y)) ? Number(table.y) : 160 + Math.floor(tableIndex / 4) * 300,
      headerColor: validHexColor(table.headerColor) ? table.headerColor.toUpperCase() : DEFAULT_HEADER_COLOR,
      fields: Array.isArray(table.fields) ? table.fields.map((field, fieldIndex) => ({
        id: field.id || uid('field'),
        name: cleanIdentifier(field.name || `CAMPO_${fieldIndex + 1}`).toUpperCase(),
        type: String(field.type || 'VARCHAR2(100)').trim().toUpperCase(),
        pk: Boolean(field.pk),
        nn: Boolean(field.nn || field.pk),
        uq: Boolean(field.uq || field.pk),
        defaultValue: String(field.defaultValue ?? field.default ?? '').trim(),
        enumValues: normalizeEnumValues(field.enumValues ?? field.enum ?? [])
      })) : []
    }));

    const tableIds = new Set(tables.map(table => table.id));
    const fieldIds = new Set(tables.flatMap(table => table.fields.map(field => field.id)));
    const relationships = Array.isArray(input.relationships) ? input.relationships
      .map(rel => ({
        id: rel.id || uid('rel'),
        fromTableId: rel.fromTableId,
        fromFieldId: rel.fromFieldId,
        toTableId: rel.toTableId,
        toFieldId: rel.toFieldId,
        type: ['1:N', '1:1', 'N:N'].includes(rel.type) ? rel.type : '1:N',
        label: String(rel.label || '').trim()
      }))
      .filter(rel => tableIds.has(rel.fromTableId) && tableIds.has(rel.toTableId) && fieldIds.has(rel.fromFieldId) && fieldIds.has(rel.toFieldId)) : [];

    return { version: 3, name: String(input.name || 'Meu diagrama'), tables, relationships };
  }

  function normalizeProjectTitle(value, fallback = 'Novo projeto') {
    const normalized = String(value || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    return normalized || fallback;
  }

  function uniqueProjectName(baseName, excludedId = null) {
    const base = normalizeProjectTitle(baseName);
    const used = new Set(workspace.projects
      .filter(item => item.id !== excludedId)
      .map(item => item.project.name.toLocaleLowerCase('pt-BR')));
    if (!used.has(base.toLocaleLowerCase('pt-BR'))) return base;
    let index = 2;
    while (used.has(`${base} ${index}`.toLocaleLowerCase('pt-BR'))) index += 1;
    return `${base} ${index}`;
  }

  function formatProjectDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'agora';
    return date.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function updateCurrentProjectUI() {
    const name = project.name || 'Projeto sem nome';
    if (elements.currentProjectName) elements.currentProjectName.textContent = name;
    document.title = `${name} — MBD - Studio`;
    if (elements.projectDialog?.open) renderProjectList();
  }

  function renderProjectList() {
    if (!elements.projectList) return;
    elements.projectCount.textContent = String(workspace.projects.length);
    const ordered = [...workspace.projects].sort((a, b) => {
      if (a.id === activeProjectId) return -1;
      if (b.id === activeProjectId) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    elements.projectList.innerHTML = ordered.map(entry => {
      const current = entry.id === activeProjectId;
      const tableCount = entry.project.tables.length;
      const relationshipCount = entry.project.relationships.length;
      return `
        <article class="project-list-item ${current ? 'active' : ''}" data-project-id="${escapeHtml(entry.id)}">
          <button type="button" class="project-open" data-project-action="open" data-project-id="${escapeHtml(entry.id)}">
            <span class="project-icon" aria-hidden="true">▦</span>
            <span class="project-info">
              <strong>${escapeHtml(entry.project.name)}</strong>
              <small>${tableCount} ${tableCount === 1 ? 'tabela' : 'tabelas'} · ${relationshipCount} ${relationshipCount === 1 ? 'relação' : 'relações'}</small>
              <small>Atualizado em ${escapeHtml(formatProjectDate(entry.updatedAt))}</small>
            </span>
            ${current ? '<span class="project-current-badge">Em uso</span>' : ''}
          </button>
          <div class="project-item-actions" aria-label="Ações do projeto">
            <button type="button" class="icon-btn" data-project-action="rename" data-project-id="${escapeHtml(entry.id)}" title="Renomear projeto" aria-label="Renomear projeto">✎</button>
            <button type="button" class="icon-btn" data-project-action="duplicate" data-project-id="${escapeHtml(entry.id)}" title="Duplicar projeto" aria-label="Duplicar projeto">⧉</button>
            <button type="button" class="icon-btn danger" data-project-action="delete" data-project-id="${escapeHtml(entry.id)}" title="Excluir projeto" aria-label="Excluir projeto">⌫</button>
          </div>
        </article>`;
    }).join('');
  }

  function resetEditorForProject() {
    selected = null;
    editingTableId = null;
    editingRelationshipId = null;
    tableSqlEditingId = null;
    quickColorTableId = null;
    pendingRelationship = null;
    relationSource = null;
    relationshipMode = false;
    history = [];
    future = [];
    elements.searchInput.value = '';
    transform = { x: 110, y: 75, scale: 1 };
    updateHistoryButtons();
    elements.modeStatus.textContent = 'Modo: seleção';
  }

  function switchProject(projectId, options = {}) {
    const entry = getProjectEntry(projectId);
    if (!entry) return;
    if (projectId === activeProjectId) {
      if (options.closeDialog !== false && elements.projectDialog.open) elements.projectDialog.close();
      return;
    }

    clearTimeout(saveTimer);
    clearTimeout(backupWriteTimer);
    try { persistWorkspaceNow(true); } catch (error) { console.warn(error); }

    activeProjectId = entry.id;
    workspace.activeProjectId = entry.id;
    project = entry.project;
    projectWasLoadedFromStorage = true;
    backupFileHandle = null;
    backupRestoreRecommended = false;
    resetEditorForProject();
    persistWorkspaceNow(false);
    updateBackupUI();
    render();
    restoreStoredBackupHandle(activeProjectId);

    if (options.closeDialog !== false && elements.projectDialog.open) elements.projectDialog.close();
    if (project.tables.length) setTimeout(fitDiagram, 0);
    if (!options.silent) showToast(`Projeto “${project.name}” aberto.`, 'success');
  }

  function createNewProject(nameValue) {
    const name = uniqueProjectName(nameValue || `Projeto ${workspace.projects.length + 1}`);
    clearTimeout(saveTimer);
    try { persistWorkspaceNow(true); } catch (error) { console.warn(error); }
    const entry = createWorkspaceEntry(defaultProject(name));
    workspace.projects.push(entry);
    activeProjectId = entry.id;
    workspace.activeProjectId = entry.id;
    project = entry.project;
    projectWasLoadedFromStorage = true;
    backupFileHandle = null;
    backupRestoreRecommended = false;
    resetEditorForProject();
    persistWorkspaceNow(false);
    updateBackupUI();
    render();
    elements.newProjectNameInput.value = '';
    elements.projectDialog.close();
    showToast(`Projeto “${name}” criado.`, 'success');
  }

  async function renameProject(projectId) {
    const entry = getProjectEntry(projectId);
    if (!entry) return;
    const value = await showAppPrompt({
      variant: 'info',
      title: 'Renomear projeto',
      message: 'Defina um novo nome para identificar este modelo.',
      inputLabel: 'Nome do projeto',
      inputValue: entry.project.name,
      inputPlaceholder: 'Ex.: Sistema comercial',
      inputMaxLength: 80,
      inputRequired: true,
      confirmText: 'Salvar nome'
    });
    if (value === null) return;
    const name = uniqueProjectName(normalizeProjectTitle(value, entry.project.name), projectId);
    entry.project.name = name;
    entry.updatedAt = new Date().toISOString();
    if (entry.id === activeProjectId) project.name = name;
    persistWorkspaceNow(entry.id === activeProjectId);
    updateCurrentProjectUI();
    renderProjectList();
    showToast('Projeto renomeado.', 'success');
  }

  function duplicateProject(projectId) {
    const source = getProjectEntry(projectId);
    if (!source) return;
    const cloned = normalizeProject(JSON.parse(JSON.stringify(source.project)));
    cloned.name = uniqueProjectName(`${source.project.name} — Cópia`);
    const entry = createWorkspaceEntry(cloned);
    workspace.projects.push(entry);
    persistWorkspaceNow(true);
    renderProjectList();
    switchProject(entry.id);
  }

  async function removeStoredBackupHandle(projectId) {
    try {
      const db = await openBackupDatabase();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(BACKUP_STORE_NAME, 'readwrite');
        tx.objectStore(BACKUP_STORE_NAME).delete(getBackupHandleKey(projectId));
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('Não foi possível remover o vínculo do backup.'));
      });
      db.close();
    } catch (error) {
      console.warn(error);
    }
  }

  async function deleteProject(projectId) {
    const entry = getProjectEntry(projectId);
    if (!entry) return;
    if (workspace.projects.length <= 1) {
      showToast('Mantenha pelo menos um projeto. Crie outro antes de excluir este.', 'error');
      return;
    }
    const confirmed = await showAppConfirm({
      variant: 'danger',
      title: 'Excluir projeto',
      message: `Deseja excluir o projeto “${entry.project.name}”?`,
      details: 'As tabelas, os relacionamentos e o histórico deste projeto serão removidos do navegador. Essa ação não pode ser desfeita.',
      confirmText: 'Excluir projeto',
      cancelText: 'Manter projeto'
    });
    if (!confirmed) return;

    const wasActive = projectId === activeProjectId;
    workspace.projects = workspace.projects.filter(item => item.id !== projectId);
    removeStoredBackupHandle(projectId);

    if (wasActive) {
      const next = workspace.projects[0];
      activeProjectId = next.id;
      workspace.activeProjectId = next.id;
      project = next.project;
      backupFileHandle = null;
      backupRestoreRecommended = false;
      resetEditorForProject();
      persistWorkspaceNow(false);
      updateBackupUI();
      render();
      restoreStoredBackupHandle(activeProjectId);
      if (project.tables.length) setTimeout(fitDiagram, 0);
    } else {
      persistWorkspaceNow(true);
      renderProjectList();
    }
    showToast('Projeto excluído.', 'success');
  }

  async function handleProjectAction(action, projectId) {
    if (action === 'open') switchProject(projectId);
    if (action === 'rename') await renameProject(projectId);
    if (action === 'duplicate') duplicateProject(projectId);
    if (action === 'delete') await deleteProject(projectId);
  }

  function normalizeEnumValues(value) {
    if (Array.isArray(value)) return value.map(item => unquoteSqlValue(String(item).trim())).filter(Boolean);
    return splitEnumList(String(value || '')).map(unquoteSqlValue).filter(Boolean);
  }

  function snapshot() {
    return JSON.stringify(project);
  }

  function pushHistory() {
    history.push(snapshot());
    if (history.length > 80) history.shift();
    future = [];
    updateHistoryButtons();
  }

  function undo() {
    if (!history.length) return;
    future.push(snapshot());
    project = normalizeProject(JSON.parse(history.pop()));
    selected = null;
    cancelRelationshipMode();
    render();
    scheduleSave();
    updateHistoryButtons();
  }

  function redo() {
    if (!future.length) return;
    history.push(snapshot());
    project = normalizeProject(JSON.parse(future.pop()));
    selected = null;
    cancelRelationshipMode();
    render();
    scheduleSave();
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    elements.undoBtn.disabled = history.length === 0;
    elements.redoBtn.disabled = future.length === 0;
  }

  function scheduleSave() {
    elements.saveStatus.textContent = 'Salvando…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        persistWorkspaceNow(true);
        elements.saveStatus.textContent = 'Salvo automaticamente';
        scheduleTxtBackup();
      } catch (error) {
        elements.saveStatus.textContent = 'Falha ao salvar';
        console.warn(error);
      }
    }, 220);
  }

  function serializeTxtBackup() {
    return JSON.stringify({
      format: TXT_BACKUP_FORMAT,
      savedAt: new Date().toISOString(),
      project
    }, null, 2);
  }

  function parseProjectText(content) {
    const parsed = JSON.parse(String(content || '').replace(/^\uFEFF/, '').trim());
    if ([TXT_BACKUP_FORMAT, LEGACY_MDB_TXT_BACKUP_FORMAT, LEGACY_TXT_BACKUP_FORMAT].includes(parsed?.format) && parsed.project) return normalizeProject(parsed.project);
    if (parsed?.project && Array.isArray(parsed.project.tables)) return normalizeProject(parsed.project);
    return normalizeProject(parsed);
  }

  function formatBackupTime(date = new Date()) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function updateBackupUI(message = '') {
    const directAccessSupported = typeof window.showSaveFilePicker === 'function';
    const linked = Boolean(backupFileHandle);
    elements.backupFileName.textContent = linked ? backupFileHandle.name : 'Nenhum arquivo vinculado';
    elements.linkBackupBtn.querySelector('strong').textContent = linked ? 'Trocar arquivo TXT' : 'Vincular arquivo TXT';
    elements.saveBackupNowBtn.disabled = !linked;
    elements.restoreLinkedBackupBtn.disabled = !linked;
    elements.backupState.textContent = message || (linked
      ? 'As alterações serão gravadas automaticamente no arquivo externo.'
      : directAccessSupported
        ? 'Vincule um arquivo para salvar automaticamente cada alteração concluída.'
        : 'Este navegador permite baixar e restaurar TXT, mas não oferece gravação automática direta.');
    elements.backupStatus.textContent = linked ? `Backup TXT: ${backupFileHandle.name}` : 'Backup TXT não vinculado';
    elements.backupCompatibilityNote.textContent = directAccessSupported
      ? 'O arquivo externo permanece no computador mesmo após a limpeza do cache. Caso o navegador esqueça o vínculo, selecione o mesmo TXT em “Restaurar outro backup”.'
      : 'A gravação automática direta não está disponível neste navegador ou contexto. Use “Baixar cópia TXT” periodicamente e restaure o arquivo quando necessário.';
  }

  function openBackupDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('IndexedDB indisponível.'));
      const request = indexedDB.open(BACKUP_DB_NAME, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(BACKUP_STORE_NAME)) {
          request.result.createObjectStore(BACKUP_STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Não foi possível abrir o armazenamento do vínculo.'));
    });
  }

  function getBackupHandleKey(projectId = activeProjectId) {
    return `${BACKUP_HANDLE_KEY}:${projectId}`;
  }

  async function storeBackupHandle(handle, projectId = activeProjectId) {
    const db = await openBackupDatabase();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(BACKUP_STORE_NAME, 'readwrite');
      const store = tx.objectStore(BACKUP_STORE_NAME);
      store.put(handle, getBackupHandleKey(projectId));
      store.put(handle, BACKUP_HANDLE_KEY); // último vínculo, usado como recuperação de compatibilidade
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Não foi possível memorizar o arquivo vinculado.'));
    });
    db.close();
  }

  async function readStoredBackupHandle(projectId = activeProjectId) {
    const db = await openBackupDatabase();
    const handle = await new Promise((resolve, reject) => {
      const tx = db.transaction(BACKUP_STORE_NAME, 'readonly');
      const store = tx.objectStore(BACKUP_STORE_NAME);
      const request = store.get(getBackupHandleKey(projectId));
      request.onsuccess = () => {
        if (request.result) return resolve(request.result);
        if (workspace.projects.length === 1) {
          const legacyRequest = store.get(BACKUP_HANDLE_KEY);
          legacyRequest.onsuccess = () => resolve(legacyRequest.result || null);
          legacyRequest.onerror = () => reject(legacyRequest.error || new Error('Não foi possível recuperar o arquivo vinculado.'));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error || new Error('Não foi possível recuperar o arquivo vinculado.'));
    });
    db.close();
    return handle;
  }

  async function hasBackupPermission(handle, requestPermission = false) {
    if (!handle?.queryPermission) return false;
    try {
      const options = { mode: 'readwrite' };
      if (await handle.queryPermission(options) === 'granted') return true;
      if (requestPermission && handle.requestPermission && await handle.requestPermission(options) === 'granted') return true;
      return false;
    } catch (error) {
      console.warn('Não foi possível verificar a permissão do backup:', error);
      return false;
    }
  }

  async function restoreStoredBackupHandle(projectId = activeProjectId) {
    const requestedProjectId = projectId;
    try {
      const storedHandle = await readStoredBackupHandle(requestedProjectId);
      if (requestedProjectId !== activeProjectId) return;
      if (!storedHandle) return updateBackupUI();
      backupFileHandle = storedHandle;
      const allowed = await hasBackupPermission(storedHandle, false);
      if (!allowed) {
        updateBackupUI('Arquivo lembrado. Clique em “Salvar agora” para renovar a permissão de gravação.');
      } else if (!projectWasLoadedFromStorage) {
        backupRestoreRecommended = true;
        updateBackupUI('Backup encontrado e o armazenamento local está vazio. Restaure o TXT antes de continuar editando.');
        showToast('Backup TXT encontrado. Abra “Backup TXT” para restaurar o diagrama.', 'success');
      } else {
        updateBackupUI();
      }
    } catch (error) {
      console.warn('Não foi possível recuperar o vínculo do backup:', error);
      updateBackupUI();
    }
  }

  async function linkBackupFile() {
    if (typeof window.showSaveFilePicker !== 'function') {
      downloadTxtBackup();
      showToast('Gravação direta indisponível. Uma cópia TXT foi baixada.', 'success');
      return;
    }
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: `${safeFileName(project.name)}-backup.txt`,
        types: [{
          description: 'Backup TXT do MBD - Studio',
          accept: { 'text/plain': ['.txt'] }
        }]
      });
      backupFileHandle = handle;
      backupRestoreRecommended = false;
      await storeBackupHandle(handle, activeProjectId).catch(error => console.warn(error));
      await writeTxtBackup(true, true, true);
    } catch (error) {
      if (error?.name === 'SecurityError') {
        downloadTxtBackup();
        showToast('A gravação automática exige localhost ou HTTPS. Uma cópia TXT foi baixada.', 'success');
      } else if (error?.name !== 'AbortError') {
        console.warn(error);
        showToast('Não foi possível vincular o arquivo TXT.', 'error');
      }
    }
  }

  function scheduleTxtBackup() {
    if (!backupFileHandle) return;
    clearTimeout(backupWriteTimer);
    backupWriteTimer = setTimeout(() => writeTxtBackup(false, false), 260);
  }

  async function writeTxtBackup(showFeedback = false, requestPermission = false, allowOverwritePrompt = false) {
    if (!backupFileHandle) return false;
    if (backupRestoreRecommended) {
      if (!allowOverwritePrompt) {
        updateBackupUI('Restaure o backup encontrado antes de permitir novas gravações automáticas.');
        elements.backupStatus.textContent = 'Backup TXT aguardando restauração';
        return false;
      }
      const overwrite = await showAppConfirm({
        variant: 'warning',
        title: 'Sobrescrever backup existente?',
        message: 'O armazenamento local está vazio, mas o arquivo TXT vinculado pode conter um diagrama anterior.',
        details: 'Ao continuar, o conteúdo atual do TXT será substituído pelo projeto vazio ou recém-criado que está aberto agora.',
        confirmText: 'Sobrescrever TXT',
        cancelText: 'Voltar e restaurar'
      });
      if (!overwrite) return false;
      backupRestoreRecommended = false;
    }
    if (backupWriteInProgress) {
      backupWriteQueued = true;
      return false;
    }
    const allowed = await hasBackupPermission(backupFileHandle, requestPermission);
    if (!allowed) {
      updateBackupUI('Permissão de gravação necessária. Clique em “Salvar agora” para reconectar.');
      elements.backupStatus.textContent = 'Backup TXT: reconexão necessária';
      return false;
    }
    backupWriteInProgress = true;
    const handle = backupFileHandle;
    const backupContent = serializeTxtBackup();
    elements.backupStatus.textContent = 'Salvando backup TXT…';
    try {
      const writable = await handle.createWritable();
      await writable.write(backupContent);
      await writable.close();
      const status = `TXT atualizado às ${formatBackupTime()}`;
      updateBackupUI(status);
      elements.backupStatus.textContent = status;
      if (showFeedback) showToast('Backup TXT atualizado.', 'success');
      return true;
    } catch (error) {
      console.warn('Falha ao gravar backup TXT:', error);
      updateBackupUI('Não foi possível gravar o arquivo. Verifique a permissão ou vincule outro TXT.');
      elements.backupStatus.textContent = 'Falha no backup TXT';
      if (showFeedback) showToast('Falha ao salvar o backup TXT.', 'error');
      return false;
    } finally {
      backupWriteInProgress = false;
      if (backupWriteQueued) {
        backupWriteQueued = false;
        setTimeout(() => writeTxtBackup(false, false), 0);
      }
    }
  }

  function downloadTxtBackup() {
    downloadText(`${safeFileName(project.name)}-backup.txt`, serializeTxtBackup(), 'text/plain;charset=utf-8');
  }

  async function restoreProjectFromText(content, sourceName = 'backup TXT') {
    const imported = parseProjectText(content);
    const confirmed = await showAppConfirm({
      variant: 'warning',
      title: 'Restaurar diagrama',
      message: `Deseja restaurar “${sourceName}”?`,
      details: 'O conteúdo do projeto atual será substituído pelas tabelas e relacionamentos encontrados no arquivo.',
      confirmText: 'Restaurar arquivo',
      cancelText: 'Cancelar'
    });
    if (!confirmed) return false;
    pushHistory();
    project = imported;
    backupRestoreRecommended = false;
    selected = null;
    cancelRelationshipMode();
    render();
    scheduleSave();
    showToast('Diagrama restaurado com sucesso.', 'success');
    return true;
  }

  async function restoreLinkedBackup() {
    if (!backupFileHandle) return;
    try {
      const allowed = await hasBackupPermission(backupFileHandle, true);
      if (!allowed) return showToast('Permissão para ler o backup não concedida.', 'error');
      const file = await backupFileHandle.getFile();
      await restoreProjectFromText(await file.text(), file.name);
      updateBackupUI();
    } catch (error) {
      console.warn(error);
      showToast('Não foi possível restaurar o arquivo vinculado.', 'error');
    }
  }

  function render() {
    updateCurrentProjectUI();
    renderTables();
    renderRelationships();
    renderSidebar();
    elements.emptyState.classList.toggle('hidden', project.tables.length > 0);
    applyTransform();
    updateSelectionUI();
  }

  function getHighlightState() {
    const activeRelationshipIds = new Set();
    const selectedFields = new Set();
    const relatedFields = new Set();

    if (selected?.type === 'field') {
      const key = `${selected.tableId}:${selected.fieldId}`;
      selectedFields.add(key);
      project.relationships.forEach(rel => {
        const fromKey = `${rel.fromTableId}:${rel.fromFieldId}`;
        const toKey = `${rel.toTableId}:${rel.toFieldId}`;
        if (fromKey === key || toKey === key) {
          activeRelationshipIds.add(rel.id);
          relatedFields.add(fromKey === key ? toKey : fromKey);
        }
      });
    }

    if (selected?.type === 'relationship') {
      const rel = getRelationship(selected.id);
      if (rel) {
        activeRelationshipIds.add(rel.id);
        selectedFields.add(`${rel.fromTableId}:${rel.fromFieldId}`);
        relatedFields.add(`${rel.toTableId}:${rel.toFieldId}`);
      }
    }

    return { activeRelationshipIds, selectedFields, relatedFields };
  }

  function renderTables() {
    elements.nodesLayer.innerHTML = '';
    const query = elements.searchInput.value.trim().toLowerCase();
    const highlights = getHighlightState();

    project.tables.forEach(table => {
      const tableMatches = !query || tableMatchesQuery(table, query);
      const node = document.createElement('article');
      node.className = 'table-node';
      node.dataset.tableId = table.id;
      node.style.left = `${table.x}px`;
      node.style.top = `${table.y}px`;
      if (selected?.type === 'table' && selected.id === table.id) node.classList.add('selected');
      if (query && tableMatches) node.classList.add('search-match');
      if (query && !tableMatches) node.classList.add('search-dim');

      const fieldsHtml = table.fields.length ? table.fields.map(field => {
        const fieldKey = `${table.id}:${field.id}`;
        const classes = [
          'field-row',
          highlights.selectedFields.has(fieldKey) ? 'selected-field' : '',
          highlights.relatedFields.has(fieldKey) ? 'related-field' : '',
          relationSource?.tableId === table.id && relationSource?.fieldId === field.id ? 'relation-source' : ''
        ].filter(Boolean).join(' ');
        const flags = [field.nn ? 'NN' : '', field.uq ? 'UQ' : ''].filter(Boolean).join(' · ');
        const tooltip = buildFieldTooltip(field);
        return `
          <div class="${classes}" data-field-id="${escapeHtml(field.id)}">
            <span class="field-key ${field.pk ? 'pk' : ''}">${field.pk ? 'PK' : '•'}</span>
            <span class="field-name-wrap">
              <span class="field-name">${escapeHtml(field.name)}</span>
              ${field.enumValues.length ? '<span class="field-enum-badge">ENUM</span>' : ''}
              ${field.defaultValue ? '<span class="field-default-badge">DEFAULT</span>' : ''}
              ${flags ? `<span class="field-flags">${flags}</span>` : ''}
            </span>
            <span class="field-type">${escapeHtml(field.type)}</span>
            ${tooltip}
          </div>`;
      }).join('') : '<div class="no-fields">Nenhum campo cadastrado</div>';

      node.innerHTML = `
        <header class="table-header" style="background:${escapeHtml(table.headerColor)}">
          <div class="table-title"><span class="table-icon">▦</span><strong>${escapeHtml(table.name)}</strong></div>
          <button class="table-menu-btn" type="button" aria-label="Menu da tabela">⋮</button>
        </header>
        <div class="table-fields">${fieldsHtml}</div>`;

      bindTableEvents(node, table);
      elements.nodesLayer.appendChild(node);
    });
  }

  function buildFieldTooltip(field) {
    if (!field.enumValues.length && !field.defaultValue) return '';
    const parts = [];
    if (field.enumValues.length) parts.push(`<strong>Valores permitidos</strong><code>${escapeHtml(field.enumValues.map(sqlQuote).join(', '))}</code>`);
    if (field.defaultValue) parts.push(`<strong style="margin-top:7px">Valor padrão</strong><code>${escapeHtml(field.defaultValue)}</code>`);
    return `<span class="field-tooltip">${parts.join('')}</span>`;
  }

  function bindTableEvents(node, table) {
    const header = $('.table-header', node);
    const menuButton = $('.table-menu-btn', node);

    node.addEventListener('mousedown', event => {
      if (event.button !== 0 || spacePressed || event.target.closest('.field-row') || event.target.closest('button')) return;
      event.stopPropagation();
      selectItem({ type: 'table', id: table.id });
    });

    node.addEventListener('dblclick', event => {
      if (!event.target.closest('.field-row') && !event.target.closest('button')) openTableDialog(table.id);
    });

    node.addEventListener('contextmenu', event => {
      event.preventDefault();
      event.stopPropagation();
      selectItem({ type: 'table', id: table.id }, false);
      openContextMenu(event.clientX, event.clientY);
    });

    menuButton.addEventListener('click', event => {
      event.stopPropagation();
      selectItem({ type: 'table', id: table.id }, false);
      const rect = menuButton.getBoundingClientRect();
      openContextMenu(rect.left, rect.bottom + 5);
    });

    header.addEventListener('mousedown', event => {
      if (event.button !== 0 || relationshipMode || spacePressed || event.target.closest('button')) return;
      event.preventDefault();
      event.stopPropagation();
      selectItem({ type: 'table', id: table.id }, false);
      dragState = {
        tableId: table.id,
        startX: event.clientX,
        startY: event.clientY,
        originX: table.x,
        originY: table.y,
        before: snapshot(),
        moved: false
      };
    });

    $$('.field-row', node).forEach(row => {
      row.addEventListener('mousedown', event => event.stopPropagation());
      row.addEventListener('click', event => {
        event.stopPropagation();
        if (relationshipMode) {
          handleFieldForRelationship(table.id, row.dataset.fieldId);
          return;
        }
        selectItem({ type: 'field', tableId: table.id, fieldId: row.dataset.fieldId });
      });
    });
  }

  function renderRelationships() {
    elements.connections.innerHTML = `
      <defs>
        <marker id="relationshipArrow" viewBox="0 0 10 10" refX="8.8" refY="5" markerWidth="8" markerHeight="8" orient="auto" markerUnits="userSpaceOnUse">
          <path class="relationship-arrow" d="M 0 0 L 10 5 L 0 10 z"></path>
        </marker>
        <marker id="activeArrow" viewBox="0 0 10 10" refX="8.8" refY="5" markerWidth="9" markerHeight="9" orient="auto" markerUnits="userSpaceOnUse">
          <path class="relationship-arrow-active" d="M 0 0 L 10 5 L 0 10 z"></path>
        </marker>
      </defs>`;
    const highlights = getHighlightState();

    project.relationships.forEach((rel, index) => {
      const pathInfo = getRelationshipPath(rel, index);
      if (!pathInfo) return;
      const active = highlights.activeRelationshipIds.has(rel.id);
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', `relationship-group${active ? ' is-active' : ''}`);
      group.dataset.relationshipId = rel.id;

      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hit.setAttribute('d', pathInfo.path);
      hit.setAttribute('class', 'relationship-hit');
      hit.addEventListener('click', event => {
        event.stopPropagation();
        selectItem({ type: 'relationship', id: rel.id });
      });
      hit.addEventListener('dblclick', event => {
        event.stopPropagation();
        openRelationshipEditor(rel.id);
      });

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute('d', pathInfo.path);
      line.setAttribute('class', 'relationship-line');
      line.setAttribute('marker-end', active ? 'url(#activeArrow)' : 'url(#relationshipArrow)');

      const cardinalities = cardinalityLabels(rel.type);
      const fromText = makeSvgText(pathInfo.fromLabelX, pathInfo.fromLabelY, cardinalities.from, 'relationship-cardinality');
      const toText = makeSvgText(pathInfo.toLabelX, pathInfo.toLabelY, cardinalities.to, 'relationship-cardinality');
      fromText.setAttribute('text-anchor', pathInfo.fromAnchor);
      toText.setAttribute('text-anchor', pathInfo.toAnchor);
      group.append(hit, line, fromText, toText);

      if (rel.label) {
        const label = makeSvgText(pathInfo.midX, pathInfo.midY - 11, rel.label, 'relationship-label');
        label.setAttribute('text-anchor', 'middle');
        group.appendChild(label);
      }
      elements.connections.appendChild(group);
    });
  }

  function makeSvgText(x, y, text, className) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    element.setAttribute('x', String(x));
    element.setAttribute('y', String(y));
    element.setAttribute('class', className);
    element.textContent = text;
    return element;
  }

  function cleanOrthogonalPoints(points) {
    const compact = [];
    points.forEach(point => {
      const normalized = [Number(point[0]), Number(point[1])];
      const previous = compact[compact.length - 1];
      if (!previous || previous[0] !== normalized[0] || previous[1] !== normalized[1]) compact.push(normalized);
    });

    let changed = true;
    while (changed && compact.length > 2) {
      changed = false;
      for (let index = 1; index < compact.length - 1; index += 1) {
        const previous = compact[index - 1];
        const current = compact[index];
        const next = compact[index + 1];
        const vertical = previous[0] === current[0] && current[0] === next[0];
        const horizontal = previous[1] === current[1] && current[1] === next[1];
        if (vertical || horizontal) {
          compact.splice(index, 1);
          changed = true;
          break;
        }
      }
    }
    return compact;
  }

  function roundedOrthogonalPath(points, radius = 12) {
    const clean = cleanOrthogonalPoints(points);
    if (clean.length < 2) return '';
    let path = `M ${clean[0][0]} ${clean[0][1]}`;

    for (let index = 1; index < clean.length - 1; index += 1) {
      const previous = clean[index - 1];
      const current = clean[index];
      const next = clean[index + 1];
      const incomingX = current[0] - previous[0];
      const incomingY = current[1] - previous[1];
      const outgoingX = next[0] - current[0];
      const outgoingY = next[1] - current[1];
      const incomingLength = Math.hypot(incomingX, incomingY);
      const outgoingLength = Math.hypot(outgoingX, outgoingY);
      if (!incomingLength || !outgoingLength) continue;
      const cornerRadius = Math.min(radius, incomingLength / 2, outgoingLength / 2);
      const before = [
        current[0] - (incomingX / incomingLength) * cornerRadius,
        current[1] - (incomingY / incomingLength) * cornerRadius
      ];
      const after = [
        current[0] + (outgoingX / outgoingLength) * cornerRadius,
        current[1] + (outgoingY / outgoingLength) * cornerRadius
      ];
      path += ` L ${before[0]} ${before[1]} Q ${current[0]} ${current[1]} ${after[0]} ${after[1]}`;
    }

    const last = clean[clean.length - 1];
    return `${path} L ${last[0]} ${last[1]}`;
  }

  function relationshipParallelOffset(rel) {
    const peers = project.relationships.filter(item => {
      const sameDirection = item.fromTableId === rel.fromTableId && item.toTableId === rel.toTableId;
      const reverseDirection = item.fromTableId === rel.toTableId && item.toTableId === rel.fromTableId;
      return sameDirection || reverseDirection;
    });
    const peerIndex = Math.max(0, peers.findIndex(item => item.id === rel.id));
    return (peerIndex - (peers.length - 1) / 2) * 18;
  }

  function getRelationshipPath(rel, relationshipIndex = 0) {
    const fromTable = getTable(rel.fromTableId);
    const toTable = getTable(rel.toTableId);
    if (!fromTable || !toTable) return null;

    const fromIndex = Math.max(0, fromTable.fields.findIndex(field => field.id === rel.fromFieldId));
    const toIndex = Math.max(0, toTable.fields.findIndex(field => field.id === rel.toFieldId));
    const fromY = fromTable.y + HEADER_HEIGHT + 4 + fromIndex * FIELD_HEIGHT + FIELD_HEIGHT / 2;
    const toY = toTable.y + HEADER_HEIGHT + 4 + toIndex * FIELD_HEIGHT + FIELD_HEIGHT / 2;
    const parallelOffset = relationshipParallelOffset(rel);
    const minimumHorizontalGap = 54;
    const separatedToRight = fromTable.x + TABLE_WIDTH + minimumHorizontalGap <= toTable.x;
    const separatedToLeft = toTable.x + TABLE_WIDTH + minimumHorizontalGap <= fromTable.x;

    let fromX;
    let toX;
    let laneX;
    let fromSide;
    let toSide;

    if (separatedToRight) {
      fromX = fromTable.x + TABLE_WIDTH;
      toX = toTable.x;
      laneX = (fromX + toX) / 2 + parallelOffset;
      fromSide = 1;
      toSide = -1;
    } else if (separatedToLeft) {
      fromX = fromTable.x;
      toX = toTable.x + TABLE_WIDTH;
      laneX = (fromX + toX) / 2 + parallelOffset;
      fromSide = -1;
      toSide = 1;
    } else {
      const routeRight = relationshipIndex % 2 === 0;
      if (routeRight) {
        fromX = fromTable.x + TABLE_WIDTH;
        toX = toTable.x + TABLE_WIDTH;
        laneX = Math.max(fromTable.x + TABLE_WIDTH, toTable.x + TABLE_WIDTH) + 84 + Math.abs(parallelOffset);
        fromSide = 1;
        toSide = 1;
      } else {
        fromX = fromTable.x;
        toX = toTable.x;
        laneX = Math.min(fromTable.x, toTable.x) - 84 - Math.abs(parallelOffset);
        fromSide = -1;
        toSide = -1;
      }
    }

    const points = [[fromX, fromY], [laneX, fromY], [laneX, toY], [toX, toY]];
    const path = roundedOrthogonalPath(points, 12);
    return {
      path,
      fromLabelX: fromX + fromSide * 14,
      fromLabelY: fromY - 9,
      toLabelX: toX + toSide * 14,
      toLabelY: toY - 9,
      fromAnchor: fromSide > 0 ? 'start' : 'end',
      toAnchor: toSide > 0 ? 'start' : 'end',
      midX: laneX,
      midY: (fromY + toY) / 2
    };
  }

  function cardinalityLabels(type) {
    if (type === '1:1') return { from: '1', to: '1' };
    if (type === 'N:N') return { from: 'N', to: 'N' };
    return { from: 'N', to: '1' };
  }

  function renderSidebar() {
    const query = elements.searchInput.value.trim().toLowerCase();
    const tables = project.tables.filter(table => !query || tableMatchesQuery(table, query));
    elements.tableCount.textContent = String(project.tables.length);
    elements.tableList.innerHTML = tables.map(table => `
      <button class="table-list-item ${selected?.type === 'table' && selected.id === table.id ? 'active' : ''}" data-table-id="${escapeHtml(table.id)}">
        <span>${escapeHtml(table.name)}</span><small>${table.fields.length}</small>
      </button>`).join('');

    $$('.table-list-item', elements.tableList).forEach(button => {
      button.addEventListener('click', () => {
        const table = getTable(button.dataset.tableId);
        if (!table) return;
        selectItem({ type: 'table', id: table.id });
        centerOnTable(table);
      });

      button.addEventListener('dblclick', event => {
        event.preventDefault();
        const table = getTable(button.dataset.tableId);
        if (!table) return;
        selectItem({ type: 'table', id: table.id });
        centerOnTable(table);
        openTableSqlDialog(table.id);
      });
    });
  }

  function tableMatchesQuery(table, query) {
    return table.name.toLowerCase().includes(query) || table.fields.some(field => {
      const haystack = `${field.name} ${field.type} ${field.defaultValue} ${field.enumValues.join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  function updateSelectionUI() {
    elements.deleteBtn.disabled = !selected;
    elements.relationshipBtn.classList.toggle('btn-primary', relationshipMode);
    if (relationshipMode && relationSource) {
      const table = getTable(relationSource.tableId);
      const field = getField(relationSource.tableId, relationSource.fieldId);
      elements.modeStatus.textContent = `Relacionamento: ${table?.name}.${field?.name} → selecione o destino`;
    } else if (relationshipMode) {
      elements.modeStatus.textContent = 'Relacionamento: selecione o campo de chave estrangeira';
    } else {
      elements.modeStatus.textContent = 'Modo: seleção';
    }
  }

  function selectItem(item, shouldRender = true) {
    selected = item;
    closeContextMenu();
    if (shouldRender) render();
  }

  function deselect() {
    selected = null;
    closeContextMenu();
    render();
  }

  function addFieldEditor(field = {}) {
    const fragment = elements.fieldEditorTemplate.content.cloneNode(true);
    const row = $('.field-editor-row', fragment);
    row.dataset.fieldId = field.id || uid('field');
    $('.field-name', row).value = field.name || '';
    $('.field-type', row).value = field.type || 'VARCHAR2(100)';
    $('.field-default', row).value = field.defaultValue || '';
    $('.field-enum', row).value = (field.enumValues || []).map(value => value.includes(',') || value.includes(' ') ? sqlQuote(value) : value).join(', ');
    $('.field-pk', row).checked = Boolean(field.pk);
    $('.field-nn', row).checked = field.nn !== false;
    $('.field-uq', row).checked = Boolean(field.uq);
    $('.remove-field', row).addEventListener('click', () => row.remove());
    $('.field-pk', row).addEventListener('change', event => {
      if (event.target.checked) {
        $('.field-nn', row).checked = true;
        $('.field-uq', row).checked = true;
      }
    });
    elements.fieldsEditor.appendChild(fragment);
  }

  function openTableDialog(tableId = null) {
    editingTableId = tableId;
    elements.fieldsEditor.innerHTML = '';
    const table = tableId ? getTable(tableId) : null;
    elements.tableDialogTitle.textContent = table ? 'Editar tabela' : 'Nova tabela';
    elements.tableNameInput.value = table?.name || '';
    setTableColorControls(table?.headerColor || DEFAULT_HEADER_COLOR);
    (table?.fields?.length ? table.fields : [fieldModel(uid('field'), 'ID', 'NUMBER', true, true, true)]).forEach(addFieldEditor);
    elements.tableDialog.showModal();
    setTimeout(() => elements.tableNameInput.focus(), 30);
  }

  function saveTableFromDialog() {
    const name = cleanIdentifier(elements.tableNameInput.value).toUpperCase();
    if (!name) return showToast('Informe o nome da tabela.', 'error');
    const fields = $$('.field-editor-row', elements.fieldsEditor).map(row => ({
      id: row.dataset.fieldId || uid('field'),
      name: cleanIdentifier($('.field-name', row).value).toUpperCase(),
      type: $('.field-type', row).value.trim().toUpperCase(),
      pk: $('.field-pk', row).checked,
      nn: $('.field-nn', row).checked || $('.field-pk', row).checked,
      uq: $('.field-uq', row).checked || $('.field-pk', row).checked,
      defaultValue: $('.field-default', row).value.trim().replace(/^DEFAULT\s+/i, ''),
      enumValues: splitEnumList($('.field-enum', row).value).map(unquoteSqlValue).filter(Boolean)
    })).filter(field => field.name && field.type);

    if (!fields.length) return showToast('Adicione pelo menos um campo válido.', 'error');
    if (new Set(fields.map(field => field.name)).size !== fields.length) return showToast('Existem campos com nomes repetidos.', 'error');
    if (project.tables.some(table => table.name === name && table.id !== editingTableId)) return showToast('Já existe uma tabela com esse nome.', 'error');

    const headerColor = validHexColor(elements.tableHeaderColorText.value) ? elements.tableHeaderColorText.value.toUpperCase() : DEFAULT_HEADER_COLOR;
    pushHistory();

    if (editingTableId) {
      const table = getTable(editingTableId);
      const removedIds = new Set(table.fields.filter(oldField => !fields.some(field => field.id === oldField.id)).map(field => field.id));
      table.name = name;
      table.headerColor = headerColor;
      table.fields = fields;
      resolveTableOverlap(table);
      project.relationships = project.relationships.filter(rel => !removedIds.has(rel.fromFieldId) && !removedIds.has(rel.toFieldId));
      showToast('Tabela atualizada.', 'success');
    } else {
      const center = screenToWorld(elements.canvas.clientWidth / 2, elements.canvas.clientHeight / 2);
      const newTable = {
        id: uid('table'),
        name,
        x: clamp(center.x - TABLE_WIDTH / 2, 20, WORLD_WIDTH - TABLE_WIDTH - 20),
        y: clamp(center.y - 100, 20, WORLD_HEIGHT - 300),
        headerColor,
        fields
      };
      project.tables.push(newTable);
      resolveTableOverlap(newTable);
      showToast('Tabela criada.', 'success');
    }

    elements.tableDialog.close();
    render();
    scheduleSave();
  }

  function setTableColorControls(color) {
    const safe = validHexColor(color) ? color.toUpperCase() : DEFAULT_HEADER_COLOR;
    elements.tableHeaderColorInput.value = safe;
    elements.tableHeaderColorText.value = safe;
  }

  function toggleRelationshipMode(force) {
    relationshipMode = typeof force === 'boolean' ? force : !relationshipMode;
    relationSource = null;
    pendingRelationship = null;
    editingRelationshipId = null;
    render();
    if (relationshipMode) showToast('Selecione primeiro o campo de chave estrangeira e depois o campo referenciado.');
  }

  function cancelRelationshipMode() {
    relationshipMode = false;
    relationSource = null;
    pendingRelationship = null;
  }

  function handleFieldForRelationship(tableId, fieldId) {
    if (!relationSource) {
      relationSource = { tableId, fieldId };
      selected = { type: 'field', tableId, fieldId };
      render();
      return;
    }
    if (relationSource.tableId === tableId && relationSource.fieldId === fieldId) {
      relationSource = null;
      render();
      return;
    }

    pendingRelationship = {
      fromTableId: relationSource.tableId,
      fromFieldId: relationSource.fieldId,
      toTableId: tableId,
      toFieldId: fieldId
    };
    editingRelationshipId = null;
    const fromTable = getTable(pendingRelationship.fromTableId);
    const fromField = getField(pendingRelationship.fromTableId, pendingRelationship.fromFieldId);
    const toTable = getTable(pendingRelationship.toTableId);
    const toField = getField(pendingRelationship.toTableId, pendingRelationship.toFieldId);
    elements.relationshipDialogTitle.textContent = 'Novo relacionamento';
    elements.relationshipSummary.textContent = `${fromTable.name}.${fromField.name} → ${toTable.name}.${toField.name}`;
    elements.relationshipType.value = '1:N';
    elements.relationshipLabel.value = '';
    elements.relationshipSubmitBtn.textContent = 'Criar relacionamento';
    elements.relationshipDialog.showModal();
  }

  function openRelationshipEditor(relId) {
    const rel = getRelationship(relId);
    if (!rel) return;
    editingRelationshipId = relId;
    pendingRelationship = null;
    const fromTable = getTable(rel.fromTableId);
    const fromField = getField(rel.fromTableId, rel.fromFieldId);
    const toTable = getTable(rel.toTableId);
    const toField = getField(rel.toTableId, rel.toFieldId);
    elements.relationshipDialogTitle.textContent = 'Editar relacionamento';
    elements.relationshipSummary.textContent = `${fromTable?.name}.${fromField?.name} → ${toTable?.name}.${toField?.name}`;
    elements.relationshipType.value = rel.type;
    elements.relationshipLabel.value = rel.label;
    elements.relationshipSubmitBtn.textContent = 'Salvar alterações';
    elements.relationshipDialog.showModal();
  }

  function saveRelationship() {
    if (editingRelationshipId) {
      const rel = getRelationship(editingRelationshipId);
      if (!rel) return;
      pushHistory();
      rel.type = elements.relationshipType.value;
      rel.label = elements.relationshipLabel.value.trim();
      elements.relationshipDialog.close();
      selected = { type: 'relationship', id: rel.id };
      render();
      scheduleSave();
      showToast('Relacionamento atualizado.', 'success');
      return;
    }

    if (!pendingRelationship) return;
    const duplicate = project.relationships.some(rel =>
      rel.fromTableId === pendingRelationship.fromTableId && rel.fromFieldId === pendingRelationship.fromFieldId &&
      rel.toTableId === pendingRelationship.toTableId && rel.toFieldId === pendingRelationship.toFieldId
    );
    if (duplicate) return showToast('Esse relacionamento já existe.', 'error');

    pushHistory();
    const rel = {
      id: uid('rel'),
      ...pendingRelationship,
      type: elements.relationshipType.value,
      label: elements.relationshipLabel.value.trim()
    };
    project.relationships.push(rel);
    elements.relationshipDialog.close();
    cancelRelationshipMode();
    selected = { type: 'relationship', id: rel.id };
    render();
    scheduleSave();
    showToast('Relacionamento criado.', 'success');
  }

  function openRelationshipFromTable(tableId) {
    const relations = project.relationships.filter(rel => rel.fromTableId === tableId || rel.toTableId === tableId);
    if (!relations.length) return showToast('A tabela não possui relacionamentos.', 'error');
    if (relations.length === 1) return openRelationshipEditor(relations[0].id);

    elements.relationshipPickerList.innerHTML = relations.map(rel => {
      const fromTable = getTable(rel.fromTableId);
      const fromField = getField(rel.fromTableId, rel.fromFieldId);
      const toTable = getTable(rel.toTableId);
      const toField = getField(rel.toTableId, rel.toFieldId);
      return `<button type="button" data-rel-id="${escapeHtml(rel.id)}"><strong>${escapeHtml(fromTable.name)}.${escapeHtml(fromField.name)}</strong> → <strong>${escapeHtml(toTable.name)}.${escapeHtml(toField.name)}</strong><br><small>${escapeHtml(rel.type)}${rel.label ? ` · ${escapeHtml(rel.label)}` : ''}</small></button>`;
    }).join('');
    $$('[data-rel-id]', elements.relationshipPickerList).forEach(button => button.addEventListener('click', () => {
      elements.relationshipPickerDialog.close();
      openRelationshipEditor(button.dataset.relId);
    }));
    elements.relationshipPickerDialog.showModal();
  }

  function deleteSelection() {
    if (!selected) return;
    pushHistory();
    if (selected.type === 'table') deleteTable(selected.id);
    else if (selected.type === 'relationship') project.relationships = project.relationships.filter(rel => rel.id !== selected.id);
    else if (selected.type === 'field') {
      const table = getTable(selected.tableId);
      if (table) {
        table.fields = table.fields.filter(field => field.id !== selected.fieldId);
        project.relationships = project.relationships.filter(rel => rel.fromFieldId !== selected.fieldId && rel.toFieldId !== selected.fieldId);
      }
    }
    selected = null;
    render();
    scheduleSave();
    showToast('Item excluído.', 'success');
  }

  function deleteTable(tableId) {
    project.tables = project.tables.filter(table => table.id !== tableId);
    project.relationships = project.relationships.filter(rel => rel.fromTableId !== tableId && rel.toTableId !== tableId);
  }

  function duplicateTable(tableId) {
    const table = getTable(tableId);
    if (!table) return;
    pushHistory();
    const name = uniqueTableName(`${table.name}_COPIA`);
    const fieldMap = new Map();
    const fields = table.fields.map(field => {
      const newId = uid('field');
      fieldMap.set(field.id, newId);
      return { ...field, id: newId, enumValues: [...field.enumValues] };
    });
    const copy = { ...table, id: uid('table'), name, x: table.x + 50, y: table.y + 50, fields };
    project.tables.push(copy);
    resolveTableOverlap(copy);
    selected = { type: 'table', id: copy.id };
    render();
    scheduleSave();
    showToast('Tabela duplicada.', 'success');
  }

  function uniqueTableName(base) {
    let candidate = base;
    let index = 2;
    while (project.tables.some(table => table.name === candidate)) candidate = `${base}_${index++}`;
    return candidate;
  }

  function tableVisualHeight(table) {
    return HEADER_HEIGHT + 8 + Math.max(1, table.fields.length) * FIELD_HEIGHT;
  }

  function tablePositionOverlaps(table, x, y, others, gapX = 90, gapY = 70) {
    const height = tableVisualHeight(table);
    return others.some(other => {
      if (!other || other.id === table.id) return false;
      const otherHeight = tableVisualHeight(other);
      return !(
        x + TABLE_WIDTH + gapX <= other.x ||
        other.x + TABLE_WIDTH + gapX <= x ||
        y + height + gapY <= other.y ||
        other.y + otherHeight + gapY <= y
      );
    });
  }

  function findNearestFreeTablePosition(table, preferredX = table.x, preferredY = table.y, others = project.tables) {
    const gapX = 90;
    const gapY = 70;
    const ownHeight = tableVisualHeight(table);
    const candidates = [{ x: preferredX, y: preferredY }];

    others.forEach(other => {
      if (!other || other.id === table.id) return;
      const otherHeight = tableVisualHeight(other);
      const left = other.x - TABLE_WIDTH - gapX;
      const right = other.x + TABLE_WIDTH + gapX;
      const above = other.y - ownHeight - gapY;
      const below = other.y + otherHeight + gapY;
      candidates.push(
        { x: left, y: preferredY },
        { x: right, y: preferredY },
        { x: preferredX, y: above },
        { x: preferredX, y: below },
        { x: left, y: above },
        { x: right, y: above },
        { x: left, y: below },
        { x: right, y: below }
      );
    });

    const stepX = 70;
    const stepY = 60;
    for (let ring = 1; ring <= 18; ring += 1) {
      for (let offset = -ring; offset <= ring; offset += 1) {
        candidates.push(
          { x: preferredX + offset * stepX, y: preferredY - ring * stepY },
          { x: preferredX + offset * stepX, y: preferredY + ring * stepY },
          { x: preferredX - ring * stepX, y: preferredY + offset * stepY },
          { x: preferredX + ring * stepX, y: preferredY + offset * stepY }
        );
      }
    }

    const unique = new Map();
    candidates.forEach(candidate => {
      const x = Math.round(clamp(candidate.x, 20, WORLD_WIDTH - TABLE_WIDTH - 20));
      const y = Math.round(clamp(candidate.y, 20, WORLD_HEIGHT - ownHeight - 20));
      unique.set(`${x}:${y}`, { x, y, score: Math.abs(x - preferredX) + Math.abs(y - preferredY) });
    });

    return [...unique.values()]
      .sort((a, b) => a.score - b.score)
      .find(candidate => !tablePositionOverlaps(table, candidate.x, candidate.y, others)) || {
        x: Math.round(clamp(preferredX, 20, WORLD_WIDTH - TABLE_WIDTH - 20)),
        y: Math.round(clamp(preferredY, 20, WORLD_HEIGHT - ownHeight - 20))
      };
  }

  function resolveTableOverlap(table) {
    if (!table) return false;
    const others = project.tables.filter(item => item.id !== table.id);
    if (!tablePositionOverlaps(table, table.x, table.y, others)) return false;
    const position = findNearestFreeTablePosition(table, table.x, table.y, others);
    const changed = position.x !== table.x || position.y !== table.y;
    table.x = position.x;
    table.y = position.y;
    return changed;
  }

  function resolveAllTableOverlaps() {
    const ordered = [...project.tables].sort((a, b) => (a.y - b.y) || (a.x - b.x));
    const placed = [];
    ordered.forEach(table => {
      const position = findNearestFreeTablePosition(table, table.x, table.y, placed);
      table.x = position.x;
      table.y = position.y;
      placed.push(table);
    });
  }

  function autoLayout() {
    if (!project.tables.length) return;
    pushHistory();
    const columns = Math.max(1, Math.ceil(Math.sqrt(project.tables.length * 1.35)));
    const startX = 160;
    const startY = 150;
    const gapX = 120;
    const gapY = 100;
    let currentY = startY;

    for (let start = 0; start < project.tables.length; start += columns) {
      const row = project.tables.slice(start, start + columns);
      const rowHeight = Math.max(...row.map(tableVisualHeight));
      row.forEach((table, columnIndex) => {
        table.x = startX + columnIndex * (TABLE_WIDTH + gapX);
        table.y = currentY;
      });
      currentY += rowHeight + gapY;
    }

    render();
    scheduleSave();
    setTimeout(fitDiagram, 30);
  }

  function setZoom(nextScale, anchorX = elements.canvas.clientWidth / 2, anchorY = elements.canvas.clientHeight / 2) {
    const scale = clamp(nextScale, 0.25, 2.4);
    const rect = elements.canvas.getBoundingClientRect();
    const localX = anchorX - rect.left;
    const localY = anchorY - rect.top;
    const worldX = (localX - transform.x) / transform.scale;
    const worldY = (localY - transform.y) / transform.scale;
    transform.x = localX - worldX * scale;
    transform.y = localY - worldY * scale;
    transform.scale = scale;
    applyTransform();
  }

  function applyTransform() {
    elements.viewport.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
    elements.zoomResetBtn.textContent = `${Math.round(transform.scale * 100)}%`;
  }

  function fitDiagram() {
    if (!project.tables.length) return;
    const bounds = getProjectBounds();
    const padding = 80;
    const scaleX = (elements.canvas.clientWidth - padding * 2) / Math.max(bounds.width, 1);
    const scaleY = (elements.canvas.clientHeight - padding * 2) / Math.max(bounds.height, 1);
    transform.scale = clamp(Math.min(scaleX, scaleY, 1.25), 0.25, 2.4);
    transform.x = (elements.canvas.clientWidth - bounds.width * transform.scale) / 2 - bounds.minX * transform.scale;
    transform.y = (elements.canvas.clientHeight - bounds.height * transform.scale) / 2 - bounds.minY * transform.scale;
    applyTransform();
  }

  function centerOnTable(table) {
    const height = HEADER_HEIGHT + 8 + table.fields.length * FIELD_HEIGHT;
    transform.x = elements.canvas.clientWidth / 2 - (table.x + TABLE_WIDTH / 2) * transform.scale;
    transform.y = elements.canvas.clientHeight / 2 - (table.y + height / 2) * transform.scale;
    applyTransform();
  }

  function getProjectBounds() {
    const minX = Math.min(...project.tables.map(table => table.x));
    const minY = Math.min(...project.tables.map(table => table.y));
    const maxX = Math.max(...project.tables.map(table => table.x + TABLE_WIDTH));
    const maxY = Math.max(...project.tables.map(table => table.y + HEADER_HEIGHT + 10 + Math.max(1, table.fields.length) * FIELD_HEIGHT));
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  function screenToWorld(screenX, screenY) {
    return { x: (screenX - transform.x) / transform.scale, y: (screenY - transform.y) / transform.scale };
  }

  function openImportDialog(mode = 'json') {
    importMode = mode;
    elements.importText.value = '';
    elements.fileInput.value = '';
    elements.fileName.textContent = 'Nenhum arquivo selecionado';
    $$('[data-import-tab]').forEach(tab => tab.classList.toggle('active', tab.dataset.importTab === mode));
    updateImportHint();
    elements.importDialog.showModal();
    setTimeout(() => elements.importText.focus(), 30);
  }

  function updateImportHint() {
    if (importMode === 'json') {
      elements.importText.placeholder = 'Cole aqui o JSON ou o backup TXT exportado pelo MBD - Studio...';
      elements.importHint.textContent = 'Aceita projeto JSON e backup TXT completo do MBD - Studio.';
    } else {
      elements.importText.placeholder = 'Cole CREATE TABLE, ALTER TABLE e restrições...';
      elements.importHint.textContent = 'Reconhece PK, FK, UNIQUE, NOT NULL, DEFAULT, ENUM e CHECK (CAMPO IN (...)).';
    }
  }

  function importProjectContent() {
    const content = elements.importText.value.trim();
    if (!content) return showToast('Cole ou selecione um arquivo para importar.', 'error');
    try {
      const strategy = elements.importStrategy.value;
      if (importMode === 'json') {
        const imported = parseProjectText(content);
        pushHistory();
        if (strategy === 'replace') project = imported;
        else appendProject(imported);
      } else {
        const parsed = parseSql(content);
        if (!parsed.tables.length) throw new Error('Nenhum CREATE TABLE válido foi encontrado.');
        pushHistory();
        if (strategy === 'replace') project = materializeParsedSql(parsed, { existingProject: { version: 3, name: 'Importado do SQL', tables: [], relationships: [] }, replace: true });
        else project = materializeParsedSql(parsed, { existingProject: project, replace: false });
      }
      elements.importDialog.close();
      selected = null;
      resolveAllTableOverlaps();
      render();
      scheduleSave();
      setTimeout(fitDiagram, 40);
      showToast('Importação concluída.', 'success');
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Não foi possível importar o conteúdo.', 'error');
    }
  }

  function appendProject(imported) {
    const tableIdMap = new Map();
    const fieldIdMap = new Map();
    const startIndex = project.tables.length;
    imported.tables.forEach((table, index) => {
      const newTableId = uid('table');
      tableIdMap.set(table.id, newTableId);
      const name = uniqueTableName(table.name);
      const fields = table.fields.map(field => {
        const newFieldId = uid('field');
        fieldIdMap.set(field.id, newFieldId);
        return { ...field, id: newFieldId, enumValues: [...field.enumValues] };
      });
      project.tables.push({ ...table, id: newTableId, name, x: 180 + ((startIndex + index) % 4) * 390, y: 160 + Math.floor((startIndex + index) / 4) * 300, fields });
    });
    imported.relationships.forEach(rel => {
      if (tableIdMap.has(rel.fromTableId) && tableIdMap.has(rel.toTableId)) {
        project.relationships.push({
          ...rel,
          id: uid('rel'),
          fromTableId: tableIdMap.get(rel.fromTableId),
          fromFieldId: fieldIdMap.get(rel.fromFieldId),
          toTableId: tableIdMap.get(rel.toTableId),
          toFieldId: fieldIdMap.get(rel.toFieldId)
        });
      }
    });
  }

  function openTableSqlDialog(tableId) {
    const table = getTable(tableId);
    if (!table) return;
    tableSqlEditingId = tableId;
    elements.tableSqlTitle.textContent = `Editar script SQL — ${table.name}`;
    elements.tableSqlInput.value = generateSqlForTables('oracle', [table], project.relationships.filter(rel => rel.fromTableId === tableId));
    elements.tableSqlDialog.showModal();
  }

  function applyTableSql() {
    const table = getTable(tableSqlEditingId);
    if (!table) return;
    try {
      const parsed = parseSql(elements.tableSqlInput.value);
      if (parsed.tables.length !== 1) throw new Error('Informe exatamente um comando CREATE TABLE.');
      const parsedTable = parsed.tables[0];
      const duplicate = project.tables.some(item => item.name === parsedTable.name && item.id !== table.id);
      if (duplicate) throw new Error('Já existe outra tabela com esse nome.');

      pushHistory();
      const oldFieldsByName = new Map(table.fields.map(field => [field.name.toUpperCase(), field]));
      const newFields = parsedTable.fields.map(field => {
        const old = oldFieldsByName.get(field.name.toUpperCase());
        return { ...field, id: old?.id || uid('field'), enumValues: [...field.enumValues] };
      });
      const validFieldIds = new Set(newFields.map(field => field.id));
      table.name = parsedTable.name;
      table.fields = newFields;
      resolveTableOverlap(table);

      project.relationships = project.relationships.filter(rel => {
        if (rel.fromTableId === table.id) return false;
        if (rel.toTableId === table.id && !validFieldIds.has(rel.toFieldId)) return false;
        return true;
      });

      parsed.foreignKeys.forEach(fk => {
        if (fk.fromTableName !== parsedTable.name) return;
        const fromField = table.fields.find(field => field.name === fk.fromFieldName);
        const targetTable = project.tables.find(item => item.name === fk.toTableName);
        const targetField = targetTable?.fields.find(field => field.name === fk.toFieldName);
        if (fromField && targetTable && targetField) {
          project.relationships.push({
            id: uid('rel'),
            fromTableId: table.id,
            fromFieldId: fromField.id,
            toTableId: targetTable.id,
            toFieldId: targetField.id,
            type: fk.type || '1:N',
            label: fk.label || ''
          });
        }
      });

      elements.tableSqlDialog.close();
      selected = { type: 'table', id: table.id };
      render();
      scheduleSave();
      showToast('Script aplicado à tabela.', 'success');
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Não foi possível aplicar o script.', 'error');
    }
  }

  function showSqlDialog() {
    elements.sqlOutput.value = generateSql(elements.dialectSelect.value);
    elements.sqlDialog.showModal();
  }

  function generateSql(dialect) {
    return generateSqlForTables(dialect, project.tables, project.relationships);
  }

  function generateSqlForTables(dialect, tables, relationships) {
    const lines = [];
    tables.forEach(table => {
      const columnLines = [];
      const tableConstraints = [];
      table.fields.forEach(field => {
        const type = sqlTypeForDialect(field, dialect);
        const attrs = [];
        if (field.defaultValue) attrs.push(`DEFAULT ${field.defaultValue}`);
        if (field.nn || field.pk) attrs.push('NOT NULL');
        if (field.pk) attrs.push('PRIMARY KEY');
        else if (field.uq) attrs.push('UNIQUE');
        columnLines.push(`    ${quoteIdentifier(field.name, dialect)} ${type}${attrs.length ? ` ${attrs.join(' ')}` : ''}`);
        if (field.enumValues.length && dialect !== 'mysql') {
          const constraintName = safeConstraintName(`CK_${table.name}_${field.name}`, dialect);
          tableConstraints.push(`    CONSTRAINT ${quoteIdentifier(constraintName, dialect)} CHECK (${quoteIdentifier(field.name, dialect)} IN (${field.enumValues.map(sqlQuote).join(', ')}))`);
        }
      });
      const allLines = [...columnLines, ...tableConstraints];
      lines.push(`CREATE TABLE ${quoteIdentifier(table.name, dialect)} (\n${allLines.join(',\n')}\n);`);
      lines.push('');
    });

    relationships.forEach((rel, index) => {
      const fromTable = getTable(rel.fromTableId);
      const toTable = getTable(rel.toTableId);
      const fromField = getField(rel.fromTableId, rel.fromFieldId);
      const toField = getField(rel.toTableId, rel.toFieldId);
      if (!fromTable || !toTable || !fromField || !toField) return;
      if (!tables.some(table => table.id === fromTable.id)) return;
      if (rel.type === 'N:N') {
        lines.push(`-- Relacionamento N:N entre ${fromTable.name} e ${toTable.name}: crie uma tabela associativa.`);
        lines.push('');
        return;
      }
      const constraintName = safeConstraintName(`FK_${fromTable.name}_${toTable.name}_${index + 1}`, dialect);
      lines.push(`ALTER TABLE ${quoteIdentifier(fromTable.name, dialect)}`);
      lines.push(`    ADD CONSTRAINT ${quoteIdentifier(constraintName, dialect)}`);
      lines.push(`    FOREIGN KEY (${quoteIdentifier(fromField.name, dialect)})`);
      lines.push(`    REFERENCES ${quoteIdentifier(toTable.name, dialect)} (${quoteIdentifier(toField.name, dialect)});`);
      if (rel.type === '1:1' && !fromField.uq) lines.push(`-- Para garantir 1:1, considere UNIQUE em ${fromTable.name}.${fromField.name}.`);
      lines.push('');
    });
    return lines.join('\n').trim() + '\n';
  }

  function sqlTypeForDialect(field, dialect) {
    if (field.enumValues.length && dialect === 'mysql') return `ENUM(${field.enumValues.map(sqlQuote).join(', ')})`;
    let type = field.type.toUpperCase();
    const hasIdentity = /GENERATED\s+(?:BY\s+DEFAULT|ALWAYS)\s+AS\s+IDENTITY|AUTO_INCREMENT/i.test(type);
    type = type.replace(/\s+GENERATED\s+(?:BY\s+DEFAULT|ALWAYS)\s+AS\s+IDENTITY/ig, '').replace(/\s+AUTO_INCREMENT/ig, '').trim();
    if (dialect === 'postgresql') {
      type = type.replace(/^VARCHAR2/i, 'VARCHAR').replace(/^NUMBER\s*\((\d+)\s*,\s*(\d+)\)/i, 'NUMERIC($1,$2)').replace(/^NUMBER$/i, 'NUMERIC').replace(/^CLOB$/i, 'TEXT');
      if (hasIdentity) type += ' GENERATED BY DEFAULT AS IDENTITY';
    } else if (dialect === 'mysql') {
      type = type.replace(/^VARCHAR2/i, 'VARCHAR').replace(/^NUMBER\s*\((\d+)\s*,\s*(\d+)\)/i, 'DECIMAL($1,$2)').replace(/^NUMBER$/i, hasIdentity ? 'BIGINT' : 'DECIMAL').replace(/^CLOB$/i, 'LONGTEXT');
      if (hasIdentity) type += ' AUTO_INCREMENT';
    } else {
      type = type.replace(/^VARCHAR\(/i, 'VARCHAR2(').replace(/^NUMERIC/i, 'NUMBER');
      if (hasIdentity) type += ' GENERATED BY DEFAULT AS IDENTITY';
    }
    return type;
  }

  function quoteIdentifier(name, dialect) {
    if (dialect === 'mysql') return `\`${String(name).replace(/`/g, '``')}\``;
    return `"${String(name).replace(/"/g, '""')}"`;
  }

  function safeConstraintName(name, dialect) {
    const clean = name.replace(/[^A-Z0-9_]/gi, '_').toUpperCase();
    return dialect === 'oracle' ? clean.slice(0, 30) : clean.slice(0, 63);
  }

  function exportJson() {
    downloadText(`${safeFileName(project.name)}.json`, JSON.stringify(project, null, 2), 'application/json');
  }

  function exportTxt() {
    downloadTxtBackup();
  }

  function exportSql() {
    const dialect = elements.dialectSelect.value;
    downloadText(`${safeFileName(project.name)}-${dialect}.sql`, generateSql(dialect), 'text/sql');
  }

  function exportSvg() {
    const svg = buildStandaloneSvg();
    downloadText(`${safeFileName(project.name)}.svg`, svg, 'image/svg+xml');
  }

  function buildStandaloneSvg() {
    if (!project.tables.length) return '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"></svg>';
    const bounds = getProjectBounds();
    const pad = 60;
    const width = bounds.width + pad * 2;
    const height = bounds.height + pad * 2;
    const offsetX = pad - bounds.minX;
    const offsetY = pad - bounds.minY;
    const relationshipSvg = project.relationships.map((rel, index) => {
      const pathInfo = getRelationshipPath(rel, index);
      if (!pathInfo) return '';
      const labels = cardinalityLabels(rel.type);
      return `<g><path d="${pathInfo.path}" fill="none" stroke="#7b8798" stroke-width="1"/><text x="${pathInfo.fromLabelX}" y="${pathInfo.fromLabelY}" font-size="12" fill="#667085">${labels.from}</text><text x="${pathInfo.toLabelX}" y="${pathInfo.toLabelY}" font-size="12" fill="#667085">${labels.to}</text>${rel.label ? `<text x="${pathInfo.midX}" y="${pathInfo.midY - 10}" text-anchor="middle" font-size="11" fill="#667085">${escapeXml(rel.label)}</text>` : ''}</g>`;
    }).join('');
    const tableSvg = project.tables.map(table => {
      const h = HEADER_HEIGHT + 8 + Math.max(1, table.fields.length) * FIELD_HEIGHT;
      const rows = table.fields.map((field, index) => {
        const y = table.y + HEADER_HEIGHT + 27 + index * FIELD_HEIGHT;
        return `<line x1="${table.x}" y1="${table.y + HEADER_HEIGHT + 4 + index * FIELD_HEIGHT}" x2="${table.x + TABLE_WIDTH}" y2="${table.y + HEADER_HEIGHT + 4 + index * FIELD_HEIGHT}" stroke="#d6dde8"/><text x="${table.x + 12}" y="${y}" font-size="11" font-weight="700" fill="#172033">${escapeXml(field.pk ? 'PK  ' : '•   ')}${escapeXml(field.name)}</text><text x="${table.x + TABLE_WIDTH - 12}" y="${y}" text-anchor="end" font-size="10" fill="#667085">${escapeXml(field.type)}${field.enumValues.length ? '  ENUM' : ''}${field.defaultValue ? '  DEFAULT' : ''}</text>`;
      }).join('');
      return `<g><rect x="${table.x}" y="${table.y}" width="${TABLE_WIDTH}" height="${h}" rx="10" fill="#ffffff" stroke="#bcc7d6"/><path d="M${table.x + 10},${table.y} H${table.x + TABLE_WIDTH - 10} Q${table.x + TABLE_WIDTH},${table.y} ${table.x + TABLE_WIDTH},${table.y + 10} V${table.y + HEADER_HEIGHT} H${table.x} V${table.y + 10} Q${table.x},${table.y} ${table.x + 10},${table.y}" fill="${escapeXml(table.headerColor)}"/><text x="${table.x + 14}" y="${table.y + 29}" font-size="13" font-weight="800" fill="#fff">${escapeXml(table.name)}</text>${rows}</g>`;
    }).join('');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${bounds.minX - pad} ${bounds.minY - pad} ${width} ${height}"><rect x="${bounds.minX - pad}" y="${bounds.minY - pad}" width="${width}" height="${height}" fill="#eef2f7"/>${relationshipSvg}${tableSvg}</svg>`;
  }

  function exportHtml() {
    downloadText(`${safeFileName(project.name)}-diagrama.html`, buildStandaloneHtml(), 'text/html');
  }

  function prepareStandaloneProject(sourceProject) {
    const copy = JSON.parse(JSON.stringify(sourceProject));
    const gapX = 110;
    const gapY = 90;
    const margin = 120;
    const tableHeight = table => HEADER_HEIGHT + 8 + Math.max(1, table.fields.length) * FIELD_HEIGHT;
    const intersects = (a, b) => !(
      a.x + TABLE_WIDTH + gapX <= b.x ||
      b.x + TABLE_WIDTH + gapX <= a.x ||
      a.y + a.height + gapY <= b.y ||
      b.y + b.height + gapY <= a.y
    );

    const ordered = copy.tables
      .map((table, index) => ({ table, index }))
      .sort((a, b) => (Number(a.table.y) - Number(b.table.y)) || (Number(a.table.x) - Number(b.table.x)) || (a.index - b.index));

    const placed = [];
    ordered.forEach(({ table }) => {
      const original = {
        x: Number.isFinite(Number(table.x)) ? Number(table.x) : margin,
        y: Number.isFinite(Number(table.y)) ? Number(table.y) : margin
      };
      const height = tableHeight(table);
      let candidate = { ...original, height };
      let guard = 0;

      while (guard < 500) {
        const blocker = placed.find(item => intersects(candidate, item));
        if (!blocker) break;

        const options = [
          { x: blocker.x + TABLE_WIDTH + gapX, y: candidate.y, height },
          { x: candidate.x, y: blocker.y + blocker.height + gapY, height },
          { x: blocker.x + TABLE_WIDTH + gapX, y: blocker.y + blocker.height + gapY, height }
        ];

        candidate = options
          .map(option => {
            const overlapCount = placed.reduce((count, item) => count + (intersects(option, item) ? 1 : 0), 0);
            const distance = Math.abs(option.x - original.x) + Math.abs(option.y - original.y);
            return { ...option, score: overlapCount * 1000000 + distance };
          })
          .sort((a, b) => a.score - b.score)[0];
        guard += 1;
      }

      table.x = Math.round(candidate.x);
      table.y = Math.round(candidate.y);
      placed.push({ x: table.x, y: table.y, height });
    });

    if (copy.tables.length) {
      const minX = Math.min(...copy.tables.map(table => table.x));
      const minY = Math.min(...copy.tables.map(table => table.y));
      const shiftX = minX < margin ? margin - minX : 0;
      const shiftY = minY < margin ? margin - minY : 0;
      copy.tables.forEach(table => {
        table.x += shiftX;
        table.y += shiftY;
      });
    }

    return copy;
  }

  function buildStandaloneHtml() {
    const exportProject = prepareStandaloneProject(project);
    const data = JSON.stringify(exportProject).replace(/</g, '\\u003c');
    return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(project.name)} — MBD - Studio</title>
<style>
:root{--bg:#eef2f7;--panel:#fff;--panel-2:#f8fafc;--text:#172033;--muted:#667085;--border:#cbd5e1;--line:#7b8798;--primary:#3867f4;--primary-soft:#eaf0ff}body.dark{--bg:#0f1522;--panel:#182132;--panel-2:#111927;--text:#edf2f8;--muted:#9da9ba;--border:#38465b;--line:#9aa6b7;--primary-soft:#20335f}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--text)}header{position:relative;z-index:5;height:58px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 14px;background:var(--panel);border-bottom:1px solid var(--border);box-shadow:0 2px 12px rgba(20,35,60,.07)}header strong{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.controls{display:flex;gap:5px;flex:0 0 auto}button{min-height:34px;border:1px solid var(--border);background:var(--panel);color:var(--text);border-radius:8px;padding:6px 10px;cursor:pointer}button:hover{border-color:var(--primary);background:var(--panel-2)}.stage{position:absolute;inset:58px 0 0;overflow:hidden;cursor:grab;background-color:var(--bg);background-image:radial-gradient(circle,rgba(90,105,130,.14) 1px,transparent 1px);background-size:22px 22px}.stage.panning{cursor:grabbing}.world{position:absolute;transform-origin:0 0;will-change:transform}.rels{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}.node{position:absolute;width:310px;border:1px solid var(--border);border-radius:11px;background:var(--panel);box-shadow:0 9px 25px rgba(24,39,67,.14);overflow:visible;transition:box-shadow .16s ease,border-color .16s ease,opacity .16s ease}.node.related{border-color:color-mix(in srgb,var(--primary),var(--border) 35%);box-shadow:0 0 0 2px color-mix(in srgb,var(--primary),transparent 70%),0 12px 30px rgba(24,39,67,.16)}.head{height:46px;padding:0 13px;display:flex;align-items:center;color:#fff;border-radius:10px 10px 0 0;font-size:13px;font-weight:800;letter-spacing:.02em}.row{position:relative;height:36px;display:grid;grid-template-columns:35px minmax(0,1fr) auto;align-items:center;padding:0 9px;border-top:1px solid var(--border);font-size:11px;cursor:pointer;transition:background .14s ease,box-shadow .14s ease}.row:hover{background:var(--panel-2)}.row.selected,.row.related{background:color-mix(in srgb,var(--primary),transparent 86%);box-shadow:inset 3px 0 0 var(--primary)}.pk{font-weight:800;color:#9a6800}.field-name{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.type{max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--muted);font-size:10px;text-align:right}.badge{display:inline-block;margin-left:4px;font-size:8px;padding:1px 5px;border-radius:99px;background:#e7dbff;color:#6840ba}.badge.default{background:#dff4e8;color:#18794e}.tip{position:absolute;left:calc(100% + 10px);top:50%;transform:translateY(-50%);width:245px;padding:10px 12px;border:1px solid var(--border);border-radius:9px;background:var(--panel);box-shadow:0 14px 34px rgba(0,0,0,.2);opacity:0;visibility:hidden;z-index:20;line-height:1.5;pointer-events:none}.row:hover .tip{opacity:1;visibility:visible}.rel-line{fill:none;stroke:var(--line);stroke-width:1.35;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round;transition:stroke .18s ease,stroke-width .18s ease,filter .18s ease}.rel-hit{fill:none;stroke:transparent;stroke-width:18;vector-effect:non-scaling-stroke;pointer-events:stroke;cursor:pointer}.rel-group.active .rel-line{stroke:var(--primary);stroke-width:2.4;stroke-dasharray:11 7;animation:dashFlow .8s linear infinite;filter:drop-shadow(0 1px 2px rgba(56,103,244,.3))}.rel-card,.rel-label{fill:var(--muted);font-size:12px;font-weight:800;paint-order:stroke;stroke:var(--panel);stroke-width:5px;stroke-linejoin:round;pointer-events:none}.rel-label{font-size:11px;font-weight:700}.rel-group.active .rel-card,.rel-group.active .rel-label{fill:var(--primary)}@keyframes dashFlow{to{stroke-dashoffset:-36}}.legend{position:absolute;left:12px;bottom:12px;display:flex;align-items:center;gap:8px;max-width:calc(100% - 210px);padding:7px 10px;border:1px solid var(--border);border-radius:9px;background:color-mix(in srgb,var(--panel),transparent 4%);box-shadow:0 8px 22px rgba(20,35,60,.1);font-size:11px;color:var(--muted);backdrop-filter:blur(7px)}.legend-line{width:30px;height:0;border-top:2px dashed var(--primary)}.status{position:absolute;right:12px;bottom:12px;padding:7px 10px;border:1px solid var(--border);border-radius:9px;background:color-mix(in srgb,var(--panel),transparent 4%);box-shadow:0 8px 22px rgba(20,35,60,.1);font-size:11px;color:var(--muted);backdrop-filter:blur(7px)}@media(max-width:720px){header{padding:0 8px}.controls button{padding:5px 8px}.legend{display:none}.status{left:8px;right:8px;text-align:center}}
</style></head><body><header><strong>${escapeHtml(project.name)} — MBD - Studio</strong><div class="controls"><button id="minus" title="Diminuir zoom">−</button><button id="reset" title="Restaurar zoom">100%</button><button id="plus" title="Aumentar zoom">＋</button><button id="fit" title="Ajustar o diagrama à tela">Ajustar</button><button id="theme" title="Alternar tema">☾</button></div></header><div class="stage" id="stage"><div class="world" id="world"><svg class="rels" id="rels" aria-label="Relacionamentos do diagrama"></svg><div id="nodes"></div></div><div class="legend"><span class="legend-line"></span>Clique em um campo ou relacionamento para destacar a ligação.</div><div class="status">Arraste o fundo para mover · Ctrl + roda do mouse para zoom</div></div>
<script>
const p=${data},W=310,H=46,F=36;let t={x:80,y:60,s:1},pan=null,selectedField=null,selectedRelation=null;const stage=document.getElementById('stage'),world=document.getElementById('world'),nodes=document.getElementById('nodes'),rels=document.getElementById('rels');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const tableHeight=a=>H+8+Math.max(1,a.fields.length)*F;
function fieldKey(tableId,fieldId){return tableId+'::'+fieldId}
function card(type){return type==='1:1'?['1','1']:type==='N:N'?['N','N']:['N','1']}
function routePath(points,radius=12){if(points.length<2)return'';let d='M '+points[0][0]+' '+points[0][1];for(let i=1;i<points.length-1;i++){const prev=points[i-1],cur=points[i],next=points[i+1],inDx=cur[0]-prev[0],inDy=cur[1]-prev[1],outDx=next[0]-cur[0],outDy=next[1]-cur[1],inLen=Math.hypot(inDx,inDy),outLen=Math.hypot(outDx,outDy),r=Math.min(radius,inLen/2,outLen/2),before=[cur[0]-(inDx/inLen)*r,cur[1]-(inDy/inLen)*r],after=[cur[0]+(outDx/outLen)*r,cur[1]+(outDy/outLen)*r];d+=' L '+before[0]+' '+before[1]+' Q '+cur[0]+' '+cur[1]+' '+after[0]+' '+after[1]}const last=points[points.length-1];return d+' L '+last[0]+' '+last[1]}
function bounds(){if(!p.tables.length)return{minX:0,minY:0,maxX:900,maxY:600,width:900,height:600};const minX=Math.min(...p.tables.map(a=>a.x)),minY=Math.min(...p.tables.map(a=>a.y)),maxX=Math.max(...p.tables.map(a=>a.x+W)),maxY=Math.max(...p.tables.map(a=>a.y+tableHeight(a)));return{minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY}}
function relationInfo(r,index){const a=p.tables.find(x=>x.id===r.fromTableId),b=p.tables.find(x=>x.id===r.toTableId);if(!a||!b)return null;const ai=Math.max(0,a.fields.findIndex(x=>x.id===r.fromFieldId)),bi=Math.max(0,b.fields.findIndex(x=>x.id===r.toFieldId));const y1=a.y+H+4+ai*F+F/2,y2=b.y+H+4+bi*F+F/2;const ac=a.x+W/2,bc=b.x+W/2;let x1,x2,laneX,fromSide,toSide;const separatedRight=a.x+W+50<=b.x,separatedLeft=b.x+W+50<=a.x;const offset=((index%7)-3)*12;if(separatedRight){x1=a.x+W;x2=b.x;laneX=(x1+x2)/2+offset;fromSide=1;toSide=-1}else if(separatedLeft){x1=a.x;x2=b.x+W;laneX=(x1+x2)/2+offset;fromSide=-1;toSide=1}else{const useRight=(index%2===0);x1=useRight?a.x+W:a.x;x2=useRight?b.x+W:b.x;laneX=useRight?Math.max(a.x+W,b.x+W)+80+Math.abs(offset):Math.min(a.x,b.x)-80-Math.abs(offset);fromSide=useRight?1:-1;toSide=useRight?1:-1}const d=routePath([[x1,y1],[laneX,y1],[laneX,y2],[x2,y2]]);return{d,x1,y1,x2,y2,laneX,midY:(y1+y2)/2,fromLabelX:x1+fromSide*14,fromLabelY:y1-9,toLabelX:x2+toSide*14,toLabelY:y2-9,fromAnchor:fromSide>0?'start':'end',toAnchor:toSide>0?'start':'end'}}
function drawNodes(){nodes.innerHTML=p.tables.map(a=>'<article class="node" data-table-id="'+a.id+'" style="left:'+a.x+'px;top:'+a.y+'px"><div class="head" style="background:'+a.headerColor+'">'+esc(a.name)+'</div>'+a.fields.map(f=>'<div class="row" data-table-id="'+a.id+'" data-field-id="'+f.id+'"><span class="'+(f.pk?'pk':'')+'">'+(f.pk?'PK':'•')+'</span><span class="field-name">'+esc(f.name)+(f.enumValues.length?'<b class="badge">ENUM</b>':'')+(f.defaultValue?'<b class="badge default">DEFAULT</b>':'')+'</span><span class="type">'+esc(f.type)+'</span>'+((f.enumValues.length||f.defaultValue)?'<span class="tip">'+(f.enumValues.length?'<b>Valores permitidos</b><br>'+esc(f.enumValues.map(v=>"'"+v+"'").join(', ')):'')+(f.defaultValue?'<br><b>Default</b><br>'+esc(f.defaultValue):'')+'</span>':'')+'</div>').join('')+'</article>').join('');nodes.querySelectorAll('.row').forEach(row=>row.addEventListener('click',e=>{e.stopPropagation();selectedField=fieldKey(row.dataset.tableId,row.dataset.fieldId);selectedRelation=null;applySelection()}))}
function drawRelationships(){const defs='<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--line)"></path></marker><marker id="arrowActive" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary)"></path></marker></defs>';rels.innerHTML=defs+p.relationships.map((r,index)=>{const q=relationInfo(r,index);if(!q)return'';const c=card(r.type),active=selectedRelation===r.id||selectedField===fieldKey(r.fromTableId,r.fromFieldId)||selectedField===fieldKey(r.toTableId,r.toFieldId);return '<g class="rel-group'+(active?' active':'')+'" data-rel-id="'+r.id+'"><path class="rel-hit" d="'+q.d+'"></path><path class="rel-line" d="'+q.d+'" marker-end="url(#'+(active?'arrowActive':'arrow')+')"></path><text class="rel-card" x="'+q.fromLabelX+'" y="'+q.fromLabelY+'" text-anchor="'+q.fromAnchor+'">'+c[0]+'</text><text class="rel-card" x="'+q.toLabelX+'" y="'+q.toLabelY+'" text-anchor="'+q.toAnchor+'">'+c[1]+'</text>'+(r.label?'<text class="rel-label" x="'+q.laneX+'" y="'+(q.midY-10)+'" text-anchor="middle">'+esc(r.label)+'</text>':'')+'</g>'}).join('');rels.querySelectorAll('.rel-hit').forEach(hit=>hit.addEventListener('click',e=>{e.stopPropagation();selectedRelation=hit.parentElement.dataset.relId;selectedField=null;applySelection()}))}
function applySelection(){nodes.querySelectorAll('.row').forEach(row=>{const key=fieldKey(row.dataset.tableId,row.dataset.fieldId);const related=p.relationships.some(r=>(selectedRelation===r.id||selectedField===fieldKey(r.fromTableId,r.fromFieldId)||selectedField===fieldKey(r.toTableId,r.toFieldId))&&(key===fieldKey(r.fromTableId,r.fromFieldId)||key===fieldKey(r.toTableId,r.toFieldId)));row.classList.toggle('selected',selectedField===key);row.classList.toggle('related',related&&selectedField!==key)});nodes.querySelectorAll('.node').forEach(node=>node.classList.toggle('related',!!node.querySelector('.row.selected,.row.related')));drawRelationships()}
function draw(){const b=bounds();world.style.width=Math.max(1400,b.maxX+220)+'px';world.style.height=Math.max(900,b.maxY+220)+'px';rels.setAttribute('viewBox','0 0 '+Math.max(1400,b.maxX+220)+' '+Math.max(900,b.maxY+220));drawNodes();drawRelationships();apply()}
function apply(){world.style.transform='translate('+t.x+'px,'+t.y+'px) scale('+t.s+')';document.getElementById('reset').textContent=Math.round(t.s*100)+'%'}
function zoom(n,x=stage.clientWidth/2,y=stage.clientHeight/2){n=Math.max(.2,Math.min(2.6,n));const wx=(x-t.x)/t.s,wy=(y-t.y)/t.s;t.x=x-wx*n;t.y=y-wy*n;t.s=n;apply()}
function fit(){if(!p.tables.length)return;const b=bounds(),pad=110;t.s=Math.max(.2,Math.min(1.25,(stage.clientWidth-pad)/Math.max(1,b.width),(stage.clientHeight-pad)/Math.max(1,b.height)));t.x=(stage.clientWidth-b.width*t.s)/2-b.minX*t.s;t.y=(stage.clientHeight-b.height*t.s)/2-b.minY*t.s;apply()}
stage.addEventListener('mousedown',e=>{if(e.button!==0||e.target.closest('.row')||e.target.closest('.rel-hit'))return;pan={x:e.clientX,y:e.clientY,tx:t.x,ty:t.y};stage.classList.add('panning')});window.addEventListener('mousemove',e=>{if(!pan)return;t.x=pan.tx+e.clientX-pan.x;t.y=pan.ty+e.clientY-pan.y;apply()});window.addEventListener('mouseup',()=>{pan=null;stage.classList.remove('panning')});stage.addEventListener('click',e=>{if(e.target===stage||e.target===world||e.target===nodes||e.target===rels){selectedField=null;selectedRelation=null;applySelection()}});stage.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();const r=stage.getBoundingClientRect();zoom(t.s*(e.deltaY<0?1.1:.9),e.clientX-r.left,e.clientY-r.top)}},{passive:false});document.getElementById('plus').onclick=()=>zoom(t.s+.1);document.getElementById('minus').onclick=()=>zoom(t.s-.1);document.getElementById('reset').onclick=()=>zoom(1);document.getElementById('fit').onclick=fit;document.getElementById('theme').onclick=()=>{document.body.classList.toggle('dark');document.getElementById('theme').textContent=document.body.classList.contains('dark')?'☀':'☾'};draw();setTimeout(fit,30);
<\/script></body></html>`;
  }


  function parseSql(sql) {
    const cleaned = stripSqlComments(String(sql || ''));
    const blocks = extractCreateTableBlocks(cleaned);
    const tables = [];
    const foreignKeys = [];

    blocks.forEach((block, index) => {
      const tableName = cleanIdentifier(block.name).toUpperCase();
      if (!tableName) return;
      const fields = [];
      const pkColumns = new Set();
      const uniqueColumns = new Set();
      const enumChecks = new Map();
      const items = splitTopLevel(block.body, ',');

      items.forEach(itemRaw => {
        const item = itemRaw.trim();
        if (!item) return;
        const constraint = parseTableConstraint(item, tableName);
        if (constraint) {
          constraint.pkColumns?.forEach(name => pkColumns.add(name));
          constraint.uniqueColumns?.forEach(name => uniqueColumns.add(name));
          if (constraint.enumField) enumChecks.set(constraint.enumField, constraint.enumValues);
          if (constraint.foreignKeys) foreignKeys.push(...constraint.foreignKeys);
          return;
        }
        const column = parseColumnDefinition(item, tableName);
        if (column) {
          fields.push(column.field);
          if (column.foreignKey) foreignKeys.push(column.foreignKey);
        }
      });

      fields.forEach(field => {
        if (pkColumns.has(field.name)) field.pk = field.nn = field.uq = true;
        if (uniqueColumns.has(field.name)) field.uq = true;
        if (enumChecks.has(field.name)) field.enumValues = enumChecks.get(field.name);
      });

      tables.push({
        id: uid('table'),
        name: tableName,
        x: 180 + (index % 4) * 390,
        y: 160 + Math.floor(index / 4) * 300,
        headerColor: colorForIndex(index),
        fields
      });
    });

    parseAlterTableForeignKeys(cleaned).forEach(fk => foreignKeys.push(fk));
    return { tables, foreignKeys };
  }

  function materializeParsedSql(parsed, { existingProject, replace }) {
    const result = replace ? { version: 3, name: 'Importado do SQL', tables: [], relationships: [] } : normalizeProject(JSON.parse(JSON.stringify(existingProject)));
    const importedNameMap = new Map();

    parsed.tables.forEach((table, index) => {
      let actualName = table.name;
      if (result.tables.some(existing => existing.name === actualName)) {
        const base = actualName;
        let suffix = 2;
        while (result.tables.some(existing => existing.name === `${base}_${suffix}`)) suffix++;
        actualName = `${base}_${suffix}`;
      }
      importedNameMap.set(table.name, actualName);
      result.tables.push({
        ...table,
        id: uid('table'),
        name: actualName,
        x: replace ? table.x : 180 + ((result.tables.length + index) % 4) * 390,
        y: replace ? table.y : 160 + Math.floor((result.tables.length + index) / 4) * 300,
        fields: table.fields.map(field => ({ ...field, id: uid('field'), enumValues: [...field.enumValues] }))
      });
    });

    parsed.foreignKeys.forEach(fk => {
      const fromName = importedNameMap.get(fk.fromTableName) || fk.fromTableName;
      const toName = importedNameMap.get(fk.toTableName) || fk.toTableName;
      const fromTable = result.tables.find(table => table.name === fromName);
      const toTable = result.tables.find(table => table.name === toName);
      const fromField = fromTable?.fields.find(field => field.name === fk.fromFieldName);
      const toField = toTable?.fields.find(field => field.name === fk.toFieldName);
      if (!fromTable || !toTable || !fromField || !toField) return;
      if (result.relationships.some(rel => rel.fromTableId === fromTable.id && rel.fromFieldId === fromField.id && rel.toTableId === toTable.id && rel.toFieldId === toField.id)) return;
      result.relationships.push({
        id: uid('rel'),
        fromTableId: fromTable.id,
        fromFieldId: fromField.id,
        toTableId: toTable.id,
        toFieldId: toField.id,
        type: fk.type || '1:N',
        label: fk.label || ''
      });
    });

    return normalizeProject(result);
  }

  function stripSqlComments(sql) {
    let output = '';
    let quote = null;
    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      const next = sql[i + 1];
      if (quote) {
        output += char;
        if (char === quote) {
          if (sql[i + 1] === quote) output += sql[++i];
          else quote = null;
        }
        continue;
      }
      if (char === "'" || char === '"' || char === '`') {
        quote = char;
        output += char;
        continue;
      }
      if (char === '-' && next === '-') {
        while (i < sql.length && sql[i] !== '\n') i++;
        output += '\n';
        continue;
      }
      if (char === '/' && next === '*') {
        i += 2;
        while (i < sql.length - 1 && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
        i++;
        output += ' ';
        continue;
      }
      output += char;
    }
    return output;
  }

  function extractCreateTableBlocks(sql) {
    const blocks = [];
    const regex = /CREATE\s+TABLE\s+/ig;
    let match;
    while ((match = regex.exec(sql))) {
      let cursor = match.index + match[0].length;
      const identifier = readQualifiedIdentifier(sql, cursor);
      if (!identifier) continue;
      cursor = identifier.end;
      while (/\s/.test(sql[cursor] || '')) cursor++;
      if (sql[cursor] !== '(') continue;
      const closing = findMatchingParen(sql, cursor);
      if (closing < 0) throw new Error(`Parênteses não balanceados em CREATE TABLE ${identifier.value}.`);
      blocks.push({ name: identifier.value, body: sql.slice(cursor + 1, closing), start: match.index, end: closing + 1 });
      regex.lastIndex = closing + 1;
    }
    return blocks;
  }

  function readQualifiedIdentifier(text, start) {
    let i = start;
    while (/\s/.test(text[i] || '')) i++;
    let value = '';
    let parts = [];
    while (i < text.length) {
      const token = readIdentifierToken(text, i);
      if (!token) break;
      parts.push(token.value);
      i = token.end;
      while (/\s/.test(text[i] || '')) i++;
      if (text[i] === '.') {
        i++;
        while (/\s/.test(text[i] || '')) i++;
        continue;
      }
      break;
    }
    if (!parts.length) return null;
    value = parts[parts.length - 1];
    return { value, parts, end: i };
  }

  function readIdentifierToken(text, start) {
    const char = text[start];
    if (char === '"' || char === '`') {
      let i = start + 1;
      let value = '';
      while (i < text.length) {
        if (text[i] === char) {
          if (text[i + 1] === char) { value += char; i += 2; continue; }
          return { value, end: i + 1 };
        }
        value += text[i++];
      }
      return null;
    }
    if (char === '[') {
      const end = text.indexOf(']', start + 1);
      if (end < 0) return null;
      return { value: text.slice(start + 1, end), end: end + 1 };
    }
    const match = text.slice(start).match(/^[A-Za-z_#$][A-Za-z0-9_#$]*/);
    if (!match) return null;
    return { value: match[0], end: start + match[0].length };
  }

  function findMatchingParen(text, openIndex) {
    let depth = 0;
    let quote = null;
    for (let i = openIndex; i < text.length; i++) {
      const char = text[i];
      if (quote) {
        if (char === quote) {
          if (text[i + 1] === quote) i++;
          else quote = null;
        }
        continue;
      }
      if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
      if (char === '(') depth++;
      else if (char === ')' && --depth === 0) return i;
    }
    return -1;
  }

  function splitTopLevel(text, delimiter = ',') {
    const parts = [];
    let start = 0;
    let depth = 0;
    let quote = null;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quote) {
        if (char === quote) {
          if (text[i + 1] === quote) i++;
          else quote = null;
        }
        continue;
      }
      if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
      if (char === '(') depth++;
      else if (char === ')') depth--;
      else if (char === delimiter && depth === 0) {
        parts.push(text.slice(start, i));
        start = i + 1;
      }
    }
    parts.push(text.slice(start));
    return parts;
  }

  function parseTableConstraint(item, tableName) {
    let text = item.trim();
    text = text.replace(/^CONSTRAINT\s+(?:"[^"]+"|`[^`]+`|\[[^\]]+\]|[A-Za-z0-9_#$]+)\s+/i, '');
    let match = text.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
    if (match) return { pkColumns: parseIdentifierList(match[1]) };
    match = text.match(/^UNIQUE\s*\(([^)]+)\)/i);
    if (match) return { uniqueColumns: parseIdentifierList(match[1]) };
    match = text.match(new RegExp(`^FOREIGN\\s+KEY\\s*\\(([^)]+)\\)\\s+REFERENCES\\s+(${SQL_QUALIFIED_IDENTIFIER_PATTERN})\\s*\\(([^)]+)\\)`, 'i'));
    if (match) {
      const fromColumns = parseIdentifierList(match[1]);
      const toTableName = cleanIdentifier(match[2]).toUpperCase();
      const toColumns = parseIdentifierList(match[3]);
      return { foreignKeys: fromColumns.map((column, index) => ({ fromTableName: tableName, fromFieldName: column, toTableName, toFieldName: toColumns[index] || toColumns[0], type: '1:N', label: '' })) };
    }
    const check = parseCheckEnum(text);
    if (check) return check;
    return null;
  }

  function parseCheckEnum(text) {
    const match = text.match(new RegExp(`^CHECK\\s*\\(\\s*(${SQL_IDENTIFIER_PATTERN})\\s+IN\\s*\\((.*)\\)\\s*\\)\\s*$`, 'is'));
    if (!match) return null;
    return { enumField: cleanIdentifier(match[1]).toUpperCase(), enumValues: splitTopLevel(match[2], ',').map(value => unquoteSqlValue(value.trim())).filter(Boolean) };
  }

  function parseColumnDefinition(item, tableName) {
    const token = readIdentifierToken(item, item.search(/\S/));
    if (!token) return null;
    const name = cleanIdentifier(token.value).toUpperCase();
    const rest = item.slice(token.end).trim();
    if (!rest) return null;
    const identityToken = '__ER_IDENTITY_CLAUSE__';
    const maskedRest = rest.replace(/GENERATED\s+(?:BY\s+DEFAULT|ALWAYS)\s+AS\s+IDENTITY/ig, identityToken);
    const keywordIndex = findFirstTopLevelKeyword(maskedRest, ['NOT NULL', 'NULL', 'PRIMARY KEY', 'UNIQUE', 'DEFAULT', 'REFERENCES', 'CHECK', 'CONSTRAINT', 'AUTO_INCREMENT']);
    let type = (keywordIndex < 0 ? maskedRest : maskedRest.slice(0, keywordIndex)).trim().replaceAll(identityToken, 'GENERATED BY DEFAULT AS IDENTITY');
    let attrs = (keywordIndex < 0 ? '' : maskedRest.slice(keywordIndex).trim()).replaceAll(identityToken, 'GENERATED BY DEFAULT AS IDENTITY');
    let enumValues = [];
    const enumMatch = type.match(/^ENUM\s*\((.*)\)$/is);
    if (enumMatch) {
      enumValues = splitTopLevel(enumMatch[1], ',').map(value => unquoteSqlValue(value.trim())).filter(Boolean);
      type = 'VARCHAR(255)';
    }

    const pk = /\bPRIMARY\s+KEY\b/i.test(attrs);
    const nn = pk || /\bNOT\s+NULL\b/i.test(attrs);
    const uq = pk || /\bUNIQUE\b/i.test(attrs);
    if (/\bAUTO_INCREMENT\b/i.test(attrs) && !/\bIDENTITY\b/i.test(type)) type = `${type} GENERATED BY DEFAULT AS IDENTITY`;
    const defaultValue = extractAttributeExpression(attrs, 'DEFAULT', ['NOT NULL', 'NULL', 'PRIMARY KEY', 'UNIQUE', 'REFERENCES', 'CHECK', 'CONSTRAINT', 'AUTO_INCREMENT']);
    const inlineCheck = attrs.match(/CHECK\s*\(\s*(?:[^\s()]+)\s+IN\s*\((.*?)\)\s*\)/is);
    if (inlineCheck) enumValues = splitTopLevel(inlineCheck[1], ',').map(value => unquoteSqlValue(value.trim())).filter(Boolean);

    let foreignKey = null;
    const refMatch = attrs.match(new RegExp(`REFERENCES\\s+(${SQL_QUALIFIED_IDENTIFIER_PATTERN})\\s*\\(([^)]+)\\)`, 'i'));
    if (refMatch) {
      foreignKey = {
        fromTableName: tableName,
        fromFieldName: name,
        toTableName: cleanIdentifier(refMatch[1]).toUpperCase(),
        toFieldName: parseIdentifierList(refMatch[2])[0],
        type: '1:N',
        label: ''
      };
    }

    return {
      field: { id: uid('field'), name, type: type.toUpperCase(), pk, nn, uq, defaultValue, enumValues },
      foreignKey
    };
  }

  function findFirstTopLevelKeyword(text, keywords) {
    let depth = 0;
    let quote = null;
    const upper = text.toUpperCase();
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quote) {
        if (char === quote) {
          if (text[i + 1] === quote) i++;
          else quote = null;
        }
        continue;
      }
      if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
      if (char === '(') { depth++; continue; }
      if (char === ')') { depth--; continue; }
      if (depth !== 0) continue;
      for (const keyword of keywords) {
        if (upper.startsWith(keyword, i) && isWordBoundary(upper[i - 1]) && isWordBoundary(upper[i + keyword.length])) return i;
      }
    }
    return -1;
  }

  function isWordBoundary(char) {
    return !char || !/[A-Z0-9_$#]/i.test(char);
  }

  function extractAttributeExpression(attrs, keyword, stopKeywords) {
    const start = findFirstTopLevelKeyword(attrs, [keyword]);
    if (start < 0) return '';
    const after = attrs.slice(start + keyword.length).trim();
    const end = findFirstTopLevelKeyword(after, stopKeywords);
    return (end < 0 ? after : after.slice(0, end)).trim();
  }

  function parseAlterTableForeignKeys(sql) {
    const foreignKeys = [];
    const regex = new RegExp(`ALTER\\s+TABLE\\s+(${SQL_QUALIFIED_IDENTIFIER_PATTERN})\\s+ADD\\s+(?:CONSTRAINT\\s+${SQL_IDENTIFIER_PATTERN}\\s+)?FOREIGN\\s+KEY\\s*\\(([^)]+)\\)\\s+REFERENCES\\s+(${SQL_QUALIFIED_IDENTIFIER_PATTERN})\\s*\\(([^)]+)\\)`, 'ig');
    let match;
    while ((match = regex.exec(sql))) {
      const fromTableName = cleanIdentifier(match[1]).toUpperCase();
      const fromColumns = parseIdentifierList(match[2]);
      const toTableName = cleanIdentifier(match[3]).toUpperCase();
      const toColumns = parseIdentifierList(match[4]);
      fromColumns.forEach((column, index) => foreignKeys.push({ fromTableName, fromFieldName: column, toTableName, toFieldName: toColumns[index] || toColumns[0], type: '1:N', label: '' }));
    }
    return foreignKeys;
  }

  function parseIdentifierList(text) {
    return splitTopLevel(text, ',').map(item => cleanIdentifier(item).toUpperCase()).filter(Boolean);
  }

  function splitEnumList(text) {
    return splitTopLevel(String(text || ''), ',').map(value => value.trim()).filter(Boolean);
  }

  function unquoteSqlValue(value) {
    const text = String(value || '').trim();
    if ((text.startsWith("'") && text.endsWith("'")) || (text.startsWith('"') && text.endsWith('"'))) {
      const quote = text[0];
      return text.slice(1, -1).replace(new RegExp(`${quote}${quote}`, 'g'), quote);
    }
    return text;
  }

  function sqlQuote(value) {
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  function cleanIdentifier(value) {
    let text = String(value || '').trim();
    const parsed = readQualifiedIdentifier(text, 0);
    if (parsed) text = parsed.value;
    else {
      const parts = text.split('.');
      text = parts[parts.length - 1].trim();
    }
    if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith('`') && text.endsWith('`')) || (text.startsWith('[') && text.endsWith(']'))) text = text.slice(1, -1);
    return text.replace(/[;\s]+$/g, '').trim();
  }

  function colorForIndex(index) {
    return ['#3867F4', '#0F766E', '#7C3AED', '#C2410C', '#BE123C', '#334155'][index % 6];
  }

  function openContextMenu(x, y) {
    elements.contextMenu.classList.remove('hidden');
    const width = 210;
    const height = 260;
    elements.contextMenu.style.left = `${Math.min(x, window.innerWidth - width - 8)}px`;
    elements.contextMenu.style.top = `${Math.min(y, window.innerHeight - height - 8)}px`;
  }

  function closeContextMenu() {
    elements.contextMenu.classList.add('hidden');
  }

  function handleContextAction(action) {
    if (selected?.type !== 'table') return;
    const tableId = selected.id;
    closeContextMenu();
    if (action === 'edit-table') openTableDialog(tableId);
    if (action === 'edit-sql') openTableSqlDialog(tableId);
    if (action === 'edit-relationship') openRelationshipFromTable(tableId);
    if (action === 'change-color') openQuickColorDialog(tableId);
    if (action === 'duplicate') duplicateTable(tableId);
    if (action === 'delete') deleteSelection();
  }

  function openQuickColorDialog(tableId) {
    const table = getTable(tableId);
    if (!table) return;
    quickColorTableId = tableId;
    elements.quickColorInput.value = table.headerColor;
    elements.quickColorText.value = table.headerColor;
    elements.colorDialog.showModal();
  }

  function saveQuickColor() {
    const table = getTable(quickColorTableId);
    if (!table) return;
    const color = elements.quickColorText.value.toUpperCase();
    if (!validHexColor(color)) return showToast('Informe uma cor hexadecimal válida.', 'error');
    pushHistory();
    table.headerColor = color;
    elements.colorDialog.close();
    render();
    scheduleSave();
  }

  function getTable(id) {
    return project.tables.find(table => table.id === id);
  }

  function getField(tableId, fieldId) {
    return getTable(tableId)?.fields.find(field => field.id === fieldId);
  }

  function getRelationship(id) {
    return project.relationships.find(rel => rel.id === id);
  }

  function validHexColor(value) {
    return /^#[0-9A-F]{6}$/i.test(String(value || '').trim());
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  }

  function escapeXml(value) {
    return escapeHtml(value);
  }

  function safeFileName(value) {
    return String(value || 'mbd-studio').trim().toLowerCase().replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'mbd-studio';
  }

  function downloadText(filename, content, mimeType) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Conteúdo copiado.', 'success');
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      showToast('Conteúdo copiado.', 'success');
    }
  }

  function getTopmostOpenDialog() {
    const openDialogs = $$('dialog[open]');
    return openDialogs.length ? openDialogs[openDialogs.length - 1] : null;
  }

  function placeToastContainer() {
    const host = getTopmostOpenDialog() || document.body;

    if (elements.toastContainer.parentElement !== host) {
      host.appendChild(elements.toastContainer);
    }

    return elements.toastContainer;
  }

  function restoreToastContainerToBody(dialog) {
    if (elements.toastContainer.parentElement === dialog) {
      document.body.appendChild(elements.toastContainer);
    }
  }

  function showToast(message, type = '') {
    const container = placeToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();

      if (!container.children.length && !getTopmostOpenDialog()) {
        document.body.appendChild(container);
      }
    }, 3400);
  }

  function toggleTheme() {
    const dark = !document.body.classList.contains('dark');
    document.body.classList.toggle('dark', dark);
    elements.themeBtn.textContent = dark ? '☀' : '☾';
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }

  function initializeTheme() {
    const dark = localStorage.getItem(THEME_KEY) === 'dark';
    document.body.classList.toggle('dark', dark);
    elements.themeBtn.textContent = dark ? '☀' : '☾';
  }

  // Desativa as mensagens de validação nativas do navegador.
  $$('form').forEach(form => { form.noValidate = true; });
  document.addEventListener('invalid', event => event.preventDefault(), true);

  elements.interactionForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!interactionRequest) return;
    if (interactionRequest.mode === 'prompt') {
      const value = elements.interactionInput.value.trim();
      const required = elements.interactionInput.dataset.required !== 'false';
      if (required && !value) {
        elements.interactionInputError.textContent = 'Informe um valor para continuar.';
        elements.interactionInputError.classList.remove('hidden');
        elements.interactionInput.setAttribute('aria-invalid', 'true');
        elements.interactionInput.focus();
        return;
      }
      finishInteraction(value);
      return;
    }
    finishInteraction(true);
  });
  elements.interactionInput.addEventListener('input', clearInteractionError);
  elements.interactionCancelBtn.addEventListener('click', () => finishInteraction(null));
  elements.interactionCloseBtn.addEventListener('click', () => finishInteraction(null));
  elements.interactionDialog.addEventListener('cancel', event => {
    event.preventDefault();
    finishInteraction(null);
  });

  elements.projectBtn.addEventListener('click', () => {
    renderProjectList();
    if (!elements.projectDialog.open) elements.projectDialog.showModal();
    setTimeout(() => elements.newProjectNameInput.focus(), 0);
  });
  elements.projectForm.addEventListener('submit', event => {
    event.preventDefault();
    createNewProject(elements.newProjectNameInput.value);
  });
  elements.projectList.addEventListener('click', event => {
    const button = event.target.closest('[data-project-action]');
    if (!button) return;
    void handleProjectAction(button.dataset.projectAction, button.dataset.projectId);
  });

  elements.newTableBtn.addEventListener('click', () => openTableDialog());
  elements.emptyNewTableBtn.addEventListener('click', () => openTableDialog());
  elements.nativeSqlBtn.addEventListener('click', () => openImportDialog('sql'));
  elements.addFieldBtn.addEventListener('click', () => addFieldEditor());
  elements.tableForm.addEventListener('submit', event => { event.preventDefault(); saveTableFromDialog(); });
  elements.relationshipBtn.addEventListener('click', () => toggleRelationshipMode());
  elements.relationshipForm.addEventListener('submit', event => { event.preventDefault(); saveRelationship(); });
  elements.relationshipDialog.addEventListener('close', () => {
    if (!editingRelationshipId) {
      pendingRelationship = null;
      relationSource = relationshipMode ? relationSource : null;
    }
    editingRelationshipId = null;
    render();
  });
  elements.autoLayoutBtn.addEventListener('click', autoLayout);
  elements.undoBtn.addEventListener('click', undo);
  elements.redoBtn.addEventListener('click', redo);
  elements.deleteBtn.addEventListener('click', deleteSelection);
  elements.zoomInBtn.addEventListener('click', () => setZoom(transform.scale + 0.1));
  elements.zoomOutBtn.addEventListener('click', () => setZoom(transform.scale - 0.1));
  elements.zoomResetBtn.addEventListener('click', () => setZoom(1));
  elements.fitBtn.addEventListener('click', fitDiagram);
  elements.themeBtn.addEventListener('click', toggleTheme);
  elements.helpBtn.addEventListener('click', () => {
    if (!elements.helpDialog.open) elements.helpDialog.showModal();
  });
  elements.backupBtn.addEventListener('click', () => elements.backupDialog.showModal());
  elements.linkBackupBtn.addEventListener('click', linkBackupFile);
  elements.saveBackupNowBtn.addEventListener('click', () => writeTxtBackup(true, true, true));
  elements.restoreLinkedBackupBtn.addEventListener('click', restoreLinkedBackup);
  elements.downloadBackupBtn.addEventListener('click', downloadTxtBackup);
  elements.restoreBackupInput.addEventListener('change', async () => {
    const file = elements.restoreBackupInput.files?.[0];
    if (!file) return;
    try {
      await restoreProjectFromText(await file.text(), file.name);
    } catch (error) {
      console.warn(error);
      showToast('Arquivo TXT inválido ou incompatível.', 'error');
    } finally {
      elements.restoreBackupInput.value = '';
    }
  });
  elements.searchInput.addEventListener('input', render);
  elements.importBtn.addEventListener('click', () => openImportDialog('json'));
  elements.importForm.addEventListener('submit', event => { event.preventDefault(); importProjectContent(); });
  elements.tableSqlForm.addEventListener('submit', event => { event.preventDefault(); applyTableSql(); });
  elements.colorForm.addEventListener('submit', event => { event.preventDefault(); saveQuickColor(); });

  elements.exportBtn.addEventListener('click', () => {
    elements.exportDialog.showModal();
  });
  elements.exportDialog.addEventListener('click', event => {
    const option = event.target.closest('[data-export]');
    if (!option) return;
    const type = option.dataset.export;
    elements.exportDialog.close();
    if (type === 'json') exportJson();
    if (type === 'sql') showSqlDialog();
    if (type === 'svg') exportSvg();
    if (type === 'html') exportHtml();
    if (type === 'txt') exportTxt();
  });

  elements.dialectSelect.addEventListener('change', () => { elements.sqlOutput.value = generateSql(elements.dialectSelect.value); });
  elements.copySqlBtn.addEventListener('click', () => copyText(elements.sqlOutput.value));
  elements.downloadSqlBtn.addEventListener('click', exportSql);

  $$('[data-close-dialog]').forEach(button => {
    button.addEventListener('click', () => document.getElementById(button.dataset.closeDialog).close());
  });

  $$('[data-import-tab]').forEach(button => button.addEventListener('click', () => {
    importMode = button.dataset.importTab;
    $$('[data-import-tab]').forEach(tab => tab.classList.toggle('active', tab === button));
    updateImportHint();
  }));

  elements.fileInput.addEventListener('change', async () => {
    const file = elements.fileInput.files?.[0];
    if (!file) return;
    elements.fileName.textContent = file.name;
    elements.importText.value = await file.text();
    if (/\.(json|txt)$/i.test(file.name)) {
      try {
        parseProjectText(elements.importText.value);
        importMode = 'json';
      } catch {
        importMode = 'sql';
      }
    } else {
      importMode = 'sql';
    }
    $$('[data-import-tab]').forEach(tab => tab.classList.toggle('active', tab.dataset.importTab === importMode));
    updateImportHint();
  });

  elements.tableHeaderColorInput.addEventListener('input', () => { elements.tableHeaderColorText.value = elements.tableHeaderColorInput.value.toUpperCase(); });
  elements.tableHeaderColorText.addEventListener('input', () => { if (validHexColor(elements.tableHeaderColorText.value)) elements.tableHeaderColorInput.value = elements.tableHeaderColorText.value; });
  elements.resetTableColorBtn.addEventListener('click', () => setTableColorControls(DEFAULT_HEADER_COLOR));
  $$('.color-preset').forEach(button => button.addEventListener('click', () => setTableColorControls(button.dataset.color)));
  elements.quickColorInput.addEventListener('input', () => { elements.quickColorText.value = elements.quickColorInput.value.toUpperCase(); });
  elements.quickColorText.addEventListener('input', () => { if (validHexColor(elements.quickColorText.value)) elements.quickColorInput.value = elements.quickColorText.value; });

  elements.contextMenu.addEventListener('click', event => {
    const action = event.target.dataset.action;
    if (action) handleContextAction(action);
  });

  elements.canvas.addEventListener('mousedown', event => {
    if (event.target.closest('.table-node') || event.target.closest('.relationship-hit')) return;
    if (event.button !== 0 && event.button !== 1) return;
    if (relationshipMode) cancelRelationshipMode();
    deselect();
    panState = { startX: event.clientX, startY: event.clientY, originX: transform.x, originY: transform.y };
    elements.canvas.classList.add('panning');
  });

  elements.canvas.addEventListener('wheel', event => {
    if (event.ctrlKey) {
      event.preventDefault();
      setZoom(transform.scale * (event.deltaY < 0 ? 1.1 : 0.9), event.clientX, event.clientY);
      return;
    }
    transform.x -= event.deltaX;
    transform.y -= event.deltaY;
    applyTransform();
  }, { passive: false });

  window.addEventListener('mousemove', event => {
    if (dragState) {
      const table = getTable(dragState.tableId);
      if (!table) return;
      const dx = (event.clientX - dragState.startX) / transform.scale;
      const dy = (event.clientY - dragState.startY) / transform.scale;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) dragState.moved = true;
      table.x = clamp(dragState.originX + dx, 0, WORLD_WIDTH - TABLE_WIDTH);
      table.y = clamp(dragState.originY + dy, 0, WORLD_HEIGHT - 100);
      render();
      return;
    }
    if (panState) {
      transform.x = panState.originX + event.clientX - panState.startX;
      transform.y = panState.originY + event.clientY - panState.startY;
      applyTransform();
    }
  });

  window.addEventListener('mouseup', () => {
    if (dragState?.moved) {
      const movedTable = getTable(dragState.tableId);
      const adjusted = resolveTableOverlap(movedTable);
      history.push(dragState.before);
      if (history.length > 80) history.shift();
      future = [];
      updateHistoryButtons();
      if (adjusted) render();
      scheduleSave();
    }
    dragState = null;
    panState = null;
    elements.canvas.classList.remove('panning');
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('#contextMenu') && !event.target.closest('.table-menu-btn')) closeContextMenu();
  });

  document.addEventListener('keydown', event => {
    const tag = event.target.tagName;
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || event.target.isContentEditable;
    if (event.key === 'F1') {
      event.preventDefault();
      if (!elements.helpDialog.open) elements.helpDialog.showModal();
      return;
    }
    if (event.code === 'Space' && !typing) { spacePressed = true; event.preventDefault(); }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'n') {
      event.preventDefault();
      renderProjectList();
      if (!elements.projectDialog.open) elements.projectDialog.showModal();
      setTimeout(() => elements.newProjectNameInput.focus(), 0);
      return;
    }
    if (typing) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
    else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
    else if (event.key === 'Delete') deleteSelection();
    else if (event.key.toLowerCase() === 't') openTableDialog();
    else if (event.key.toLowerCase() === 'r') toggleRelationshipMode();
    else if (event.key === 'Escape') { cancelRelationshipMode(); deselect(); }
  });

  document.addEventListener('keyup', event => { if (event.code === 'Space') spacePressed = false; });
  window.addEventListener('resize', () => applyTransform());

  $$('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => restoreToastContainerToBody(dialog));
  });

  initializeTheme();
  updateBackupUI();
  updateHistoryButtons();
  render();
  try { persistWorkspaceNow(false); } catch (error) { console.warn(error); }
  restoreStoredBackupHandle(activeProjectId);
})();
