// AI Study Planner - Main Application Logic with localStorage

// Constants
const STORAGE_KEY = 'ai_study_planner_courses';

// State management
let courses = [];
let currentAssignment = null;
let currentCourse = null;
let currentCourseForNewAssignment = null;
let calendarCurrentDate = new Date();
let selectedDate = null;
let deleteConfirmCallback = null;
let stepsEditMode = false;
let previousProgress = 0; // Track progress before marking as done
let courseLinksEditMode = {};
let draggedLinkElement = null;
let draggedLinkCourseId = null;

// DOM Elements
const coursesGrid = document.getElementById('coursesGrid');
const detailModal = document.getElementById('detailModal');
const courseModal = document.getElementById('courseModal');
const assignmentModal = document.getElementById('assignmentModal');
const addCourseBtn = document.getElementById('addCourseBtn');
const closeCourseModalBtn = document.getElementById('closeCourseModal');
const closeAssignmentModalBtn = document.getElementById('closeAssignmentModal');
const closeDetailModalBtn = document.getElementById('closeModal');
const courseForm = document.getElementById('courseForm');
const assignmentForm = document.getElementById('assignmentForm');
const cancelCourseBtn = document.getElementById('cancelCourseBtn');
const cancelAssignmentBtn = document.getElementById('cancelAssignmentBtn');
const generateStepsBtn = document.getElementById('generateStepsBtn');
const progressSlider = document.getElementById('progressSlider');
const loadingOverlay = document.getElementById('loadingOverlay');
const timeline = document.getElementById('timeline');
const toast = document.getElementById('toast');
const markDoneBtn = document.getElementById('markDoneBtn');
const deleteTaskBtn = document.getElementById('deleteTaskBtn');
const confirmDeleteModal = document.getElementById('confirmDeleteModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Mock data for first-time users (empty - no default courses)
const DEFAULT_COURSES = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadCoursesFromStorage();
    renderCourses();
    renderTimeline();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Course modal
    if (addCourseBtn) addCourseBtn.addEventListener('click', openCourseModal);
    if (closeCourseModalBtn) closeCourseModalBtn.addEventListener('click', closeCourseModal);
    if (cancelCourseBtn) cancelCourseBtn.addEventListener('click', closeCourseModal);
    if (courseForm) courseForm.addEventListener('submit', createNewCourse);
    
    // Assignment modal
    if (closeAssignmentModalBtn) closeAssignmentModalBtn.addEventListener('click', closeAssignmentModal);
    if (cancelAssignmentBtn) cancelAssignmentBtn.addEventListener('click', closeAssignmentModal);
    if (assignmentForm) assignmentForm.addEventListener('submit', createNewAssignment);
    
    // Calendar picker
    const dateDisplay = document.getElementById('assignmentDeadlineDisplay');
    const calendarPicker = document.getElementById('calendarPicker');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    
    if (dateDisplay) {
        dateDisplay.addEventListener('click', () => {
            if (calendarPicker) {
                calendarPicker.classList.toggle('active');
                if (calendarPicker.classList.contains('active')) {
                    renderCalendar();
                }
            }
        });
    }
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    // Close calendar when clicking outside
    document.addEventListener('click', (e) => {
        if (calendarPicker && dateDisplay && !calendarPicker.contains(e.target) && !dateDisplay.contains(e.target)) {
            calendarPicker.classList.remove('active');
        }
    });
    
    // Detail modal
    if (closeDetailModalBtn) closeDetailModalBtn.addEventListener('click', closeDetailModal);
    if (generateStepsBtn) generateStepsBtn.addEventListener('click', generateStepsWithAI);
    if (markDoneBtn) markDoneBtn.addEventListener('click', markAssignmentDone);
    if (deleteTaskBtn) deleteTaskBtn.addEventListener('click', () => {
        showDeleteConfirmation('האם אתה בטוח שאתה רוצה למחוק מטלה זו?', deleteAssignment);
    });
    
    // Edit general info mode
    const editGeneralBtn = document.getElementById('editGeneralBtn');
    const saveEditBtn = document.getElementById('saveEditBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (editGeneralBtn) editGeneralBtn.addEventListener('click', toggleEditGeneralMode);
    if (saveEditBtn) saveEditBtn.addEventListener('click', saveGeneralInfoEdit);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', cancelGeneralInfoEdit);
    
    // Edit steps mode
    const editStepsBtn = document.getElementById('editStepsBtn');
    if (editStepsBtn) {
        editStepsBtn.addEventListener('click', toggleStepsEditMode);
    }
    
    // Manual step input
    const addManualStepBtn = document.getElementById('addManualStepBtn');
    const manualStepInput = document.getElementById('manualStepInput');
    if (addManualStepBtn) addManualStepBtn.addEventListener('click', addManualStep);
    if (manualStepInput) {
        manualStepInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addManualStep();
            }
        });
    }
    
    // Delete confirmation modal
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteConfirmation);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', () => {
        if (deleteConfirmCallback) {
            deleteConfirmCallback();
            closeDeleteConfirmation();
        }
    });
    
    // Close modals when clicking outside
    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) closeDetailModal();
        });
    }
    if (courseModal) {
        courseModal.addEventListener('click', (e) => {
            if (e.target === courseModal) closeCourseModal();
        });
    }
    if (assignmentModal) {
        assignmentModal.addEventListener('click', (e) => {
            if (e.target === assignmentModal) closeAssignmentModal();
        });
    }
}

