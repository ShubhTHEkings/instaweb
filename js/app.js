// Main application for InstaWeb Website Builder - A drag-and-drop website builder
document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements - Get references to key UI elements
    const canvas = document.getElementById('canvas');                     // Main canvas where elements are dropped
    const elements = document.querySelectorAll('.element');               // Draggable elements in the sidebar
    const propertiesForm = document.getElementById('propertiesForm');     // Form for editing element properties
    const previewBtn = document.getElementById('previewBtn');             // Button to show website preview
    const saveBtn = document.getElementById('saveBtn');                   // Button to save/export website
    const previewModal = document.getElementById('previewModal');         // Modal dialog for preview
    const previewContent = document.getElementById('previewContent');     // Content container in preview modal
    const closeModal = document.querySelector('.close-modal');            // Close button for modal

    // State variables to track application state
    let selectedElement = null;   // Currently selected element on canvas
    let elementCounter = 0;       // Counter to generate unique IDs for elements

    // Initialize the application
    init();

    function init() {
        // Setup drag and drop for elements in the sidebar
        elements.forEach(element => {
            element.addEventListener('dragstart', handleDragStart);
        });

        // Setup canvas as a drop area for dragged elements
        canvas.addEventListener('dragover', handleDragOver);
        canvas.addEventListener('drop', handleDrop);
        canvas.addEventListener('click', handleCanvasClick);

        // Setup buttons for preview and save actions
        previewBtn.addEventListener('click', showPreview);
        saveBtn.addEventListener('click', saveWebsite);
        closeModal.addEventListener('click', hidePreview);

        // Clear empty state if there are already elements
        updateCanvasState();
    }

    // Drag and Drop Handlers

    /**
     * Handle the start of dragging an element from the sidebar
     * Sets the data type being dragged and the allowed effect
     */
    function handleDragStart(e) {
        // Store the element type in the dataTransfer object
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
        e.dataTransfer.effectAllowed = 'copy';
    }

    /**
     * Handle element being dragged over the canvas
     * Provides visual feedback by adding drag-over class
     */
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';

        // Remove previous drag-over class from all elements
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });

        // Add drag-over class to appropriate element for visual feedback
        if (e.target.classList.contains('canvas-element')) {
            e.target.classList.add('drag-over');
        } else if (e.target.id === 'canvas' || e.target.closest('#canvas')) {
            canvas.classList.add('drag-over');
        }
    }

    /**
     * Handle dropping an element onto the canvas
     * Creates new elements based on the type or handles dropped image URLs
     */
    function handleDrop(e) {
        e.preventDefault();
        // Remove all drag-over visual indicators
        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));

        // Special handling for dropping image URLs (from external sources like Google Photos)
        const urlList = e.dataTransfer.getData('text/uri-list');
        const plainText = e.dataTransfer.getData('text/plain');
        const dropUrl = urlList || plainText;
        if (dropUrl && /^https?:\/\//i.test(dropUrl) && /\.(jpg|jpeg|png|gif|svg|webp)(\?.*)?$/i.test(dropUrl)) {
            const newElement = createCanvasElement('image');
            const imgEl = newElement.querySelector('img');
            imgEl.src = dropUrl;
            updateCanvasState();
            selectElement(newElement);
            return;
        }

        // Standard element drop handling
        const elementType = e.dataTransfer.getData('text/plain');
        if (!elementType) return;        // Create the new element based on the element type
        const newElement = createCanvasElement(elementType);

        // Determine drop target and position for proper placement in the canvas
        let dropTarget = e.target;

        // If dropped on the canvas or the empty state message, append to the end
        if (dropTarget.id === 'canvas' || dropTarget.closest('.empty-state')) {
            canvas.appendChild(newElement);
        }
        // If dropped on an existing element, insert after that element
        else if (dropTarget.classList.contains('canvas-element') || dropTarget.closest('.canvas-element')) {
            const targetElement = dropTarget.classList.contains('canvas-element')
                ? dropTarget
                : dropTarget.closest('.canvas-element');

            canvas.insertBefore(newElement, targetElement.nextSibling);
        }

        // Update canvas state (remove empty state message if needed)
        updateCanvasState();

        // Select the newly created element to edit its properties
        selectElement(newElement);
    }

    /**
     * Creates a new canvas element based on the specified type
     * Each element type has different HTML structure and default content
     * @param {string} type - The type of element to create (heading, paragraph, image, etc.)
     * @returns {HTMLElement} The created element
     */
    function createCanvasElement(type) {
        // Generate a unique ID for the new element
        elementCounter++;
        const id = `element-${Date.now()}-${elementCounter}`;

        // Create the main container element
        const element = document.createElement('div');
        element.className = 'canvas-element';
        element.dataset.type = type;
        element.dataset.id = id;

        // Add element actions - the controls for moving and deleting the element
        const actions = document.createElement('div');
        actions.className = 'element-actions';

        // Create move button with drag functionality
        const moveBtn = document.createElement('span');
        moveBtn.className = 'element-action move';
        moveBtn.innerHTML = '⋮';
        moveBtn.title = 'Move';
        moveBtn.draggable = true;
        moveBtn.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            e.dataTransfer.setData('application/element-id', id);
            e.dataTransfer.effectAllowed = 'move';
        });

        // Create delete button
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'element-action delete';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Delete';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            element.remove();
            if (selectedElement === element) {
                selectedElement = null;
                showEmptyPropertiesForm();
            }
            updateCanvasState();
        });

        // Add action buttons to the actions container
        actions.appendChild(moveBtn);
        actions.appendChild(deleteBtn);
        element.appendChild(actions);

        // Add content based on element type with default values
        let content = '';

        switch (type) {
            case 'heading':
                content = '<h2>Heading Text</h2>';
                break;
            case 'paragraph':
                content = '<p>This is a paragraph of text. Click to edit the content and properties.</p>';
                break;
            case 'image':
                content = '<img src="https://via.placeholder.com/300x200" alt="Placeholder Image" style="max-width:100%;">';
                break;
            case 'button':
                content = '<button style="display:inline-block;padding:10px 20px;background:#4a6cf7;color:white;border:none;border-radius:4px;cursor:pointer;">Button</button>';
                break;
            case 'divider':
                content = '<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">';
                break;
            case 'spacer':
                content = '<div style="height:50px;"></div>';
                break;
            default:
                content = '<div>Unknown Element</div>';
        }

        const contentContainer = document.createElement('div');
        contentContainer.className = 'element-content';
        contentContainer.innerHTML = content;
        element.appendChild(contentContainer);

        // Add event listeners
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            selectElement(element);
        });

        return element;
    }

    /**
     * Selects an element and shows its properties in the properties panel
     * @param {HTMLElement} element - The element to select
     */
    function selectElement(element) {
        // Deselect previously selected element
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }

        // Select new element
        selectedElement = element;
        element.classList.add('selected');

        // Show properties form for the selected element
        showPropertiesForm(element);
    }

    /**
     * Show properties form for the selected element
     * Displays different form fields based on the element type
     * @param {HTMLElement} element - The element whose properties to show
     */
    function showPropertiesForm(element) {
        const type = element.dataset.type;
        let formHTML = `<h4>${capitalize(type)} Properties</h4>`;

        switch (type) {
            case 'heading':
                const headingText = element.querySelector('h2').innerText;
                formHTML += `
                    <div class="form-group">
                        <label for="headingText">Text</label>
                        <input type="text" id="headingText" value="${headingText}">
                    </div>
                    <div class="form-group">
                        <label for="headingSize">Size</label>
                        <select id="headingSize">
                            <option value="h1">Heading 1 (Largest)</option>
                            <option value="h2" selected>Heading 2</option>
                            <option value="h3">Heading 3</option>
                            <option value="h4">Heading 4</option>
                            <option value="h5">Heading 5</option>
                            <option value="h6">Heading 6 (Smallest)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="headingColor">Color</label>
                        <input type="color" id="headingColor" value="#2d3748">
                    </div>
                    <div class="form-group">
                        <label for="headingAlign">Alignment</label>
                        <select id="headingAlign">
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                        </select>
                    </div>
                `;
                break;

            case 'paragraph':
                const paragraphText = element.querySelector('p').innerText;
                formHTML += `
                    <div class="form-group">
                        <label for="paragraphText">Text</label>
                        <textarea id="paragraphText" rows="4">${paragraphText}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="paragraphColor">Color</label>
                        <input type="color" id="paragraphColor" value="#2d3748">
                    </div>
                    <div class="form-group">
                        <label for="paragraphSize">Font Size (px)</label>
                        <input type="number" id="paragraphSize" value="16" min="10" max="36">
                    </div>
                    <div class="form-group">
                        <label for="paragraphAlign">Alignment</label>
                        <select id="paragraphAlign">
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                            <option value="justify">Justify</option>
                        </select>
                    </div>
                `;
                break;

            case 'image':
                const imgElement = element.querySelector('img');
                const imgSrc = imgElement.src;
                const imgAlt = imgElement.alt;

                formHTML += `
                    <div class="form-group">
                        <label for="imageURL">Image URL</label>
                        <input type="text" id="imageURL" value="${imgSrc}">
                    </div>
                    <div class="form-group">
                        <label for="imageAlt">Alt Text</label>
                        <input type="text" id="imageAlt" value="${imgAlt}">
                    </div>
                    <div class="form-group">
                        <label for="imageWidth">Width (%)</label>
                        <input type="number" id="imageWidth" value="100" min="10" max="100">
                    </div>
                    <div class="form-group">
                        <label for="imageAlign">Alignment</label>
                        <select id="imageAlign">
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                        </select>
                    </div>
                `;
                break;

            case 'button':
                const btnElement = element.querySelector('button');
                const btnText = btnElement.innerText;
                const btnBgColor = btnElement.style.backgroundColor || '#4a6cf7';
                const btnTextColor = btnElement.style.color || 'white';

                formHTML += `
                    <div class="form-group">
                        <label for="buttonText">Text</label>
                        <input type="text" id="buttonText" value="${btnText}">
                    </div>
                    <div class="form-group">
                        <label for="buttonBg">Background Color</label>
                        <input type="color" id="buttonBg" value="${rgbToHex(btnBgColor)}">
                    </div>
                    <div class="form-group">
                        <label for="buttonTextColor">Text Color</label>
                        <input type="color" id="buttonTextColor" value="${rgbToHex(btnTextColor)}">
                    </div>
                    <div class="form-group">
                        <label for="buttonSize">Size</label>
                        <select id="buttonSize">
                            <option value="small">Small</option>
                            <option value="medium" selected>Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="buttonAlign">Alignment</label>
                        <select id="buttonAlign">
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                        </select>
                    </div>
                `;
                break;

            case 'divider':
                const hrElement = element.querySelector('hr');
                const dividerColor = hrElement.style.borderTopColor || '#e2e8f0';

                formHTML += `
                    <div class="form-group">
                        <label for="dividerColor">Color</label>
                        <input type="color" id="dividerColor" value="${rgbToHex(dividerColor)}">
                    </div>
                    <div class="form-group">
                        <label for="dividerThickness">Thickness (px)</label>
                        <input type="number" id="dividerThickness" value="1" min="1" max="10">
                    </div>
                    <div class="form-group">
                        <label for="dividerStyle">Style</label>
                        <select id="dividerStyle">
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="dotted">Dotted</option>
                        </select>
                    </div>
                `;
                break;

            case 'spacer':
                const spacerElement = element.querySelector('div');
                const spacerHeight = parseInt(spacerElement.style.height) || 50;

                formHTML += `
                    <div class="form-group">
                        <label for="spacerHeight">Height (px)</label>
                        <input type="number" id="spacerHeight" value="${spacerHeight}" min="10" max="200">
                    </div>
                `;
                break;
        }

        // Add general properties for all elements
        formHTML += `
            <div class="form-group">
                <label for="elementMargin">Margin (px)</label>
                <input type="number" id="elementMargin" value="0" min="0" max="100">
            </div>
            <div class="form-group">
                <label for="elementPadding">Padding (px)</label>
                <input type="number" id="elementPadding" value="0" min="0" max="100">
            </div>
            <button id="applyProperties" class="primary">Apply Changes</button>
        `;

        propertiesForm.innerHTML = formHTML;

        // Add event listener to apply changes button
        document.getElementById('applyProperties').addEventListener('click', () => {
            applyProperties(element);
        });
    }

    // Apply property changes to the selected element
    function applyProperties(element) {
        const type = element.dataset.type;

        switch (type) {
            case 'heading':
                const headingText = document.getElementById('headingText').value;
                const headingSize = document.getElementById('headingSize').value;
                const headingColor = document.getElementById('headingColor').value;
                const headingAlign = document.getElementById('headingAlign').value;

                const headingContent = `<${headingSize} style="color:${headingColor};text-align:${headingAlign};">${headingText}</${headingSize}>`;
                element.querySelector('.element-content').innerHTML = headingContent;
                break;

            case 'paragraph':
                const paragraphText = document.getElementById('paragraphText').value;
                const paragraphColor = document.getElementById('paragraphColor').value;
                const paragraphSize = document.getElementById('paragraphSize').value;
                const paragraphAlign = document.getElementById('paragraphAlign').value;

                const paragraphContent = `<p style="color:${paragraphColor};font-size:${paragraphSize}px;text-align:${paragraphAlign};">${paragraphText}</p>`;
                element.querySelector('.element-content').innerHTML = paragraphContent;
                break;

            case 'image':
                const imageURL = document.getElementById('imageURL').value;
                const imageAlt = document.getElementById('imageAlt').value;
                const imageWidth = document.getElementById('imageWidth').value;
                const imageAlign = document.getElementById('imageAlign').value;

                const imgStyle = `max-width:${imageWidth}%;display:block;`;
                const containerStyle = `text-align:${imageAlign};`;

                const imageContent = `<div style="${containerStyle}"><img src="${imageURL}" alt="${imageAlt}" style="${imgStyle}"></div>`;
                element.querySelector('.element-content').innerHTML = imageContent;
                break;

            case 'button':
                const buttonText = document.getElementById('buttonText').value;
                const buttonBg = document.getElementById('buttonBg').value;
                const buttonTextColor = document.getElementById('buttonTextColor').value;
                const buttonSize = document.getElementById('buttonSize').value;
                const buttonAlign = document.getElementById('buttonAlign').value;

                let padding;
                switch (buttonSize) {
                    case 'small': padding = '6px 12px'; break;
                    case 'medium': padding = '10px 20px'; break;
                    case 'large': padding = '14px 28px'; break;
                }

                const buttonStyle = `display:inline-block;padding:${padding};background:${buttonBg};color:${buttonTextColor};border:none;border-radius:4px;cursor:pointer;`;
                const buttonContainerStyle = `text-align:${buttonAlign};`;

                const buttonContent = `<div style="${buttonContainerStyle}"><button style="${buttonStyle}">${buttonText}</button></div>`;
                element.querySelector('.element-content').innerHTML = buttonContent;
                break;

            case 'divider':
                const dividerColor = document.getElementById('dividerColor').value;
                const dividerThickness = document.getElementById('dividerThickness').value;
                const dividerStyle = document.getElementById('dividerStyle').value;

                const hrStyle = `border:none;border-top:${dividerThickness}px ${dividerStyle} ${dividerColor};margin:20px 0;`;

                const dividerContent = `<hr style="${hrStyle}">`;
                element.querySelector('.element-content').innerHTML = dividerContent;
                break;

            case 'spacer':
                const spacerHeight = document.getElementById('spacerHeight').value;

                const spacerContent = `<div style="height:${spacerHeight}px;"></div>`;
                element.querySelector('.element-content').innerHTML = spacerContent;
                break;
        }

        // Apply common properties
        const margin = document.getElementById('elementMargin').value;
        const padding = document.getElementById('elementPadding').value;

        element.style.margin = `${margin}px 0`;
        element.style.padding = `${padding}px`;
    }

    // Show empty properties form when no element is selected
    function showEmptyPropertiesForm() {
        propertiesForm.innerHTML = `
            <div class="empty-state">
                <p>Select an element to edit its properties</p>
            </div>
        `;
    }

    // Handle canvas click (deselect elements)
    function handleCanvasClick(e) {
        if (e.target === canvas || e.target.closest('.empty-state')) {
            if (selectedElement) {
                selectedElement.classList.remove('selected');
                selectedElement = null;
                showEmptyPropertiesForm();
            }
        }
    }

    // Show preview modal
    function showPreview() {
        previewModal.style.display = 'block';

        // Create a clean version of the canvas content for preview
        const previewHTML = generateCleanHTML();
        previewContent.innerHTML = previewHTML;
    }

    // Hide preview modal
    function hidePreview() {
        previewModal.style.display = 'none';
    }

    // Save website (just a placeholder - in a real app this would save to a server)
    function saveWebsite() {
        const websiteHTML = generateCleanHTML();

        // For demo purposes, we'll just alert that it's saved
        // In a real app, this would be an API call to save the HTML
        alert('Website saved! In a real application, this would save your website to a server.');

        // You could also provide an option to download the HTML file
        const blob = new Blob([generateFullHTML()], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-website.html';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Generate clean HTML without editing UI elements
    function generateCleanHTML() {
        const tempCanvas = canvas.cloneNode(true);

        // Remove empty state if it exists
        const emptyState = tempCanvas.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // Remove element actions
        const actions = tempCanvas.querySelectorAll('.element-actions');
        actions.forEach(action => action.remove());

        // Remove canvas-element class and data attributes
        const elements = tempCanvas.querySelectorAll('.canvas-element');
        elements.forEach(el => {
            el.classList.remove('canvas-element');
            el.classList.remove('selected');
            el.removeAttribute('data-type');
            el.removeAttribute('data-id');

            // Just keep the content
            el.innerHTML = el.querySelector('.element-content').innerHTML;
        });

        return tempCanvas.innerHTML;
    }

    // Generate complete HTML document
    function generateFullHTML() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>My Website</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                img {
                    max-width: 100%;
                    height: auto;
                }
            </style>
        </head>
        <body>
            ${generateCleanHTML()}
        </body>
        </html>`;
    }

    // Update canvas state (show/hide empty state)
    function updateCanvasState() {
        const hasElements = canvas.querySelectorAll('.canvas-element').length > 0;
        const emptyState = canvas.querySelector('.empty-state');

        if (hasElements && emptyState) {
            emptyState.remove();
        } else if (!hasElements && !emptyState) {
            const newEmptyState = document.createElement('div');
            newEmptyState.className = 'empty-state';
            newEmptyState.innerHTML = `
                <div class="message">
                    <span class="material-symbols-outlined">drag_pan</span>
                    <p>Drag elements from the sidebar to start building your website</p>
                </div>
            `;
            canvas.appendChild(newEmptyState);
        }
    }

    // Helper function to capitalize first letter
    function capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Helper function to convert RGB to HEX
    function rgbToHex(rgb) {
        // Default color if not set
        if (!rgb || rgb === 'initial' || rgb === '') {
            return '#000000';
        }

        // Check if already hex
        if (rgb.startsWith('#')) {
            return rgb;
        }

        // Convert rgb(r,g,b) to hex
        const rgbMatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (rgbMatch) {
            return "#" +
                ("0" + parseInt(rgbMatch[1], 10).toString(16)).slice(-2) +
                ("0" + parseInt(rgbMatch[2], 10).toString(16)).slice(-2) +
                ("0" + parseInt(rgbMatch[3], 10).toString(16)).slice(-2);
        }

        // If we can't parse it, return a default
        return '#000000';
    }
});