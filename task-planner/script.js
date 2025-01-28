const todayList = document.getElementById('today-list');
const tomorrowList = document.getElementById('tomorrow-list');
let history = [];
const MAX_HISTORY = 50;

function loadTasks() {
    const todayTasks = JSON.parse(localStorage.getItem('today-tasks')) || [];
    const tomorrowTasks = JSON.parse(localStorage.getItem('tomorrow-tasks')) || [];
    todayList.innerHTML = '';
    tomorrowList.innerHTML = '';
    todayTasks.forEach(task => task.text && addTaskToList(task.text, 'today', task));
    tomorrowTasks.forEach(task => task.text && addTaskToList(task.text, 'tomorrow', task));
}

function saveTasks() {
    saveStateToHistory();
    const todayTasks = Array.from(todayList.children)
        .map(li => ({
            text: li.querySelector('span')?.textContent.trim() || '',
            completed: li.querySelector('input[type="checkbox"]')?.checked || false,
            important: li.querySelector('.important-btn')?.classList.contains('active') || false
        }))
        .filter(task => task.text !== '');

    const tomorrowTasks = Array.from(tomorrowList.children)
        .map(li => ({
            text: li.querySelector('span')?.textContent.trim() || '',
            completed: li.querySelector('input[type="checkbox"]')?.checked || false,
            important: li.querySelector('.important-btn')?.classList.contains('active') || false
        }))
        .filter(task => task.text !== '');

    localStorage.setItem('today-tasks', JSON.stringify(todayTasks));
    localStorage.setItem('tomorrow-tasks', JSON.stringify(tomorrowTasks));
}

function saveStateToHistory() {
    history.push({
        today: localStorage.getItem('today-tasks'),
        tomorrow: localStorage.getItem('tomorrow-tasks')
    });
    if (history.length > MAX_HISTORY) history.shift();
}

function addTask(list) {
    const input = document.getElementById(`new-task-${list}`);
    const tasks = input.value.trim().split('\n').filter(task => task);
    tasks.reverse().forEach(task => addTaskToList(task, list));
    saveTasks();
    input.value = '';

    li.appendChild(checkbox);    // ☑
    li.appendChild(taskText);    // Текст
    li.appendChild(importantBtn); // 🔥
    li.appendChild(buttons);     // Кнопки
}

function handleKeyPress(event, list) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        addTask(list);
    }
}

function addTaskToList(task, list, options = {}) {
    if (!task.trim()) return;

    const { completed = false, important = false } = options;
    const li = document.createElement('li');
    li.draggable = true;
    li.addEventListener('dragstart', dragStart);
    li.addEventListener('dragend', dragEnd);
    li.addEventListener('mouseenter', () => li.classList.add('hovered'));
    li.addEventListener('mouseleave', () => li.classList.remove('hovered'));

    // Important Button
    const importantBtn = document.createElement('button');
    importantBtn.className = 'important-btn' + (important ? ' active' : '');
    importantBtn.innerHTML = '🔥';
    importantBtn.onclick = (e) => {
        e.stopPropagation();
        importantBtn.classList.toggle('active');
        li.classList.toggle('important');
        saveTasks();
    };

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = completed;
    checkbox.onchange = () => {
        taskText.classList.toggle('completed', checkbox.checked);
        saveTasks();
    };

    // Task Text
    const taskText = document.createElement('span');
    taskText.textContent = task;
    if (completed) taskText.classList.add('completed');
    if (important) li.classList.add('important');

    // Task Editing
    taskText.addEventListener('click', (event) => {
        const textarea = document.createElement('textarea');
        textarea.value = taskText.textContent;
        li.replaceChild(textarea, taskText);
        textarea.focus();

        const onClickOutside = (event) => {
            if (!li.contains(event.target)) {
                const newText = textarea.value.trim();
                if (!newText) li.remove();
                else {
                    taskText.textContent = newText;
                    li.replaceChild(taskText, textarea);
                }
                saveTasks();
                document.removeEventListener('click', onClickOutside);
            }
        };

        document.addEventListener('click', onClickOutside);

        textarea.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const newText = textarea.value.trim();
                if (!newText) li.remove();
                else {
                    taskText.textContent = newText;
                    li.replaceChild(taskText, textarea);
                }
                saveTasks();
                event.preventDefault();
            } else if (event.key === 'Escape') {
                li.replaceChild(taskText, textarea);
            }
        });
    });

    // Action Buttons
    const buttons = document.createElement('div');
    buttons.className = 'buttons';

    const moveBtn = document.createElement('button');
    moveBtn.className = 'move-btn';
    moveBtn.textContent = list === 'today' ? 'На завтра' : 'На сегодня';
    moveBtn.onclick = (e) => {
        e.stopPropagation();
        moveTask(li);
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '✖';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        li.remove();
        saveTasks();
    };

    buttons.appendChild(moveBtn);
    buttons.appendChild(deleteBtn);

    // Element Order
    li.appendChild(importantBtn);
    li.appendChild(checkbox);
    li.appendChild(taskText);
    li.appendChild(buttons);

    document.getElementById(`${list}-list`).appendChild(li);
}

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
    moveBtn.textContent = newList === 'today' ? 'На завтра' : 'На сегодня';
}

function clearList(list) {
    if (!confirm('Вы уверены, что хотите удалить все задачи?')) return;
    const taskList = list === 'today' ? todayList : tomorrowList;
    taskList.innerHTML = '';
    saveTasks();
}

function updateDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    document.getElementById('today-date').textContent = `${today.getDate()}, ${today.toLocaleDateString('ru-RU', { weekday: 'long' })}`;
    document.getElementById('tomorrow-date').textContent = `${tomorrow.getDate()}, ${tomorrow.toLocaleDateString('ru-RU', { weekday: 'long' })}`;
}

function shiftTasks() {
    const today = new Date();
    const lastVisit = new Date(localStorage.getItem('last-visit') || 0);
    if (today.toDateString() !== lastVisit.toDateString()) {
        const tomorrowTasks = JSON.parse(localStorage.getItem('tomorrow-tasks')) || [];
        const todayTasks = JSON.parse(localStorage.getItem('today-tasks')) || [];
        localStorage.setItem('today-tasks', JSON.stringify([...todayTasks, ...tomorrowTasks]));
        localStorage.setItem('tomorrow-tasks', JSON.stringify([]));
        localStorage.setItem('last-visit', today);
        loadTasks();
    }
}

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
            { offset: offset, element: child } :
            closest;
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

function handleUndo(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        const state = history.pop();
        if (state) {
            localStorage.setItem('today-tasks', state.today);
            localStorage.setItem('tomorrow-tasks', state.tomorrow);
            loadTasks();
        }
    }
}

document.addEventListener('keydown', handleUndo);
shiftTasks();
updateDates();
loadTasks();