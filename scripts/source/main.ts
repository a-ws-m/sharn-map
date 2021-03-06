import $ from "jquery";
import marked from "marked";
import DOMPurify from "dompurify";

interface locationsDict {
    name: string[];
    description: string[];
}
interface wardEntry {
    name: string;
    description: string;
}
interface levelEntry extends wardEntry {
    notableLocations: locationsDict;
}
type districtEntry = levelEntry | { upper: levelEntry, middle: levelEntry, lower: levelEntry };

var descriptions: { [x: string]: any; };
var selectedDistrict: JQuery<HTMLElement> | null;
var helpInfo: string;

const infoBox = $("#infobox");

function showHelp() {
    // Show the help information from the landing screen
    infoBox.html(helpInfo);
}

function showSelected() {
    // Check if there's a district already selected and update info if so,
    // otherwise show help info
    if (selectedDistrict) {
        showInfo(selectedDistrict.attr("id"));
    } else {
        showHelp();
    }
}

function setDescriptionsFromJson(jsonText: string) {
    // Update descriptions variable based on JSON text
    try {
        descriptions = JSON.parse(jsonText);
    } catch (e) {
        alert(`Error with JSON file: ${e}`);
        setDefaultDescriptions();
    }
    showSelected();
}

function descriptionsFromUrl(url: string) {
    return $.getJSON(url, data => {
        console.log(`Successfully loaded data from ${url}.`);
        descriptions = data;
    })
        .fail(() => {
            alert(`Error loading from ${url}, ensure that CORS is enabled at target.`);
            setDefaultDescriptions();
        });
}

function setDefaultDescriptions() {
    if (typeof descriptions === "undefined") {
        return descriptionsFromUrl("districtInfo.json");
    }
}

function postMapLoad() {
    // Add SVG class
    $("svg").addClass("map");

    // Add click event listeners to districts
    const districts = $(".districts>path");
    districts.on("click", function (this: JQuery<HTMLElement>) {
        const $this = $(this);
        if (selectedDistrict?.attr("id") === $this.attr("id")) {
            deselectDistrict();
        } else {
            selectDistrict($this);
        }
    });

    // Load descriptions
    const descriptionLoad = loadDescriptions();

    // Check for hashes
    if (descriptionLoad) {
        descriptionLoad.done(selectFromHash);
    }
    else {
        selectFromHash();
    }
}

function loadDescriptions() {
    // Load the JSON containing the district information
    // Check URL for query string with JSON file
    const urlParams = new URLSearchParams(window.location.search);
    const jsonUrl = urlParams.get("json");
    if (jsonUrl) {
        return descriptionsFromUrl(jsonUrl);
    } else {
        return setDefaultDescriptions();
    }
}

function initialize() {
    // Get help info
    helpInfo = infoBox.html();

    // Ajax load the SVG
    $("#map-container").load("sharn.svg", postMapLoad);

    // Add JSON upload handler
    const jsonInput = $("#jsonInput");
    jsonInput.on("change", () => {
        const uploadedJson = jsonInput.prop("files")[0];
        uploadedJson.text().then(setDescriptionsFromJson);
    });

    // Check hashtag in URL
    window.addEventListener("hashchange", selectFromHash);
}

function selectFromHash() {
    // Select district based on hash in URL
    const hash = window.location.hash.substr(1);
    if (hash) {
        const hashRef = $("#" + hash);
        if (hashRef) {
            selectDistrict(hashRef);
        }
    }
}

function addNotableLocations(names: string[], descriptions: string[], section: JQuery<HTMLElement>) {
    // Add notable locations table to the given section
    if (names.length == 0) {
        return;
    }
    let table = document.createElement("table");
    table.classList.add("locationsTable");

    let theader = document.createElement("tr");

    const columnNames = ["Location", "Description"];
    columnNames.forEach(element => {
        let headerCell = document.createElement("th");
        headerCell.appendChild(document.createTextNode(element));
        theader.appendChild(headerCell);
    });

    table.appendChild(theader);

    for (let index = 0; index < names.length; index++) {
        const districtName = names[index];
        const districtDesc = descriptions[index];

        let trow = document.createElement("tr");
        let tName = document.createElement("td");
        let tDesc = document.createElement("td");

        tName.innerHTML = descToHtml(districtName);
        tDesc.innerHTML = descToHtml(districtDesc);

        trow.appendChild(tName);
        trow.appendChild(tDesc);

        table.appendChild(trow);
    }

    section.append(table);
}

