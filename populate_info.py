"""Make boilerplate JSON file for descriptions."""
import json
from pathlib import Path

JSON_FILE = Path("districtInfoEmpty.json")

cliffside_districts = {
    "grayflood": "Grayflood",
    "sharnsWelcome": "Sharn's Welcome",
    "mudCaves": "Mud Caves",
    "shipsTowers": "Ship's Towers",
}
boilerplate_district = {
    "name": "",
    "description": "",
    "notableLocations": {"name": [], "description": []},
}
quarters = {
    "cliffside": "Cliffside",
    "tavicks": "Tavick's Landing",
    "menthis": "Menthis Plateau",
    "central": "Central Plateau",
    "dura": "Dura",
    "northedge": "Northedge",
}
# discrictId : (lowerName, middleName, upperName)
other_districts = {
    "N1": ("Longstairs", "High Hope", "Shae Lias"),
    "N2": ("Stoneyard", "Oakbridge", "Oak Towers"),
    "N3": ("North Market", "Holdfast", "Crystal Bridge"),
    "C1": ("North Towers", "Tradefair", "Platinum Heights"),
    "C2": ("Boldrei's Hearth", "Sovereign Towers", "Korran Thiven"),
    "C3": ("Olladra's Kitchen", "Sword Point", "Skysedge Park"),
    "C4": ("Granite Halls", "Dragon Towers", "Highest Towers"),
    "C5": ("Vallia Towers", "Dava Gate", "Mithral Tower"),
    "C6": ("Myshan Gardens", "Ambassador Towers", "Korranath"),
    "M1": ("Torchfire", "Smoky Towers", "Den'iyas"),
    "M2": ("Firelight", "Little Plains", "Platinate"),
    "M3": ("Center Bridge", "Everbright", "University District"),
    "M4": ("Downstairs", "Cassan Bridge", "Seventh Tower"),
    "M5": ("Forgelight Towers", "Warden Towers", "Ivy Towers"),
    "T1": ("Terminus", "Tavick's Market", "Silvergate"),
    "T2": ("Wroann's Gate", "Cornerstone", "Pinnacle"),
    "T3": ("Cogsgate", "Graywall", "Twelve Pillars"),
    "T4": ("High Walls", "Dancing Shadows", "Copper Arch"),
    "T5": ("Dragoneyes", "Deathsgate", "Dalan's Refuge"),
    "T6": ("Black Arch", "Little Barrington", "Ocean View"),
    "T7": ("Foundation", "Kenton", "Sunrise"),
    "D1": ("Precarious", "Underlook", "Overlook"),
    "D2": ("Oldkeep", "Broken Arch", "Highwater"),
    "D3": ("Malleon's Gate", "Tumbledown", "Clifftop"),
    "D4": ("Gate of Gold", "Hareth's Folly", "Hope's Peak"),
    "D5": ("Callestan", "The Bazaar", "Redstone"),
    "D6": ("The Stores", "Stormhold", "Daggerwatch"),
    "D7": ("Fallen", "Rattlestone", "Highhold"),
}

district_dict = {}
for district_id, names in other_districts.items():
    quarter_heights = ("lower", "middle", "upper")

    district_entry = {}
    for height, district_name in zip(quarter_heights, names):
        template_dict = dict(**boilerplate_district)
        template_dict["name"] = district_name
        district_entry[height] = template_dict

    district_dict[district_id] = district_entry

for district_id, readable_name in cliffside_districts.items():
    # Copy the boilerplate
    cliffside_district = dict(**boilerplate_district)
    cliffside_district["name"] = readable_name
    district_dict[district_id] = cliffside_district

for quarter_id, quarter_name in quarters.items():
    district_dict[quarter_id] = {"name": quarter_name, "description": ""}

JSON_FILE.write_text(json.dumps(district_dict, indent=4, sort_keys=True))
