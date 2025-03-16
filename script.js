
const region_aspect_mapping = {
        "n": [338,23],
        "ne": [23,68],
        "e": [68,113],
        "se": [113,158],
        "s": [158,203],
        "sw": [203,248],
        "w": [248,293],
        "nw": [293,338]
    }

function makeNonNegative(inputElement) {
    inputElement.addEventListener('input', () => {
        let value = parseFloat(inputElement.value);
        if (isNaN(value) || value < 0) {
            inputElement.value = 0;
        }
    });
}

function get_aspect_gradient_layer() {
    // FILL ARRAY IN FORMAT:
    //  1_ [int,int]: pair of values representing the angle bounds for the gradient section
    //  2_ [str,str]: pair of string hex codes for the color at the start and end of the gradient
    const aspect_gradient_mapping = [
        {
            "a": [0, 90], 
            "c": ["FF0000","F0F000"]
        },
        {
            "a": [90, 180],
            "c": ["F0F000","00FF00"]
        },
        {
            "a": [180, 210],
            "c": ["00FF00","0000FF"]
        },
        {
            "a": [210,360],
            "c": ["0000FF","FF0000"]
        },
    ]
    return {
        "title": "ASPECT GRADIENT",
        "rule": "sc_" + aspect_gradient_mapping.map((cur) => {
            return rule_tool("a", cur.a) + rule_tool("c", cur.c);
        }).join("p")
    }
    
}

function get_aspect_shading_layers() {
    const aspect_shading_color = "FF00A0"
    return Object.keys(region_aspect_mapping).map((key, i) => {
        return {
            "title": key.toUpperCase(),
            "rule": "sc_" + rule_tool("a", region_aspect_mapping[key]) + "c" + aspect_shading_color + "p"
        }
    })
}

function get_treecover_shading_layers() {
    const treecover_shading_colors = ["FF0000","0000FF","00FF00"];
    const treecover_bounds = get_treecover_bounds();
    return Object.keys(treecover_bounds).map((key, i) => {
        return {
            "title": "." + key.toUpperCase(),
            "rule": "sc_" + rule_tool("t", treecover_bounds[key]) + "c" + treecover_shading_colors[i] + "p"
        }
    })
}

function get_helper_layers() {
    let ret = []
    if(document.getElementById("treecover_shading").value) {
        ret.push(...get_treecover_shading_layers());
    }
    if(document.getElementById("aspect_quadrants").value) {
        ret.push(...get_aspect_shading_layers());
    }
    if(document.getElementById("aspect_gradient").value) {
        ret.push(get_aspect_gradient_layer());
    }
    return ret
}

