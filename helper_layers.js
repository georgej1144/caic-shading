export function get_aspect_gradient_layer() {
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

export function get_aspect_shading_layers() {
    const aspect_shading_color = "FF00A0"
    return Object.keys(region_aspect_mapping).map((key, i) => {
        return {
            "title": key.toUpperCase(),
            "rule": "sc_" + rule_tool("a", region_aspect_mapping[key]) + "c" + aspect_shading_color + "p"
        }
    })
}

export function get_treecover_shading_layers() {
    const treecover_shading_colors = ["FF0000","0000FF","00FF00"];
    const treecover_bounds = get_treecover_bounds();
    return Object.keys(treecover_bounds).map((key, i) => {
        return {
            "title": "." + key.toUpperCase(),
            "rule": "sc_" + rule_tool("t", treecover_bounds[key]) + "c" + treecover_shading_colors[i] + "p"
        }
    })
}

export function get_helper_layers() {
    let ret = []
    if(document.getElementById("treecover_shading").checked) {
        ret.push(...get_treecover_shading_layers());
    }
    if(document.getElementById("aspect_quadrants").checked) {
        ret.push(...get_aspect_shading_layers());
    }
    if(document.getElementById("aspect_gradient").checked) {
        ret.push(get_aspect_gradient_layer());
    }
    return ret
}