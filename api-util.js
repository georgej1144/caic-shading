
class FORECAST_INTERPRETER {

    async getJsonFromEndpoint(data) {
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
    
    find_region_for_latlon(lat,lon, regions) {
        // returns [center_id, zone_id]
        if (!Array.isArray(regions)) {
            console.error("Regions must be an array of GeoJSON polygons.");
            return null; // Or throw an error
        }

        if (!Array.isArray(point) || point.length !== 2) {
            console.error("Point must be a [longitude, latitude] array.");
            return null;
        }

        const turfPoint = turf.point([lon,lat]);
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
                    ret = (region.properties.center_id, region.id);
                    // return region.id; // Or region.properties.id, if ID is in properties
                }
            } catch (error) {
                console.error("Error checking point in polygon:", error);
            }
        }
        return ret;
        // return null; // No region found
    }

    sort_trim_aspects(aspects) {
        /**
         * Returns the start and end aspect
         * Returns null if aspects is empty
         */
        if (aspects.length === 0) {
            return null;
        }
        
        let aspectRegions = aspects.map(asp => this.aspect_mapping[asp]);
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

    rule_tool(mode, range) {
        return mode + range.join("-");
    }

    format_as_rule(aspect_range, elevation_range, color, options) {
        let ret = this.rule_tool("s", [slideSlopeMin.value, slideSlopeMax.value]);
        ret += this.rule_tool("a", aspect_range);
        if(options.useTreecover) {  //TODO: logic for options to configure treecover or elevation as separator (and unit if elevation)
            ret += this.rule_tool("t", elevation_range);
        }
        if(options.useElevation) {
            ret += this.rule_tool("e", elevation_range) + options.elevationUnit;
        }
        ret += "c" + color + "p";
    }

    split_by_elevation(location) {
        let ret = {
            [this.elevation_mapping[0]]: [],
            [this.elevation_mapping[1]]: [],
            [this.elevation_mapping[2]]: [],
        };
        for(const e of location) {
            div = e.split(" ");
            ret[div[1]].push(div[0]);
        }
        return ret;
    }

    danger_to_rule(problem, options) {
        let aspects = this.split_by_elevation(problem.location);
        const color = "FF0000"; // danger_to_color(null); // TODO: implement color mapping from danger levels
        const elevations = options.elevations;  //TODO: logic for options.elevations to be object of correct form
        rule = {
            "title": "",
            "rule": "sc_"
        };
        for(const key of Object.keys(aspects)) {
            // per elev, get aspect bounds
            aspects[key] = this.sort_trim_aspects(aspects[key]);
            if(aspects[key]) {
                // only add rule if prob exists for elev
                rule.title = " " + problem.name + "_" + date;
                // rule.title = " " + problem.type + " " + date.toISOString().split("T")[0];
                rule.rule += this.format_as_rule(aspects[key], elevations[key], color, options);
                // rule.rule += "p";
            }
        }
        return rule;
    }
    
    interpret_problems_to_DEM(problems, options) {
        let result = [];
        for(let i = 0; i < problems.length; i++) {
            result.push(this.danger_to_rule(problems[i], options))
        }
        return result
    }    


    run(options) {
        let problems = this.get_problems_from_coords(options.lat, options.lon);
        if(!problems) {
            // no problems found in forecast
            //TODO: tell user what happened
            return;
        }

        let interp = this.interpret_problems_to_DEM(problems, options);

    }

}

class CAIC_API extends FORECAST_INTERPRETER {
    
    aspect_mapping = {
        "n": [338,23],
        "ne": [23,68],
        "e": [68,113],
        "se": [113,158],
        "s": [158,203],
        "sw": [203,248],
        "w": [248,293],
        "nw": [293,338]
    }

    elevation_mapping = ["alp", "tln", "btl"]

