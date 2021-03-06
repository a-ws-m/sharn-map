"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jquery_1 = __importDefault(require("jquery"));
var marked_1 = __importDefault(require("marked"));
var dompurify_1 = __importDefault(require("dompurify"));
var descriptions;
var selectedDistrict;
var helpInfo;
var infoBox = (0, jquery_1.default)("#infobox");
function showHelp() {
    // Show the help information from the landing screen
    infoBox.html(helpInfo);
}
function showSelected() {
    // Check if there's a district already selected and update info if so,
    // otherwise show help info
    if (selectedDistrict) {
        showInfo(selectedDistrict.attr("id"));
    }
    else {
        showHelp();
    }
}
function setDescriptionsFromJson(jsonText) {
    // Update descriptions variable based on JSON text
    try {
        descriptions = JSON.parse(jsonText);
    }
    catch (e) {
        alert("Error with JSON file: " + e);
        setDefaultDescriptions();
    }
    showSelected();
}
function descriptionsFromUrl(url) {
    return jquery_1.default.getJSON(url, function (data) {
        console.log("Successfully loaded data from " + url + ".");
        descriptions = data;
    })
        .fail(function () {
        alert("Error loading from " + url + ", ensure that CORS is enabled at target.");
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
    (0, jquery_1.default)("svg").addClass("map");
    // Add click event listeners to districts
    var districts = (0, jquery_1.default)(".districts>path");
    districts.on("click", function () {
        var $this = (0, jquery_1.default)(this);
        if ((selectedDistrict === null || selectedDistrict === void 0 ? void 0 : selectedDistrict.attr("id")) === $this.attr("id")) {
            deselectDistrict();
        }
        else {
            selectDistrict($this);
        }
    });
    // Load descriptions
    var descriptionLoad = loadDescriptions();
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
    var urlParams = new URLSearchParams(window.location.search);
    var jsonUrl = urlParams.get("json");
    if (jsonUrl) {
        return descriptionsFromUrl(jsonUrl);
    }
    else {
        return setDefaultDescriptions();
    }
}
function initialize() {
    // Get help info
    helpInfo = infoBox.html();
    // Ajax load the SVG
    (0, jquery_1.default)("#map-container").load("sharn.svg", postMapLoad);
    // Add JSON upload handler
    var jsonInput = (0, jquery_1.default)("#jsonInput");
    jsonInput.on("change", function () {
        var uploadedJson = jsonInput.prop("files")[0];
        uploadedJson.text().then(setDescriptionsFromJson);
    });
    // Check hashtag in URL
    window.addEventListener("hashchange", selectFromHash);
}
function selectFromHash() {
    // Select district based on hash in URL
    var hash = window.location.hash.substr(1);
    if (hash) {
        var hashRef = (0, jquery_1.default)("#" + hash);
        if (hashRef) {
            selectDistrict(hashRef);
        }
    }
}
function addNotableLocations(names, descriptions, section) {
    // Add notable locations table to the given section
    if (names.length == 0) {
        return;
    }
    var table = document.createElement("table");
    table.classList.add("locationsTable");
    var theader = document.createElement("tr");
    var columnNames = ["Location", "Description"];
    columnNames.forEach(function (element) {
        var headerCell = document.createElement("th");
        headerCell.appendChild(document.createTextNode(element));
        theader.appendChild(headerCell);
    });
    table.appendChild(theader);
    for (var index = 0; index < names.length; index++) {
        var districtName = names[index];
        var districtDesc = descriptions[index];
        var trow = document.createElement("tr");
        var tName = document.createElement("td");
        var tDesc = document.createElement("td");
        tName.innerHTML = descToHtml(districtName);
        tDesc.innerHTML = descToHtml(districtDesc);
        trow.appendChild(tName);
        trow.appendChild(tDesc);
        table.appendChild(trow);
    }
    section.append(table);
}
function showInfo(districtId) {
    if (!districtId) {
        return;
    }
    var wardIds = {
        "C": "central",
        "M": "menthis",
        "T": "tavicks",
        "N": "northedge",
        "D": "dura"
    };
    var ward = (0, jquery_1.default)("#ward");
    var wardInfo = (0, jquery_1.default)("#wardInfo");
    var upperDistrict = (0, jquery_1.default)("#upperDistrict");
    var middleDistrict = (0, jquery_1.default)("#middleDistrict");
    var lowerDistrict = (0, jquery_1.default)("#lowerDistrict");
    var upperInfo = (0, jquery_1.default)("#upperInfo");
    var middleInfo = (0, jquery_1.default)("#middleInfo");
    var lowerInfo = (0, jquery_1.default)("#lowerInfo");
    var upperSection = (0, jquery_1.default)("#upperSection");
    var middleSection = (0, jquery_1.default)("#middleSection");
    var lowerSection = (0, jquery_1.default)("#lowerSection");
    // Determine ward name
    var isCliffside = true;
    var wardKey = "cliffside";
    for (var key in wardIds) {
        if (Object.hasOwnProperty.call(wardIds, key)) {
            var currentWard = wardIds[key];
            if (districtId.startsWith(key)) {
                wardKey = currentWard;
                isCliffside = false;
                break;
            }
        }
    }
    // Remove location information tables
    (0, jquery_1.default)(".locationsTable").remove();
    var upperName, middleName, lowerName;
    var upperDesc, middleDesc, lowerDesc;
    var upperLocs;
    var descEntry = descriptions[districtId];
    if (isCliffside) {
        upperName = descEntry["name"];
        upperDesc = descToHtml(descEntry["description"]);
        upperLocs = descEntry["notableLocations"];
        middleName = "";
        lowerName = "";
        middleDesc = "";
        lowerDesc = "";
    }
    else {
        var upperEntry = descEntry["upper"];
        var middleEntry = descEntry["middle"];
        var lowerEntry = descEntry["lower"];
        upperLocs = upperEntry["notableLocations"];
        var middleLocs = middleEntry["notableLocations"];
        var lowerLocs = lowerEntry["notableLocations"];
        upperName = upperEntry["name"];
        middleName = middleEntry["name"];
        lowerName = lowerEntry["name"];
        upperDesc = descToHtml(upperEntry["description"]);
        middleDesc = descToHtml(middleEntry["description"]);
        lowerDesc = descToHtml(lowerEntry["description"]);
        var middleLocNames = middleLocs["name"];
        var lowerLocNames = lowerLocs["name"];
        var middleLocDescs = middleLocs["description"];
        var lowerLocDescs = lowerLocs["description"];
        addNotableLocations(middleLocNames, middleLocDescs, middleSection);
        addNotableLocations(lowerLocNames, lowerLocDescs, lowerSection);
    }
    // Handle upper locations the same regardless
    var upperLocNames = upperLocs["name"];
    var upperLocDescs = upperLocs["description"];
    addNotableLocations(upperLocNames, upperLocDescs, upperSection);
    // And handle ward names
    var wardEntry = descriptions[wardKey];
    var wardName = wardEntry["name"];
    var wardDesc = descToHtml(wardEntry["description"]);
    ward.text(wardName);
    if (isCliffside) {
        setDistrictName(upperDistrict, upperName);
        middleDistrict.html("");
        lowerDistrict.html("");
    }
    else {
        setDistrictName(upperDistrict, upperName, "upper");
        setDistrictName(middleDistrict, middleName, "middle");
        setDistrictName(lowerDistrict, lowerName, "lower");
    }
    wardInfo.html(wardDesc);
    upperInfo.html(upperDesc);
    middleInfo.html(middleDesc);
    lowerInfo.html(lowerDesc);
    (0, jquery_1.default)("#districtId").text(districtId);
}
function setDistrictName(nameElement, name, height) {
    // Set a district name for a given height
    var nameText = document.createTextNode(name);
    // Clear the element
    nameElement.html("");
    var direction;
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
    var heightIcon = document.createElement("i");
    heightIcon.classList.add("heightIcon");
    heightIcon.classList.add("bi");
    heightIcon.classList.add("bi-arrow-" + direction + "-square-fill");
    nameElement.append(heightIcon);
    nameElement.append(nameText);
}
function descToHtml(description) {
    // Convert a markdown description to sanitised HTML
    return dompurify_1.default.sanitize((0, marked_1.default)(description));
}
function selectDistrict(district) {
    // Select a district and show information about it
    var districtId = district.attr("id");
    // Remove any other selected districts
    selectedDistrict === null || selectedDistrict === void 0 ? void 0 : selectedDistrict.removeClass("selected");
    // And make this one selected
    selectedDistrict = district;
    district.addClass("selected");
    // Update permalink pointer
    (0, jquery_1.default)("#districtLink").attr("href", "#" + districtId);
    // Show district info
    showInfo(districtId);
}
function deselectDistrict() {
    // Deselect district in order to show help info
    selectedDistrict === null || selectedDistrict === void 0 ? void 0 : selectedDistrict.removeClass("selected");
    selectedDistrict = null;
    showHelp();
}
initialize();
