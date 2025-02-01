const todayList = document.getElementById('today-list');
const tomorrowList = document.getElementById('tomorrow-list');
let undoStack = [];
let redoStack = [];
const MAX_HISTORY = 50;

// Загрузка задач
function loadTasks() {
    const todayTasks = JSON.parse(localStorage.getItem('today-tasks')) || [];
    const tomorrowTasks = JSON.parse(localStorage.getItem('tomorrow-tasks')) || [];

    todayList.innerHTML = '';
    tomorrowList.innerHTML = '';
    todayTasks.forEach(task => task.text && addTaskToList(task.text, 'today', task));
    tomorrowTasks.forEach(task => task.text && addTaskToList(task.text, 'tomorrow', task));
}

// Сохранение задач
function saveTasks() {
    saveStateToHistory();
    const todayTasks = Array.from(todayList.children).map(li => ({
        text: li.querySelector('span')?.textContent.trim() || '',
        completed: li.querySelector('.custom-checkbox')?.src.includes('checkbox-true.svg') || false,
        important: li.querySelector('.important-btn')?.classList.contains('active') || false
    })).filter(task => task.text !== '');

    const tomorrowTasks = Array.from(tomorrowList.children).map(li => ({
        text: li.querySelector('span')?.textContent.trim() || '',
        completed: li.querySelector('.custom-checkbox')?.src.includes('checkbox-true.svg') || false,
        important: li.querySelector('.important-btn')?.classList.contains('active') || false
    })).filter(task => task.text !== '');

    localStorage.setItem('today-tasks', JSON.stringify(todayTasks));
    localStorage.setItem('tomorrow-tasks', JSON.stringify(tomorrowTasks));
}

// История изменений
function saveStateToHistory() {
    const state = {
        today: localStorage.getItem('today-tasks'),
        tomorrow: localStorage.getItem('tomorrow-tasks')
    };

    undoStack.push(state);
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack = [];
}

// Отмена действия
function undo() {
    if (undoStack.length === 0) return;

    const currentState = {
        today: localStorage.getItem('today-tasks'),
        tomorrow: localStorage.getItem('tomorrow-tasks')
    };

    const prevState = undoStack.pop();
    redoStack.push(currentState);
    applyState(prevState);
}

// Повтор действия
function redo() {
    if (redoStack.length === 0) return;

    const currentState = {
        today: localStorage.getItem('today-tasks'),
        tomorrow: localStorage.getItem('tomorrow-tasks')
    };

    const nextState = redoStack.pop();
    undoStack.push(currentState);
    applyState(nextState);
}

// Применение состояния
function applyState(state) {
    localStorage.setItem('today-tasks', state.today);
    localStorage.setItem('tomorrow-tasks', state.tomorrow);
    loadTasks();
}

// Обработчик клавиш для undo/redo
function handleUndoRedo(e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
    }
    else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
    }
}

// Добавление новой задачи
function addTask(list) {
    const input = document.getElementById(`new-task-${list}`);
    const tasks = input.value.trim().split('\n').filter(task => task);
    tasks.reverse().forEach(task => addTaskToList(task, list));
    saveTasks();
    input.value = '';
}

// Обработка нажатия клавиш
function handleKeyPress(event, list) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        addTask(list);
    }
}