// ========== localStorage Functions ==========

// Load courses from localStorage or use defaults
function loadCoursesFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            courses = JSON.parse(stored).map(course => ({
                ...course,
                links: Array.isArray(course.links) ? course.links : [],
                assignments: Array.isArray(course.assignments) ? course.assignments : []
            }));
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            courses = JSON.parse(JSON.stringify(DEFAULT_COURSES));
        }
    } else {
        courses = JSON.parse(JSON.stringify(DEFAULT_COURSES));
    }
}

// Save courses to localStorage
function saveCoursesToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

// ========== Course Functions ==========

// Open course creation modal
function openCourseModal() {
    courseForm.reset();
    courseModal.classList.add('active');
    document.getElementById('courseName').focus();
}

// Close course modal
function closeCourseModal() {
    courseModal.classList.remove('active');
    courseForm.reset();
}

// Create new course
function createNewCourse(e) {
    e.preventDefault();
    const courseName = document.getElementById('courseName').value.trim();
    
    if (!courseName) {
        showToast('אנא הכנס שם קורס', 'error');
        return;
    }
    
    const newCourse = {
        id: Date.now().toString(),
        title: courseName,
        assignments: [],
        links: []
    };
    
    courses.push(newCourse);
    saveCoursesToStorage();
    renderCourses();
    closeCourseModal();
    showToast(`הקורס "${courseName}" נוצר!`);
}

function normalizeUrl(url) {
    if (!url) return '';
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function addImportantLink(courseId) {
    const title = prompt('שם הקישור:');
    if (!title || !title.trim()) return;

    const urlInput = prompt('כתובת הקישור:');
    if (!urlInput || !urlInput.trim()) return;

    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    if (!Array.isArray(course.links)) {
        course.links = [];
    }

    course.links.push({
        id: `link-${Date.now()}`,
        title: title.trim(),
        url: normalizeUrl(urlInput.trim())
    });

    saveCoursesToStorage();
    renderCourses();
    showToast('הקישור נוסף בהצלחה!');
}

function toggleCourseLinksEditMode(courseId) {
    courseLinksEditMode[courseId] = !courseLinksEditMode[courseId];
    renderCourses();
}

function editImportantLink(courseId, linkId) {
    const course = courses.find(c => c.id === courseId);
    if (!course || !Array.isArray(course.links)) return;

    const link = course.links.find(l => l.id === linkId);
    if (!link) return;

    const newTitle = prompt('שם הקישור:', link.title);
    if (!newTitle || !newTitle.trim()) return;

    const newUrl = prompt('כתובת הקישור:', link.url);
    if (!newUrl || !newUrl.trim()) return;

    link.title = newTitle.trim();
    link.url = normalizeUrl(newUrl.trim());

    saveCoursesToStorage();
    renderCourses();
    showToast('הקישור עודכן בהצלחה!');
}

function deleteImportantLink(courseId, linkId) {
    const course = courses.find(c => c.id === courseId);
    if (!course || !Array.isArray(course.links)) return;

    course.links = course.links.filter(link => link.id !== linkId);

    saveCoursesToStorage();
    renderCourses();
    showToast('הקישור נמחק!');
}

function handleLinkDragStart(e) {
    draggedLinkElement = this;
    draggedLinkCourseId = this.dataset.courseId;
    e.dataTransfer.effectAllowed = 'move';
    this.classList.add('dragging');
}

function handleLinkDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.course-link-edit-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

function handleLinkDragOver(e) {
    e.preventDefault();
    if (this !== draggedLinkElement) {
        this.classList.add('drag-over');
    }
}

function handleLinkDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedLinkElement || draggedLinkCourseId !== this.dataset.courseId) return;

    const courseId = this.dataset.courseId;
    const draggedId = draggedLinkElement.dataset.linkId;
    const targetId = this.dataset.linkId;

    const course = courses.find(c => c.id === courseId);
    if (!course || !Array.isArray(course.links)) return;

    const draggedIndex = course.links.findIndex(link => link.id === draggedId);
    const targetIndex = course.links.findIndex(link => link.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const [movedLink] = course.links.splice(draggedIndex, 1);
    course.links.splice(targetIndex, 0, movedLink);

    saveCoursesToStorage();
    renderCourses();
}