async function getJsonFromEndpoint(data) {
    const endpoint = `https://cors-proxy.gjnsn.com/corsproxy_magic/?endpoint=${data}`;
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

function create_geojson(rules) {
    rules.push(...get_helper_layers());
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

function get_specific_avaforecast(data, areaId) {
    for(const obj of data) {
        if(obj.areaId == areaId) {
            return obj
        }
    }
}

function get_treecover_bounds() {
    // fill into { "[elev]": [min,max],...}
    return {
        "alp": [treecoverAlpMin, treecoverAlpMax],
        "tln": [treecoverTlnMin, treecoverTlnMax],
        "btl": [treecoverBtlMin, treecoverBtlMax],
    }
}

function sort_trim_aspects(aspects) {
    /**
     * Returns the start and end aspect
     * Returns null if aspects is empty
     */
    if (aspects.length === 0) {
        return null;
    }
    
    let aspectRegions = aspects.map(asp => region_aspect_mapping[asp]);
    let ret = [];
    let i = 0;
    
    while (aspectRegions.length > 0) {
        if (i > aspectRegions.length - 1) i = 0;

        if (ret.length === 0) {
            ret.push(aspectRegions[i]);
            aspectRegions.splice(i, 1);
        }

        let [boundL, boundR] = aspectRegions[i] || [];
        for (let j = 0; j < ret.length; j++) {
            let [regL, regR] = ret[j];
            if (boundL === regR) {
                ret.splice(j + 1, 0, aspectRegions[i]);
                aspectRegions.splice(i, 1);
                break;
            } else if (boundR === regL) {
                ret.splice(j, 0, aspectRegions[i]);
                aspectRegions.splice(i, 1);
                break;
            }
        }
        i++;
    }
    return [ret[0][0], ret[ret.length - 1][1]];
}


function rule_tool(mode, range) {
    return mode + range.join("-");
}

function format_as_rule(aspect_range, treecover_range, color) {
    return  rule_tool("s", [slideSlopeMin.value, slideSlopeMax.value]) +
            rule_tool("a", aspect_range) +
            rule_tool("t", treecover_range) +
            "c" + color + "p";
}

function split_by_elevation(aspectElevations) {
    let ret = {
        "alp": [],
        "tln": [],
        "btl": [],
    };
    for(const e of aspectElevations) {
        div = e.split("_");
        ret[div[1]].push(div[0]);
    }
    return ret;
}

function danger_to_color(likelihood, expectedSize) {
    // TODO: impl
}


function danger_to_rule(problem, date) {
    let aspects = split_by_elevation(problem.aspectElevations);
    const color = "FF0000"; // danger_to_color(null); // TODO: implement color mapping from danger levels
    const treecovers = get_treecover_bounds(); //
    rule = {
        "title": "",
        "rule": "sc_"
    };
    for(const key of Object.keys(aspects)) {
        // per elev, get aspect bounds
        aspects[key] = sort_trim_aspects(aspects[key]);
        if(aspects[key]) {
            // only add rule if prob exists for elev
            rule.title = " " + problem.type + " " + date;
            // rule.title = " " + problem.type + " " + date.toISOString().split("T")[0];
            rule.rule += format_as_rule(aspects[key], treecovers[key], color);
            // rule.rule += "p";
        }
    }
    return rule;
}   

function interpret_problems(problems, date) {
    let result = [];
    for(let i = 0; i < problems.length; i++) {
        result.push(danger_to_rule(problems[i], date))
    }
    return result
}

async function avy_forecast(date = null, and_weather = false) {
    let params = {};
    if (!and_weather) {
        params["productType"] = "avalancheforecast";
    }
    if (date) {
        params["datetime"] = date.toISOString();
    }

    let data = "/products/all?"
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
                    // TODO: handle else
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
        params["datetime"] = date.toISOString();
    }

    let data = "/products/all/area?"
    for (const [key,val] of Object.entries(params)) {
        data += `${key}=${val}&`
    }

    try {
        const resp = await getJsonFromEndpoint(data);
        const ret = [];

        if (resp && resp.features && Array.isArray(resp.features)) { // Check if resp is an array
            for (const item of resp.features) {
                if (
                    typeof item === "object" &&
                    item !== null &&
                    item.type === "Feature"
                ) {
                    ret.push(item); // Just push the raw object
                } else if (typeof item === "object" && item !== null) {
                    // TODO: handle else
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

    const turfPoint = turf.point(point);
    let ret = "";
    for (const region of regions) {
        if (typeof region !== 'object' || region === null || !region.geometry || !region.geometry.type || region.geometry.type !== 'MultiPolygon') {
            console.warn("Invalid GeoJSON polygon encountered in regions array:", region);
            continue; // Skip to the next region
        }

        try {
            const mpolygon = turf.multiPolygon(region.geometry.coordinates); // Create Turf polygon
            const isInside = turf.booleanPointInPolygon(turfPoint, mpolygon);

            if (isInside) {
                ret = region.id;
                // return region.id; // Or region.properties.id, if ID is in properties
            }
        } catch (error) {
            console.error("Error checking point in polygon:", error);
        }
    }
    return ret;
    // return null; // No region found
}

async function main(lat,lon,date) {
    let date_param = null;
    if(date) {
        // if date given, use 12:00:00
        // this will guarantee for any date we  
        // TODO: TEST
        // always return the forcast FOR that day, not FROM that day
        const split = date.split("-");
        date_param = new Date();
        date_param.setYear(split[0]);
        date_param.setUTCMonth(split[1]-1);
        date_param.setUTCDate(split[2]);
        date_param.setUTCHours(12,0,0,0);

    } else {
        // if no date given, $OMIT$ use current day AND TIME
        date_param = new Date();
        date = date_param.toISOString().split("T")[0];
        // 10:30PM UTC
        // date.setHours(23);
        // console.log(date.toISOString());
    }

    const forecast = await avy_forecast(date_param);
    const regions = await avy_regions(date_param);

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