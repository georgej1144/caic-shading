
function get_cur_date() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function makeNonNegative(inputElement) {
    inputElement.addEventListener('input', () => {
        let value = parseFloat(inputElement.value);
        if (isNaN(value) || value < 0) {
            inputElement.value = 0;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const forecastDateInput = document.getElementById('forecast-date');
    forecastDateInput.value = get_cur_date();
    
    const includeHelpersContainer = document.getElementById('include-helpers-container');
    const getForecastButton = document.getElementById('get-forecast-button');
    
    
    const treecoverAlpMin = document.getElementById('treecover-alp-min');
    const treecoverAlpMax = document.getElementById('treecover-alp-max');
    const treecoverTlnMin = document.getElementById('treecover-tln-min');
    const treecoverTlnMax = document.getElementById('treecover-tln-max');
    const treecoverBtlMin = document.getElementById('treecover-btl-min');
    const treecoverBtlMax = document.getElementById('treecover-btl-max');
    const slideSlopeMin = document.getElementById('slide-slope-min');
    const slideSlopeMax = document.getElementById('slide-slope-max');

    makeNonNegative(treecoverAlpMin);
    makeNonNegative(treecoverAlpMax);
    makeNonNegative(treecoverTlnMin);
    makeNonNegative(treecoverTlnMax);
    makeNonNegative(treecoverBtlMin);
    makeNonNegative(treecoverBtlMax);
    makeNonNegative(slideSlopeMin);
    makeNonNegative(slideSlopeMax);

    treecoverAlpMax.addEventListener('input', () => {
        treecoverTlnMin.value = treecoverAlpMax.value;
    });

    treecoverTlnMin.addEventListener('input', () => {
        treecoverAlpMax.value = treecoverTlnMin.value;
    });

    treecoverTlnMax.addEventListener('input', () => {
        treecoverBtlMin.value = treecoverTlnMax.value;
    });

    treecoverBtlMin.addEventListener('input', () => {
        treecoverTlnMax.value = treecoverBtlMin.value;
    });

});

const coll = document.getElementsByClassName("collapsible");
        let i;

        for (i = 0; i < coll.length; i++) {
            coll[i].addEventListener("click", function() {
                this.classList.toggle("active");
                const content = this.nextElementSibling;
                if (content.style.display === "block") {
                    content.style.display = "none";
                } else {
                    content.style.display = "block";
                }
            });
        }