// ========== Assignment Functions ==========

// Open assignment creation modal for a specific course
function openAssignmentModal(course) {
    currentCourseForNewAssignment = course;
    assignmentForm.reset();
    document.getElementById('assignmentModalCourse').textContent = `עבור ${course.title}`;
    
    // Reset calendar to today
    calendarCurrentDate = new Date();
    selectedDate = new Date();
    
    // Set date display to today
    const displayInput = document.getElementById('assignmentDeadlineDisplay');
    if (displayInput) {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        displayInput.value = selectedDate.toLocaleDateString('he-IL', options);
    }
    
    // Set hidden input to today
    const hiddenInput = document.getElementById('assignmentDeadline');
    if (hiddenInput) {
        hiddenInput.value = selectedDate.toISOString().split('T')[0];
    }
    
    // Close calendar if open
    const calendarPicker = document.getElementById('calendarPicker');
    if (calendarPicker) {
        calendarPicker.classList.remove('active');
    }
    
    assignmentModal.classList.add('active');
    document.getElementById('assignmentTitle').focus();
}

// Close assignment modal
function closeAssignmentModal() {
    assignmentModal.classList.remove('active');
    assignmentForm.reset();
    currentCourseForNewAssignment = null;
    
    // Close calendar if open
    const calendarPicker = document.getElementById('calendarPicker');
    if (calendarPicker) {
        calendarPicker.classList.remove('active');
    }
}

// Create new assignment
function createNewAssignment(e) {
    e.preventDefault();
    
    if (!currentCourseForNewAssignment) return;
    
    const title = document.getElementById('assignmentTitle').value.trim();
    const deadline = document.getElementById('assignmentDeadline').value;
    const brief = document.getElementById('assignmentBrief').value.trim();
    
    if (!title || !deadline) {
        showToast('אנא מלא את שם המטלה והתאריך', 'error');
        return;
    }
    
    const newAssignment = {
        id: Date.now().toString(),
        title,
        deadline,
        brief,
        progress: 0,
        steps: []
    };
    
    // Find and update the course
    const courseIndex = courses.findIndex(c => c.id === currentCourseForNewAssignment.id);
    if (courseIndex !== -1) {
        courses[courseIndex].assignments.push(newAssignment);
        saveCoursesToStorage();
        renderCourses();
        renderTimeline();
        closeAssignmentModal();
        showToast(`המטלה "${title}" הוספה!`);
    }
}

// ========== Calendar Functions ==========

// Render calendar
function renderCalendar() {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    
    // Set header
    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
                       'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const calendarMonth = document.getElementById('calendarMonth');
    if (calendarMonth) {
        calendarMonth.textContent = `${monthNames[month]} ${year}`;
    }
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    calendarDays.innerHTML = '';
    
    // Previous month's days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayEl = createDayElement(day, true);
        calendarDays.appendChild(dayEl);
    }
    
    // Current month's days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = day === today.getDate() && 
                       month === today.getMonth() && 
                       year === today.getFullYear();
        
        const isSelected = selectedDate && 
                          day === selectedDate.getDate() && 
                          month === selectedDate.getMonth() && 
                          year === selectedDate.getFullYear();
        
        const dayEl = createDayElement(day, false, isToday, isSelected);
        dayEl.addEventListener('click', () => setSelectedDate(year, month, day));
        calendarDays.appendChild(dayEl);
    }
    
    // Next month's days
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createDayElement(day, true);
        calendarDays.appendChild(dayEl);
    }
}

// Create day element
function createDayElement(day, isOtherMonth = false, isToday = false, isSelected = false) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    if (isOtherMonth) dayEl.classList.add('other-month');
    if (isToday) dayEl.classList.add('today');
    if (isSelected) dayEl.classList.add('selected');
    dayEl.textContent = day;
    return dayEl;
}

// Set selected date
function setSelectedDate(year, month, day) {
    selectedDate = new Date(year, month, day);
    
    // Format as YYYY-MM-DD
    const formattedDate = selectedDate.toISOString().split('T')[0];
    
    // Update hidden input
    const hiddenInput = document.getElementById('assignmentDeadline');
    if (hiddenInput) {
        hiddenInput.value = formattedDate;
    }
    
    // Update display
    const displayInput = document.getElementById('assignmentDeadlineDisplay');
    if (displayInput) {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        displayInput.value = selectedDate.toLocaleDateString('he-IL', options);
    }
    
    // Re-render calendar to show selected state
    renderCalendar();
    
    // Close calendar
    const calendarPicker = document.getElementById('calendarPicker');
    if (calendarPicker) {
        calendarPicker.classList.remove('active');
    }
}