    async get_zones(date = null) {
        let endpoint = "/products/all/area?"

        if(date) {
            endpoint += `date=${date.toISOString()}`
        }

        try {
            const response = await self.getJsonFromEndpoint(endpoint);
            console.log(response);
            console.log("UNFINISHED FLOW, RETURN CAIC/PROCESS")
            return response
        } catch (error) {
            console.error(`Error in get_zones(date=${date}):`, error);
            return null;
        }
    }


    async avy_regions(date = null, and_weather = false) {
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
}

class NAC_API extends FORECAST_INTERPRETER {

    CBAC_NW_feature = {"type": "Feature","id": 2987,"properties": {"name": "Northwest Mountains","center": "Crested Butte Avalanche Center","center_link": "https://cbavalanchecenter.org/","timezone": "America/Denver","center_id": "CBAC","state": "CO","link": "https://cbavalanchecenter.org/forecasts/#/northwest-mountains"},"geometry": {"type": "Polygon","coordinates": [[[-107.196350098,38.953668815],[-107.140817642,38.984432331],[-107.142791748,38.997707897],[-107.129745483,39.013782008],[-107.099618912,39.020850793],[-107.067689896,39.035252921],[-107.04331398,39.025451792],[-107.017049789,39.041652925],[-107.007694244,39.036052953],[-106.988983154,39.031385971],[-106.97353363,39.028718986],[-106.96726799,39.03098593],[-106.963748932,39.028852337],[-106.964435577,39.017783294],[-106.94237709,39.012248122],[-106.94413662,39.004311397],[-106.962804794,39.003110807],[-106.965808868,38.993705476],[-106.979799271,38.992037734],[-107.016448975,38.979294885],[-107.023487091,38.973423063],[-107.025547028,38.964080524],[-107.042884827,38.94419016],[-107.041683197,38.936379329],[-107.045545578,38.929502416],[-107.032499313,38.911605965],[-107.056875229,38.881879872],[-107.059106827,38.871857037],[-107.052927017,38.86290211],[-107.023143768,38.837434547],[-107.020397186,38.827271716],[-107.024517059,38.818578669],[-107.07567215,38.816572431],[-107.082023621,38.812158507],[-107.088718414,38.799316447],[-107.10193634,38.797175879],[-107.107429504,38.793028345],[-107.14931488,38.797309666],[-107.186908722,38.816973683],[-107.224159241,38.82339341],[-107.242527008,38.831952147],[-107.27891922,38.836364844],[-107.295742035,38.849066534],[-107.306728363,38.864572891],[-107.305355072,38.897312273],[-107.298660278,38.904125513],[-107.300548553,38.90960235],[-107.296772003,38.912006681],[-107.292995453,38.936846668],[-107.285957336,38.946459812],[-107.258319855,38.959809239],[-107.235832214,38.961944914],[-107.216091156,38.955270716],[-107.196350098,38.953668815]]]}}
    CBAC_SW_feature = {"type": "Feature","id": 2988,"properties": {"name": "Southeast Mountains","center": "Crested Butte Avalanche Center","center_link": "https://cbavalanchecenter.org/","timezone": "America/Denver","center_id": "CBAC","state": "CO","link": "https://cbavalanchecenter.org/forecasts/#/southeast-mountains"},"geometry": {"type": "Polygon","coordinates": [[[-106.942205429,39.011847973],[-106.933107376,39.004844987],[-106.917486191,38.99944221],[-106.910405159,39.000242647],[-106.907572746,38.99227122],[-106.893754005,38.989702829],[-106.878261566,38.994239145],[-106.876802444,39.007012652],[-106.860795021,39.009380333],[-106.847019196,38.987234416],[-106.828093529,38.977960423],[-106.817107201,38.981263172],[-106.799426079,38.979495053],[-106.797065735,38.969352537],[-106.790370941,38.964881361],[-106.764364243,38.971221004],[-106.753721237,38.961844805],[-106.755137444,38.947494483],[-106.751747131,38.94419016],[-106.732091904,38.944090026],[-106.720590591,38.939717396],[-106.718788147,38.919619859],[-106.723079681,38.916681536],[-106.723766327,38.910871312],[-106.719560623,38.898314261],[-106.72041893,38.883416582],[-106.729946136,38.874663574],[-106.730976105,38.867914335],[-106.745738983,38.85722116],[-106.744365692,38.852275023],[-106.752090454,38.847595928],[-106.754665375,38.835295124],[-106.809768677,38.810820901],[-106.823759079,38.796172466],[-106.834316254,38.772220137],[-106.841869354,38.766933484],[-106.861009598,38.765059639],[-106.865987778,38.768807279],[-106.87682,38.79508],[-106.891136169,38.802058957],[-106.919546127,38.802727845],[-106.942892075,38.798580634],[-106.950101852,38.789215076],[-106.976280212,38.779781378],[-107.015419006,38.775030604],[-107.025718689,38.765260411],[-107.044944763,38.764390397],[-107.056789398,38.767535781],[-107.087087631,38.789683384],[-107.088375092,38.794700767],[-107.082624435,38.811556587],[-107.07695961,38.8161043],[-107.027692795,38.817709306],[-107.020311356,38.826603057],[-107.021169662,38.833891093],[-107.028636932,38.84398613],[-107.053871155,38.863770921],[-107.05953598,38.87299303],[-107.057218552,38.88234757],[-107.051210403,38.886155852],[-107.04709053,38.895775864],[-107.032670975,38.911472392],[-107.045631409,38.929435647],[-107.041082382,38.937581052],[-107.042798996,38.944724202],[-107.016792297,38.979294885],[-106.978254318,38.992504706],[-106.965465546,38.994105728],[-106.962547302,39.003377607],[-106.943922043,39.004177999],[-106.942205429,39.011847973]]]}}

