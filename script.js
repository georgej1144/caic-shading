
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

async function getJsonFromEndpoint(data) {
    const endpoint = `https://cors-proxy.gjnsn.com/corsproxy_magic/?endpoint=${data}`;
    console.log(endpoint);
    try {
        const response = await fetch(endpoint, {
            headers: {
              "Content-Type": "application/json",
            }});
        if (!response.ok) {
            const errorText = await response.text(); // Get error details from server
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const jsonData = await response.json();
        return jsonData;
    } catch (error) {
        console.error("Error fetching JSON:", error);
        // Consider re-throwing the error or returning a default value depending on your needs.
        throw error; // Re-throwing to allow calling function to handle the error.
    }
}

async function avy_forecast(date = null, and_weather = false) {
    let params = {};
    if (!and_weather) {
        params["productType"] = "avalancheforecast";
    }
    if (date) {
        params["datetime"] = date.toISOString(); // Convert Date to ISO string
    }

    var data = "/products/all?"
    for (const [key,val] of Object.entries(params)) {
        data += `${key}=${val}&`
    }

    try {
        const resp = await getJsonFromEndpoint(data);
        const ret = [];

        if (resp && Array.isArray(resp)) { // Check if resp is an array
            for (const item of resp) {
                if (
                    typeof item === "object" &&
                    item !== null &&
                    item.type === "avalancheforecast"
                ) {
                    ret.push(item); // Just push the raw object
                } else if (typeof item === "object" && item !== null) {
                    ret.push(item); // Just push the raw object
                }
            }
        }

        return ret;
    } catch (error) {
        console.error("Error in avy_forecast:", error);
        return [];
    }
}

async function avy_regions(date = null, and_weather = false) {
    let params = {};
    if (!and_weather) {
        params["productType"] = "avalancheforecast";
    }
    if (date) {
        params["datetime"] = date.toISOString(); // Convert Date to ISO string
    }

    var data = "/products/all/area?"
    for (const [key,val] of Object.entries(params)) {
        data += `${key}=${val}&`
    }

    try {
        const resp = await getJsonFromEndpoint(data);
        const ret = [];

        if (resp && Array.isArray(resp)) { // Check if resp is an array
            for (const item of resp) {
                if (
                    typeof item === "object" &&
                    item !== null &&
                    item.type === "avalancheforecast"
                ) {
                    ret.push(item); // Just push the raw object
                } else if (typeof item === "object" && item !== null) {
                    ret.push(item); // Just push the raw object
                }
            }
        }

        return ret;
    } catch (error) {
        console.error("Error in avy_forecast:", error);
        return [];
    }
}

function find_region_for_point(point, regions) {
    if (!Array.isArray(regions)) {
        console.error("Regions must be an array of GeoJSON polygons.");
        return null; // Or throw an error
    }

    if (!Array.isArray(point) || point.length !== 2) {
        console.error("Point must be a [longitude, latitude] array.");
        return null;
    }

    const turfPoint = turf.point(...point);

    for (const region of regions) {
        if (typeof region !== 'object' || region === null || !region.geometry || !region.geometry.type || region.geometry.type !== 'MultiPolygon') {
            console.warn("Invalid GeoJSON polygon encountered in regions array:", region);
            continue; // Skip to the next region
        }

        try {
            const mpolygon = turf.multiPolygon(region.geometry.coordinates); // Create Turf polygon
            const isInside = booleanPointInPolygon(turfPoint, mpolygon);

            if (isInside) {
                return region.id; // Or region.properties.id, if ID is in properties
            }
        } catch (error) {
            console.error("Error checking point in polygon:", error);
        }
    }

    return null; // No region found
}

function main(lat,lon,date) {
    const forecast = avy_forecast();
    const regions = avy_regions();

    const zone_id = find_region_for_point([lon,lat],regions);
    console.log(zone_id);
}

document.addEventListener('DOMContentLoaded', () => {
    const forecastDateInput = document.getElementById('forecast-date');
    // forecastDateInput.value = get_cur_date();
    
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

    getForecastButton.addEventListener('click', () => {
        const lat = document.getElementById('latitude').value;
        const lon = document.getElementById('longitude').value;
        const date = document.getElementById('forecast-date').value;
        if (lat === "" || lon === "") {
            // handle no lat/lon
            return
        }

        main(lat,lon,date)
    })
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