// ========== Render Functions ==========

// Render all courses and their assignments
function renderCourses() {
    coursesGrid.innerHTML = '';
    
    if (courses.length === 0) {
        coursesGrid.innerHTML = '<p style="color: var(--text-light); grid-column: 1 / -1;">אין קורסים עדיין. לחץ על \"+ קורס חדש\" כדי להתחיל!</p>';
        return;
    }
    
    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'course-card';
        
        // Header with title and menu
        const header = document.createElement('div');
        header.className = 'course-header';
        header.innerHTML = `
            <button class="btn-course-menu" title="אפשרויות">⋮</button>
            <h3 class="course-title">${course.title}</h3>
        `;
        
        // Dropdown menu
        const dropdown = document.createElement('div');
        dropdown.className = 'course-dropdown';
        dropdown.innerHTML = `
            <button class="dropdown-item" data-action="rename">שינוי שם קורס</button>
            <button class="dropdown-item dropdown-danger" data-action="delete">מחק קורס</button>
        `;
        
        // Assignments list
        const assignmentsList = document.createElement('ul');
        assignmentsList.className = 'assignments-list';
        
        if (course.assignments.length === 0) {
            const emptyMsg = document.createElement('li');
            emptyMsg.style.color = 'var(--text-light)';
            emptyMsg.style.fontSize = '0.9rem';
            emptyMsg.textContent = 'אין מטלות עדיין';
            assignmentsList.appendChild(emptyMsg);
        } else {
            course.assignments.forEach(assignment => {
                const item = document.createElement('li');
                item.className = 'assignment-item';
                item.innerHTML = `
                    <div class="assignment-title">${assignment.title}</div>
                    <div class="assignment-deadline">סיום: ${formatDate(assignment.deadline)}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${assignment.progress}%"></div>
                    </div>
                `;
                item.addEventListener('click', () => openAssignmentDetail(course, assignment));
                assignmentsList.appendChild(item);
            });
        }

        // Links
        const linksSection = document.createElement('div');
        linksSection.className = 'course-links-section';

        const isLinksEditMode = !!courseLinksEditMode[course.id];

        linksSection.innerHTML = `
            <div class="course-links-header">
                <h4 class="course-links-title">קישורים חשובים</h4>
                <button type="button" class="btn-edit-links ${isLinksEditMode ? 'active' : ''}" title="ערוך קישורים"></button>
            </div>
            <div class="course-links-list">
                ${
                    course.links && course.links.length > 0
                        ? isLinksEditMode
                            ? course.links.map(link => `
                                <div class="course-link-edit-item" draggable="true" data-course-id="${course.id}" data-link-id="${link.id}">
                                    <span class="drag-handle" title="גרור כדי לשנות סדר">⋮⋮⋮</span>
                                    <span class="course-link-text">${link.title}</span>
                                    <div class="course-link-actions">
                                        <button type="button" class="course-link-action" data-action="edit" data-link-id="${link.id}">ערוך</button>
                                        <button type="button" class="step-delete-circle-btn course-link-delete-btn" data-action="delete" data-link-id="${link.id}" title="מחק קישור"></button>
                                    </div>
                                </div>
                            `).join('')
                            : course.links.map(link => `
                                <a class="course-link-anchor" href="${link.url}" target="_blank" rel="noopener noreferrer">
                                    ${link.title}
                                </a>
                            `).join('')
                        : '<p class="course-links-empty">אין קישורים עדיין</p>'
                }
            </div>
            <div class="course-links-footer">
                <button type="button" class="btn-add-link" title="הוסף קישור">+</button>
            </div>
        `;

        linksSection.querySelector('.btn-add-link').addEventListener('click', (e) => {
            e.stopPropagation();
            addImportantLink(course.id);
        });

        linksSection.querySelector('.btn-edit-links').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCourseLinksEditMode(course.id);
        });

        if (isLinksEditMode) {
            linksSection.querySelectorAll('.course-link-edit-item').forEach(item => {
                item.addEventListener('dragstart', handleLinkDragStart);
                item.addEventListener('dragend', handleLinkDragEnd);
                item.addEventListener('dragover', handleLinkDragOver);
                item.addEventListener('drop', handleLinkDrop);
            });

            linksSection.querySelectorAll('.course-link-action[data-action="edit"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editImportantLink(course.id, btn.dataset.linkId);
                });
            });

            linksSection.querySelectorAll('.course-link-delete-btn[data-action="delete"]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteImportantLink(course.id, btn.dataset.linkId);
                });
            });
        }

        // Footer with add button
        const footer = document.createElement('div');
        footer.className = 'course-footer';
        footer.innerHTML = `<button class="btn-add-assignment" title="הוסף מטלה">+</button>`;
        
        courseCard.appendChild(header);
        courseCard.appendChild(dropdown);
        courseCard.appendChild(assignmentsList);
        courseCard.appendChild(footer);
        courseCard.appendChild(linksSection);
        coursesGrid.appendChild(courseCard);
        
        // Menu toggle
        header.querySelector('.btn-course-menu').addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });
        
        // Menu items
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                
                if (action === 'rename') {
                    renameCoursePrepare(course);
                } else if (action === 'delete') {
                    showDeleteConfirmation(
                        `האם אתה בטוח שברצונך למחוק את קורס "${course.title}" וכל המטלות שלו?`,
                        () => deleteCourse(course.id)
                    );
                }
                
                dropdown.classList.remove('active');
            });
        });
        
        // Add button
        footer.querySelector('.btn-add-assignment').addEventListener('click', (e) => {
            e.stopPropagation();
            openAssignmentModal(course);
        });
        
        // Close menu when clicking outside
        courseCard.addEventListener('click', (e) => {
            if (e.target !== header.querySelector('.btn-course-menu')) {
                dropdown.classList.remove('active');
            }
        });
    });
}

