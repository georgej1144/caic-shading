
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
    
}

class CAIC_API extends FORECAST_INTERPRETER {
    
    api_vocab = {}

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

}