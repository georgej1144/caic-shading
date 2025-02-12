// script.js
document.addEventListener('DOMContentLoaded', () => {
    const regionSelect = document.getElementById('region-select');
    const dangerLevelsContainer = document.getElementById('danger-levels-container');
    const aspectsContainer = document.getElementById('aspects-container');
    const includeHelpersContainer = document.getElementById('include-helpers-container');
    const getForecastButton = document.getElementById('get-forecast-button');

    fetch('config.json')  // Fetch the config file
        .then(response => response.json())
        .then(config => {
            // Populate Regions
            for (const region in config.regions) {
                const option = document.createElement('option');
                option.value = region;
                option.text = region;
                regionSelect.appendChild(option);
            }

            // Populate Danger Levels (1-5)
            for (let i = 1; i <= 5; i++) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `danger-level-${i}`;
                checkbox.value = i;
                const label = document.createElement('label');
                label.htmlFor = `danger-level-${i}`;
                label.textContent = `${i}`; // You might want more descriptive labels
                dangerLevelsContainer.appendChild(checkbox);
                dangerLevelsContainer.appendChild(label);
                dangerLevelsContainer.appendChild(document.createElement('br')); // Add line break
            }

            // Populate Aspects
            for (const aspect in config.regions) { // Use the same keys as regions
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `aspect-${aspect}`;
                checkbox.value = aspect;
                const label = document.createElement('label');
                label.htmlFor = `aspect-${aspect}`;
                label.textContent = aspect.toUpperCase();
                aspectsContainer.appendChild(checkbox);
                aspectsContainer.appendChild(label);
                aspectsContainer.appendChild(document.createElement('br')); // Add line break
            }

            // Populate Include Helpers
            for (const helper in config.include_helpers) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `helper-${helper}`;
                checkbox.value = config.include_helpers[helper]; // Store the boolean value
                checkbox.checked = config.include_helpers[helper]; // Set initial checked state
                const label = document.createElement('label');
                label.htmlFor = `helper-${helper}`;
                label.textContent = helper;
                includeHelpersContainer.appendChild(checkbox);
                includeHelpersContainer.appendChild(label);
                includeHelpersContainer.appendChild(document.createElement('br'));
            }


            getForecastButton.addEventListener('click', () => {
                const selectedRegion = regionSelect.value;
                const forecastDate = document.getElementById('forecast-date').value;

                const selectedDangerLevels = Array.from(document.querySelectorAll('input[type="checkbox"][id^="danger-level-"]:checked'))
                    .map(cb => cb.value);

                const selectedAspects = Array.from(document.querySelectorAll('input[type="checkbox"][id^="aspect-"]:checked'))
                    .map(cb => cb.value);

                const selectedHelpers = {};
                for (const helper in config.include_helpers) {
                    selectedHelpers[helper] = document.getElementById(`helper-${helper}`).checked;
                }

                const slideSlopeMin = document.getElementById('slide-slope-min').value;
                const slideSlopeMax = document.getElementById('slide-slope-max').value;
                const treelineTransitionMin = document.getElementById('treeline-transition-min').value;
                const treelineTransitionMax = document.getElementById('treeline-transition-max').value;

                console.log("Region:", selectedRegion);
                console.log("Date:", forecastDate);
                console.log("Danger Levels:", selectedDangerLevels);
                console.log("Aspects:", selectedAspects);
                console.log("Helpers:", selectedHelpers);
                console.log("Slide Slope Min:", slideSlopeMin);
                console.log("Slide Slope Max:", slideSlopeMax);
                console.log("Treeline Transition Min:", treelineTransitionMin);
                console.log("Treeline Transition Max:", treelineTransitionMax);

                // ... (Your Python/JS conversion and CAIC data fetching logic will go here)
            });
        })
        .catch(error => console.error('Error loading config.json:', error));
});