// Open assignment detail modal
function openAssignmentDetail(course, assignment) {
    currentCourse = course;
    currentAssignment = assignment;
    
    // Convert old string steps to new object format if needed
    if (currentAssignment.steps.length > 0 && typeof currentAssignment.steps[0] === 'string') {
        currentAssignment.steps = currentAssignment.steps.map((step, index) => ({
            id: `step-${Date.now()}-${index}`,
            text: step,
            completed: false
        }));
        // Update in storage immediately
        updateAssignmentInCourses();
        saveCoursesToStorage();
    }
    
    // Store previous progress for toggle functionality
    previousProgress = assignment.progress;
    
    document.getElementById('detailTitle').textContent = assignment.title;
    document.getElementById('detailCourse').textContent = course.title;
    document.getElementById('detailDeadline').textContent = formatDate(assignment.deadline);
    document.getElementById('detailBrief').textContent = assignment.brief;
    
    // Update progress
    document.getElementById('detailProgress').style.width = assignment.progress + '%';
    document.getElementById('detailProgressText').textContent = assignment.progress + '%';
    
    // Update mark as done button text and color
    const isDone = assignment.progress === 100;
    if (markDoneBtn) {
        markDoneBtn.textContent = isDone ? 'בטל סימון כבוצע' : 'סמן כבוצע';
        markDoneBtn.classList.remove('btn-success', 'btn-secondary');
        markDoneBtn.classList.add(isDone ? 'btn-secondary' : 'btn-success');
    }
    
    // Setup edit fields with current values
    document.getElementById('editTaskName').value = assignment.title;
    document.getElementById('editTaskBrief').value = assignment.brief;
    document.getElementById('editTaskDeadline').value = assignment.deadline;
    
    // Hide edit mode initially
    const editMode = document.getElementById('detailEditMode');
    if (editMode) {
        editMode.style.display = 'none';
    }
    
    // Render steps
    renderSteps(currentAssignment.steps);
    
    detailModal.classList.add('active');
}

// Close detail modal
function closeDetailModal() {
    // Save any pending changes
    if (currentAssignment && currentCourse) {
        updateAssignmentInCourses();
        saveCoursesToStorage();
    }
    detailModal.classList.remove('active');
    currentAssignment = null;
    currentCourse = null;
    stepsEditMode = false;
}

// Toggle general info edit mode
function toggleEditGeneralMode() {
    const editMode = document.getElementById('detailEditMode');
    const detailBody = document.querySelector('.detail-body');
    
    if (editMode.style.display === 'none') {
        // Show edit mode
        editMode.style.display = 'block';
        detailBody.style.display = 'none';
    } else {
        // Hide edit mode
        editMode.style.display = 'none';
        detailBody.style.display = 'block';
    }
}

// Save general info changes
function saveGeneralInfoEdit() {
    if (!currentAssignment || !currentCourse) return;
    
    const newName = document.getElementById('editTaskName').value.trim();
    const newBrief = document.getElementById('editTaskBrief').value.trim();
    const newDeadline = document.getElementById('editTaskDeadline').value;
    
    if (!newName || !newDeadline) {
        showToast('אנא מלא את שם המטלה והתאריך', 'error');
        return;
    }
    
    // Update assignment
    currentAssignment.title = newName;
    currentAssignment.brief = newBrief;
    currentAssignment.deadline = newDeadline;
    
    // Update in courses and save
    updateAssignmentInCourses();
    saveCoursesToStorage();
    
    // Update UI
    document.getElementById('detailTitle').textContent = newName;
    document.getElementById('detailDeadline').textContent = formatDate(newDeadline);
    document.getElementById('detailBrief').textContent = newBrief;
    
    // Close edit mode
    const editMode = document.getElementById('detailEditMode');
    const detailBody = document.querySelector('.detail-body');
    editMode.style.display = 'none';
    detailBody.style.display = 'block';
    
    // Update course cards
    renderCourses();
    renderTimeline();
    
    showToast('המטלה עודכנה בהצלחה!');
}

