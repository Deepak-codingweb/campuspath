campus_graph = {
    "Main Gate": ["Administrative Block", "Parking Area"],

    "Administrative Block": [
        "Main Gate",
        "Library",
        "Computer Science Department"
    ],

    "Library": [
        "Administrative Block",
        "Central Canteen",
        "Seminar Hall"
    ],

    "Computer Science Department": [
        "Administrative Block",
        "Science Block"
    ],

    "Central Canteen": [
        "Library",
        "Boys Hostel",
        "Girls Hostel"
    ],

    "Boys Hostel": ["Central Canteen", "Sports Ground"],

    "Girls Hostel": ["Central Canteen", "Auditorium"],

    "Auditorium": ["Girls Hostel", "Sports Ground"],

    "Science Block": [
        "Computer Science Department",
        "Seminar Hall"
    ],

    "Seminar Hall": ["Science Block", "Library"],

    "Sports Ground": ["Boys Hostel", "Auditorium"],

    "Parking Area": ["Main Gate"]
}