// Создание элемента задачи
function addTaskToList(task, list, options = {}) {
    if (!task.trim()) return;

    const { completed = false, important = false } = options;
    const li = document.createElement('li');
    li.draggable = true;
    li.addEventListener('dragstart', dragStart);
    li.addEventListener('dragend', dragEnd);

    // Кнопка важности
    const importantBtn = document.createElement('button');
    importantBtn.className = `important-btn${important ? ' active' : ''}`;
    importantBtn.innerHTML = '🔥';
    importantBtn.onclick = (e) => {
        e.stopPropagation();
        importantBtn.classList.toggle('active');
        li.classList.toggle('important');
        saveTasks();
    };

    // Кастомный чекбокс
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'checkbox-container';

    const checkbox = document.createElement('img');
    checkbox.className = 'custom-checkbox';
    checkbox.src = completed ? 'img/checkbox-true.svg' : 'img/checkbox-false.svg';
    checkbox.alt = 'checkbox';
    checkbox.onclick = (e) => {
        e.stopPropagation();
        const isCompleted = checkbox.src.includes('checkbox-true.svg');
        checkbox.src = isCompleted ? 'img/checkbox-false.svg' : 'img/checkbox-true.svg';
        const taskText = li.querySelector('span');
        taskText.classList.toggle('completed', !isCompleted);
        saveTasks();
    };

    checkboxContainer.appendChild(checkbox);

    // Текст задачи
    const taskText = document.createElement('span');
    taskText.textContent = task;
    if (completed) taskText.classList.add('completed');
    if (important) li.classList.add('important');

    // Функция редактирования задачи
    const activateEdit = () => {
        const textarea = document.createElement('textarea');
        textarea.value = taskText.textContent;
        li.replaceChild(textarea, taskText);
        textarea.focus();

        const saveChanges = () => {
            const newText = textarea.value.trim();
            if (newText !== taskText.textContent) {
                if (newText) {
                    taskText.textContent = newText;
                    if (!li.contains(taskText)) {
                        li.insertBefore(taskText, buttons);
                    }
                    saveTasks();
                } else {
                    li.remove();
                    saveTasks();
                }
            }
            li.replaceChild(taskText, textarea);
        };

        textarea.addEventListener('blur', saveChanges);
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveChanges();
            }
            if (e.key === 'Escape') {
                li.replaceChild(taskText, textarea);
            }
        });
    };

    taskText.addEventListener('click', (e) => {
        if (e.detail === 1) {
            activateEdit();
        }
    });

    taskText.addEventListener('dblclick', (e) => {
        activateEdit();
    });

    // Кнопки управления
    const buttons = document.createElement('div');
    buttons.className = 'buttons';

    const moveBtn = document.createElement('button');
    moveBtn.className = 'move-btn';
    moveBtn.textContent = list === 'today' ? '⏩ Завтра' : '📆 На сегодня';
    moveBtn.onclick = (e) => {
        e.stopPropagation();
        moveTask(li);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        li.remove();
        saveTasks();
    };

    buttons.appendChild(moveBtn);
    buttons.appendChild(deleteBtn);

    // Сборка элемента
    li.appendChild(importantBtn);
    li.appendChild(checkboxContainer);
    li.appendChild(taskText);
    li.appendChild(buttons);

    const targetList = document.getElementById(`${list}-list`);
    targetList.appendChild(li);
}

// Перемещение задачи между списками
function moveTask(task) {
    const currentList = task.parentElement.id === 'today-list' ? 'today' : 'tomorrow';
    const targetList = currentList === 'today' ? 'tomorrow' : 'today';

    task.style.transform = currentList === 'today' ? 'translateY(50px)' : 'translateY(-50px)';
    task.style.opacity = '0';

    setTimeout(() => {
        task.style.transform = '';
        task.style.opacity = '1';
        document.getElementById(`${targetList}-list`).appendChild(task);
        updateMoveButton(task, targetList);
        saveTasks();
    }, 300);
}

function updateMoveButton(li, newList) {
    const moveBtn = li.querySelector('.move-btn');
    moveBtn.textContent = newList === 'today' ? '⏩ Завтра' : '📆 На сегодня';
}

// Очистка списка
function clearList(list) {
    if (!confirm('Вы уверены, что хотите удалить все задачи?')) return;
    const taskList = list === 'today' ? todayList : tomorrowList;
    taskList.innerHTML = '';
    saveTasks();
}

// Обновление дат с новыми стилями
function updateDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Форматирование даты для сегодня
    updateDateElement(today, 'today-date');
    updateDateElement(tomorrow, 'tomorrow-date');
}

// Создание HTML для даты с разными стилями
function createDateHTML(day, weekday, isWeekend) {
    const weekendClass = isWeekend ? ' weekend' : '';
    return `<span class="weekday${weekendClass}">${day}, ${weekday}</span>`;
}

// Обновление элемента с датой
function updateDateElement(date, elementId) {
    const day = date.getDate();
    const weekday = date.toLocaleDateString('ru-RU', { weekday: 'long' });
    const isWeekend = [0, 6].includes(date.getDay());

    const element = document.getElementById(elementId);
    element.innerHTML = createDateHTML(day, weekday, isWeekend);
}