// Cancel general info edit
function cancelGeneralInfoEdit() {
    const editMode = document.getElementById('detailEditMode');
    const detailBody = document.querySelector('.detail-body');
    editMode.style.display = 'none';
    detailBody.style.display = 'block';
}

// Render work steps
function renderSteps(steps) {
    const stepsList = document.getElementById('stepsList');
    const editStepsBtn = document.getElementById('editStepsBtn');
    stepsList.innerHTML = '';
    
    // Hide edit button if no steps
    if (editStepsBtn) {
        editStepsBtn.style.display = steps.length > 0 ? 'flex' : 'none';
    }
    
    if (steps.length === 0) {
        stepsList.innerHTML = '<p style="color: var(--text-light); font-size: 0.9rem;">אין שלבים עדיין. לחץ על \"צור שלבים עם AI\" או הוסף שלב!</p>';
        return;
    }
    
    steps.forEach((step, index) => {
        const item = document.createElement('li');
        item.className = 'steps-item';
        item.draggable = stepsEditMode;
        item.dataset.stepId = typeof step === 'object' ? step.id : `step-${index}`;
        
        // Use step.completed if it's an object, otherwise treat it as not completed
        const isCompleted = typeof step === 'object' ? step.completed : false;
        const stepText = typeof step === 'object' ? step.text : step;
        const stepId = typeof step === 'object' ? step.id : `step-${index}`;
        
        if (stepsEditMode) {
            // Edit mode: drag handle, step text, delete button
            item.innerHTML = `
                <span class="drag-handle" title="גרור כדי להזיז">⋮⋮⋮</span>
                <span class="steps-text">${stepText}</span>
                <button type="button" class="step-delete-circle-btn" title="מחק שלב"></button>
            `;
            
            const deleteBtn = item.querySelector('.step-delete-circle-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                deleteStep(stepId);
            });
            
            // Drag and drop events
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('drop', handleDrop);
        } else {
            // Normal mode: checkbox and step text only
            item.innerHTML = `
                <span class="steps-text">${stepText}</span>
                <input type="checkbox" id="step-${stepId}" ${isCompleted ? 'checked' : ''} class="step-checkbox">
            `;
            
            const checkbox = item.querySelector('.step-checkbox');
            checkbox.addEventListener('change', () => onStepCheckboxChange(stepId, checkbox.checked));
        }
        
        stepsList.appendChild(item);
    });
}

// Drag and drop variables
let draggedElement = null;

// Handle drag start
function handleDragStart(e) {
    draggedElement = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}

// Handle drag end
function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.steps-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

// Handle drag over
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    if (this !== draggedElement) {
        this.classList.add('drag-over');
    }
    
    return false;
}

// Handle drop
function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement !== this && currentAssignment && currentAssignment.steps) {
        const draggedId = draggedElement.dataset.stepId;
        const targetId = this.dataset.stepId;
        
        const draggedIndex = currentAssignment.steps.findIndex(s => 
            (typeof s === 'object' ? s.id : s) === draggedId
        );
        const targetIndex = currentAssignment.steps.findIndex(s => 
            (typeof s === 'object' ? s.id : s) === targetId
        );
        
        if (draggedIndex !== -1 && targetIndex !== -1) {
            // Swap steps
            const temp = currentAssignment.steps[draggedIndex];
            currentAssignment.steps[draggedIndex] = currentAssignment.steps[targetIndex];
            currentAssignment.steps[targetIndex] = temp;
            
            updateAssignmentInCourses();
            saveCoursesToStorage();
            renderSteps(currentAssignment.steps);
        }
    }
    
    return false;
}

// Toggle steps edit mode
function toggleStepsEditMode() {
    stepsEditMode = !stepsEditMode;
    const editModeBtn = document.getElementById('editStepsBtn');
    if (editModeBtn) {
        editModeBtn.classList.toggle('active', stepsEditMode);
    }
    if (currentAssignment && currentAssignment.steps) {
        renderSteps(currentAssignment.steps);
    }
}

// Handle checkbox change
function onStepCheckboxChange(stepId, isChecked) {
    if (!currentAssignment || !currentAssignment.steps) return;
    
    // Update step completion status
    currentAssignment.steps = currentAssignment.steps.map(step => {
        if (typeof step === 'object' && step.id === stepId) {
            return { ...step, completed: isChecked };
        }
        return step;
    });
    
    // Update in courses array and save
    updateAssignmentInCourses();
    saveCoursesToStorage();
    
    // Update progress based on completed steps
    updateProgressFromSteps();
}

