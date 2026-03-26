// import "./helper_layers.js";

function makeNonNegative(inputElement) {
    inputElement.addEventListener('input', () => {
        let value = parseFloat(inputElement.value);
        if (isNaN(value) || value < 0) {
            inputElement.value = 0;
        }
    });
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


async function main(lat,lon) {
    // let date_param = null;
    // if(date) {
    //     // if date given, use 12:00:00
    //     // this will guarantee for any date we  
    //     // TODO: TEST
    //     // always return the forcast FOR that day, not FROM that day
    //     const split = date.split("-");
    //     date_param = new Date();
    //     date_param.setYear(split[0]);
    //     date_param.setUTCMonth(split[1]-1);
    //     date_param.setUTCDate(split[2]);
    //     date_param.setUTCHours(12,0,0,0);

    // } else {
    //     // if no date given, $OMIT$ use current day AND TIME
    //     date_param = new Date();
    //     date = date_param.toISOString().split("T")[0];
    //     // 10:30PM UTC
    //     // date.setHours(23);
    //     // console.log(date.toISOString());
    // }

    const regions = await avy_regions();

    const forecast = await avy_forecast();

    treecoverAlpMin = 0;
    treecoverAlpMax = treecoverAlpTln.value;
    treecoverTlnMin = treecoverAlpMax;
    treecoverTlnMax = treecoverTlnBtl.value;
    treecoverBtlMin = treecoverTlnMax;
    treecoverBtlMax = 100;

    const zone_id = find_region_for_point([lon,lat],regions);
    const zone_forecast = get_specific_avaforecast(forecast, zone_id);
    
    const day_probs = zone_forecast.avalancheProblems.days[0];
    const interpretation = interpret_problems(day_probs, date);
    const json_data = create_geojson(interpretation);
    save_as_json(json_data, "ava_shading_" + date);
}


export let treecoverAlpTln = document.getElementById('treecover-alp-tln');
export let treecoverTlnBtl = document.getElementById('treecover-tln-btl');
export let slideSlopeMin = document.getElementById('slide-slope-min');
export let slideSlopeMax = document.getElementById('slide-slope-max');

document.addEventListener('DOMContentLoaded', () => {
    const forecastDateInput = document.getElementById('forecast-date');
    const getForecastButton = document.getElementById('get-forecast-button');
    
    // dropdown nonsense
    const coll = document.getElementsByClassName("collapsible");

    for(let i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            const content = this.nextElementSibling;
            if (content.style.display === "flex") {
                content.style.display = "none";
            } else {
                content.style.display = "flex";
            }
        });
    }

    treecoverAlpTln = document.getElementById('treecover-alp-tln');
    treecoverTlnBtl = document.getElementById('treecover-tln-btl');
    slideSlopeMin = document.getElementById('slide-slope-min');
    slideSlopeMax = document.getElementById('slide-slope-max');

    makeNonNegative(treecoverAlpTln);
    makeNonNegative(treecoverTlnBtl);
    makeNonNegative(slideSlopeMin);
    makeNonNegative(slideSlopeMax);

    treecoverAlpTln.addEventListener('input', () => {
        makeNonNegative(treecoverAlpTln);
        if(treecoverAlpTln.value > treecoverTlnBtl.value) {
            treecoverAlpTln.value = treecoverTlnBtl.value;
        }
    });
    
    treecoverTlnBtl.addEventListener('input', () => {
        makeNonNegative(treecoverTlnBtl);
        if(treecoverTlnBtl.value < treecoverAlpTln.value) {
            treecoverTlnBtl.value = treecoverAlpTln.value;
        }
    });
    
    getForecastButton.addEventListener('click', async () => {
        // SIMPLE LAT LON REGEX
        // MATCH 1 LAT | MATCH 2 LON
        // (-?\d+.\d+)[,| ]+(-?\d+.\d+)
        let lat = document.getElementById('latitude').value;
        let lon = document.getElementById('longitude').value;
        let date = forecastDateInput.value;
        if (lat === "" || lon === "") {
            // handle no lat/lon
            return
        }

        await main(lat,lon,date)
    })
});

function reset_settings() {
    const settings = {
        treecoverAlpTln: 1,
        treecoverTlnBtl: 25,
        slideSlopeMin: 30,
        slideSlopeMax: 50,
    }
    treecoverAlpTln.value = settings.treecoverAlpTln;
    treecoverTlnBtl.value = settings.treecoverTlnBtl;
    slideSlopeMin.value = settings.slideSlopeMin;
    slideSlopeMax.value = settings.slideSlopeMax;
}