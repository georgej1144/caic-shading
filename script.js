import { get_helper_layers } from "./helper_layers.js";
import { NAC_API } from "./api-util.js";

function enforceMinMax(el) {
    console.log('t')
    if (el.value != "") {
        if (parseInt(el.value) < parseInt(el.min)) {
            el.value = el.min;
        }
        if (parseInt(el.value) > parseInt(el.max)) {
            console.log(el.value, el.max, parseInt(el.value))
            el.value = el.max;
            console.log(el.value, el.max)
        }
    }
}

function create_geojson(rules, options) {
    rules.push(...get_helper_layers(options));
    return {
        "features": rules.map((rule) => {
            return {
                "geometry": null,
                "id": crypto.randomUUID(),
                "type": "Feature",
                "properties": {
                    "alias": rule.rule,
                    "title": rule.title,
                    "class": "ConfiguredLayer"
                }
            }}),
        "type": "FeatureCollection"
    }
}

function save_as_json(exportObj, exportName){
    // https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    let downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

const treecoverAlpTln = document.getElementById('treecover-alp-tln');
const treecoverTlnBtl = document.getElementById('treecover-tln-btl');
const elevationAlpTln = document.getElementById('elevation-alp-tln');
const elevationTlnBtl = document.getElementById('elevation-tln-btl');
const elevationFeet = document.getElementById('elevationFeet');
const elevationMeters = document.getElementById('elevationMeters');
const slideSlopeMin = document.getElementById('slide-slope-min');
const slideSlopeMax = document.getElementById('slide-slope-max');
const getForecastButton = document.getElementById('get-forecast-button');
const treecoverSettingsButton = document.getElementById('treecover%');
const elevationSettingsButton = document.getElementById('elevations');

async function main(lat,lon) {
    let interpreter = new NAC_API();

    let date_param = new Date();
    let date = date_param.toISOString().split("T")[0];
    
    let options = {
        "useTreecover": treecoverSettingsButton.nextElementSibling.checkVisibility(),
        "useElevation": elevationSettingsButton.nextElementSibling.checkVisibility(),
        "elevationUnit": elevationFeet.checked ? 'f' : 'm',
        "elevations": {},
        "slideSlopeMin": parseInt(slideSlopeMin.value),
        "slideSlopeMax": parseInt(slideSlopeMax.value),
        "lat": lat,
        "lon": lon,
        "helper_treecover_shading": document.getElementById("treecover_shading").checked,
        "helper_aspect_quadrants": document.getElementById("aspect_quadrants").checked,
        "helper_aspect_gradient": document.getElementById("aspect_gradient").checked,
        "date": date
    }

    if(options.useTreecover) {
        options.elevations = {
                [interpreter.elevation_mapping[0]]: [0, parseInt(treecoverAlpTln.value)],
                [interpreter.elevation_mapping[1]]: [parseInt(treecoverAlpTln.value), parseInt(treecoverTlnBtl.value)],
                [interpreter.elevation_mapping[2]]: [parseInt(treecoverTlnBtl.value), 100],
            }
    } else {
        options.elevations = {
                [interpreter.elevation_mapping[0]]: [30000, parseInt(elevationAlpTln.value)],
                [interpreter.elevation_mapping[1]]: [parseInt(elevationAlpTln.value), parseInt(elevationTlnBtl.value)],
                [interpreter.elevation_mapping[2]]: [parseInt(elevationTlnBtl.value), 100],
            }
    }

    const interpretation = await interpreter.run(options);
    console.log(interpretation)
    if(!interpretation) {
        return;
    }
    const json_data = create_geojson(interpretation, options);

    
    save_as_json(json_data, "ava_shading_" + date);
}

document.addEventListener('DOMContentLoaded', () => {
    // binary dropdowns

    // treecoverSettingsButton.classList.toggle("active");
    treecoverSettingsButton.nextElementSibling.style.display = "flex"

    treecoverSettingsButton.addEventListener("click", function() {
        this.classList.toggle("active")
        const content = this.nextElementSibling;
        if(content.style.display === "flex") {
            content.style.display = "none";
            elevationSettingsButton.classList.toggle("active");
            elevationSettingsButton.nextElementSibling.style.display = "flex"
        } else {
            content.style.display = "flex";
            elevationSettingsButton.classList.toggle("active");
            elevationSettingsButton.nextElementSibling.style.display = "none"
        }
    })

    elevationSettingsButton.addEventListener("click", function() {
        this.classList.toggle("active")
        const content = this.nextElementSibling;
        if(content.style.display === "flex") {
            content.style.display = "none";
            treecoverSettingsButton.classList.toggle("active");
            treecoverSettingsButton.nextElementSibling.style.display = "flex"
        } else {
            content.style.display = "flex";
            treecoverSettingsButton.classList.toggle("active");
            treecoverSettingsButton.nextElementSibling.style.display = "none"
        }
    })

    // enforce min-max ranges
    treecoverAlpTln.addEventListener('change', () => enforceMinMax(treecoverAlpTln));
    treecoverTlnBtl.addEventListener('change', () => enforceMinMax(treecoverTlnBtl));
    elevationAlpTln.addEventListener('change', () => enforceMinMax(elevationAlpTln));
    elevationTlnBtl.addEventListener('change', () => enforceMinMax(elevationTlnBtl));
    slideSlopeMin.addEventListener('change', () => enforceMinMax(slideSlopeMin));
    slideSlopeMax.addEventListener('change', () => enforceMinMax(slideSlopeMax));

    // enforce hierarchy of treecover%
    treecoverAlpTln.addEventListener('change', () => {
        if(parseInt(treecoverAlpTln.value) > parseInt(treecoverTlnBtl.value)) {
            treecoverAlpTln.value = treecoverTlnBtl.value;
        }
    });
    treecoverTlnBtl.addEventListener('change', () => {
        if(parseInt(treecoverTlnBtl.value) < parseInt(treecoverAlpTln.value)) {
            treecoverTlnBtl.value = treecoverAlpTln.value;
        }
    });

    // enforce hierarchy of elevations
    elevationAlpTln.addEventListener('change', () => {
        if(parseInt(elevationAlpTln.value) > parseInt(elevationTlnBtl.value)) {
            elevationAlpTln.value = elevationTlnBtl.value;
        }
    });
    elevationTlnBtl.addEventListener('change', () => {
        if(parseInt(elevationTlnBtl.value) < parseInt(elevationAlpTln.value)) {
            elevationTlnBtl.value = elevationAlpTln.value;
        }
    });

    // enforce hierarchy of slide slope
    slideSlopeMin.addEventListener('change', () => {
        if(parseInt(slideSlopeMin.value) > parseInt(slideSlopeMax.value)) {
            slideSlopeMin.value = slideSlopeMax.value;
        }
    });
    slideSlopeMax.addEventListener('change', () => {
        if(parseInt(slideSlopeMax.value) < parseInt(slideSlopeMin.value)) {
            slideSlopeMax.value = slideSlopeMin.value;
        }
    });
    
    getForecastButton.addEventListener('click', async () => {
        // SIMPLE LAT LON REGEX
        // MATCH 1 LAT | MATCH 2 LON
        // (-?\d+.\d+)[,| ]+(-?\d+.\d+)
        let lat, lon, latlon = document.getElementById('coords').value.match(/(-?\d+.\d+)[,| ]+(-?\d+.\d+)/);
        
        if (latlon.length !== 3) {
            // TODO: handle bad match
            return
        } else {
            lat = latlon[1];
            lon = latlon[2];
        }

        await main(lat,lon)
    })
});

// function reset_settings() {
//     const settings = {
//         treecoverAlpTln: 1,
//         treecoverTlnBtl: 25,
//         slideSlopeMin: 30,
//         slideSlopeMax: 50,
//     }
//     treecoverAlpTln.value = settings.treecoverAlpTln;
//     treecoverTlnBtl.value = settings.treecoverTlnBtl;
//     slideSlopeMin.value = settings.slideSlopeMin;
//     slideSlopeMax.value = settings.slideSlopeMax;
// }