// Перенос задач на следующий день
function shiftTasks() {
    const today = new Date();
    const lastVisitStr = localStorage.getItem('last-visit');
    const lastVisit = lastVisitStr ? new Date(lastVisitStr) : null;

    if (!lastVisit) {
        localStorage.setItem('last-visit', today.toISOString());
        return;
    }

    const daysSinceLastVisit = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));
    if (daysSinceLastVisit < 1) return;

    // Собираем выполненные задачи из обоих списков
    const todayTasks = JSON.parse(localStorage.getItem('today-tasks')) || [];
    const tomorrowTasks = JSON.parse(localStorage.getItem('tomorrow-tasks')) || [];

    const allCompletedTasks = [
        ...todayTasks.filter(task => task.completed),
        ...tomorrowTasks.filter(task => task.completed)
    ];

    // Архивирование выполненных задач
    if (allCompletedTasks.length > 0) {
        const archive = JSON.parse(localStorage.getItem('archive')) || [];
        archive.push({
            date: lastVisit.toISOString(),
            tasks: allCompletedTasks
        });

        // Очистка архива старше месяца
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const filteredArchive = archive.filter(entry =>
            new Date(entry.date) > oneMonthAgo
        );

        localStorage.setItem('archive', JSON.stringify(filteredArchive));
    }

    // Формируем новые списки задач
    const newTodayTasks = [
        ...todayTasks.filter(task => !task.completed), // Оставляем невыполненные сегодняшние
        ...tomorrowTasks.filter(task => !task.completed) // Добавляем невыполненные завтрашние
    ];

    // Обновляем хранилище
    localStorage.setItem('today-tasks', JSON.stringify(newTodayTasks));
    localStorage.setItem('tomorrow-tasks', JSON.stringify([]));
    localStorage.setItem('last-visit', today.toISOString());
}

// Drag and Drop
let draggedItem = null;
let placeholder = null;
let lastPlaceholderPosition = null;

function dragStart(event) {
    draggedItem = this;
    this.classList.add('dragging');
    event.dataTransfer.setData('text/plain', null);
    placeholder = document.createElement('li');
    placeholder.classList.add('placeholder');
    this.parentNode.insertBefore(placeholder, this.nextSibling);
}

function dragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
    document.querySelectorAll('.task-container li').forEach(li => {
        li.style.transform = '';
    });
    if (placeholder) {
        placeholder.remove();
        placeholder = null;
    }
}

function allowDrop(event) {
    event.preventDefault();
    if (!draggedItem) return;

    const targetList = event.currentTarget;
    const children = Array.from(targetList.children).filter(child => child !== placeholder);

    children.forEach(child => {
        const rect = child.getBoundingClientRect();
        const offset = event.clientY - rect.top - rect.height / 2;
        child.style.transform = offset < 0 ? 'translateY(10px)' : 'translateY(-10px)';
    });

    const closestLi = children.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = event.clientY - box.top - box.height / 2;
        return offset < 0 && offset > closest.offset ?
            { offset: offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;

    if (placeholder) {
        if (closestLi) targetList.insertBefore(placeholder, closestLi);
        else targetList.appendChild(placeholder);
        lastPlaceholderPosition = placeholder;
    }
}

function drop(event) {
    event.preventDefault();
    if (draggedItem && lastPlaceholderPosition) {
        const targetList = event.currentTarget;
        const newList = targetList.id === 'today-list' ? 'today' : 'tomorrow';
        targetList.insertBefore(draggedItem, lastPlaceholderPosition);
        updateMoveButton(draggedItem, newList);
        saveTasks();
    }
}

// Архив
document.getElementById('archive-btn').addEventListener('click', showArchive);
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('archive-modal').style.display = 'none';
});

function showArchive() {
    const archive = JSON.parse(localStorage.getItem('archive')) || [];
    const archiveList = document.getElementById('archive-list');
    archiveList.innerHTML = '';

    if (archive.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-archive-message';
        emptyMessage.textContent = 'Сейчас архив пуст. Выполненные задачи перемещаются сюда на следующий день';
        archiveList.appendChild(emptyMessage);
    } else {
        // Сортируем архив по дате в обратном порядке (новые сверху)
        archive
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(entry => {
                const dayElement = document.createElement('div');
                dayElement.className = 'archive-day';
                dayElement.innerHTML = `<h3>${new Date(entry.date).toLocaleDateString('ru-RU')}</h3>`;

                entry.tasks.forEach(task => {
                    const taskElement = document.createElement('div');
                    taskElement.className = 'archive-task';
                    taskElement.textContent = task.text;
                    dayElement.appendChild(taskElement);
                });

                archiveList.appendChild(dayElement);
            });
    }

    document.getElementById('archive-modal').style.display = 'block';
}

// Инициализация
document.addEventListener('keydown', handleUndoRedo);
shiftTasks();
updateDates();
loadTasks();