import $ from "jquery";
import marked from "marked";
import DOMPurify from "dompurify";

interface locationsDict {
    name: string[];
    description: string[];
}
interface quarterEntry {
    name: string;
    description: string;
}
interface levelEntry extends quarterEntry {
    notableLocations: locationsDict;
}
type districtEntry = levelEntry | { upper: levelEntry, middle: levelEntry, lower: levelEntry };

var descriptions: { [x: string]: any; };
var selectedDistrict: JQuery<HTMLElement> | null;
var helpInfo: string;

const infoBox = $("#infobox");

function editSection(editButton: JQuery<HTMLElement>) {
    // Open edit box for section
    const selectedId = selectedDistrict?.attr("id");
    const level = editButton.attr("name");
    if (!selectedId || !level) {
        return;
    }
    const infoContainer = $(`#${level}Info`);
    const districtEntry = descriptions[selectedId];

    // May be Cliffside entry, or have several levels
    const currentDescription = districtEntry["description"] ?? districtEntry[level]["description"];

    // Get everything but locations table
    const descriptionDom = infoContainer.children().not(".locationsTable");
    let descriptionHeight = 0;
    descriptionDom.each(
        function (this: HTMLElement) {
            descriptionHeight += $(this).outerHeight(true) ?? 0;
        }
    );
    descriptionDom.remove();

    const textArea = $("<textarea></textarea>");
    textArea.text(currentDescription);
    textArea.height(descriptionHeight);
    infoContainer.prepend(textArea);
    /*
        TODO:
            * Make edit buttons into submission buttons
            * Save changes when done
            * Add locations table edit + adding functionality
            * Add "Download JSON" button
            * Add quarter description editing functionality
    */
}

function showHelp() {
    // Show the help information from the landing screen
    infoBox.html(helpInfo);
    $(".editInfo").prop("disabled", true);
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
    districts.on("click", function (this: HTMLElement) {
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

    // Add edit button handler
    $(".editInfo").on("click", function (this: HTMLElement) {
        editSection($(this));
    });
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
    const quarterIds: { [x: string]: string } = {
        "C": "central",
        "M": "menthis",
        "T": "tavicks",
        "N": "northedge",
        "D": "dura"
    };
    const quarter = $("#quarter");
    const quarterInfo = $("#quarterInfo");

    const upperDistrict = $("#upperDistrict");
    const middleDistrict = $("#middleDistrict");
    const lowerDistrict = $("#lowerDistrict");

    const upperInfo = $("#upperInfo");
    const middleInfo = $("#middleInfo");
    const lowerInfo = $("#lowerInfo");

    const upperSection = $("#upperSection");
    const middleSection = $("#middleSection");
    const lowerSection = $("#lowerSection");

    const upperEditBtn = upperSection.find(".editInfo");
    const middleEditBtn = middleSection.find(".editInfo");
    const lowerEditBtn = lowerSection.find(".editInfo");

    // Determine quarter name
    let isCliffside = true;
    let quarterKey = "cliffside";
    for (const key in quarterIds) {
        if (Object.hasOwnProperty.call(quarterIds, key)) {
            const currentquarter = quarterIds[key];
            if (districtId.startsWith(key)) {
                quarterKey = currentquarter;
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

    // And handle quarter names
    const quarterEntry = descriptions[quarterKey];
    const quarterName = quarterEntry["name"];
    const quarterDesc = descToHtml(quarterEntry["description"]);

    quarter.text(quarterName);
    if (isCliffside) {
        setDistrictName(upperDistrict, upperName);
        upperEditBtn.prop("disabled", false);
        middleDistrict.html("");
        middleEditBtn.prop("disabled", true);
        lowerDistrict.html("");
        lowerEditBtn.prop("disabled", true);
    } else {
        setDistrictName(upperDistrict, upperName, "upper");
        upperEditBtn.prop("disabled", false);
        setDistrictName(middleDistrict, middleName, "middle");
        middleEditBtn.prop("disabled", false);
        setDistrictName(lowerDistrict, lowerName, "lower");
        lowerEditBtn.prop("disabled", false);
    }

    quarterInfo.html(quarterDesc);
    upperInfo.html(upperDesc);
    middleInfo.html(middleDesc);
    lowerInfo.html(lowerDesc);

    // Set district ID indicator
    $("#districtId").text(districtId);
    // Enable edit button
    $("#editInfo").prop("disabled", false);
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
    heightIcon.classList.add("heightIcon", "bi", `bi-arrow-${direction}-square-fill`);

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