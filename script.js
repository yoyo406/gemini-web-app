import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.14.0';

env.allowLocalModels = false;

document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM ELEMENTS ---
    const memoryList = document.getElementById('memoryList');
    const addBtn = document.getElementById('addBtn');
    
    // Add Modal
    const addModal = document.getElementById('addModal');
    const closeAddModal = document.getElementById('closeAddModal');
    const saveNoteBtn = document.getElementById('saveNoteBtn');
    const noteType = document.getElementById('noteType');
    const noteContent = document.getElementById('noteContent');
    const noteImage = document.getElementById('noteImage');
    const imageUploadGroup = document.getElementById('imageUploadGroup');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const eventFields = document.getElementById('eventFields');
    const eventDate = document.getElementById('eventDate');
    const micBtn = document.getElementById('micBtn');
    const aiStatus = document.getElementById('aiStatus');
    const addTagInput = document.getElementById('addTagInput');
    const addTagsList = document.getElementById('addTagsList');

    // Voice Recorder Elements
    const voiceRecorder = document.getElementById('voiceRecorder');
    const recordBtn = document.getElementById('recordBtn');
    const stopBtn = document.getElementById('stopBtn');
    const playPreviewBtn = document.getElementById('playPreviewBtn');
    const deleteRecordingBtn = document.getElementById('deleteRecordingBtn');
    const transcriptionPreview = document.getElementById('transcriptionPreview');
    const recorderStatus = document.querySelector('.recorder-status');
    const recorderTimer = document.querySelector('.recorder-timer');

    // View Modal
    const viewModal = document.getElementById('viewModal');
    const closeViewModal = document.getElementById('closeViewModal');
    const viewType = document.getElementById('viewType');
    const viewContent = document.getElementById('viewContent');
    const viewTime = document.getElementById('viewTime');
    const viewEventDetails = document.getElementById('viewEventDetails');
    const viewImageContainer = document.getElementById('viewImageContainer');
    const viewAudioContainer = document.getElementById('viewAudioContainer');
    const viewAudioPlayBtn = document.getElementById('viewAudioPlayBtn');
    const viewAudioElement = document.getElementById('viewAudioElement');
    const deleteNoteBtn = document.getElementById('deleteNoteBtn');
    const pinNoteBtn = document.getElementById('pinNoteBtn');
    const viewTagInput = document.getElementById('viewTagInput');
    const viewTagsList = document.getElementById('viewTagsList');

    // Widgets & Sidebar
    const recentPreview = document.getElementById('recentPreview');
    const recentText = document.getElementById('recentText');
    const recentTime = document.getElementById('recentTime');
    const upcomingTitle = document.getElementById('upcomingTitle');
    const upcomingDesc = document.getElementById('upcomingDesc');
    const upcomingTime = document.getElementById('upcomingTime');
    const tagFilterList = document.getElementById('tagFilterList');

    // Variables
    let currentAddTags = [];
    let currentViewTags = [];
    let currentViewId = null;
    let currentNote = null;
    let currentFilter = null;
    let classifier = null;

    // Recorder Variables
    let mediaRecorder;
    let audioChunks = [];
    let audioBlob = null;
    let recognition;
    let transcript = "";
    let isRecording = false;
    let recordingStartTime;
    let timerInterval;

    // --- INITIALIZATION ---
    try {
        await db.init();
        await refreshAll();
    } catch (err) {
        console.error("DB Init Error:", err);
    }

    async function refreshAll() {
        const notes = await db.getAllNotes(currentFilter);
        renderItems(notes);
        await updateWidgets();
        await updateFilterSidebar();
    }

    // --- WIDGETS ---
    async function updateWidgets() {
        const recent = await db.getRecentMedia();
        if (recent) {
            recentPreview.style.backgroundImage = `url(${recent.imageData})`;
            recentText.textContent = recent.type === '[PHOTO]' ? 'Photo' : 'Image';
            recentTime.textContent = new Date(recent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            recentPreview.style.backgroundImage = 'none';
            recentText.textContent = 'No Media';
            recentTime.textContent = '--:--';
        }

        const upcoming = await db.getUpcomingEvents();
        if (upcoming && upcoming.length > 0) {
            const next = upcoming[0];
            upcomingTitle.textContent = next.content || 'Event';
            upcomingDesc.textContent = new Date(next.eventDate).toLocaleDateString();
            upcomingTime.textContent = new Date(next.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            upcomingTitle.textContent = 'Nothing';
            upcomingDesc.textContent = 'Planned';
            upcomingTime.textContent = '--:--';
        }
    }

    // --- SIDEBAR FILTERS ---
    async function updateFilterSidebar() {
        const tags = await db.getUniqueTags();
        tagFilterList.innerHTML = `<li class="${currentFilter === null ? 'active' : ''}" data-tag="all">ALL</li>`;
        
        tags.forEach(tag => {
            const li = document.createElement('li');
            li.textContent = tag;
            if (currentFilter === tag) li.classList.add('active');
            li.onclick = () => { currentFilter = tag; refreshAll(); };
            tagFilterList.appendChild(li);
        });

        tagFilterList.querySelector('[data-tag="all"]').onclick = () => { currentFilter = null; refreshAll(); };
    }

    // --- RENDER ITEMS ---
    function renderItems(items) {
        memoryList.innerHTML = '';
        items.forEach(item => {
            const el = document.createElement('div');
            el.className = `memory-item ${item.isPinned ? 'pinned' : ''}`;
            el.onclick = () => openViewModal(item);

            const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let preview = item.imageData ? `<img src="${item.imageData}" class="item-image-preview">` : '';
            
            // Text logic
            let displayText = item.content;
            if (item.type === '[VOICE]') displayText = item.transcript ? `"${item.transcript}"` : 'Voice Memo';
            if (!displayText && item.imageData) displayText = 'Image Attachment';
            if (!displayText) displayText = 'Empty Note';

            el.innerHTML = `
                ${preview}
                <div class="item-content-wrapper">
                    <span class="item-type">${item.type}</span>
                    <p class="item-content">${displayText}</p>
                    <span class="item-time">${timeStr}</span>
                </div>
            `;
            memoryList.appendChild(el);
        });
    }

    // --- ADD MODAL LOGIC ---
    addBtn.addEventListener('click', () => {
        addModal.classList.add('active');
        // Reset Form
        noteContent.value = '';
        noteImage.value = '';
        noteType.value = '[NOTE]';
        eventDate.value = '';
        imagePreview.src = '';
        imagePreviewContainer.classList.add('hidden');
        imageUploadGroup.style.display = 'none';
        eventFields.style.display = 'none';
        voiceRecorder.style.display = 'none';
        
        currentAddTags = [];
        renderTags(addTagsList, currentAddTags, 'add');
        aiStatus.textContent = '';
        
        resetVoiceRecorderState();
    });

    closeAddModal.addEventListener('click', () => {
        addModal.classList.remove('active');
        resetVoiceRecorderState();
    });

    // Handle Type Toggle (THE BUG FIX)
    noteType.addEventListener('change', () => {
        imageUploadGroup.style.display = 'none';
        eventFields.style.display = 'none';
        voiceRecorder.style.display = 'none';
        
        // Reset Voice if switching away
        if (isRecording) stopBtn.click();

        if (noteType.value === '[PHOTO]') imageUploadGroup.style.display = 'block';
        else if (noteType.value === '[EVENT]') eventFields.style.display = 'block';
        else if (noteType.value === '[VOICE]') voiceRecorder.style.display = 'block';
    });

    // Image Preview
    noteImage.addEventListener('change', async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await convertToBase64(file);
            imagePreview.src = base64;
            imagePreviewContainer.classList.remove('hidden');
            
            // AI Auto Tag
            const model = await getClassifier();
            if (model) {
                aiStatus.textContent = 'Scanning...';
                const output = await model(base64);
                aiStatus.textContent = 'Tagged';
                if (output && output.length) {
                    output.slice(0, 2).forEach(p => addTag(p.label, 'add'));
                }
            }
        }
    });

    // SAVE LOGIC
    saveNoteBtn.addEventListener('click', async () => {
        const type = noteType.value;
        const content = noteContent.value;
        let imageData = null;
        let eDate = null;

        if (type === '[PHOTO]' && noteImage.files[0]) {
            imageData = await convertToBase64(noteImage.files[0]);
        }
        if (type === '[EVENT]') {
            eDate = eventDate.value;
            if (!eDate) return alert('Date required for event');
        }

        const newNote = {
            type,
            content,
            imageData,
            eventDate: eDate,
            tags: currentAddTags,
            timestamp: new Date().toISOString(),
            isPinned: false
        };

        if (type === '[VOICE]') {
            if (!audioBlob) return alert('No recording found');
            newNote.audioBlob = audioBlob;
            newNote.transcript = transcript;
        } else if (!content && !imageData && type !== '[EVENT]') {
            return; // Empty note
        }

        await db.addNote(newNote);
        addModal.classList.remove('active');
        refreshAll();
    });

    // --- VIEW MODAL LOGIC ---
    function openViewModal(item) {
        currentViewId = item.id;
        currentNote = item;
        viewType.textContent = item.type;
        viewTime.textContent = new Date(item.timestamp).toLocaleString();
        
        // Reset View
        viewImageContainer.innerHTML = '';
        viewAudioContainer.style.display = 'none';
        viewAudioElement.pause();
        viewAudioPlayBtn.textContent = '▶';

        // Content
        viewContent.textContent = item.content;

        // Image
        if (item.imageData) {
            const img = document.createElement('img');
            img.src = item.imageData;
            viewImageContainer.appendChild(img);
        }

        // Voice
        if (item.type === '[VOICE]' && item.audioBlob) {
            viewAudioContainer.style.display = 'flex';
            viewAudioElement.src = URL.createObjectURL(item.audioBlob);
            
            // Fix Audio Button Logic
            viewAudioPlayBtn.onclick = () => {
                if (viewAudioElement.paused) {
                    viewAudioElement.play();
                    viewAudioPlayBtn.textContent = '⏸';
                } else {
                    viewAudioElement.pause();
                    viewAudioPlayBtn.textContent = '▶';
                }
            };
            viewAudioElement.onended = () => {
                viewAudioPlayBtn.textContent = '▶';
            };

            if (item.transcript) {
                viewContent.innerHTML = `<em style="color:#666">"${item.transcript}"</em><br><br>${item.content}`;
            }
        }

        // Event
        viewEventDetails.textContent = (item.type === '[EVENT]' && item.eventDate) 
            ? `Due: ${new Date(item.eventDate).toLocaleString()}` : '';

        // Tags
        currentViewTags = item.tags || [];
        renderTags(viewTagsList, currentViewTags, 'view');
        
        pinNoteBtn.textContent = item.isPinned ? 'UNPIN' : 'PIN';
        viewModal.classList.add('active');
    }

    closeViewModal.addEventListener('click', () => {
        viewModal.classList.remove('active');
        viewAudioElement.pause();
    });

    deleteNoteBtn.addEventListener('click', async () => {
        if(confirm('Delete this entry?')) {
            await db.deleteNote(currentViewId);
            viewModal.classList.remove('active');
            refreshAll();
        }
    });

    pinNoteBtn.addEventListener('click', async () => {
        const newStatus = await db.togglePin(currentViewId);
        pinNoteBtn.textContent = newStatus ? 'UNPIN' : 'PIN';
        refreshAll();
    });

    // --- VOICE RECORDER ENGINE ---
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (e) => {
            let temp = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) transcript += e.results[i][0].transcript;
                else temp += e.results[i][0].transcript;
            }
            transcriptionPreview.textContent = transcript + temp;
        };
    }

    recordBtn.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            transcript = "";
            transcriptionPreview.textContent = "";

            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                playPreviewBtn.disabled = false;
                deleteRecordingBtn.disabled = false;
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            if (recognition) recognition.start();
            
            isRecording = true;
            recorderStatus.textContent = "REC";
            recorderStatus.style.color = "var(--accent-color)";
            recordBtn.disabled = true;
            stopBtn.disabled = false;
            
            recordingStartTime = Date.now();
            timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - recordingStartTime)/1000);
                const min = String(Math.floor(elapsed/60)).padStart(2,'0');
                const sec = String(elapsed%60).padStart(2,'0');
                recorderTimer.textContent = `${min}:${sec}`;
            }, 1000);

        } catch (err) {
            alert("Mic permission denied");
        }
    });

    stopBtn.addEventListener('click', () => {
        if (!isRecording) return;
        mediaRecorder.stop();
        if (recognition) recognition.stop();
        isRecording = false;
        recorderStatus.textContent = "DONE";
        recorderStatus.style.color = "var(--text-secondary)";
        recordBtn.disabled = false;
        stopBtn.disabled = true;
        clearInterval(timerInterval);
    });

    playPreviewBtn.addEventListener('click', () => {
        if (audioBlob) new Audio(URL.createObjectURL(audioBlob)).play();
    });

    deleteRecordingBtn.addEventListener('click', resetVoiceRecorderState);

    function resetVoiceRecorderState() {
        if (isRecording) stopBtn.click();
        audioBlob = null;
        transcript = "";
        transcriptionPreview.textContent = "";
        recorderTimer.textContent = "00:00";
        recorderStatus.textContent = "READY";
        playPreviewBtn.disabled = true;
        deleteRecordingBtn.disabled = true;
    }

    // --- UTILS & TAGS ---
    function renderTags(container, tags, mode) {
        container.innerHTML = '';
        tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag-pill';
            span.innerHTML = `${tag} <span class="remove-tag">×</span>`;
            span.querySelector('.remove-tag').onclick = (e) => {
                e.stopPropagation();
                if (mode === 'add') currentAddTags = currentAddTags.filter(t => t !== tag);
                else {
                    currentViewTags = currentViewTags.filter(t => t !== tag);
                    if (currentNote) { currentNote.tags = currentViewTags; db.updateNote(currentNote).then(refreshAll); }
                }
                renderTags(container, mode === 'add' ? currentAddTags : currentViewTags, mode);
            };
            container.appendChild(span);
        });
    }

    function addTag(tag, mode) {
        const clean = tag.trim().toLowerCase();
        if(!clean) return;
        if (mode === 'add' && !currentAddTags.includes(clean)) {
            currentAddTags.push(clean);
            renderTags(addTagsList, currentAddTags, 'add');
        } else if (mode === 'view' && !currentViewTags.includes(clean)) {
            currentViewTags.push(clean);
            renderTags(viewTagsList, currentViewTags, 'view');
            if (currentNote) { currentNote.tags = currentViewTags; db.updateNote(currentNote).then(refreshAll); }
        }
    }

    addTagInput.addEventListener('keydown', e => { if(e.key==='Enter') { e.preventDefault(); addTag(addTagInput.value, 'add'); addTagInput.value=''; }});
    viewTagInput.addEventListener('keydown', e => { if(e.key==='Enter') { e.preventDefault(); addTag(viewTagInput.value, 'view'); viewTagInput.value=''; }});

    function convertToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    async function getClassifier() {
        if (!classifier) {
            aiStatus.textContent = 'Loading AI...';
            try {
                classifier = await pipeline('image-classification', 'Xenova/resnet-50');
                aiStatus.textContent = '';
            } catch (e) { aiStatus.textContent = 'AI Error'; }
        }
        return classifier;
    }

    // Settings Toggle Logic
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    
    settingsBtn.addEventListener('click', (e) => { e.stopPropagation(); settingsMenu.classList.toggle('active'); });
    document.addEventListener('click', (e) => { if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) settingsMenu.classList.remove('active'); });
    
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const setting = btn.dataset.setting;
            const value = btn.dataset.value;
            btn.parentElement.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (setting === 'theme') {
                document.documentElement.setAttribute('data-theme', value);
                localStorage.setItem('theme', value);
            } else if (setting === 'accent') {
                document.documentElement.style.setProperty('--accent-color', value === 'grey' ? '#A0A0A0' : '#D71921');
            }
        });
    });

    // Load saved theme