// Generate steps with AI
async function generateStepsWithAI() {
    if (!currentAssignment) return;
    
    // Check if brief is empty
    if (!currentAssignment.brief || currentAssignment.brief.trim() === '') {
        showToast('add a description to the task for generating steps', 'error');
        return;
    }
    
    generateStepsBtn.disabled = true;
    loadingOverlay.classList.add('active');
    
    try {
        const response = await fetch('/api/generate-steps', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: currentAssignment.title,
                brief: currentAssignment.brief,
                deadline: currentAssignment.deadline,
                course: currentCourse.title
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Convert string steps to step objects with id, text, and completed status
            currentAssignment.steps = data.steps.map((step, index) => ({
                id: `step-${Date.now()}-${index}`,
                text: step,
                completed: false
            }));
            
            // Update in courses array
            updateAssignmentInCourses();
            
            // Save to localStorage
            saveCoursesToStorage();
            
            // Re-render steps in modal
            renderSteps(currentAssignment.steps);
            showToast('השלבים נוצרו בהצלחה!');
        } else {
            const errorMsg = data.error || 'יצירת השלבים נכשלה. אנא נסה שוב.';
            showToast(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Error generating steps:', error);
        showToast('שגיאת חיבור. בדוק את החיבור שלך לאינטרנט.', 'error');
    } finally {
        generateStepsBtn.disabled = false;
        loadingOverlay.classList.remove('active');
    }
}

// Mark assignment as done / Unmark
function markAssignmentDone() {
    if (!currentAssignment) return;
    
    if (currentAssignment.progress === 100) {
        // Unmark - restore previous progress
        currentAssignment.progress = previousProgress;
    } else {
        // Mark as done
        previousProgress = currentAssignment.progress;
        currentAssignment.progress = 100;
    }
    
    updateAssignmentInCourses();
    saveCoursesToStorage();
    
    // Update UI
    document.getElementById('detailProgress').style.width = currentAssignment.progress + '%';
    document.getElementById('detailProgressText').textContent = currentAssignment.progress + '%';
    
    // Update button text and color
    const isDone = currentAssignment.progress === 100;
    if (markDoneBtn) {
        markDoneBtn.textContent = isDone ? 'בטל סימון כבוצע' : 'סמן כבוצע';
        markDoneBtn.classList.toggle('btn-success', !isDone);
        markDoneBtn.classList.toggle('btn-secondary', isDone);
    }
    
    // Update course cards
    renderCourses();
    
    const message = isDone ? 'המטלה סומנה כבוצעה!' : 'סקיור ביטול סימון המטלה!';
    showToast(message);
}

// Update progress based on completed steps
function updateProgressFromSteps() {
    if (!currentAssignment || !currentAssignment.steps || currentAssignment.steps.length === 0) return;
    
    const completedSteps = currentAssignment.steps.filter(
        step => typeof step === 'object' && step.completed === true
    ).length;
    
    const totalSteps = currentAssignment.steps.length;
    const newProgress = Math.round((completedSteps / totalSteps) * 100);
    
    currentAssignment.progress = newProgress;
    
    // Update in courses array
    updateAssignmentInCourses();
    saveCoursesToStorage();
    
    // Update UI immediately
    document.getElementById('detailProgress').style.width = newProgress + '%';
    document.getElementById('detailProgressText').textContent = newProgress + '%';
    
    // Update course cards
    renderCourses();
}

// Helper function to update assignment in courses array
function updateAssignmentInCourses() {
    if (!currentAssignment || !currentCourse) return;
    
    const courseIndex = courses.findIndex(c => c.id === currentCourse.id);
    if (courseIndex === -1) return;
    
    const assignmentIndex = courses[courseIndex].assignments.findIndex(
        a => a.id === currentAssignment.id
    );
    if (assignmentIndex === -1) return;
    
    // Make a deep copy to ensure proper storage
    const stepsToSave = currentAssignment.steps && Array.isArray(currentAssignment.steps) 
        ? currentAssignment.steps.map(s => ({ ...s }))
        : [];
    
    courses[courseIndex].assignments[assignmentIndex] = {
        ...currentAssignment,
        steps: stepsToSave
    };
}

// Delete assignment
function deleteAssignment() {
    if (!currentAssignment || !currentCourse) return;
    
    const courseIndex = courses.findIndex(c => c.id === currentCourse.id);
    if (courseIndex === -1) return;
    
    const assignmentIndex = courses[courseIndex].assignments.findIndex(
        a => a.id === currentAssignment.id
    );
    if (assignmentIndex === -1) return;
    
    courses[courseIndex].assignments.splice(assignmentIndex, 1);
    saveCoursesToStorage();
    
    closeDetailModal();
    renderCourses();
    renderTimeline();
    
    showToast('המטלה נמחקה בהצלחה!');
}

// Delete a specific step
function deleteStep(stepId) {
    if (!currentAssignment || !currentAssignment.steps) return;
    
    currentAssignment.steps = currentAssignment.steps.filter(step => {
        if (typeof step === 'object') {
            return step.id !== stepId;
        }
        return true;
    });
    
    updateAssignmentInCourses();
    saveCoursesToStorage();
    renderSteps(currentAssignment.steps);
    
    showToast('השלב נמחק!');
}

// Add a manual step
function addManualStep() {
    if (!currentAssignment) return;
    
    const input = document.getElementById('manualStepInput');
    const stepText = input.value.trim();
    
    if (!stepText) {
        showToast('אנא הכנס טקסט לשלב', 'error');
        return;
    }
    
    const newStep = {
        id: `step-${Date.now()}`,
        text: stepText,
        completed: false
    };
    
    if (!currentAssignment.steps) {
        currentAssignment.steps = [];
    }
    
    currentAssignment.steps.push(newStep);
    updateAssignmentInCourses();
    saveCoursesToStorage();
    
    input.value = '';
    input.focus();
    
    renderSteps(currentAssignment.steps);
    showToast('השלב התווסף בהצלחה!');
}

// Show delete confirmation modal
function showDeleteConfirmation(message, callback) {
    deleteConfirmCallback = callback;
    document.getElementById('confirmDeleteMessage').textContent = message;
    confirmDeleteModal.style.display = 'flex';
}

// Close delete confirmation modal
function closeDeleteConfirmation() {
    confirmDeleteModal.style.display = 'none';
    deleteConfirmCallback = null;
}

// Delete course
function deleteCourse(courseId) {
    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return;
    
    courses.splice(courseIndex, 1);
    saveCoursesToStorage();
    
    renderCourses();
    renderTimeline();
    
    showToast('הקורס נמחק בהצלחה!');
}

// Prepare for renaming course
function renameCoursePrepare(course) {
    const newName = prompt('שם קורס חדש:', course.title);
    if (newName && newName.trim()) {
        renameCourse(course.id, newName.trim());
    }
}

// Rename course
function renameCourse(courseId, newName) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    course.title = newName;
    saveCoursesToStorage();
    renderCourses();
    renderTimeline();
    
    showToast('שם הקורס שונה בהצלחה!');
}

// Render two-week timeline
function renderTimeline() {
    timeline.innerHTML = '';
    
    // Get today's date and next 14 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    // Get all assignments from all courses
    const allAssignments = [];
    courses.forEach(course => {
        course.assignments.forEach(assignment => {
            const deadlineDate = new Date(assignment.deadline + 'T00:00:00');
            allAssignments.push({
                ...assignment,
                courseName: course.title,
                deadline: deadlineDate
            });
        });
    });
    
    // Filter assignments within 2 weeks and sort by deadline
    const upcomingAssignments = allAssignments
        .filter(a => a.deadline >= today && a.deadline <= twoWeeksLater)
        .sort((a, b) => a.deadline - b.deadline);
    
    if (upcomingAssignments.length === 0) {
        timeline.innerHTML = '<p style="color: var(--text-light);">אין מטלות בשבועיים הקרובים :)</p>';
        return;
    }
    
    // Group by date
    const groupedByDate = {};
    upcomingAssignments.forEach(assignment => {
        const dateKey = assignment.deadline.toISOString().split('T')[0];
        if (!groupedByDate[dateKey]) {
            groupedByDate[dateKey] = [];
        }
        groupedByDate[dateKey].push(assignment);
    });
    
    // Render timeline
    Object.keys(groupedByDate).sort().forEach(dateKey => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        
        const dateEl = document.createElement('div');
        dateEl.className = 'timeline-date';
        dateEl.textContent = formatDate(dateKey);
        
        const tasksEl = document.createElement('div');
        tasksEl.className = 'timeline-tasks';
        
        groupedByDate[dateKey].forEach(assignment => {
            const taskEl = document.createElement('div');
            taskEl.className = 'timeline-task';
            taskEl.textContent = `${assignment.courseName} - ${assignment.title}`;
            tasksEl.appendChild(taskEl);
        });
        
        timelineItem.appendChild(dateEl);
        timelineItem.appendChild(tasksEl);
        timeline.appendChild(timelineItem);
    });
}

// ========== Utility Functions ==========

// Format date string to readable format
function formatDate(dateString) {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString + 'T00:00:00').toLocaleDateString('he-IL', options);
}

// Show toast notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast active ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}