    aspect_mapping = {
        "north": [338,23],
        "northeast": [23,68],
        "east": [68,113],
        "southeast": [113,158],
        "south": [158,203],
        "southwest": [203,248],
        "west": [248,293],
        "northwest": [293,338]
    }

    elevation_mapping = ["upper", "middle", "lower"]

    append_CBAC_regions(regions) {
        regions.push(this.CBAC_NW_feature);
        regions.push(this.CBAC_SW_feature);
        return regions
    }

    async avy_regions() {

        let data = "products/map-layer?day="

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
                    } else {
                        // TODO: handle else
                        // ret.push(item); // Just push the raw object
                    }
                }
            }

            ret = this.append_CBAC_regions(ret); // append static CBAC regions that aren't returned by general endpoint

            return ret;
        } catch (error) {
            console.error("Error in avy_regions:", error);
            return [];
        }
    }

    async avy_forecast(center_id, zone_id) {

        if (!center_id || !zone_id) {
            //if center or zone id not provided, err and exit
            return [];
        }

        let params = {"type": "forecast", "center_id": center_id, "zone_id": zone_id};

        let data = "product?"
        for (const [key,val] of Object.entries(params)) {
            data += `${key}=${val}&`
        }

        try {
            const resp = await getJsonFromEndpoint(data);
            
            if (resp) { // Check if resp exists
                if (
                    typeof resp === "object" &&
                    resp.product_type === "forecast"
                ) {
                    return resp; // Just return the response
                } else {
                    // TODO: handle else
                    return null
                }
            }

        } catch (error) {
            console.error("Error in avy_forecast:", error);
            return null;
        }
    }

    async get_problems_from_coords(lat,lon) {
        
        let regions, forecast, center_id, zone_id;
        
        regions = this.avy_regions();
        center_id, zone_id = this.find_region_for_latlon(lat,lon,regions);

        forecast = this.avy_forecast(center_id, zone_id);
        
        if(forecast && forecast.forecast_avalanche_problems) {
            return forecast.forecast_avalanche_problems;
        } else {
            return null;
        }
    }

}