function showInfo(districtId: string | void) {
    if (!districtId) {
        return;
    }
    const wardIds: { [x: string]: string } = {
        "C": "central",
        "M": "menthis",
        "T": "tavicks",
        "N": "northedge",
        "D": "dura"
    };
    const ward = $("#ward");
    const wardInfo = $("#wardInfo");

    const upperDistrict = $("#upperDistrict");
    const middleDistrict = $("#middleDistrict");
    const lowerDistrict = $("#lowerDistrict");

    const upperInfo = $("#upperInfo");
    const middleInfo = $("#middleInfo");
    const lowerInfo = $("#lowerInfo");

    const upperSection = $("#upperSection");
    const middleSection = $("#middleSection");
    const lowerSection = $("#lowerSection");

    // Determine ward name
    let isCliffside = true;
    let wardKey = "cliffside";
    for (const key in wardIds) {
        if (Object.hasOwnProperty.call(wardIds, key)) {
            const currentWard = wardIds[key];
            if (districtId.startsWith(key)) {
                wardKey = currentWard;
                isCliffside = false;
                break;
            }
        }
    }

    // Remove location information tables
    $(".locationsTable").remove();

    let upperName: string, middleName: string, lowerName: string;
    let upperDesc: string, middleDesc: string, lowerDesc: string;
    let upperLocs: locationsDict;
    const descEntry = descriptions[districtId];
    if (isCliffside) {
        upperName = descEntry["name"];
        upperDesc = descToHtml(descEntry["description"]);
        upperLocs = descEntry["notableLocations"];

        middleName = "";
        lowerName = "";
        middleDesc = "";
        lowerDesc = "";
    } else {
        const upperEntry: levelEntry = descEntry["upper"];
        const middleEntry: levelEntry = descEntry["middle"];
        const lowerEntry: levelEntry = descEntry["lower"];

        upperLocs = upperEntry["notableLocations"];
        const middleLocs = middleEntry["notableLocations"];
        const lowerLocs = lowerEntry["notableLocations"];

        upperName = upperEntry["name"];
        middleName = middleEntry["name"];
        lowerName = lowerEntry["name"];

        upperDesc = descToHtml(upperEntry["description"]);
        middleDesc = descToHtml(middleEntry["description"]);
        lowerDesc = descToHtml(lowerEntry["description"]);

        const middleLocNames = middleLocs["name"];
        const lowerLocNames = lowerLocs["name"];

        const middleLocDescs = middleLocs["description"];
        const lowerLocDescs = lowerLocs["description"];

        addNotableLocations(middleLocNames, middleLocDescs, middleSection);
        addNotableLocations(lowerLocNames, lowerLocDescs, lowerSection);
    }
    // Handle upper locations the same regardless
    let upperLocNames = upperLocs["name"];
    let upperLocDescs = upperLocs["description"];
    addNotableLocations(upperLocNames, upperLocDescs, upperSection);

    // And handle ward names
    const wardEntry = descriptions[wardKey];
    const wardName = wardEntry["name"];
    const wardDesc = descToHtml(wardEntry["description"]);

    ward.text(wardName);
    if (isCliffside) {
        setDistrictName(upperDistrict, upperName);
        middleDistrict.html("");
        lowerDistrict.html("");
    } else {
        setDistrictName(upperDistrict, upperName, "upper");
        setDistrictName(middleDistrict, middleName, "middle");
        setDistrictName(lowerDistrict, lowerName, "lower");
    }

    wardInfo.html(wardDesc);
    upperInfo.html(upperDesc);
    middleInfo.html(middleDesc);
    lowerInfo.html(lowerDesc);

    $("#districtId").text(districtId);
}

function setDistrictName(nameElement: JQuery<HTMLElement>, name: string, height?: string) {
    // Set a district name for a given height
    const nameText = document.createTextNode(name);
    // Clear the element
    nameElement.html("");

    let direction;
    switch (height) {
        case "lower":
            direction = "down";
            break;
        case "middle":
            direction = "right";
            break;
        case "upper":
            direction = "up";
            break;
        default:
            // Cliffside district
            nameElement.append(nameText);
            return;
    }

    const heightIcon = document.createElement("i");
    heightIcon.classList.add("heightIcon");
    heightIcon.classList.add("bi");
    heightIcon.classList.add(`bi-arrow-${direction}-square-fill`);

    nameElement.append(heightIcon);
    nameElement.append(nameText);
}

function descToHtml(description: string) {
    // Convert a markdown description to sanitised HTML
    return DOMPurify.sanitize(marked(description));
}

function selectDistrict(district: JQuery<HTMLElement>) {
    // Select a district and show information about it
    const districtId = district.attr("id");
    // Remove any other selected districts
    selectedDistrict?.removeClass("selected");
    // And make this one selected
    selectedDistrict = district;
    district.addClass("selected");
    // Update permalink pointer
    $("#districtLink").attr("href", `#${districtId}`);
    // Show district info
    showInfo(districtId);
}

function deselectDistrict() {
    // Deselect district in order to show help info
    selectedDistrict?.removeClass("selected");
    selectedDistrict = null;
    showHelp();
}

initialize();