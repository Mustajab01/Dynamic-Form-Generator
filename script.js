document.addEventListener('DOMContentLoaded', function () {
    loadSubmissions();
});

function addRow() {
    const table = document.getElementById('field-tbody');
    const newRow = table.insertRow();
    newRow.innerHTML = `
        <td><input type="text" name="field-name" placeholder="Field Name"></td>
        <td>
            <select name="field-type">
                <option value="String">String</option>
                <option value="Number">Number</option>
                <option value="Dropdown">Dropdown</option>
                <option value="Boolean">True/False</option>
                <option value="Date">Date</option>
            </select>
        </td>
        <td>
            <select name="mandatory">
                <option value="true">True</option>
                <option value="false">False</option>
            </select>
        </td>
        <td><input type="text" name="options" placeholder="Comma separated options"></td>
        <td><button onclick="deleteRow(this)">Delete</button></td>
    `;
}

function deleteRow(button) {
    const row = button.parentNode.parentNode;
    row.parentNode.removeChild(row);
    showMessage('Row deleted successfully', 'success');
}

function saveJSON() {
    try {
        const rows = document.querySelectorAll('#field-tbody tr');
        const fields = [];
        rows.forEach(row => {
            const name = row.querySelector('input[name="field-name"]').value.trim();
            if (!name) throw new Error('Field name is required.');
            
            const type = row.querySelector('select[name="field-type"]').value;
            const mandatory = row.querySelector('select[name="mandatory"]').value === 'true';
            const options = row.querySelector('input[name="options"]').value.trim().split(',');

            fields.push({ name, type, mandatory, options });
        });

        const json = JSON.stringify(fields, null, 2);
        downloadJSON(json, 'form-definition.json');
        showMessage('Form definition saved as JSON successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function downloadJSON(json, filename) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function loadJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = event => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const json = JSON.parse(e.target.result);
                loadFormDefinition(json);
                showMessage('Form definition loaded from JSON successfully', 'success');
            } catch (error) {
                showMessage('Invalid JSON format. Please upload a valid JSON file.', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function loadFormDefinition(fields) {
    const table = document.getElementById('field-tbody');
    table.innerHTML = '';
    fields.forEach(field => {
        const newRow = table.insertRow();
        newRow.innerHTML = `
            <td><input type="text" name="field-name" value="${field.name}" placeholder="Field Name"></td>
            <td>
                <select name="field-type">
                    <option value="String" ${field.type === 'String' ? 'selected' : ''}>String</option>
                    <option value="Number" ${field.type === 'Number' ? 'selected' : ''}>Number</option>
                    <option value="Dropdown" ${field.type === 'Dropdown' ? 'selected' : ''}>Dropdown</option>
                    <option value="Boolean" ${field.type === 'Boolean' ? 'selected' : ''}>True/False</option>
                    <option value="Date" ${field.type === 'Date' ? 'selected' : ''}>Date</option>
                </select>
            </td>
            <td>
                <select name="mandatory">
                    <option value="true" ${field.mandatory ? 'selected' : ''}>True</option>
                    <option value="false" ${!field.mandatory ? 'selected' : ''}>False</option>
                </select>
            </td>
            <td><input type="text" name="options" value="${field.options.join(',')}" placeholder="Comma separated options"></td>
            <td><button onclick="deleteRow(this)">Delete</button></td>
        `;
    });
}

function generateForm() {
    try {
        const rows = document.querySelectorAll('#field-tbody tr');
        if (rows.length === 0) throw new Error('No fields defined. Please add at least one field.');

        const formContainer = document.getElementById('generated-form');
        formContainer.innerHTML = '';
        rows.forEach(row => {
            const name = row.querySelector('input[name="field-name"]').value.trim();
            if (!name) throw new Error('Field name is required for all fields.');

            const type = row.querySelector('select[name="field-type"]').value;
            const mandatory = row.querySelector('select[name="mandatory"]').value === 'true';
            const options = row.querySelector('input[name="options"]').value.trim().split(',');

            const formField = document.createElement('div');
            formField.className = 'form-field';

            const label = document.createElement('label');
            label.textContent = name;
            formField.appendChild(label);

            let input;
            switch (type) {
                case 'String':
                    input = document.createElement('input');
                    input.type = 'text';
                    break;
                case 'Number':
                    input = document.createElement('input');
                    input.type = 'number';
                    break;
                case 'Dropdown':
                    input = document.createElement('select');
                    options.forEach(option => {
                        const opt = document.createElement('option');
                        opt.value = option.trim();
                        opt.textContent = option.trim();
                        input.appendChild(opt);
                    });
                    break;
                case 'Boolean':
                    input = document.createElement('select');
                    const trueOption = document.createElement('option');
                    trueOption.value = 'true';
                    trueOption.textContent = 'True';
                    const falseOption = document.createElement('option');
                    falseOption.value = 'false';
                    falseOption.textContent = 'False';
                    input.appendChild(trueOption);
                    input.appendChild(falseOption);
                    break;
                case 'Date':
                    input = document.createElement('input');
                    input.type = 'date';
                    break;
            }

            if (mandatory) {
                input.required = true;
            }

            formField.appendChild(input);
            formContainer.appendChild(formField);
        });

        showMessage('Form generated successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function saveSubmission() {
    try {
        const form = document.getElementById('generated-form');
        const fields = form.querySelectorAll('.form-field');
        if (fields.length === 0) throw new Error('No form fields available to save.');

        const submission = {};
        fields.forEach(field => {
            const label = field.querySelector('label').textContent;
            const input = field.querySelector('input, select');
            if (input.value.trim() === '') throw new Error(`Please fill in the ${label} field.`);
            submission[label] = input.value.trim();
        });

        const submissions = getSubmissions();
        submissions.push(submission);
        localStorage.setItem('submissions', JSON.stringify(submissions));
        loadSubmissions();

        const json = JSON.stringify(submission, null, 2);
        downloadJSON(json, 'submission.json');
        
        showMessage('Submission saved and downloaded successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

function getSubmissions() {
    const submissions = localStorage.getItem('submissions');
    return submissions ? JSON.parse(submissions) : [];
}

function loadSubmissions() {
    const submissions = getSubmissions();
    const container = document.getElementById('submissions-list');
    container.innerHTML = '';
    const lastSubmissions = submissions.slice(-10);
    lastSubmissions.forEach(submission => {
        const div = document.createElement('div');
        div.className = 'submission';
        div.textContent = JSON.stringify(submission, null, 2);
        container.appendChild(div);
    });
}

function showMessage(message, type) {
    const messageBox = document.createElement('div');
    messageBox.className = `message ${type}`;
    messageBox.textContent = message;
    document.body.appendChild(messageBox);
    setTimeout(() => {
        messageBox.remove();
    }, 3000);
}
